import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { type FinancialImpact } from '@/types/report';

interface FinancialImpactChartProps {
  financialImpact: FinancialImpact;
}

export function FinancialImpactChart({ financialImpact }: FinancialImpactChartProps) {
  const currentAnnualTaxes = financialImpact.currentAnnualTaxes || 0;
  const projectedAnnualTaxes = financialImpact.projectedAnnualTaxes || 0;
  const annualTaxSavings = financialImpact.annualTaxSavings || 0;
  
  const savingsData = [
    { year: 'Year 1', current: currentAnnualTaxes, projected: projectedAnnualTaxes, savings: annualTaxSavings },
    { year: 'Year 2', current: currentAnnualTaxes, projected: projectedAnnualTaxes, savings: annualTaxSavings },
    { year: 'Year 3', current: currentAnnualTaxes, projected: projectedAnnualTaxes, savings: annualTaxSavings },
    { year: 'Year 4', current: currentAnnualTaxes, projected: projectedAnnualTaxes, savings: annualTaxSavings },
    { year: 'Year 5', current: currentAnnualTaxes, projected: projectedAnnualTaxes, savings: annualTaxSavings },
  ];

  const roiData = [
    { metric: 'Appeal Cost', value: financialImpact.appealCost || 0, color: '#ef4444' },
    { metric: '5-Year Savings', value: financialImpact.fiveYearSavings || 0, color: '#22c55e' },
    { metric: 'Net Benefit', value: financialImpact.netBenefit || 0, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">5-Year Tax Savings Projection</h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={savingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
              labelFormatter={(label) => `${label}`}
            />
            <Area type="monotone" dataKey="current" stackId="1" stroke="#ef4444" fill="#fecaca" name="Current Taxes" />
            <Area type="monotone" dataKey="savings" stackId="2" stroke="#22c55e" fill="#bbf7d0" name="Annual Savings" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">ROI Analysis - {((financialImpact.roi as number) || 0).toFixed(1)}% Return</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={roiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
            <Bar dataKey="value">
              {roiData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}