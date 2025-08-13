/**
 * 🍎 CHARLY 2.0 - PROPERTY CLAIM MODAL
 * 
 * Apple-quality property claiming workflow with progressive disclosure
 * and sophisticated user experience for property ownership management.
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/v2/Button';
import { Card } from '@/components/v2/Card';
import { StepDisclosure, CollapsibleSection } from '@/components/v2/ProgressiveDisclosure';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// import { useToast } from '@/components/ui/use-toast';
import { usePropertyOwnership } from '@/hooks/usePropertyOwnership';
import { Upload, FileText, Shield, Users, CheckCircle, Building, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationMethod } from '@/types/property';

// ============================================================================
// TYPES
// ============================================================================

interface PropertyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyAddress: string;
  currentOwner?: string;
}

interface ClaimFormData {
  claimType: 'owner' | 'agent' | 'manager' | 'attorney';
  relationship: string;
  evidenceTypes: VerificationMethod[];
  uploadedFiles: File[];
  notes: string;
  agreeToTerms: boolean;
  shareWithCommunity: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PropertyClaimModal({
  isOpen,
  onClose,
  propertyId,
  propertyAddress
}: PropertyClaimModalProps) {
  // const { toast } = useToast();
  const { claimProperty, isLoading, getUserReputationScore } = usePropertyOwnership();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClaimFormData>({
    claimType: 'owner',
    relationship: '',
    evidenceTypes: [],
    uploadedFiles: [],
    notes: '',
    agreeToTerms: false,
    shareWithCommunity: true
  });

  const userReputation = getUserReputationScore();
  const totalSteps = 4;

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleClaimTypeChange = (claimType: ClaimFormData['claimType']) => {
    setFormData(prev => ({ 
      ...prev, 
      claimType,
      relationship: getDefaultRelationship(claimType)
    }));
  };

  const getDefaultRelationship = (type: ClaimFormData['claimType']): string => {
    switch (type) {
      case 'owner': return 'Property Owner';
      case 'agent': return 'Real Estate Agent';
      case 'manager': return 'Property Manager';
      case 'attorney': return 'Legal Representative';
      default: return '';
    }
  };

  const handleEvidenceToggle = (evidence: VerificationMethod) => {
    setFormData(prev => ({
      ...prev,
      evidenceTypes: prev.evidenceTypes.includes(evidence)
        ? prev.evidenceTypes.filter(e => e !== evidence)
        : [...prev.evidenceTypes, evidence]
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const success = await claimProperty(propertyId, {
        claimType: formData.claimType,
        relationship: formData.relationship,
        evidenceProvided: formData.evidenceTypes,
        notes: formData.notes
      });

      if (success) {
        onClose();
        // Reset form
        setCurrentStep(1);
        setFormData({
          claimType: 'owner',
          relationship: '',
          evidenceTypes: [],
          uploadedFiles: [],
          notes: '',
          agreeToTerms: false,
          shareWithCommunity: true
        });
      }
    } catch (error) {
      console.error('Failed to submit claim:', error);
    }
  };

  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.claimType !== '' && formData.relationship.length > 0;
      case 2:
        return formData.evidenceTypes.length > 0;
      case 3:
        return formData.uploadedFiles.length > 0 || formData.notes.length > 0;
      case 4:
        return formData.agreeToTerms;
      default:
        return false;
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
              step < currentStep
                ? "bg-green-500 text-white"
                : step === currentStep
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                "w-12 h-1 mx-2",
                step < currentStep ? "bg-green-500" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderClaimTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="w-12 h-12 mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Property Claim Type</h3>
        <p className="text-gray-600">
          What is your relationship to this property?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { value: 'owner', label: 'Property Owner', description: 'I own this property' },
          { value: 'agent', label: 'Real Estate Agent', description: 'I represent the owner' },
          { value: 'manager', label: 'Property Manager', description: 'I manage this property' },
          { value: 'attorney', label: 'Legal Representative', description: 'I represent the owner legally' }
        ].map((option) => (
          <Card
            key={option.value}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              formData.claimType === option.value
                ? "ring-2 ring-blue-500 bg-blue-50"
                : "hover:bg-gray-50"
            )}
            onClick={() => handleClaimTypeChange(option.value as ClaimFormData['claimType'])}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{option.label}</h4>
                {formData.claimType === option.value && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <Label htmlFor="relationship">Specific Relationship</Label>
        <Input
          id="relationship"
          value={formData.relationship}
          onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
          placeholder="e.g., Property Owner, Listing Agent, etc."
          className="mt-1"
        />
      </div>
    </div>
  );

  const renderEvidenceStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Evidence of Relationship</h3>
        <p className="text-gray-600">
          What documentation can you provide to verify your relationship to this property?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { value: 'deed', label: 'Property Deed', description: 'Official ownership document' },
          { value: 'tax_bill', label: 'Tax Bill', description: 'Recent property tax statement' },
          { value: 'utility_bill', label: 'Utility Bill', description: 'Recent utility statement' },
          { value: 'lease_agreement', label: 'Lease Agreement', description: 'Rental or management agreement' },
          { value: 'management_contract', label: 'Management Contract', description: 'Property management agreement' }
        ].map((evidence) => (
          <div
            key={evidence.value}
            className={cn(
              "p-4 border rounded-lg cursor-pointer transition-all duration-200",
              formData.evidenceTypes.includes(evidence.value as VerificationMethod)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => handleEvidenceToggle(evidence.value as VerificationMethod)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{evidence.label}</h4>
                <p className="text-sm text-gray-600 mt-1">{evidence.description}</p>
              </div>
              {formData.evidenceTypes.includes(evidence.value as VerificationMethod) && (
                <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 mx-auto text-purple-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload Documentation</h3>
        <p className="text-gray-600">
          Upload supporting documents or provide additional details about your claim.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="fileUpload">Upload Documents</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload or drag and drop
            </p>
            <input
              id="fileUpload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('fileUpload')?.click()}
            >
              Choose Files
            </Button>
          </div>
        </div>

        {formData.uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Files</Label>
            {formData.uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div>
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Provide any additional context or information that supports your claim..."
            rows={4}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-12 h-12 mx-auto text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Review & Submit</h3>
        <p className="text-gray-600">
          Review your claim details and privacy preferences before submitting.
        </p>
      </div>

      <Card className="p-6">
        <h4 className="font-semibold mb-4">Claim Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Property:</span>
            <span className="font-medium">{propertyAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Claim Type:</span>
            <Badge variant="secondary">{formData.claimType}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Relationship:</span>
            <span className="font-medium">{formData.relationship}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Evidence Types:</span>
            <span className="font-medium">{formData.evidenceTypes.length} selected</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Documents:</span>
            <span className="font-medium">{formData.uploadedFiles.length} files</span>
          </div>
        </div>
      </Card>

      <CollapsibleSection title="Privacy & Community Settings" defaultOpen={true}>
        <div className="space-y-4 p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="shareWithCommunity"
              checked={formData.shareWithCommunity}
              onChange={(e) => setFormData(prev => ({ ...prev, shareWithCommunity: e.target.checked }))}
              className="mt-1"
            />
            <div>
              <Label htmlFor="shareWithCommunity" className="font-medium">
                Contribute to Community Intelligence
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Share anonymized property data to help improve market insights for all users.
                Your personal information will never be shared.
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Your Reputation Score</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${userReputation * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-blue-900">
                {Math.round(userReputation * 100)}%
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Higher reputation scores help verify claims faster
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="agreeToTerms"
          checked={formData.agreeToTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
          className="mt-1"
        />
        <div>
          <Label htmlFor="agreeToTerms" className="font-medium">
            I agree to the terms and conditions
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            I certify that the information provided is accurate and I have the legal right to claim this property.
          </p>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>Claim Property Ownership</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {renderStepIndicator()}

          <StepDisclosure
            steps={[
              { title: "Claim Type", content: renderClaimTypeStep() },
              { title: "Evidence", content: renderEvidenceStep() },
              { title: "Upload", content: renderUploadStep() },
              { title: "Review", content: renderReviewStep() }
            ]}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        </div>

        <DialogFooter className="space-x-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={isLoading}
            >
              Previous
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNextStep() || isLoading}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceedToNextStep() || isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit Claim'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}