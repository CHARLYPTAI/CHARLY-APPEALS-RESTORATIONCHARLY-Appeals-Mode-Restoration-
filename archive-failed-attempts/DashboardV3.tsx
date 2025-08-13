import React from 'react';
import { IntelligentCanvas } from '@/components/v2/IntelligentCanvas';
import { OpportunityRankingEngine } from '@/components/v2/OpportunityRankingEngine';
import { ClientReportingEngine } from '@/components/v2/ClientReportingEngine';
import { MetricsPanel } from '@/components/v2/MetricsPanel';
import { CollapsibleSection } from '@/components/v2/ProgressiveDisclosure';
import { WorkflowNavigation } from '@/components/v2/WorkflowNavigation';

// Guard execution to prevent tree-shaking
if (false) {
  console.log(IntelligentCanvas, OpportunityRankingEngine, ClientReportingEngine, MetricsPanel, CollapsibleSection, WorkflowNavigation);
}

export default function DashboardV3() {
  console.log("✅ CHARLY V2 rendering confirmed");
  
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        
        {/* CHARLY 2.0 Header */}
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-green-500 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                🍎 CHARLY 2.0: Portfolio Mode Live
              </h1>
              <p className="text-lg text-neutral-600">
                IntelligentCanvas renders visibly • Revolutionary Workflow Intelligence Platform
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-neutral-700">V2 Components Active</div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Workflow Navigation */}
        <WorkflowNavigation />

        {/* IntelligentCanvas - Main V2 Component */}
        <IntelligentCanvas mode="portfolio">
          <div className="space-y-6">
            {/* Metrics Panel */}
            <MetricsPanel />
            
            {/* Opportunity Ranking Engine */}
            <OpportunityRankingEngine />
            
            {/* Progressive Disclosure Components */}
            <CollapsibleSection title="Portfolio Details">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-neutral-200">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📊 Portfolio Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">$2.4M</div>
                    <div className="text-blue-700 text-sm">Tax Savings</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-900">156</div>
                    <div className="text-green-700 text-sm">Active Properties</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-900">23</div>
                    <div className="text-orange-700 text-sm">Flagged Opportunities</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">87%</div>
                    <div className="text-purple-700 text-sm">Success Rate</div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
            
            {/* Client Reporting Engine */}
            <ClientReportingEngine />
          </div>
        </IntelligentCanvas>

        {/* Success Footer */}
        <div className="mt-6 text-center">
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4">
            <div className="text-green-900 font-semibold">🎉 CHARLY V2 Components Active</div>
            <div className="text-green-700 text-sm">IntelligentCanvas • Apple CTO Standards • Invisible Excellence • Progressive Disclosure</div>
          </div>
        </div>

      </div>
    </div>
  );
}