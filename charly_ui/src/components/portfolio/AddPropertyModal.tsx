import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building, Loader2 } from "lucide-react";
import { getJurisdictionOptions } from "@/services/jurisdictionService";
import { getAllPropertyTypes } from "@/services/propertyTypeService";

interface NewPropertyData {
  address: string;
  propertyType: string;
  currentAssessment: string;
  estimatedValue: string;
  jurisdiction: string;
  parcelNumber: string;
  ownerName: string;
  yearBuilt: string;
  squareFootage: string;
  notes: string;
}

interface AddPropertyModalProps {
  showAddPropertyModal: boolean;
  onClose: () => void;
  newPropertyData: NewPropertyData;
  setNewPropertyData: React.Dispatch<React.SetStateAction<NewPropertyData>>;
  onAddProperty: () => void;
  isAddingProperty: boolean;
  onResetForm: () => void;
}

export function AddPropertyModal({
  showAddPropertyModal,
  onClose,
  newPropertyData,
  setNewPropertyData,
  onAddProperty,
  isAddingProperty,
  onResetForm
}: AddPropertyModalProps) {
  
  const handleClose = () => {
    onResetForm();
    onClose();
  };

  return (
    <Dialog open={showAddPropertyModal} onOpenChange={onClose}>
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
            onClick={handleClose}
            disabled={isAddingProperty}
          >
            Cancel
          </Button>
          <Button 
            onClick={onAddProperty}
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
  );
}