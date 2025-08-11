// src/components/v2/OpportunityRankingEngine.tsx

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

console.log("✅ OpportunityRankingEngine.tsx loaded");

export const OpportunityRankingEngine = () => {
  return (
    <Card className="p-6 rounded-xl shadow-md bg-white border border-neutral-200">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">🧠 Opportunity Engine</h2>
          <p className="text-sm text-neutral-600">
            AI-prioritized appeal targets with high potential savings
          </p>
        </div>
        <Button variant="outline" size="sm">View All</Button>
      </div>

      <div className="space-y-4">
        <Card className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Flagged: Vacancy Anomaly</p>
              <p className="text-xl font-bold text-blue-900">Property #1243</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Potential Savings</p>
              <p className="text-lg font-bold text-blue-800">$48,300</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Flagged: Expense Ratio</p>
              <p className="text-xl font-bold text-orange-900">Property #1167</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-600">Potential Savings</p>
              <p className="text-lg font-bold text-orange-800">$32,900</p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};
