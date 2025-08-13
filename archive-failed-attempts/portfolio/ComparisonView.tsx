import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

interface ComparisonViewProps {
  compareProperties: string[];
  displayProperties: MockProperty[];
  onBackToPortfolio: () => void;
}

export function ComparisonView({ 
  compareProperties, 
  displayProperties, 
  onBackToPortfolio 
}: ComparisonViewProps) {
  const compareData = compareProperties.map(id => 
    displayProperties.find((p: MockProperty) => p.id === id)
  ).filter(Boolean) as MockProperty[];

  if (compareProperties.length < 2) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={onBackToPortfolio}
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
                    ${property.currentAssessment.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr role="row">
                <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Estimated Value</th>
                {compareData.map((property: MockProperty) => (
                  <td key={property.id} className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                    ${property.estimatedValue.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50" role="row">
                <th className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" scope="row">Potential Savings</th>
                {compareData.map((property: MockProperty) => (
                  <td key={property.id} className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    ${property.potentialSavings.toLocaleString()}
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