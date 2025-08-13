import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { mapPropertyTypeLabelToBackend } from '@/config/property_type_crosswalk';

interface PropertyCreationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPropertyCreated: () => void;
}

interface NewPropertyData {
  address: string;
  jurisdiction: string;
  propertyType: string;
  currentAssessment: string;
  estimatedValue: string;
  squareFootage: string;
  yearBuilt: string;
}

export function PropertyCreationForm({ open, onOpenChange, onPropertyCreated }: PropertyCreationFormProps) {
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [newPropertyData, setNewPropertyData] = useState<NewPropertyData>({
    address: '',
    jurisdiction: '',
    propertyType: '',
    currentAssessment: '',
    estimatedValue: '',
    squareFootage: '',
    yearBuilt: '',
  });

  const validatePropertyForm = () => {
    const errors: string[] = [];
    
    if (!newPropertyData.address.trim()) {
      errors.push("Address is required");
    }
    if (!newPropertyData.jurisdiction.trim()) {
      errors.push("Jurisdiction is required");
    }
    if (!newPropertyData.propertyType) {
      errors.push("Property type is required");
    }
    if (!newPropertyData.currentAssessment || isNaN(Number(newPropertyData.currentAssessment))) {
      errors.push("Valid current assessment is required");
    }
    
    return errors;
  };

  const resetNewPropertyForm = () => {
    setNewPropertyData({
      address: '',
      jurisdiction: '',
      propertyType: '',
      currentAssessment: '',
      estimatedValue: '',
      squareFootage: '',
      yearBuilt: '',
    });
  };

  const handleAddProperty = async () => {
    const validationErrors = validatePropertyForm();
    
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsAddingProperty(true);
    
    try {
      const mappedType = mapPropertyTypeLabelToBackend(newPropertyData.propertyType);
      
      const propertyPayload = {
        address: newPropertyData.address.trim(),
        city: newPropertyData.jurisdiction?.trim() || 'Default City',
        state: 'TX', // TODO: Extract from data or make configurable
        zip_code: '78701', // TODO: Extract from data or make configurable
        county: newPropertyData.jurisdiction?.trim() || 'Default County', 
        property_type: mappedType,
        current_assessment: Number(newPropertyData.currentAssessment),
        square_footage: newPropertyData.squareFootage ? Number(newPropertyData.squareFootage) : undefined,
        year_built: newPropertyData.yearBuilt ? Number(newPropertyData.yearBuilt) : undefined
      };

      const response = await apiClient.createProperty(propertyPayload);

      if (response.error) {
        throw new Error(response.error || `Failed to add property`);
      }

      const result = response.data;
      console.info('[Add Property] Response:', result);
      
      toast({
        title: "Property Added Successfully",
        description: `${newPropertyData.address} has been added to your portfolio.`,
        variant: "default",
      });
      
      // Reset form and close modal
      resetNewPropertyForm();
      onOpenChange(false);
      
      // Notify parent to refresh data
      onPropertyCreated();
      
    } catch (error) {
      console.error("Error adding property:", error);
      toast({
        title: "Error Adding Property",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAddingProperty(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📄</span>
            <span>Add New Property</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="address">Property Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State"
                value={newPropertyData.address}
                onChange={(e) => setNewPropertyData({...newPropertyData, address: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="jurisdiction">Jurisdiction *</Label>
              <Input
                id="jurisdiction"
                placeholder="e.g., Travis County"
                value={newPropertyData.jurisdiction}
                onChange={(e) => setNewPropertyData({...newPropertyData, jurisdiction: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="propertyType">Property Type *</Label>
              <Select
                value={newPropertyData.propertyType}
                onValueChange={(value) => setNewPropertyData({...newPropertyData, propertyType: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                  <SelectItem value="Vacant Land">Vacant Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="currentAssessment">Current Assessment *</Label>
              <Input
                id="currentAssessment"
                type="number"
                placeholder="0"
                value={newPropertyData.currentAssessment}
                onChange={(e) => setNewPropertyData({...newPropertyData, currentAssessment: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="estimatedValue">Estimated Market Value</Label>
              <Input
                id="estimatedValue"
                type="number"
                placeholder="0"
                value={newPropertyData.estimatedValue}
                onChange={(e) => setNewPropertyData({...newPropertyData, estimatedValue: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  placeholder="0"
                  value={newPropertyData.squareFootage}
                  onChange={(e) => setNewPropertyData({...newPropertyData, squareFootage: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="YYYY"
                  value={newPropertyData.yearBuilt}
                  onChange={(e) => setNewPropertyData({...newPropertyData, yearBuilt: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isAddingProperty}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddProperty}
              disabled={isAddingProperty}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddingProperty ? "Adding..." : "Add Property"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}