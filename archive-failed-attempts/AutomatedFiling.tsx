import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Upload, 
  FileText, 
  Clock 
} from 'lucide-react';

interface AutomatedFilingProps {
  propertyId: string;
  onFilingComplete?: (status: { id: string; status: string }) => void;
}

export const AutomatedFiling: React.FC<AutomatedFilingProps> = ({ 
  propertyId, 
  onFilingComplete 
}) => {
  // Note: propertyId used for future integration
  console.log('Property ID:', propertyId);
  const [filingData, setFilingData] = useState({
    propertyAddress: '',
    currentAssessment: '',
    proposedValue: '',
    appealReason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = async () => {
    if (!filingData.propertyAddress || !filingData.currentAssessment || !filingData.proposedValue) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate filing process (no external dependencies)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const filingId = `AUTO-${Date.now()}`;
      setIsCompleted(true);
      
      onFilingComplete?.({
        id: filingId,
        status: 'submitted'
      });
    } catch (error) {
      console.error('Filing simulation failed:', error);
      alert('Filing failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Appeal Filed Successfully
              </h3>
              <p className="text-green-700">
                Your automated appeal has been submitted for processing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Automated Appeal Filing
        </CardTitle>
        <p className="text-gray-600">
          Streamlined electronic filing for property tax appeals
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="propertyAddress">Property Address *</Label>
          <Input
            id="propertyAddress"
            value={filingData.propertyAddress}
            onChange={(e) => setFilingData(prev => ({ 
              ...prev, 
              propertyAddress: e.target.value 
            }))}
            placeholder="123 Main St, Austin, TX"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="currentAssessment">Current Assessment *</Label>
            <Input
              id="currentAssessment"
              type="number"
              value={filingData.currentAssessment}
              onChange={(e) => setFilingData(prev => ({ 
                ...prev, 
                currentAssessment: e.target.value 
              }))}
              placeholder="450000"
            />
          </div>
          <div>
            <Label htmlFor="proposedValue">Proposed Value *</Label>
            <Input
              id="proposedValue"
              type="number"
              value={filingData.proposedValue}
              onChange={(e) => setFilingData(prev => ({ 
                ...prev, 
                proposedValue: e.target.value 
              }))}
              placeholder="380000"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="appealReason">Appeal Reason</Label>
          <Textarea
            id="appealReason"
            value={filingData.appealReason}
            onChange={(e) => setFilingData(prev => ({ 
              ...prev, 
              appealReason: e.target.value 
            }))}
            placeholder="Brief description of why the assessment should be reduced..."
            rows={3}
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Filing Appeal...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit Automated Appeal
            </>
          )}
        </Button>

        <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          <strong>Note:</strong> This is a demonstration of automated filing capabilities. 
          In production, this would integrate with county systems for electronic submission.
        </div>
      </CardContent>
    </Card>
  );
};