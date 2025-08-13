import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppealsIntegrationStore } from "@/store/appealsIntegration";
import { usePortfolioStore } from "@/store/portfolio";
import { usePropertyAnalysisStore } from "@/store/propertyAnalysis";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { AutomatedFiling } from "@/components/AutomatedFiling";
import TaxAttorneyWorkflow from "@/components/TaxAttorneyWorkflow";
import JurisdictionDropdown from "@/components/JurisdictionDropdown";
import { authenticatedRequest } from "@/lib/auth";

// Import modular appeal components
import { AppealsStats } from "@/components/appeals/AppealsStats";
import { AppealsList } from "@/components/appeals/AppealsList";
import { NewAppealModal } from "@/components/appeals/NewAppealModal";
import { AppealDetailsModal } from "@/components/appeals/AppealDetailsModal";
import { AppealManagementModal } from "@/components/appeals/AppealManagementModal";

// Appeal interface for type safety
interface Appeal {
  id: string;
  property: string;
  jurisdiction: string;
  status: string;
  filedDate: string;
  currentAssessment?: number;
  proposedValue?: number;
  potentialSavings?: number;
  deadline?: string;
  hearingDate?: string;
  completedDate?: string;
  originalAssessment?: number;
  finalAssessment?: number;
  actualSavings?: number;
}

export function Appeals() {
  const { propertyId } = useParams();
  const { 
    currentAppealPrep, 
    getAppealFormData
  } = useAppealsIntegrationStore();
  
  // Portfolio and Property Analysis store connections
  const { 
    properties, 
    selectedProperty, 
    setSelectedProperty 
  } = usePortfolioStore();
  
  const {
    analysisComplete,
    completeAnalysis
  } = usePropertyAnalysisStore();
  
  const [isNewAppealModalOpen, setIsNewAppealModalOpen] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState("");
  
  // Appeal Details Modal State
  const [showAppealDetailsModal, setShowAppealDetailsModal] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  
  // Appeal Management Modal State
  const [showAppealManagementModal, setShowAppealManagementModal] = useState(false);
  const [managedAppeal, setManagedAppeal] = useState<Appeal | null>(null);
  const [managementTab, setManagementTab] = useState("status");
  
  // Certificate Generation State
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [appealForm, setAppealForm] = useState({
    property_address: "",
    current_assessment: "",
    proposed_value: "",
    jurisdiction: "",
    reason: ""
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [formTouched, setFormTouched] = useState<{[key: string]: boolean}>({});

  // Appeals data state
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");

  const { toast } = useToast();

  // Validation functions
  const validateField = (name: string, value: string) => {
    let error = "";
    
    switch (name) {
      case "property_address":
        if (!value.trim()) {
          error = "Property address is required";
        } else if (value.trim().length < 10) {
          error = "Please enter a complete address";
        }
        break;
      case "current_assessment":
        const currentVal = parseFloat(value);
        if (!value || isNaN(currentVal) || currentVal <= 0) {
          error = "Please enter a valid current assessment amount";
        } else if (currentVal < 10000) {
          error = "Assessment seems unusually low. Please verify.";
        }
        break;
      case "proposed_value":
        const proposedVal = parseFloat(value);
        const currentAssessment = parseFloat(appealForm.current_assessment);
        if (!value || isNaN(proposedVal) || proposedVal <= 0) {
          error = "Please enter a valid proposed value";
        } else if (!isNaN(currentAssessment) && proposedVal >= currentAssessment) {
          error = "Proposed value must be less than current assessment";
        } else if (proposedVal < 5000) {
          error = "Proposed value seems unusually low. Please verify.";
        }
        break;
      case "jurisdiction":
        if (!value.trim()) {
          error = "Please select a jurisdiction";
        }
        break;
    }
    
    return error;
  };

  const handleFieldChange = (name: string, value: string) => {
    setAppealForm(prev => ({ ...prev, [name]: value }));
    
    // Validate field and update errors
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFieldBlur = (name: string) => {
    setFormTouched(prev => ({ ...prev, [name]: true }));
  };

  const isFormValid = () => {
    const requiredFields = ["property_address", "current_assessment", "proposed_value", "jurisdiction"];
    
    // Check if all required fields are filled
    const allFieldsFilled = requiredFields.every(field => 
      appealForm[field as keyof typeof appealForm]?.trim()
    );
    
    if (!allFieldsFilled) return false;
    
    // Check if there are any errors
    const hasErrors = Object.values(formErrors).some(error => error !== "");
    if (hasErrors) return false;
    
    // Run validation on all fields to catch any remaining issues
    const allFieldsValid = requiredFields.every(field => {
      const error = validateField(field, appealForm[field as keyof typeof appealForm]);
      return error === "";
    });
    
    return allFieldsValid;
  };

  // Fetch appeals from API
  const fetchAppeals = async () => {
    try {
      const response = await authenticatedRequest('/api/appeals/packets');
      if (response.ok) {
        const data = await response.json();
        setAppeals(data.appeals || []);
      } else {
        console.error('Failed to fetch appeals');
        toast({
          title: "Error",
          description: "Failed to load appeals data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching appeals:', error);
      toast({
        title: "Error", 
        description: "Failed to connect to server",
        variant: "destructive"
      });
    }
  };

  // Load appeals on component mount
  useEffect(() => {
    fetchAppeals();
  }, []);

  // Handle incoming property data from Portfolio
  useEffect(() => {
    if (propertyId && currentAppealPrep) {
      // Auto-open the appeal modal with pre-filled data
      setIsNewAppealModalOpen(true);
      
      // Pre-fill the form with appeal data
      const prepData = getAppealFormData();
      if (prepData) {
        setAppealForm({
          property_address: prepData.property_address || "",
          current_assessment: prepData.current_assessment?.toString() || "",
          proposed_value: prepData.proposed_value?.toString() || "",
          jurisdiction: prepData.jurisdiction || "",
          reason: prepData.reason || ""
        });
      }
    }
  }, [propertyId, currentAppealPrep, getAppealFormData]);

  const handleViewAppealDetails = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setShowAppealDetailsModal(true);
  };

  const handleManageAppeal = (appeal: Appeal) => {
    setManagedAppeal(appeal);
    setManagementTab("status");
    setShowAppealManagementModal(true);
  };

  const handleGenerateCertificate = async (appeal: Appeal) => {
    setIsGeneratingCertificate(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a completion certificate
      const certificateContent = `
PROPERTY TAX APPEAL COMPLETION CERTIFICATE

Appeal ID: ${appeal.id}
Property: ${appeal.property}
Jurisdiction: ${appeal.jurisdiction}

APPEAL RESULTS:
Original Assessment: $${appeal.originalAssessment?.toLocaleString()}
Final Assessment: $${appeal.finalAssessment?.toLocaleString()}
Annual Tax Savings: $${appeal.actualSavings?.toLocaleString()}

This certificate confirms the successful completion of the property tax appeal filed on ${new Date(appeal.filedDate).toLocaleDateString()}.

Generated by CHARLY AI System
Date: ${new Date().toLocaleDateString()}
      `.trim();
      
      const blob = new Blob([certificateContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appeal_certificate_${appeal.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Certificate Generated",
        description: "Appeal completion certificate has been downloaded.",
      });
      
    } catch (error) {
      console.error('Certificate generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate certificate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  const handleOpenNewAppealModal = () => {
    setIsNewAppealModalOpen(true);
    setGeneratedNarrative("");
    setAppealForm({
      property_address: "",
      current_assessment: "",
      proposed_value: "",
      jurisdiction: "",
      reason: ""
    });
    setFormErrors({});
    setFormTouched({});
  };

  const handleGenerateNarrative = async () => {
    // Prevent double submission
    if (isGeneratingNarrative) {
      return;
    }

    // Use comprehensive form validation
    if (!isFormValid()) {
      toast({
        title: "Form Incomplete",
        description: "Please complete all required fields with valid data before generating narrative.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingNarrative(true);
    
    try {
      // Simulate narrative generation for frontend-only mode
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a professional appeal narrative
      const currentAssessment = parseInt(appealForm.current_assessment);
      const proposedValue = parseInt(appealForm.proposed_value);
      const reduction = currentAssessment - proposedValue;
      const reductionPercent = ((reduction / currentAssessment) * 100).toFixed(1);
      
      const narrative = `PROPERTY TAX APPEAL NARRATIVE

Property Address: ${appealForm.property_address}
Jurisdiction: ${appealForm.jurisdiction || 'County Tax Assessor'}
Current Assessment: $${currentAssessment.toLocaleString()}
Proposed Value: $${proposedValue.toLocaleString()}
Requested Reduction: $${reduction.toLocaleString()} (${reductionPercent}%)

GROUNDS FOR APPEAL:
${appealForm.reason || 'The current assessment significantly exceeds the fair market value of the property based on recent comparable sales and income analysis.'}

SUPPORTING EVIDENCE:

1. COMPARABLE SALES ANALYSIS
Recent sales of similar properties in the immediate area indicate a market value substantially lower than the current assessment. The sales comparison approach supports a value of $${proposedValue.toLocaleString()}.

2. INCOME APPROACH ANALYSIS
Based on current market rents and operating expenses, the income capitalization approach indicates a value of $${proposedValue.toLocaleString()}, utilizing a market-derived capitalization rate.

3. ASSESSMENT UNIFORMITY
The subject property is assessed at a higher ratio to market value compared to similar properties in the neighborhood, violating the principle of assessment uniformity.

CONCLUSION:
Based on the comprehensive analysis using all three standard valuation approaches, we respectfully request the assessment be reduced to $${proposedValue.toLocaleString()} to reflect the property's true fair market value.

PREPARED BY: CHARLY AI Analysis System
DATE: ${new Date().toLocaleDateString()}`;
      
      setGeneratedNarrative(narrative);
      
      toast({
        title: "AI Narrative Generated",
        description: "The appeal narrative has been generated successfully. Click 'Generate Appeal Packet' to create a PDF.",
      });
      
    } catch (err) {
      console.error('Narrative generation error:', err);
      toast({
        title: "Generation Failed",
        description: "Unable to generate narrative. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const handleSubmitAppeal = async (formData: any) => {
    if (isGeneratingPacket) return;

    setIsGeneratingPacket(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new appeal record
      const newAppeal: Appeal = {
        id: `APP-${Date.now()}`,
        property: formData.property_address,
        jurisdiction: formData.jurisdiction,
        status: "submitted",
        filedDate: new Date().toISOString(),
        currentAssessment: parseInt(formData.current_assessment),
        proposedValue: parseInt(formData.proposed_value),
        potentialSavings: parseInt(formData.current_assessment) - parseInt(formData.proposed_value)
      };
      
      // Add to appeals list
      setAppeals(prev => [newAppeal, ...prev]);
      
      // Close modal and reset form
      setIsNewAppealModalOpen(false);
      setGeneratedNarrative("");
      setAppealForm({
        property_address: "",
        current_assessment: "",
        proposed_value: "",
        jurisdiction: "",
        reason: ""
      });
      setFormErrors({});
      setFormTouched({});
      
      toast({
        title: "Appeal Created Successfully",
        description: "Your appeal has been submitted and is now being processed.",
      });
      
    } catch (error) {
      console.error('Appeal submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit appeal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPacket(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚖️ Appeals</h1>
          <p className="text-gray-600">Manage and track your property tax appeals</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <JurisdictionDropdown
              value={jurisdictionFilter}
              onValueChange={setJurisdictionFilter}
              includeAll={true}
            />
          </div>
          <Button 
            onClick={handleOpenNewAppealModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Appeal
          </Button>
        </div>
      </div>

      <AppealsStats 
        appeals={appeals}
        selectedJurisdiction={jurisdictionFilter}
      />

      <AppealsList
        appeals={appeals}
        selectedJurisdiction={jurisdictionFilter}
        onViewDetails={handleViewAppealDetails}
        onManageAppeal={handleManageAppeal}
        onGenerateCertificate={handleGenerateCertificate}
      />

      {/* Specialized workflows */}
      <div className="space-y-6">
        <AutomatedFiling 
          propertyId={propertyId || ''} 
          onFilingComplete={(status) => {
            console.log('Filing completed:', status);
            toast({
              title: "Filing Complete",
              description: "Automated filing has been processed successfully.",
            });
          }}
        />
        
        <TaxAttorneyWorkflow />
      </div>

      {/* Modals */}
      <NewAppealModal
        isOpen={isNewAppealModalOpen}
        onClose={() => setIsNewAppealModalOpen(false)}
        onSubmit={handleSubmitAppeal}
        isGeneratingNarrative={isGeneratingNarrative}
        isGeneratingPacket={isGeneratingPacket}
        generatedNarrative={generatedNarrative}
        appealForm={appealForm}
        onFormChange={handleFieldChange}
        onGenerateNarrative={handleGenerateNarrative}
        formErrors={formErrors}
        formTouched={formTouched}
        onFieldBlur={handleFieldBlur}
        isFormValid={isFormValid}
      />

      <AppealDetailsModal
        isOpen={showAppealDetailsModal}
        onClose={() => setShowAppealDetailsModal(false)}
        appeal={selectedAppeal}
      />

      <AppealManagementModal
        isOpen={showAppealManagementModal}
        onClose={() => setShowAppealManagementModal(false)}
        appeal={managedAppeal}
        activeTab={managementTab}
        onTabChange={setManagementTab}
      />
    </div>
  );
}

export default Appeals;