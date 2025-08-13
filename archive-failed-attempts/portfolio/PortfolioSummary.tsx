import { Building, Calculator, AlertCircle, CheckSquare } from "lucide-react";

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

interface PortfolioSummaryProps {
  sortedAndFilteredProperties: MockProperty[];
  displayProperties: MockProperty[];
  filterStatus: string;
}

export function PortfolioSummary({ 
  sortedAndFilteredProperties, 
  displayProperties, 
  filterStatus 
}: PortfolioSummaryProps) {
  if (sortedAndFilteredProperties.length === 0) {
    return null;
  }

  return (
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
            ${sortedAndFilteredProperties.reduce((sum: number, p: MockProperty) => sum + (p.potentialSavings || 0), 0).toLocaleString()}
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
  );
}