import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketFactorsChartProps {
  marketFactors: Record<string, unknown>;
  propertyFactors: Record<string, unknown>;
  jurisdictionFactors: Record<string, unknown>;
  timingFactors: Record<string, unknown>;
}

export function MarketFactorsChart({ marketFactors, propertyFactors, jurisdictionFactors, timingFactors }: MarketFactorsChartProps) {
  const data = [
    {
      category: 'Market',
      'Price Variance': (marketFactors.priceVariance as number) || 0,
      'Market Condition': (marketFactors.marketCondition as number) || 0,
      'Comparability': (marketFactors.comparabilityStrength as number) || 0,
    },
    {
      category: 'Property',
      'Assessment Ratio': (propertyFactors.assessmentRatio as number) || 0,
      'Age & Condition': (propertyFactors.ageAndCondition as number) || 0,
      'Uniqueness': (propertyFactors.uniquenessScore as number) || 0,
    },
    {
      category: 'Jurisdiction',
      'Success Rate': (jurisdictionFactors.historicalSuccessRate as number) || 0,
      'Professionalism': (jurisdictionFactors.assessorProfessionalism as number) || 0,
      'Reforms': (jurisdictionFactors.recentReforms as number) || 0,
    },
    {
      category: 'Timing',
      'Days to Deadline': (timingFactors.daysToDeadline as number) || 0,
      'Seasonal': (timingFactors.seasonalOptimality as number) || 0,
      'Workload': (timingFactors.workloadTiming as number) || 0,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Success Probability Factors Analysis</h4>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip formatter={(value: number) => [value.toFixed(1), '']} />
          <Bar dataKey="Price Variance" fill="#ef4444" />
          <Bar dataKey="Market Condition" fill="#f97316" />
          <Bar dataKey="Comparability" fill="#eab308" />
          <Bar dataKey="Assessment Ratio" fill="#22c55e" />
          <Bar dataKey="Age & Condition" fill="#06b6d4" />
          <Bar dataKey="Uniqueness" fill="#3b82f6" />
          <Bar dataKey="Success Rate" fill="#8b5cf6" />
          <Bar dataKey="Professionalism" fill="#d946ef" />
          <Bar dataKey="Reforms" fill="#f43f5e" />
          <Bar dataKey="Days to Deadline" fill="#64748b" />
          <Bar dataKey="Seasonal" fill="#84cc16" />
          <Bar dataKey="Workload" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}