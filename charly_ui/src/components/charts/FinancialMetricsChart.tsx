import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavingsByCategory {
  commercial: number;
  residential: number;
  industrial: number;
}

interface PerformanceMetrics {
  average_reduction: number;
  success_rate: number;
  avg_resolution_days: number;
}

interface MarketTrends {
  austin_commercial_overassessment: number;
  houston_residential_variance: number;
  dallas_industrial_compliance: number;
}

interface Analytics {
  savings_by_category?: SavingsByCategory;
  performance_metrics?: PerformanceMetrics;
  market_trends?: MarketTrends;
}

interface FinancialMetricsChartProps {
  analytics: Analytics | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function FinancialMetricsChart({ analytics }: FinancialMetricsChartProps) {
  if (!analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform savings data for bar chart
  const savingsData = analytics.savings_by_category ? [
    { name: 'Commercial', value: analytics.savings_by_category.commercial, formatted: `$${(analytics.savings_by_category.commercial / 1000000).toFixed(1)}M` },
    { name: 'Residential', value: analytics.savings_by_category.residential, formatted: `$${(analytics.savings_by_category.residential / 1000).toFixed(0)}K` },
    { name: 'Industrial', value: analytics.savings_by_category.industrial, formatted: `$${(analytics.savings_by_category.industrial / 1000).toFixed(0)}K` },
  ] : [];

  // Transform savings data for pie chart
  const pieData = savingsData.map((item, index) => ({
    name: item.name,
    value: item.value,
    formatted: item.formatted,
    color: COLORS[index % COLORS.length]
  }));

  // Performance metrics for trend analysis
  const performanceData = analytics.performance_metrics ? [
    { name: 'Average Reduction', value: analytics.performance_metrics.average_reduction, unit: '%' },
    { name: 'Success Rate', value: analytics.performance_metrics.success_rate, unit: '%' },
    { name: 'Resolution Days', value: analytics.performance_metrics.avg_resolution_days, unit: 'days' },
  ] : [];


  return (
    <div className="space-y-6">
      {/* Savings Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              💰 Tax Savings by Property Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  className="text-sm"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-sm"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `$${(value / 1000000).toFixed(2)}M`,
                    'Tax Savings'
                  ]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              📊 Savings Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${(value / 1000000).toFixed(2)}M`,
                    name
                  ]}
                  contentStyle={{ 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center mt-4 space-x-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            🎯 IAAO Performance Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {performanceData.map((metric, index) => (
              <div key={index} className="text-center">
                <div className="relative">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={[{ value: metric.value, target: metric.name === 'Resolution Days' ? 45 : 90 }]}>
                      <Bar 
                        dataKey="value" 
                        fill={metric.value > 85 ? '#10b981' : metric.value > 70 ? '#f59e0b' : '#ef4444'}
                        radius={[4, 4, 4, 4]}
                      />
                      <YAxis hide />
                      <Tooltip 
                        formatter={(value: number) => [`${value}${metric.unit}`, metric.name]}
                        contentStyle={{ 
                          backgroundColor: '#f9fafb', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}{metric.unit}
                  </p>
                  <p className="text-sm text-gray-600">{metric.name}</p>
                  <div className="mt-1">
                    {metric.value > 85 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Excellent
                      </span>
                    )}
                    {metric.value > 70 && metric.value <= 85 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Good
                      </span>
                    )}
                    {metric.value <= 70 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Needs Improvement
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            📈 Jurisdiction Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {analytics.market_trends && (
              <>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.market_trends.austin_commercial_overassessment}%
                  </div>
                  <div className="text-sm font-medium text-gray-700">Austin Commercial</div>
                  <div className="text-xs text-gray-500">Overassessment Rate</div>
                  <div className="mt-2">
                    {analytics.market_trends.austin_commercial_overassessment > 10 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Opportunity
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Fair Market
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analytics.market_trends.houston_residential_variance}%
                  </div>
                  <div className="text-sm font-medium text-gray-700">Houston Residential</div>
                  <div className="text-xs text-gray-500">Assessment Variance</div>
                  <div className="mt-2">
                    {analytics.market_trends.houston_residential_variance < 10 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Consistent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Variable
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analytics.market_trends.dallas_industrial_compliance}%
                  </div>
                  <div className="text-sm font-medium text-gray-700">Dallas Industrial</div>
                  <div className="text-xs text-gray-500">IAAO Compliance</div>
                  <div className="mt-2">
                    {analytics.market_trends.dallas_industrial_compliance > 90 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Excellent
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Fair
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}