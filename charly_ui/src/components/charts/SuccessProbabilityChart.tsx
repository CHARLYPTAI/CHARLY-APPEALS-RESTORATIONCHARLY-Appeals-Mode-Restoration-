import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SuccessProbabilityChartProps {
  successProbability: number;
  confidenceLevel: number;
}

export function SuccessProbabilityChart({ successProbability, confidenceLevel }: SuccessProbabilityChartProps) {
  const data = [
    { name: 'Success Probability', value: successProbability * 100, color: '#22c55e' },
    { name: 'Risk Factor', value: (1 - successProbability) * 100, color: '#ef4444' },
  ];

  const confidenceData = [
    { name: 'AI Confidence', value: confidenceLevel, color: '#3b82f6' },
    { name: 'Uncertainty', value: 100 - confidenceLevel, color: '#94a3b8' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg shadow" role="img" aria-label={`Appeal success probability chart showing ${(successProbability * 100).toFixed(1)}% success rate`}>
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">Appeal Success Probability</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}%`, '']} 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="sr-only">
          Success probability: {(successProbability * 100).toFixed(1)}%. 
          Risk factor: {((1 - successProbability) * 100).toFixed(1)}%.
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow" role="img" aria-label={`AI confidence chart showing ${(confidenceLevel * 100).toFixed(1)}% confidence level`}>
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">AI Analysis Confidence</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={confidenceData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {confidenceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}%`, '']} 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="sr-only">
          AI confidence: {(confidenceLevel * 100).toFixed(1)}%. 
          Uncertainty: {(100 - confidenceLevel * 100).toFixed(1)}%.
        </div>
      </div>
    </div>
  );
}