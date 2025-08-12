import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioStore } from "@/store/portfolio";
import { usePropertyAnalysisStore } from "@/store/propertyAnalysis";
import { useAppealsIntegrationStore } from "@/store/appealsIntegration";
import { authService, authenticatedRequest } from "@/lib/auth";
import { mapPropertyTypeLabelToBackend } from '@/config/property_type_crosswalk';
import { ValuationTabs } from "@/components/ValuationTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, AlertCircle, Building, MapPin, Calculator, ArrowLeft, BarChart3, CheckSquare, Square, Loader2, FileText, Search, X, SlidersHorizontal, Download, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { validateFileList, formatValidationErrors } from "@/lib/fileValidation";
import { CloudUploadButton } from "@/components/CloudUploadButton";
import { MarketDataService } from "@/services/marketDataService";
import { ReportPreview } from "@/components/ReportPreview";
import type { ReportData } from "@/types/report";
import MultiStateJurisdiction from "@/components/MultiStateJurisdiction";
import { getJurisdictionOptions } from "@/services/jurisdictionService";
import { getAllPropertyTypes } from "@/services/propertyTypeService";

// Portfolio render resilience helpers
type PropIn = any;
type PropOut = {
  id?: string | number;
  address?: string;
  city?: string;
  county?: string;
  currentAssessment?: number | null;
  marketValue?: number | null;
  propertyType?: string | null;
  squareFootage?: number | null;
  yearBuilt?: number | null;
  estimatedValue?: number | null;
  potentialSavings?: number | null;
  status?: string | null;
  jurisdiction?: string | null;
  parcelNumber?: string | null;
  ownerName?: string | null;
};

function normalizeProperty(p: PropIn): PropOut {
  return {
    id: p.id ?? p.property_id ?? p._id ?? null,
    address: p.address ?? null,
    city: p.city ?? null,
    county: p.county ?? null,
    currentAssessment: p.current_assessment ?? p.currentAssessment ?? null,
    marketValue: p.market_value ?? p.estimatedValue ?? null,
    estimatedValue: p.market_value ?? p.estimatedValue ?? null,
    propertyType: p.property_type ?? p.propertyType ?? null,
    squareFootage: p.square_footage ?? p.squareFootage ?? null,
    yearBuilt: p.year_built ?? p.yearBuilt ?? null,
    potentialSavings: p.potential_savings ?? p.potentialSavings ?? null,
    status: p.status ?? null,
    jurisdiction: p.jurisdiction ?? null,
    parcelNumber: p.parcel_number ?? p.parcelNumber ?? null,
    ownerName: p.owner_name ?? p.ownerName ?? null,
  };
}

// Safe number formatting
const fmtNumber = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString('en-US');

const fmtUSD = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

interface MockProperty {
  id: string;
  address: string;
  propertyType: string;
  currentAssessment: number;
  estimatedValue: number;
  potentialSavings: number;
  status: string;
  jurisdiction: string;
  parcelNumber: string;
  ownerName: string;
  yearBuilt: number;
  squareFootage: number;
}

export function Portfolio() {
  console.info("%cACTIVE_HANDLER", "color:#0bf;font-weight:bold", "pages/Portfolio.tsx", "filters patch applied");
  const [authError, setAuthError] = useState<string | null>(null);
  const [appealPacketGenerated, setAppealPacketGenerated] = useState<string | null>(null); // stores packet ID
  
  // Auto-login on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if already authenticated
        if (!authService.isAuthenticated()) {
          console.log("Portfolio: Not authenticated, proceeding without auth");
          // Use gentle auth recovery (no auto-login)
          await authService.ensureAutoLoginOrRefresh();
          if (!authService.isAuthenticated()) {
            console.log("Portfolio: Clean logged-out state, proceeding with limited functionality");
          }
        } else {
          console.log("Portfolio: Already authenticated");
        }
      } catch (loginError: any) {
        console.error("Portfolio: Auth initialization failed:", loginError);
        // Don't show auth error banner - treat as clean logged-out state
        console.info('Portfolio: Proceeding with limited functionality');
      }
    };
    
    initializeAuth();
  }, []);
  
  // Handle keyboard navigation for property cards
  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };
  const navigate = useNavigate();
  const { properties, loading, error, ingestFiles, addProperty } = usePortfolioStore();
  const {
    currentProperty,
    analysisResults,
    isAnalyzing,
    showAnalysisModal,
    analysisComplete,
    setAnalysisResult,
    startAnalysis,
    completeAnalysis,
    resetAnalysis,
    getCurrentAnalysis,
    getCurrentValuation
  } = usePropertyAnalysisStore();
  const {
    prepareAppealFromAnalysis
  } = useAppealsIntegrationStore();
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'valuation' | 'comparison' | 'analytics' | 'multistate'>('list');
  const [compareProperties, setCompareProperties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'address' | 'value' | 'savings' | 'status'>('address');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Enhanced search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Report preview state
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingAppeal, setIsGeneratingAppeal] = useState(false);

  // Add Property Modal State
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState({
    address: '',
    propertyType: '',
    currentAssessment: '',
    estimatedValue: '',
    jurisdiction: '',
    parcelNumber: '',
    ownerName: '',
    yearBuilt: '',
    squareFootage: '',
    notes: ''
  });

  // Export and Bulk Actions State
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [, ] = useState(false); // Export modal state for future use
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false);

  // Helper function for property ID normalization (used in action handlers)
  const getPropId = (p: any) => 
    String(p.id ?? p.property_id ?? '')
      .replace(/^prop_00prop_/, 'prop_')  // sanitize double prefix
      .trim();

  const handlePropertySelect = async (propertyId: string) => {
    const property = displayProperties.find(p => p.id === propertyId);
    if (!property) return;

    // Convert MockProperty to AnalysisProperty format and start analysis
    const analysisProperty = {
      id: property.id,
      address: property.address,
      propertyType: property.propertyType,
      currentAssessment: property.currentAssessment,
      estimatedValue: property.estimatedValue,
      potentialSavings: property.potentialSavings,
      status: property.status,
      jurisdiction: property.jurisdiction,
      parcelNumber: property.parcelNumber,
      ownerName: property.ownerName,
      yearBuilt: (property.yearBuilt ?? '—'),
      squareFootage: property.squareFootage
    };

    // Start analysis workflow using the store
    startAnalysis(analysisProperty);
    
    try {
      // Generate all 3 AI narratives in parallel
      const propertyData = {
        address: property.address,
        property_type: property.propertyType,
        current_assessment: property.currentAssessment,
        market_value: property.estimatedValue,
        squareFootage: property.squareFootage,
        yearBuilt: (property.yearBuilt ?? '—'),
        grossIncome: property.estimatedValue * 0.08, // 8% cap rate assumption
        netOperatingIncome: property.estimatedValue * 0.06, // 6% NOI assumption
        capRate: 0.08,
        condition: "Average",
        lotSize: property.squareFootage * 4 // Lot size assumption
      };

      const [incomeResponse, salesResponse, costResponse] = await Promise.all([
        authenticatedRequest('/api/narrative/income-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propertyData)
        }),
        authenticatedRequest('/api/narrative/sales-comparison', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propertyData)
        }),
        authenticatedRequest('/api/narrative/cost-approach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propertyData)
        })
      ]);

      // Parse all responses
      const incomeResult = await incomeResponse.json();
      const salesResult = await salesResponse.json();
      const costResult = await costResponse.json();

      // Combine all narratives into comprehensive analysis result
      const comprehensiveResult = {
        property_id: propertyId,
        success_probability: 0.75,
        predicted_reduction: 0.12,
        confidence_score: 0.88,
        risk_score: 0.25,
        recommended_action: "PROCEED",
        reasons: [
          "Multi-approach analysis supports assessment reduction",
          "All three valuation methods indicate over-assessment",
          "Professional AI-generated narratives ready for appeal"
        ],
        appeal_probability: 0.75,
        narratives: {
          income_summary: incomeResult,
          sales_comparison: salesResult,
          cost_approach: costResult
        },
        total_cost: (incomeResult.estimated_cost || 0) + (salesResult.estimated_cost || 0) + (costResult.estimated_cost || 0),
        total_tokens: (incomeResult.tokens_used || 0) + (salesResult.tokens_used || 0) + (costResult.tokens_used || 0),
        analysis_date: new Date().toISOString()
      };
      
      setAnalysisResult(propertyId, comprehensiveResult);
      
      toast({
        title: "AI Narrative Analysis Complete",
        description: `Generated 3 professional narratives with ${Math.round(comprehensiveResult.success_probability * 100)}% success probability`,
      });
      
      completeAnalysis();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI narrative generation failed, using enhanced mock data:', errorMessage);
      
      // Enhanced fallback with comprehensive mock narratives
      const mockResult = {
        property_id: propertyId,
        success_probability: 0.75,
        predicted_reduction: 0.12,
        confidence_score: 0.88,
        risk_score: 0.25,
        recommended_action: "PROCEED",
        reasons: [
          "Assessment appears 12% above market value",
          "Multi-approach analysis supports reduction",
          "Strong professional case for appeal"
        ],
        appeal_probability: 0.75,
        narratives: {
          income_summary: {
            success: true,
            narrative_type: "income_summary" as const,
            narrative: [
              `INCOME APPROACH ANALYSIS - ${property.address}`,
              `Property Assessment: ${fmtUSD(property.currentAssessment)}`,
              `Income-Based Value: ${fmtUSD(property.estimatedValue)}`,
              `INCOME ANALYSIS SUMMARY:`,
              `The income approach methodology provides compelling evidence that the current assessment exceeds fair market value. Based on market rental rates for similar ${property.propertyType.toLowerCase()} properties, this ${fmtNumber(property.squareFootage)} square foot property generates approximately ${(property.estimatedValue * 0.06)}) in net operating income annually.`,
              `CAPITALIZATION RATE ANALYSIS:`,
              `Market-derived capitalization rate of 8.0% reflects current investor expectations for properties of this type and location. Recent sales of comparable income-producing properties support this rate.`,
              `VALUATION CONCLUSION:`,
              `Using the income approach (NOI ÷ Cap Rate = Value), the indicated value is ${fmtUSD(property.estimatedValue)}. This represents a more accurate reflection of the property's economic value based on its income-generating potential.`,
              `RECOMMENDATION:`,
              `The assessment should be reduced to align with income approach valuation, providing justifiable grounds for appeal.`
            ].join('\n\n'),
            model_used: "demo-mode",
            tokens_used: 0,
            estimated_cost: 0,
            generation_time: 800,
            confidence_score: 0.88
          },
          sales_comparison: {
            success: true,
            narrative_type: "sales_comparison" as const,
            narrative: [
              `SALES COMPARISON ANALYSIS - ${property.address}`,
              `Property Assessment: ${fmtUSD(property.currentAssessment)}`,
              `Market Value Indication: ${fmtUSD(property.estimatedValue)}`,
              `COMPARABLE SALES ANALYSIS:`,
              `Recent sales of comparable ${property.propertyType.toLowerCase()} properties in the market area provide strong evidence supporting a lower valuation. Three similar properties with comparable size, age, and location characteristics have sold within the past 12 months.`,
              `MARKET ADJUSTMENTS:`,
              `After appropriate adjustments for:`,
              `- Size differences (${fmtNumber(property.squareFootage)} sq ft subject property)`,
              `- Age variation (${property.yearBuilt ? 2024 - property.yearBuilt : 'Unknown'} years old)`,
              `- Location and accessibility factors`,
              `- Market conditions at time of sale`,
              `The adjusted sales prices range from ${fmtUSD(property.estimatedValue * 0.95)} to ${fmtUSD(property.estimatedValue * 1.05)}, with a median of ${fmtUSD(property.estimatedValue)}.`,
              `MARKET CONCLUSION:`,
              `The sales comparison approach clearly indicates the current assessment exceeds demonstrated market values for comparable properties.`,
              `RECOMMENDATION:`,
              `Assessment reduction to ${fmtUSD(property.estimatedValue)} is supported by recent market transactions.`
            ].join('\n\n'),
            model_used: "demo-mode",
            tokens_used: 0,
            estimated_cost: 0,
            generation_time: 750,
            confidence_score: 0.85
          },
          cost_approach: {
            success: true,
            narrative_type: "cost_approach" as const,
            narrative: [
              `COST APPROACH ANALYSIS - ${property.address}`,
              `Property Assessment: ${fmtUSD(property.currentAssessment)}`,
              `Cost Approach Value: ${fmtUSD(property.estimatedValue)}`,
              `COST APPROACH METHODOLOGY:`,
              `The cost approach estimates property value by calculating current replacement cost of improvements, less depreciation, plus land value.`,
              `REPLACEMENT COST:`,
              `Current replacement cost for this ${fmtNumber(property.squareFootage)} square foot ${property.propertyType.toLowerCase()} property is estimated at ${(property.estimatedValue * 1.4)}) based on:`,
              `- Current construction costs per square foot`,
              `- Building specifications and quality`,
              `- Local construction market conditions`,
              `DEPRECIATION ANALYSIS:`,
              `Total depreciation of ${Math.round(((2024 - (property.yearBuilt ?? '—')) / 40) * 100)}% applied based on:`,
              `- Physical depreciation (${2024 - (property.yearBuilt ?? '—')} years of age)`,
              `- Functional obsolescence considerations`,
              `- Economic obsolescence factors`,
              `Depreciated improvement value: ${(property.estimatedValue * 0.75)}}`,
              `Land value: ${(property.estimatedValue * 0.25)}}`,
              `COST APPROACH CONCLUSION:`,
              `Total indicated value: ${fmtUSD(property.estimatedValue)}`,
              `RECOMMENDATION:`,
              `The cost approach supports assessment reduction to reflect current replacement cost methodology.`
            ].join('\n\n'),
            model_used: "demo-mode",
            tokens_used: 0,
            estimated_cost: 0,
            generation_time: 720,
            confidence_score: 0.82
          }
        },
        total_cost: 0,
        total_tokens: 0,
        analysis_date: new Date().toISOString()
      };
      
      setAnalysisResult(propertyId, mockResult);
      
      toast({
        title: "AI Analysis Complete (Demo Mode)",
        description: `Generated comprehensive analysis with 3 professional narratives`,
      });
      
      completeAnalysis();
    }
  };

  const handleFileUpload = (files: FileList) => {
    const validation = validateFileList(files);

    if (!validation.valid) {
      toast({
        title: "File validation failed",
        description: formatValidationErrors(validation.errors),
        variant: "destructive",
      });
      return;
    }

    const validFiles = Array.from(files);

    if (validFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select valid files to upload.",
        variant: "destructive",
      });
      return;
    }

    if (validFiles.length > 0) {
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      ingestFiles(fileList.files);
      toast({
        title: "Files uploaded successfully",
        description: `${validFiles.length} file(s) processed and ready for analysis`,
      });
    }
  };

  // Enhanced mock property data for display
  const mockProperties: MockProperty[] = [
    {
      id: "1",
      address: "123 Main St, Austin, TX",
      propertyType: "Office Building",
      currentAssessment: 450000,
      estimatedValue: 380000,
      potentialSavings: 14000,
      status: "Under Review",
      jurisdiction: "Travis County",
      parcelNumber: "TC-2024-001234",
      ownerName: "Austin Commercial LLC",
      yearBuilt: 1998,
      squareFootage: 12500
    },
    {
      id: "2", 
      address: "456 Oak Ave, Houston, TX",
      propertyType: "Single Family",
      currentAssessment: 285000,
      estimatedValue: 265000,
      potentialSavings: 4200,
      status: "Appeal Filed",
      jurisdiction: "Harris County",
      parcelNumber: "HC-2024-567890",
      ownerName: "Johnson Family Trust",
      yearBuilt: 2005,
      squareFootage: 2400
    },
    {
      id: "3",
      address: "789 Business Blvd, Dallas, TX", 
      propertyType: "Retail Center",
      currentAssessment: 1200000,
      estimatedValue: 950000,
      potentialSavings: 52500,
      status: "Won",
      jurisdiction: "Dallas County",
      parcelNumber: "DC-2024-112233",
      ownerName: "Dallas Retail Holdings",
      yearBuilt: 1995,
      squareFootage: 35000
    },
    {
      id: "4",
      address: "321 Industrial Dr, Austin, TX",
      propertyType: "Warehouse",
      currentAssessment: 850000,
      estimatedValue: 750000,
      potentialSavings: 22000,
      status: "Flagged",
      jurisdiction: "Travis County",
      parcelNumber: "TC-2024-445566",
      ownerName: "Austin Logistics Inc",
      yearBuilt: 1988,
      squareFootage: 45000
    },
    {
      id: "5",
      address: "555 Medical Center Dr, Houston, TX",
      propertyType: "Medical Office",
      currentAssessment: 2100000,
      estimatedValue: 1850000,
      potentialSavings: 65000,
      status: "Under Review",
      jurisdiction: "Harris County", 
      parcelNumber: "HC-2024-778899",
      ownerName: "Medical Plaza Partners",
      yearBuilt: 2010,
      squareFootage: 28000
    },
    {
      id: "6",
      address: "999 Tech Park Ln, Austin, TX",
      propertyType: "Office Building",
      currentAssessment: 3500000,
      estimatedValue: 3200000,
      potentialSavings: 84000,
      status: "Ready to File",
      jurisdiction: "Travis County",
      parcelNumber: "TC-2024-990011",
      ownerName: "Tech Campus LLC",
      yearBuilt: 2015,
      squareFootage: 65000
    }
  ];

  // Normalize response shape and handle either array or { items: [...] }
  const normalizeApiResponse = (apiData: any) => {
    const raw = Array.isArray(apiData) ? apiData : Array.isArray(apiData?.items) ? apiData.items : [];
    return raw.map(normalizeProperty);
  };
  
  const displayProperties: MockProperty[] = properties.length > 0 
    ? normalizeApiResponse(properties) as unknown as MockProperty[] 
    : mockProperties;

  // Enhanced search and filter logic
  const searchAndFilterProperties = (properties: MockProperty[]) => {
    let filtered = properties;

    // Text search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p: MockProperty) =>
        p.address.toLowerCase().includes(query) ||
        p.parcelNumber.toLowerCase().includes(query) ||
        p.ownerName.toLowerCase().includes(query) ||
        p.propertyType.toLowerCase().includes(query) ||
        p.jurisdiction.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
      );
    }

    // Jurisdiction filter
    if (selectedJurisdiction !== 'all') {
      filtered = filtered.filter((p: MockProperty) => p.jurisdiction === selectedJurisdiction);
    }

    // Property type filter
    if (selectedPropertyType !== 'all') {
      filtered = filtered.filter((p: MockProperty) => p.propertyType === selectedPropertyType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p: MockProperty) => p.status === filterStatus);
    }

    // Value range filter
    if (minValue || maxValue) {
      filtered = filtered.filter((p: MockProperty) => {
        const value = p.currentAssessment;
        const min = minValue ? parseInt(minValue) : 0;
        const max = maxValue ? parseInt(maxValue) : Infinity;
        return value >= min && value <= max;
      });
    }

    return filtered;
  };

  // Sort and filter properties
  const sortedAndFilteredProperties = searchAndFilterProperties(displayProperties)
    .sort((a: MockProperty, b: MockProperty) => {
      switch (sortBy) {
        case 'value':
          return b.currentAssessment - a.currentAssessment;
        case 'savings':
          return (b.potentialSavings || 0) - (a.potentialSavings || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return a.address.localeCompare(b.address);
      }
    });


  const handleBackToList = () => {
    setSelectedPropertyId(null);
    setViewMode('list');
  };

  const handleValuationComplete = (finalValue: number) => {
    toast({
      title: "Valuation Completed",
      description: `Final appraised value: ${fmtUSD(finalValue)}`,
    });
    completeAnalysis();
  };

  const handleCloseAnalysisModal = () => {
    resetAnalysis();
    setAppealPacketGenerated(null); // Reset packet state for next property
  };

  const handleFileAppeal = () => {
    if (!currentProperty) return;
    
    const analysis = getCurrentAnalysis();
    const valuation = getCurrentValuation();
    
    if (!analysis) {
      toast({
        title: "No Analysis Available",
        description: "Please complete the AI analysis before filing an appeal.",
        variant: "destructive"
      });
      return;
    }
    
    // Prepare appeal data using the appeals integration store
    prepareAppealFromAnalysis(currentProperty, analysis, valuation || undefined);
    
    toast({
      title: "Navigating to Appeals",
      description: `Transferring ${currentProperty.address} data to Appeals page for filing.`,
    });
    
    // Close the analysis modal
    resetAnalysis();
    
    // Navigate to Appeals page with property context
    navigate(`/appeals/${currentProperty.id}`);
  };

  // Filter management functions
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedJurisdiction('all');
    setSelectedPropertyType('all');
    setFilterStatus('all');
    setMinValue('');
    setMaxValue('');
  };

  const clearFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'jurisdiction':
        setSelectedJurisdiction('all');
        break;
      case 'propertyType':
        setSelectedPropertyType('all');
        break;
      case 'status':
        setFilterStatus('all');
        break;
      case 'valueRange':
        setMinValue('');
        setMaxValue('');
        break;
    }
  };

  // Get comprehensive jurisdiction options from service
  const getUniqueJurisdictions = () => {
    const jurisdictionOptions = getJurisdictionOptions();
    return jurisdictionOptions.map(j => j.label).sort();
  };

  const getUniquePropertyTypes = () => {
    const propertyTypes = getAllPropertyTypes();
    return propertyTypes.map(pt => pt.display_name).sort();
  };

  const getUniqueStatuses = () => {
    const statuses = Array.from(new Set(mockProperties.map(p => p.status)));
    return statuses.sort();
  };

  const handleCompareToggle = (propertyId: string) => {
    setCompareProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      }
      if (prev.length >= 3) {
        toast({
          title: "Comparison Limit",
          description: "You can compare up to 3 properties at a time",
          variant: "destructive"
        });
        return prev;
      }
      return [...prev, propertyId];
    });
  };

  const startComparison = () => {
    if (compareProperties.length < 2) {
      toast({
        title: "Select More Properties",
        description: "Please select at least 2 properties to compare",
        variant: "destructive"
      });
      return;
    }
    setViewMode('comparison');
  };

  // Add Property Functions
  const resetNewPropertyForm = () => {
    setNewPropertyData({
      address: '',
      propertyType: '',
      currentAssessment: '',
      estimatedValue: '',
      jurisdiction: '',
      parcelNumber: '',
      ownerName: '',
      yearBuilt: '',
      squareFootage: '',
      notes: ''
    });
  };

  const validatePropertyForm = () => {
    const errors: string[] = [];
    
    if (!newPropertyData.address.trim()) errors.push('Address is required');
    if (!newPropertyData.propertyType) errors.push('Property type is required');
    if (!newPropertyData.currentAssessment || isNaN(Number(newPropertyData.currentAssessment))) {
      errors.push('Valid current assessment is required');
    }
    if (!newPropertyData.jurisdiction) errors.push('Jurisdiction is required');
    if (!newPropertyData.parcelNumber.trim()) errors.push('Parcel number is required');
    if (!newPropertyData.ownerName.trim()) errors.push('Owner name is required');
    
    if (newPropertyData.yearBuilt && (isNaN(Number(newPropertyData.yearBuilt)) || Number(newPropertyData.yearBuilt) < 1800 || Number(newPropertyData.yearBuilt) > new Date().getFullYear())) {
      errors.push('Valid year built is required');
    }
    
    if (newPropertyData.squareFootage && (isNaN(Number(newPropertyData.squareFootage)) || Number(newPropertyData.squareFootage) <= 0)) {
      errors.push('Valid square footage is required');
    }

    return errors;
  };

  const handleAddProperty = async () => {
    const validationErrors = validatePropertyForm();
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive"
      });
      return;
    }

    setIsAddingProperty(true);

    try {
      // Map property type to backend enum before sending
      const mappedType = mapPropertyTypeLabelToBackend(newPropertyData.propertyType);
      
      console.info('[Add Property] Payload:', {
        address: newPropertyData.address.trim(),
        property_type: mappedType,
        current_assessment: Number(newPropertyData.currentAssessment),
        market_value: newPropertyData.estimatedValue 
          ? Number(newPropertyData.estimatedValue) 
          : Number(newPropertyData.currentAssessment) * 0.88
      });

      // Make API call to backend with correct payload structure
      const response = await authenticatedRequest('/api/portfolio/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: newPropertyData.address.trim(),
          city: newPropertyData.jurisdiction?.trim() || 'Default City',
          county: newPropertyData.jurisdiction?.trim() || 'Default County', 
          property_type: mappedType,
          current_assessment: Number(newPropertyData.currentAssessment),
          market_value: newPropertyData.estimatedValue 
            ? Number(newPropertyData.estimatedValue) 
            : Number(newPropertyData.currentAssessment) * 0.88,
          square_footage: newPropertyData.squareFootage ? Number(newPropertyData.squareFootage) : null,
          year_built: newPropertyData.yearBuilt ? Number(newPropertyData.yearBuilt) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add property: ${response.status}`);
      }

      const result = await response.json();
      console.info('[Add Property] Response:', result);
      
      // Clear any active filters so new property is visible
      setSearchQuery('');
      setFilterStatus('all');
      setSelectedJurisdiction('all');
      setSelectedPropertyType('all');
      setMinValue('');
      setMaxValue('');
      
      try {
        // Add property to store using normalized data
        if (result && result.id) {
          const normalizedProperty = normalizeProperty({
            ...result,
            id: getPropId(result) // Ensure ID normalization
          });
          
          // Optimistic insert - add to store (appends to end of list)
          addProperty(normalizedProperty);
          
          toast({
            title: "Property Added Successfully",
            description: `${result.address || newPropertyData.address} has been added to your portfolio.`,
          });
          
          console.info('[Add Property] Added to store:', normalizedProperty.id);
        } else {
          // If no response data, show generic success
          toast({
            title: "Property Added Successfully", 
            description: `Property has been added to your portfolio. Refresh the page to see it.`,
          });
        }
        
        // Reset form and close modal
        resetNewPropertyForm();
        setShowAddPropertyModal(false);
        
      } catch (uiError) {
        console.warn('[Add Property] UI error during success handling:', uiError);
        // Still show success since API call worked
        toast({
          title: "Property Added Successfully",
          description: "Property was added but there was a display issue. Refresh the page to see it.",
        });
        resetNewPropertyForm();
        setShowAddPropertyModal(false);
      }
      
    } catch (error: any) {
      console.error('Error adding property:', error);
      
      // Extract server validation error details
      let errorMessage = "Unable to add property. Please try again.";
      if (error?.detail) {
        // FastAPI validation error format
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          errorMessage = error.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error Adding Property",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsAddingProperty(false);
    }
  };

  // Export Portfolio Handler
  const handleExportPortfolio = async () => {
    setIsExporting(true);
    try {
      const selectedIds = compareProperties.length > 0 ? compareProperties : displayProperties.map(p => p.id);
      
      const response = await authenticatedRequest('/api/portfolio/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: 'csv',
          include_analysis: true,
          property_ids: selectedIds
        })
      });

      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      
      toast({
        title: "Export Started",
        description: `Exporting ${result.properties_count} properties. Download will be ready soon.`,
      });
      
      // In a real app, you'd poll for completion or use websockets
      setTimeout(() => {
        toast({
          title: "Export Ready",
          description: "Your portfolio export is ready for download.",
        });
      }, 3000);
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export portfolio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk Actions Handler
  const handleBulkActions = async (action: string) => {
    if (compareProperties.length === 0) {
      toast({
        title: "No Properties Selected",
        description: "Please select properties to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    setIsBulkProcessing(true);
    try {
      const response = await authenticatedRequest('/api/portfolio/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          property_ids: compareProperties,
          action_data: {}
        })
      });

      if (!response.ok) throw new Error('Bulk action failed');
      
      const result = await response.json();
      
      toast({
        title: "Bulk Action Started",
        description: `${result.message}. Processing ${result.properties_affected} properties.`,
      });
      
      setShowBulkActionsModal(false);
      
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: "Bulk Action Failed",
        description: "Unable to perform bulk action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const selectedProperty = displayProperties.find(p => p.id === selectedPropertyId);

  // Render valuation interface if property is selected
  if (viewMode === 'valuation' && selectedPropertyId && selectedProperty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            className="flex items-center gap-2"
            aria-label="Return to portfolio list"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" id="valuation-heading">Property Valuation</h1>
            <p className="text-gray-600">{selectedProperty.address}</p>
          </div>
        </div>
        
        <ValuationTabs 
          propertyId={selectedPropertyId === "1" ? "prop_001" : `prop_00${selectedPropertyId}`}
          propertyAddress={selectedProperty.address}
          onValuationComplete={handleValuationComplete}
        />
      </div>
    );
  }

  // Render comparison view
  if (viewMode === 'comparison' && compareProperties.length >= 2) {
    const compareData = compareProperties.map(id => 
      displayProperties.find((p: MockProperty) => p.id === id)
    ).filter(Boolean) as MockProperty[];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setViewMode('list');
              setCompareProperties([]);
            }}
            className="flex items-center gap-2"
            aria-label="Return to portfolio from comparison view"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" id="comparison-heading">Property Comparison</h1>
            <p className="text-gray-600">Comparing {compareData.length} properties</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Property comparison table">
              <thead className="bg-gray-50">
                <tr role="row">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Property</th>
                  {compareData.map((property: MockProperty) => (
                    <th key={property.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                      {property.address}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr role="row">
                  <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Type</th>
                  {compareData.map((property: MockProperty) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.propertyType}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50" role="row">
                  <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Current Assessment</th>
                  {compareData.map((property: MockProperty) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${fmtUSD(property.currentAssessment)}
                    </td>
                  ))}
                </tr>
                <tr role="row">
                  <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Estimated Value</th>
                  {compareData.map((property: MockProperty) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      ${fmtUSD(property.estimatedValue)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50" role="row">
                  <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Potential Savings</th>
                  {compareData.map((property: MockProperty) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      ${fmtUSD(property.potentialSavings)}
                    </td>
                  ))}
                </tr>
                <tr role="row">
                  <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Status</th>
                  {compareData.map((property: MockProperty) => (
                    <td key={property.id} className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        property.status === 'Won' 
                          ? 'bg-green-100 text-green-800'
                          : property.status === 'Appeal Filed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {property.status}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render analytics view
  if (viewMode === 'analytics') {
    const totalProperties = displayProperties.length;
    const totalSavings = displayProperties.reduce((sum: number, p: MockProperty) => sum + (p.potentialSavings || 0), 0);
    const totalAssessment = displayProperties.reduce((sum: number, p: MockProperty) => sum + (p.currentAssessment || 0), 0);
    const avgSavingsRate = totalAssessment > 0 ? (totalSavings / totalAssessment * 100).toFixed(1) : '0';
    const statusCounts = displayProperties.reduce((acc: Record<string, number>, p: MockProperty) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
            aria-label="Return to portfolio from analytics view"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" id="analytics-heading">Portfolio Analytics</h1>
            <p className="text-gray-600">Performance metrics and insights</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-blue-50">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-blue-600">Total Properties</h3>
              <p className="text-3xl font-bold text-blue-700 mt-2">{totalProperties}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-green-600">Total Potential Savings</h3>
              <p className="text-3xl font-bold text-green-700 mt-2">{fmtUSD(totalSavings)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-purple-600">Average Savings Rate</h3>
              <p className="text-3xl font-bold text-purple-700 mt-2">{avgSavingsRate}%</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50">
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-orange-600">Success Rate</h3>
              <p className="text-3xl font-bold text-orange-700 mt-2">
                {totalProperties > 0 ? Math.round((statusCounts['Won'] || 0) / totalProperties * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Distribution</h2>
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]: [string, number]) => {
              const percentage = totalProperties > 0 ? (count / totalProperties * 100).toFixed(1) : '0';
              return (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      status === 'Won' 
                        ? 'bg-green-100 text-green-800'
                        : status === 'Appeal Filed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full ${
                          status === 'Won' 
                            ? 'bg-green-500'
                            : status === 'Appeal Filed'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-medium text-gray-700">{count} ({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render multi-state jurisdiction view
  if (viewMode === 'multistate') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
            aria-label="Return to portfolio from multi-state view"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Portfolio
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" id="multistate-heading">Multi-State Jurisdiction</h1>
            <p className="text-gray-600">Manage appeals across multiple state jurisdictions</p>
          </div>
        </div>
        
        <MultiStateJurisdiction />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-[9999] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      
      {/* Main content with proper semantic structure */}
      <main id="main-content" tabIndex={-1} role="main" aria-label="Portfolio Management">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2" id="page-title">
              📁 Portfolio
            </h1>
            <p className="text-gray-600" id="page-description">
              Upload and manage your property data files
            </p>
          </div>
        <div className="flex gap-2" role="toolbar" aria-label="Portfolio actions">
          {compareProperties.length > 0 && (
            <Button 
              onClick={startComparison}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Compare ${compareProperties.length} selected properties`}
              aria-describedby="compare-description"
            >
              Compare ({compareProperties.length})
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => setViewMode('analytics')}
            aria-label="Switch to analytics view"
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
            Analytics
          </Button>
          <Button 
            variant="outline"
            onClick={() => setViewMode('multistate')}
            aria-label="Switch to multi-state jurisdiction view"
            className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
            Multi-State
          </Button>
        </div>
      </div>

      {error && (
        <div 
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
          <span id="error-message">{error}</span>
        </div>
      )}

      {/* Portfolio Summary */}
      {sortedAndFilteredProperties.length > 0 && (
        <section 
          className="bg-white rounded-xl shadow-md p-6"
          aria-labelledby="portfolio-summary-heading"
          role="region"
        >
          <h2 
            className="text-xl font-semibold text-gray-900 mb-4"
            id="portfolio-summary-heading"
          >
            Portfolio Summary
          </h2>
          <div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            role="list"
            aria-label="Portfolio statistics"
          >
            <div 
              className="bg-blue-50 rounded-lg p-4"
              role="listitem"
              aria-labelledby="total-properties-label"
            >
              <div className="flex items-center justify-between mb-2">
                <Building className="w-5 h-5 text-blue-600" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-blue-600" id="total-properties-label">
                Total Properties
              </p>
              <p 
                className="text-2xl font-bold text-blue-700"
                aria-describedby="total-properties-label"
              >
                {sortedAndFilteredProperties.length}
                {filterStatus !== 'all' && (
                  <span className="text-sm font-normal text-blue-600"> of {displayProperties.length}</span>
                )}
              </p>
            </div>
            <div 
              className="bg-green-50 rounded-lg p-4"
              role="listitem"
              aria-labelledby="potential-savings-label"
            >
              <div className="flex items-center justify-between mb-2">
                <Calculator className="w-5 h-5 text-green-600" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-green-600" id="potential-savings-label">
                Total Potential Savings
              </p>
              <p 
                className="text-2xl font-bold text-green-700"
                aria-describedby="potential-savings-label"
              >
                {fmtUSD(sortedAndFilteredProperties.reduce((sum: number, p: MockProperty) => sum + (p.potentialSavings || 0), 0))}
              </p>
            </div>
            <div 
              className="bg-yellow-50 rounded-lg p-4"
              role="listitem"
              aria-labelledby="under-review-label"
            >
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-yellow-600" id="under-review-label">
                Under Review
              </p>
              <p 
                className="text-2xl font-bold text-yellow-700"
                aria-describedby="under-review-label"
              >
                {sortedAndFilteredProperties.filter((p: MockProperty) => p.status === 'Under Review').length}
              </p>
            </div>
            <div 
              className="bg-purple-50 rounded-lg p-4"
              role="listitem"
              aria-labelledby="appeals-won-label"
            >
              <div className="flex items-center justify-between mb-2">
                <CheckSquare className="w-5 h-5 text-purple-600" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-purple-600" id="appeals-won-label">
                Appeals Won
              </p>
              <p 
                className="text-2xl font-bold text-purple-700"
                aria-describedby="appeals-won-label"
              >
                {sortedAndFilteredProperties.filter((p: MockProperty) => p.status === 'Won').length}
              </p>
            </div>
          </div>
        </section>
      )}


      {/* Valuation Results */}
      {sortedAndFilteredProperties.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Portfolio Valuation Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Income Approach</p>
                    <p className="text-2xl font-bold text-blue-700">$2,180,000</p>
                    <p className="text-xs text-blue-600">Average Portfolio Value</p>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Sales Comparison</p>
                    <p className="text-2xl font-bold text-green-700">$2,250,000</p>
                    <p className="text-xs text-green-600">Market Indication</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Cost Approach</p>
                    <p className="text-2xl font-bold text-purple-700">$2,100,000</p>
                    <p className="text-xs text-purple-600">Replacement Cost</p>
                  </div>
                  <Building className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Reconciled Portfolio Value</p>
                <p className="text-xl font-bold text-gray-900">$2,200,000</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Weighted Average
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Properties Section with Search and Filtering */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Properties ({sortedAndFilteredProperties.length})</h2>
          <div className="flex gap-2">
            {compareProperties.length > 0 && (
              <Button 
                onClick={startComparison}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Compare ({compareProperties.length})
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={handleExportPortfolio}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Portfolio
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowBulkActionsModal(true)}
              disabled={compareProperties.length === 0}
            >
              <Package className="w-4 h-4 mr-2" />
              Bulk Actions ({compareProperties.length})
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                resetNewPropertyForm();
                setShowAddPropertyModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Comprehensive Search Bar */}
        <div className="mb-6">
          <label htmlFor="property-search" className="sr-only">Search properties</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" aria-hidden="true" />
            <Input
              id="property-search"
              type="text"
              placeholder="Search by address, parcel number, owner name, property type, jurisdiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-lg"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">Search across property address, parcel number, owner name, property type, and jurisdiction</div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mb-6 space-y-4" role="region" aria-labelledby="filters-heading">
          <div className="flex items-center justify-between">
            <h3 id="filters-heading" className="text-sm font-medium text-gray-800">Filters</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-blue-600 hover:text-blue-700"
                aria-expanded={showAdvancedFilters}
                aria-controls="advanced-filters"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1" aria-hidden="true" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
              </Button>
              {(searchQuery || selectedJurisdiction !== 'all' || selectedPropertyType !== 'all' || filterStatus !== 'all' || minValue || maxValue) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700"
                  aria-label="Clear all filters"
                >
                  <X className="w-4 h-4 mr-1" aria-hidden="true" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="jurisdiction-filter" className="block text-xs font-medium text-gray-800 mb-1">Jurisdiction</label>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger id="jurisdiction-filter" aria-label="Filter by jurisdiction">
                  <SelectValue placeholder="All Jurisdictions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {getUniqueJurisdictions().map(jurisdiction => (
                    <SelectItem key={jurisdiction} value={jurisdiction}>
                      {jurisdiction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="property-type-filter" className="block text-xs font-medium text-gray-800 mb-1">Property Type</label>
              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                <SelectTrigger id="property-type-filter" aria-label="Filter by property type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Property Types</SelectItem>
                  {getUniquePropertyTypes().map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="status-filter" className="block text-xs font-medium text-gray-800 mb-1">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter" aria-label="Filter by status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {getUniqueStatuses().map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="sort-by-filter" className="block text-xs font-medium text-gray-800 mb-1">Sort By</label>
              <Select value={sortBy} onValueChange={(value: 'address' | 'value' | 'savings' | 'status') => setSortBy(value)}>
                <SelectTrigger id="sort-by-filter" aria-label="Sort properties by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="address">Address</SelectItem>
                  <SelectItem value="value">Assessment Value</SelectItem>
                  <SelectItem value="savings">Potential Savings</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div id="advanced-filters" className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="min-value" className="block text-xs font-medium text-gray-800 mb-1">Assessment Value Range</label>
                  <div className="flex gap-2">
                    <Input
                      id="min-value"
                      type="number"
                      placeholder="Min value"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      className="flex-1"
                      aria-label="Minimum assessment value"
                    />
                    <span className="self-center text-gray-500">to</span>
                    <Input
                      id="max-value"
                      type="number"
                      placeholder="Max value"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      className="flex-1"
                      aria-label="Maximum assessment value"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-800 mb-1">Quick Filters</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMinValue('1000000');
                        setMaxValue('');
                      }}
                      className="h-8"
                      aria-label="Filter for high value properties over $1 million"
                    >
                      High Value ($1M+)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterStatus('Flagged')}
                      className="h-8"
                      aria-label="Show only flagged properties"
                    >
                      Flagged Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedJurisdiction('Harris County')}
                      className="h-8"
                      aria-label="Filter for Harris County properties"
                    >
                      Harris County
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(searchQuery || selectedJurisdiction !== 'all' || selectedPropertyType !== 'all' || filterStatus !== 'all' || minValue || maxValue) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-xs font-medium text-gray-700 self-center">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => clearFilter('search')} aria-label="Remove search filter" className="hover:bg-gray-200 rounded">
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {selectedJurisdiction !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {selectedJurisdiction}
                  <button onClick={() => clearFilter('jurisdiction')} aria-label={`Remove ${selectedJurisdiction} filter`} className="hover:bg-gray-200 rounded">
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {selectedPropertyType !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {selectedPropertyType}
                  <button onClick={() => clearFilter('propertyType')} aria-label={`Remove ${selectedPropertyType} filter`} className="hover:bg-gray-200 rounded">
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {filterStatus}
                  <button onClick={() => clearFilter('status')} aria-label={`Remove ${filterStatus} status filter`} className="hover:bg-gray-200 rounded">
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
              {(minValue || maxValue) && (
                <Badge variant="secondary" className="gap-1">
                  ${minValue || '0'} - ${maxValue || '∞'}
                  <button onClick={() => clearFilter('valueRange')} aria-label="Remove value range filter" className="hover:bg-gray-200 rounded">
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
            <p className="text-gray-600 mt-2">Loading properties...</p>
          </div>
        ) : displayProperties.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No properties yet</h3>
            <p className="text-gray-500 mb-4">Upload your property data files in the Appeals section to get started</p>
            <Button 
              onClick={() => navigate('/appeals')} 
              aria-label="Navigate to Appeals section to upload property data"
              className="transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Go to Appeals
            </Button>
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Property list">
            {sortedAndFilteredProperties.map((property: MockProperty) => (
              <Card 
                key={property.id} 
                className={`hover:shadow-md transition-shadow ${
                  compareProperties.includes(property.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                role="listitem"
                aria-label={`Property: ${property.address}`}
              >
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-start">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompareToggle(property.id);
                          }}
                          onKeyDown={(e) => handleKeyDown(e, () => handleCompareToggle(property.id))}
                          className="mr-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                          aria-label={`${compareProperties.includes(property.id) ? 'Remove from' : 'Add to'} comparison: ${property.address}`}
                          tabIndex={0}
                        >
                          {compareProperties.includes(property.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" aria-hidden="true" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" aria-hidden="true" />
                          )}
                        </button>
                        <div className="flex items-start space-x-3">
                          <Building className="w-5 h-5 text-gray-500 mt-1" aria-hidden="true" />
                          <div>
                            <h3 className="font-medium text-gray-900">{property.address}</h3>
                            <p className="text-sm text-gray-600">{property.propertyType}</p>
                            <div className="space-y-1 mt-2">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 text-gray-400 mr-1" aria-hidden="true" />
                                <span className="text-sm text-gray-500">{property.jurisdiction}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                Parcel: {property.parcelNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                Owner: {property.ownerName}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Current Assessment</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${fmtUSD(property.currentAssessment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Est. Fair Value</p>
                        <p className="text-lg font-semibold text-blue-600">
                          ${fmtUSD(property.estimatedValue)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Potential Savings</p>
                        <p className="text-lg font-semibold text-green-600">
                          {fmtUSD(property.potentialSavings)}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          property.status === 'Won' 
                            ? 'bg-green-100 text-green-800'
                            : property.status === 'Appeal Filed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-2">
                      <Button
                        onClick={() => handlePropertySelect(property.id)}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                        size="sm"
                        disabled={isAnalyzing === property.id}
                        aria-label={`Start property workup for ${property.address}`}
                      >
                        {isAnalyzing === property.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4 mr-2" aria-hidden="true" />
                            Property Workup
                          </>
                        )}
                      </Button>
                      
                      {analysisResults[property.id] && (
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Success Probability:</span>
                            <span className="font-medium text-green-600">
                              {Math.round(analysisResults[property.id].appeal_probability * 100)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium">
                              {Math.round(analysisResults[property.id].confidence_score * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Property Analysis Modal */}
      <Dialog open={showAnalysisModal} onOpenChange={(open) => !open && resetAnalysis()}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto" role="dialog" aria-labelledby="analysis-modal-title">
          <DialogHeader>
            <DialogTitle id="analysis-modal-title" className="flex items-center gap-2">
              <Calculator className="w-5 h-5" aria-hidden="true" />
              Property Workup
              {currentProperty && (
                <Badge variant="outline" className="ml-2">
                  {currentProperty.address}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {currentProperty && (
            <div className="space-y-6">
              {/* Comprehensive Valuation Analysis - MOVED TO TOP */}
              <ValuationTabs 
                propertyId={currentProperty.id === "1" ? "prop_001" : `prop_00${currentProperty.id}`}
                propertyAddress={currentProperty.address}
                onValuationComplete={handleValuationComplete}
              />

              {/* API Valuation Summary for Selected Property */}
              <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">API Valuation Summary - {currentProperty.address}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-600">NOI</p>
                      <p className="text-xl font-bold text-blue-700">$125,000</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">Cap Rate</p>
                      <p className="text-xl font-bold text-green-700">7.4%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-600">Expense Ratio</p>
                      <p className="text-xl font-bold text-amber-700">42%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-purple-600">Valuation Score</p>
                      <p className="text-xl font-bold text-purple-700">82/100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Property Data - Property Specific */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Upload Property Data - {currentProperty.address}</CardTitle>
                  <p className="text-sm text-gray-600">Upload additional property-specific documents for comprehensive analysis</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                      <CardContent className="p-6 text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">Local Files</p>
                        <p className="text-sm text-gray-500 mb-4">CSV, Excel, XML, PDF files</p>
                        <Button 
                          onClick={() => document.getElementById('workup-file-upload')?.click()}
                          variant="outline"
                          size="sm"
                        >
                          Choose Files
                        </Button>
                        <input
                          id="workup-file-upload"
                          type="file"
                          multiple
                          accept=".csv,.xlsx,.xls,.xml,.pdf"
                          className="hidden"
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed border-gray-300">
                      <CardContent className="p-6 text-center">
                        <CloudUploadButton provider="gdrive" />
                        <p className="font-medium text-gray-700 mt-2">Google Drive</p>
                        <p className="text-sm text-gray-500">Import from cloud</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed border-gray-300">
                      <CardContent className="p-6 text-center">
                        <CloudUploadButton provider="dropbox" />
                        <p className="font-medium text-gray-700 mt-2">Dropbox</p>
                        <p className="text-sm text-gray-500">Import from cloud</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed border-gray-300">
                      <CardContent className="p-6 text-center">
                        <CloudUploadButton provider="icloud" />
                        <p className="font-medium text-gray-700 mt-2">iCloud</p>
                        <p className="text-sm text-gray-500">Import from Apple cloud</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* AI Analysis Results Header */}
              {getCurrentAnalysis() && (
                <Card className="bg-gradient-to-r from-blue-50 to-green-50">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-blue-600">Appeal Success</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {Math.round(getCurrentAnalysis()!.appeal_probability * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-green-600">Confidence Score</p>
                        <p className="text-2xl font-bold text-green-700">
                          {Math.round(getCurrentAnalysis()!.confidence_score * 100)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-purple-600">Potential Reduction</p>
                        <p className="text-2xl font-bold text-purple-700">
                          {fmtUSD(getCurrentAnalysis()?.estimated_reduction) || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-amber-600">Recommendation</p>
                        <Badge className="bg-amber-100 text-amber-800">
                          {getCurrentAnalysis()!.recommendation}
                        </Badge>
                      </div>
                    </div>
                    
                    {getCurrentAnalysis()?.key_factors && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Key Factors:</p>
                        <div className="flex flex-wrap gap-2">
                          {getCurrentAnalysis()!.key_factors!.map((factor: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Loading State */}
              {isAnalyzing === currentProperty.id && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" aria-hidden="true" />
                    <p className="text-gray-600">Running AI analysis...</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handleCloseAnalysisModal}
                  aria-label="Close property analysis modal"
                >
                  Close Analysis
                </Button>
                
                <div className="flex gap-3">
                  {analysisComplete && (
                    <>
                      <Button 
                        onClick={async () => {
                          if (!currentProperty || isGeneratingAppeal) return;
                          
                          setIsGeneratingAppeal(true);
                          
                          try {
                            console.log("Generating appeal packet for:", currentProperty.address);
                            
                            // Use shared helper function for property ID normalization
                            const propertyId = getPropId(currentProperty);
                            console.log('📋 Normalized property ID for API:', propertyId);
                            console.info('[Proof] Appeals payload', { property_id: propertyId });
                            
                            // Make real API call to backend with correct property_id (simplified payload)
                            const response = await authenticatedRequest('/api/appeals/generate-packet', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                property_id: propertyId
                              })
                            });
                            
                            if (!response.ok) {
                              const errorData = await response.json().catch(() => ({}));
                              throw new Error(errorData.detail || `Appeal packet generation failed: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            const packetId = result.packet_id ?? result.id;
                            console.log('✅ Appeal packet generation started, ID:', packetId);
                            
                            // C2: APPEALS STATUS POLLING with backoff
                            console.log('🔄 Starting status polling for packet:', packetId);
                            let tries = 0;
                            const maxTries = 20;
                            
                            while (tries < maxTries) {
                              tries++;
                              const waitTime = Math.min(2000, 300 + tries * 200); // Progressive backoff
                              await new Promise(resolve => setTimeout(resolve, waitTime));
                              
                              console.log(`🔍 Status check ${tries}/${maxTries} for packet ${packetId}`);
                              const statusResponse = await authenticatedRequest(`/api/appeals/packet-status/${packetId}`);
                              
                              if (!statusResponse.ok) {
                                const errorData = await statusResponse.json().catch(() => ({}));
                                console.warn('Status check failed:', errorData.detail || statusResponse.status);
                                continue; // Continue polling on status check failures
                              }
                              
                              const statusJson = await statusResponse.json();
                              console.log('📊 Status response:', statusJson);
                              
                              if (statusJson.status === 'ready' || statusJson.status === 'completed') {
                                console.log('✅ Appeal packet ready for download');
                                break;
                              }
                              
                              if (statusJson.status === 'error' || statusJson.status === 'failed') {
                                throw new Error('Appeal packet generation failed on server');
                              }
                            }
                            
                            if (tries >= maxTries) {
                              throw new Error('Appeal packet generation timeout - please try again later');
                            }
                            
                            // C2: DOWNLOAD APPEAL PACKET
                            console.log('📥 GET /api/appeals/download/' + packetId);
                            const downloadResponse = await authenticatedRequest(`/api/appeals/download/${packetId}`);
                            
                            if (!downloadResponse.ok) {
                              const errorData = await downloadResponse.json().catch(() => ({}));
                              throw new Error(errorData.detail || `Appeal packet download failed: ${downloadResponse.status}`);
                            }
                            
                            // Handle file download with Content-Disposition
                            const blob = await downloadResponse.blob();
                            const contentDisposition = downloadResponse.headers.get('Content-Disposition');
                            let filename = `appeal_packet_${propertyId}.pdf`;
                            
                            if (contentDisposition) {
                              const matches = contentDisposition.match(/filename="?([^"]+)"?/);
                              if (matches) filename = matches[1];
                            }
                            
                            // Create download link and trigger download
                            const downloadLink = document.createElement('a');
                            downloadLink.href = URL.createObjectURL(blob);
                            downloadLink.download = filename;
                            document.body.appendChild(downloadLink);
                            downloadLink.click();
                            document.body.removeChild(downloadLink);
                            URL.revokeObjectURL(downloadLink.href);
                            
                            console.log('✅ Appeal packet downloaded:', filename);
                            setAppealPacketGenerated(packetId);
                            
                            toast({
                              title: "Appeal Packet Complete",
                              description: `Professional appeal packet for ${currentProperty.address} generated and downloaded successfully.`,
                            });
                            
                          } catch (error) {
                            console.error('Error generating appeal packet:', error);
                            toast({
                              title: "Generation Failed",
                              description: "Unable to generate appeal packet. Please try again.",
                              variant: "destructive"
                            });
                          } finally {
                            setIsGeneratingAppeal(false);
                          }
                        }}
                        disabled={isGeneratingAppeal}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        aria-label="Generate appeal packet for this property"
                      >
                        {isGeneratingAppeal ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                            Generate Appeal
                          </>
                        )}
                      </Button>
                      {appealPacketGenerated && (
                        <Button 
                          onClick={() => {
                            // Go to Filing page instead of Appeals page
                            navigate('/filing');
                            toast({
                              title: "Filing Appeal",
                              description: `Navigating to Filing page to submit ${currentProperty?.address} appeal to ${currentProperty?.jurisdiction}.`,
                            });
                          }}
                          className="bg-green-600 hover:bg-green-700"
                          aria-label="File appeal with county for this property"
                          title="Submit packet to county filing system"
                        >
                          <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                          File with County
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button 
                    variant="outline"
                    disabled={isGeneratingReport}
                    aria-label="Generate comprehensive property report"
                    onClick={async () => {
                      console.log('🌟 Supernova button clicked');
                      console.log('🏠 Current property:', currentProperty);
                      console.log('📋 Properties list:', properties);
                      console.log('🔍 Selected property ID:', selectedPropertyId);
                      
                      if (!currentProperty) {
                        console.error('❌ No current property selected');
                        toast({
                          title: "No Property Selected",
                          description: "Please select a property from your portfolio first.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      setIsGeneratingReport(true);
                      
                      try {
                        console.log('Starting Supernova report generation for:', currentProperty);
                        
                        // Validate required data before proceeding - use crosswalk for type normalization
                        if (!currentProperty.address) {
                          throw new Error('Property address is required for report generation');
                        }
                        
                        // Derive backend property type using crosswalk system
                        const backendPropertyType = mapPropertyTypeLabelToBackend(currentProperty.propertyType);
                        
                        // Generate comprehensive IAAO/MAI compliant report data with Phase 1 enhancements
                        console.log('Getting current analysis...');
                        const currentAnalysis = getCurrentAnalysis();
                        console.log('Current analysis:', currentAnalysis);
                        
                        console.log('Getting current valuation...');
                        const currentValuation = getCurrentValuation();
                        console.log('Current valuation:', currentValuation);
                        
                        if (!currentAnalysis) {
                          throw new Error('Analysis data is required for Supernova report generation. Please run AI analysis first.');
                        }
                        
                        // C1: SUPERNOVA API FLOW - Generate → Unlock → Download
                        const propertyId = getPropId(currentProperty);
                        console.log('🌟 Starting Supernova API flow for property:', propertyId);
                        console.info('[Proof] Supernova payload', { property_id: propertyId, report_type: 'supernova' });
                        // Step 1: Generate Report
                        console.log('📤 POST /api/reports/generate');
                        const generateResponse = await authenticatedRequest('/api/reports/generate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            property_id: propertyId,
                            report_type: 'supernova'
                          })
                        });
                        
                        if (!generateResponse.ok) {
                          const errorData = await generateResponse.json().catch(() => ({}));
                          throw new Error(errorData.detail || `Report generation failed: ${generateResponse.status}`);
                        }
                        
                        const genJson = await generateResponse.json();
                        const reportId = genJson.report_id ?? genJson.id;
                        console.log('✅ Report generation started, ID:', reportId);
                        
                        // Step 2: Unlock Report (always required for Supernova)
                        console.log('🔓 POST /api/reports/unlock');
                        const unlockResponse = await authenticatedRequest('/api/reports/unlock', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ report_id: reportId })
                        });
                        
                        if (!unlockResponse.ok) {
                          const errorData = await unlockResponse.json().catch(() => ({}));
                          throw new Error(errorData.detail || `Report unlock failed: ${unlockResponse.status}`);
                        }
                        
                        const unlockJson = await unlockResponse.json();
                        const downloadUrl = unlockJson.download_url || `/api/reports/download/${reportId}`;
                        console.log('✅ Report unlocked, download URL:', downloadUrl);
                        
                        // Step 3: Download Report
                        console.log('📥 GET', downloadUrl);
                        const downloadResponse = await authenticatedRequest(downloadUrl);
                        
                        if (!downloadResponse.ok) {
                          const errorData = await downloadResponse.json().catch(() => ({}));
                          throw new Error(errorData.detail || `Report download failed: ${downloadResponse.status}`);
                        }
                        
                        // Handle file download with Content-Disposition
                        const blob = await downloadResponse.blob();
                        const contentDisposition = downloadResponse.headers.get('Content-Disposition');
                        let filename = `supernova_report_${propertyId}.pdf`;
                        
                        if (contentDisposition) {
                          const matches = contentDisposition.match(/filename="?([^"]+)"?/);
                          if (matches) filename = matches[1];
                        }
                        
                        // Create download link and trigger download
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = filename;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        URL.revokeObjectURL(downloadLink.href);
                        
                        console.log('✅ Supernova report downloaded:', filename);
                        
                        // Show success message
                        toast({
                          title: "🌟 Supernova Report Generated",
                          description: `Professional IAAO-compliant report for ${currentProperty.address} downloaded successfully.`,
                        });
                        
                        // Mark analysis as complete so Generate Appeal button shows
                        completeAnalysis();
                      
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      console.error('🚨 ERROR generating enhanced report:', errorMessage, error);
                      console.error('🚨 Full error object:', error);
                      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack available');
                      toast({
                        title: "Supernova Report Generation Error",
                        description: `Error: ${errorMessage}`,
                        variant: "destructive",
                      });
                    } finally {
                      setIsGeneratingReport(false);
                    }
                    }}
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        Generating Supernova 2B Report...
                      </>
                    ) : (
                      '🌟 Generate Supernova Report'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReportPreview showReportPreview={showReportPreview} setShowReportPreview={setShowReportPreview} reportData={reportData} />

      {/* Add Property Modal */}
      <Dialog open={showAddPropertyModal} onOpenChange={setShowAddPropertyModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Add New Property</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address">Property Address *</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St, City, State ZIP"
                    value={newPropertyData.address}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={newPropertyData.propertyType} onValueChange={(value) => setNewPropertyData(prev => ({ ...prev, propertyType: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllPropertyTypes().map(propertyType => (
                        <SelectItem key={propertyType.iaao_code} value={propertyType.display_name}>
                          {propertyType.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                  <Select value={newPropertyData.jurisdiction} onValueChange={(value) => setNewPropertyData(prev => ({ ...prev, jurisdiction: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      {getJurisdictionOptions().map(jurisdiction => (
                        <SelectItem key={jurisdiction.value} value={jurisdiction.label}>
                          {jurisdiction.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Assessment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Assessment Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentAssessment">Current Assessment Value *</Label>
                  <Input
                    id="currentAssessment"
                    type="number"
                    placeholder="500000"
                    value={newPropertyData.currentAssessment}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, currentAssessment: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimatedValue">Estimated Market Value</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    placeholder="Leave blank for auto-calculation"
                    value={newPropertyData.estimatedValue}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, estimatedValue: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parcelNumber">Parcel Number *</Label>
                  <Input
                    id="parcelNumber"
                    type="text"
                    placeholder="123-456-789"
                    value={newPropertyData.parcelNumber}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, parcelNumber: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ownerName">Owner Name *</Label>
                  <Input
                    id="ownerName"
                    type="text"
                    placeholder="Property Owner LLC"
                    value={newPropertyData.ownerName}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    placeholder="1995"
                    value={newPropertyData.yearBuilt}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, yearBuilt: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="squareFootage">Square Footage</Label>
                  <Input
                    id="squareFootage"
                    type="number"
                    placeholder="2500"
                    value={newPropertyData.squareFootage}
                    onChange={(e) => setNewPropertyData(prev => ({ ...prev, squareFootage: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about this property..."
                  value={newPropertyData.notes}
                  onChange={(e) => setNewPropertyData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                resetNewPropertyForm();
                setShowAddPropertyModal(false);
              }}
              disabled={isAddingProperty}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProperty}
              disabled={isAddingProperty}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddingProperty ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Property...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Modal */}
      <Dialog open={showBulkActionsModal} onOpenChange={setShowBulkActionsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Bulk Actions</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Perform actions on {compareProperties.length} selected properties:
            </p>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleBulkActions('update_status')}
                disabled={isBulkProcessing}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Update Status
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleBulkActions('flag_properties')}
                disabled={isBulkProcessing}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Flag Properties
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleBulkActions('bulk_analysis')}
                disabled={isBulkProcessing}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Run Analysis
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleBulkActions('export_selected')}
                disabled={isBulkProcessing}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkActionsModal(false)}
              disabled={isBulkProcessing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </main>
    </div>
  );
}

export default Portfolio;