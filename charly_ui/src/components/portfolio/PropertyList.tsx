import { PropertyCard } from "@/components/portfolio/PropertyCard";
import { Loader2, AlertCircle } from "lucide-react";

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

interface PropertyListProps {
  properties: MockProperty[];
  compareProperties: string[];
  analysisResults: Record<string, AnalysisResult>;
  isAnalyzing: string | null;
  onPropertySelect: (propertyId: string) => void;
  onCompareToggle: (propertyId: string) => void;
  handleKeyDown: (event: React.KeyboardEvent, action: () => void) => void;
  loading: boolean;
  error: string | null;
}

export function PropertyList({
  properties,
  compareProperties,
  analysisResults,
  isAnalyzing,
  onPropertySelect,
  onCompareToggle,
  handleKeyDown,
  loading,
  error
}: PropertyListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-2">Error loading properties</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">No properties found</p>
          <p className="text-gray-500 text-sm">Try adjusting your search filters or add new properties to your portfolio.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="grid gap-4"
      role="list"
      aria-label="Properties in portfolio"
    >
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          isSelected={compareProperties.includes(property.id)}
          isAnalyzing={isAnalyzing === property.id}
          analysisResults={analysisResults[property.id]}
          onPropertySelect={onPropertySelect}
          onCompareToggle={onCompareToggle}
          handleKeyDown={handleKeyDown}
        />
      ))}
    </div>
  );
}