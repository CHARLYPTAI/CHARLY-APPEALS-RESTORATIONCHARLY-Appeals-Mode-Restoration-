import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Calculator, Loader2, CheckSquare, Square } from "lucide-react";

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

interface AnalysisResult {
  appeal_probability: number;
  confidence_score: number;
}

interface PropertyCardProps {
  property: MockProperty;
  isSelected: boolean;
  isAnalyzing: boolean;
  analysisResults?: AnalysisResult;
  onPropertySelect: (propertyId: string) => void;
  onCompareToggle: (propertyId: string) => void;
  handleKeyDown: (event: React.KeyboardEvent, action: () => void) => void;
}

export function PropertyCard({
  property,
  isSelected,
  isAnalyzing,
  analysisResults,
  onPropertySelect,
  onCompareToggle,
  handleKeyDown
}: PropertyCardProps) {
  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${
        isSelected ? 'ring-2 ring-blue-500' : ''
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
                  onCompareToggle(property.id);
                }}
                onKeyDown={(e) => handleKeyDown(e, () => onCompareToggle(property.id))}
                className="mr-3 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label={`${isSelected ? 'Remove from' : 'Add to'} comparison: ${property.address}`}
                tabIndex={0}
              >
                {isSelected ? (
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
                ${property.currentAssessment.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Est. Fair Value</p>
              <p className="text-lg font-semibold text-blue-600">
                ${property.estimatedValue.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-gray-700">Potential Savings</p>
              <p className="text-lg font-semibold text-green-600">
                ${property.potentialSavings?.toLocaleString() || '0'}
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
              onClick={() => onPropertySelect(property.id)}
              className="bg-blue-600 hover:bg-blue-700 w-full"
              size="sm"
              disabled={isAnalyzing}
              aria-label={`Start property workup for ${property.address}`}
            >
              {isAnalyzing ? (
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
            
            {analysisResults && (
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Probability:</span>
                  <span className="font-medium text-green-600">
                    {Math.round(analysisResults.appeal_probability * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">
                    {Math.round(analysisResults.confidence_score * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}