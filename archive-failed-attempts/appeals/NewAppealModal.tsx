import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import JurisdictionDropdown from '@/components/JurisdictionDropdown';

interface NewAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  isGeneratingNarrative: boolean;
  isGeneratingPacket: boolean;
  generatedNarrative: string;
  appealForm: {
    property_address: string;
    current_assessment: string;
    proposed_value: string;
    jurisdiction: string;
    reason: string;
  };
  onFormChange: (name: string, value: string) => void;
  onGenerateNarrative: () => Promise<void>;
  formErrors: { [key: string]: string };
  formTouched: { [key: string]: boolean };
  onFieldBlur: (name: string) => void;
  isFormValid: () => boolean;
}

export const NewAppealModal: React.FC<NewAppealModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isGeneratingNarrative,
  isGeneratingPacket,
  generatedNarrative,
  appealForm,
  onFormChange,
  onGenerateNarrative,
  formErrors,
  formTouched,
  onFieldBlur,
  isFormValid
}) => {
  const handleSubmit = async () => {
    if (!isFormValid()) return;
    await onSubmit(appealForm);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Appeal</DialogTitle>
          <DialogDescription>
            Fill in the property details to generate an automated appeal packet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="property_address">Property Address *</Label>
              <Input
                id="property_address"
                value={appealForm.property_address}
                onChange={(e) => onFormChange("property_address", e.target.value)}
                onBlur={() => onFieldBlur("property_address")}
                placeholder="123 Main Street, City, State 12345"
                className={formErrors.property_address && formTouched.property_address ? "border-red-500" : ""}
              />
              {formErrors.property_address && formTouched.property_address && (
                <p className="text-sm text-red-600 mt-1">{formErrors.property_address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_assessment">Current Assessment *</Label>
                <Input
                  id="current_assessment"
                  type="number"
                  value={appealForm.current_assessment}
                  onChange={(e) => onFormChange("current_assessment", e.target.value)}
                  onBlur={() => onFieldBlur("current_assessment")}
                  placeholder="450000"
                  className={formErrors.current_assessment && formTouched.current_assessment ? "border-red-500" : ""}
                />
                {formErrors.current_assessment && formTouched.current_assessment && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.current_assessment}</p>
                )}
              </div>

              <div>
                <Label htmlFor="proposed_value">Proposed Value *</Label>
                <Input
                  id="proposed_value"
                  type="number"
                  value={appealForm.proposed_value}
                  onChange={(e) => onFormChange("proposed_value", e.target.value)}
                  onBlur={() => onFieldBlur("proposed_value")}
                  placeholder="380000"
                  className={formErrors.proposed_value && formTouched.proposed_value ? "border-red-500" : ""}
                />
                {formErrors.proposed_value && formTouched.proposed_value && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.proposed_value}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="jurisdiction">Jurisdiction *</Label>
              <JurisdictionDropdown
                value={appealForm.jurisdiction}
                onChange={(value) => onFormChange("jurisdiction", value)}
                onBlur={() => onFieldBlur("jurisdiction")}
                className={formErrors.jurisdiction && formTouched.jurisdiction ? "border-red-500" : ""}
              />
              {formErrors.jurisdiction && formTouched.jurisdiction && (
                <p className="text-sm text-red-600 mt-1">{formErrors.jurisdiction}</p>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Appeal Reason</Label>
              <Textarea
                id="reason"
                value={appealForm.reason}
                onChange={(e) => onFormChange("reason", e.target.value)}
                onBlur={() => onFieldBlur("reason")}
                placeholder="Optional: Describe the reason for appeal (e.g., recent sales data, property condition issues)"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              onClick={onGenerateNarrative}
              disabled={!isFormValid() || isGeneratingNarrative}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingNarrative ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating AI Narrative...
                </>
              ) : (
                "Generate AI Appeal Narrative"
              )}
            </Button>
          </div>

          {generatedNarrative && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Generated Appeal Narrative</h3>
              <div className="prose text-sm text-green-700 whitespace-pre-wrap">
                {generatedNarrative}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid() || !generatedNarrative || isGeneratingPacket}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGeneratingPacket ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Appeal Packet...
              </>
            ) : (
              "Create Appeal & Generate Packet"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};