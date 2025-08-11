import { Card, CardContent } from "@/components/ui/card";
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

interface AnalyticsViewProps {
  properties: MockProperty[];
  onBackToPortfolio: () => void;
}

export function AnalyticsView({ properties, onBackToPortfolio }: AnalyticsViewProps) {
  // Calculate analytics data
  const totalProperties = properties.length;
  const totalSavings = properties.reduce((sum, prop) => sum + (prop.potentialSavings || 0), 0);
  const avgSavingsRate = totalProperties > 0 ? Math.round(totalSavings / totalProperties / 10000) : 0;
  
  // Status distribution
  const statusCounts = properties.reduce((acc, prop) => {
    acc[prop.status] = (acc[prop.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={onBackToPortfolio}
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
            <p className="text-3xl font-bold text-green-700 mt-2">${totalSavings.toLocaleString()}</p>
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