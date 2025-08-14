import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, FeatureCard, MetricCard } from './v2';

export function AnalystValuationWorkbench() {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-headline-medium">Analyst Valuation Workbench</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FeatureCard
              title="Market Analysis"
              description="Advanced market comparisons and trends"
            />
            <FeatureCard
              title="Valuation Models"
              description="Cost, income, and sales comparison approaches"
            />
          </div>
          <div className="space-y-4">
            <MetricCard
              label="Properties Under Review"
              value="8"
              change={{ value: 3, label: "+3 this week", trend: 'up' }}
              color="warning"
            />
            <MetricCard
              label="Avg. Assessment Reduction"
              value="22%"
              change={{ value: 4, label: "+4% this month", trend: 'up' }}
              color="success"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}