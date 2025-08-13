import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, MetricCard } from './v2';

export function AttorneyExecutiveDashboard() {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-headline-medium">Attorney Executive Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            label="Active Cases"
            value="12"
            change={{ value: 8, label: "+8 this month", trend: 'up' }}
          />
          <MetricCard
            label="Success Rate"
            value="94%"
            change={{ value: 2, label: "+2% this month", trend: 'up' }}
            color="success"
          />
          <MetricCard
            label="Total Savings"
            value="$2.4M"
            change={{ value: 15, label: "+15% this quarter", trend: 'up' }}
            color="primary"
          />
        </div>
      </CardContent>
    </Card>
  );
}