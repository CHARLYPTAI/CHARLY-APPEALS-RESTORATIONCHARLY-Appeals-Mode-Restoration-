/**
 * 🍎 CHARLY 2.0 - VISUAL TRANSFORMATION DEMONSTRATION
 * 
 * Showcase of the new Ive Design System implementing:
 * - Invisible Excellence
 * - Inevitable Simplicity  
 * - Progressive Disclosure
 * - Professional Elevation
 */

import React, { useState } from 'react';

// Icons (placeholder - in real implementation would use Lucide React)
const BarChart3Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
    <polyline points="16,7 22,7 22,13" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

export function V2Demo() {
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('portfolio');

  // Demo KPI data
  const kpiData = [
    {
      value: '$2.4M',
      label: 'Tax Savings',
      change: { value: 23, label: 'vs last quarter', trend: 'up' as const },
      icon: <TrendingUpIcon />,
      color: 'success' as const,
    },
    {
      value: '156',
      label: 'Active Properties',
      change: { value: 12, label: 'this month', trend: 'up' as const },
      icon: <HomeIcon />,
      color: 'primary' as const,
    },
    {
      value: '23',
      label: 'Flagged Opportunities',
      change: { value: -5, label: 'since review', trend: 'down' as const },
      icon: <AlertTriangleIcon />,
      color: 'warning' as const,
    },
    {
      value: '87%',
      label: 'Success Rate',
      change: { value: 4, label: 'improvement', trend: 'up' as const },
      icon: <CheckCircleIcon />,
      color: 'success' as const,
    },
  ];

  // Demo accordion data
  const accordionItems = [
    {
      id: 'market-analysis',
      trigger: (
        <div>
          <p className="text-body-medium font-medium">Market Analysis Intelligence</p>
          <p className="text-caption text-text-secondary">Enhanced community insights and trends</p>
        </div>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Our collaborative intelligence platform aggregates anonymous market data from the entire 
            user community to provide unprecedented insights into local assessment patterns.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-success-50 rounded-apple">
              <p className="text-label-medium font-medium text-success-700">Travis County</p>
              <p className="text-caption text-success-600">15% over-assessment trend</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-apple">
              <p className="text-label-medium font-medium text-warning-700">Harris County</p>
              <p className="text-caption text-warning-600">8% assessment variance</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'portfolio-management',
      trigger: (
        <div>
          <p className="text-body-medium font-medium">Intelligent Portfolio Management</p>
          <p className="text-caption text-text-secondary">Multi-user collaboration with ownership tracking</p>
        </div>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Advanced property claiming system with verification workflows ensures clear ownership 
            and enables firm-wide collaboration while maintaining data privacy.
          </p>
          <div className="flex space-x-2">
            <Button size="sm" variant="primary">Claim Properties</Button>
            <Button size="sm" variant="secondary">Share Portfolio</Button>
          </div>
        </div>
      ),
    },
    {
      id: 'appeals-generation',
      trigger: (
        <div>
          <p className="text-body-medium font-medium">Hero-Driven Appeals Workflow</p>
          <p className="text-caption text-text-secondary">Invisible technology, professional results</p>
        </div>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Appeal packets show only firm branding with zero AI attribution, ensuring professional 
            credibility while leveraging sophisticated analysis behind the scenes.
          </p>
          <div className="p-4 bg-neutral-50 rounded-apple border border-neutral-200">
            <p className="text-label-small font-medium text-neutral-700 mb-2">Sample Output</p>
            <p className="text-caption text-neutral-600 italic">
              "Johnson & Associates LLP presents this comprehensive market analysis demonstrating 
              significant over-assessment based on comparable sales data..."
            </p>
          </div>
        </div>
      ),
    },
  ];

  // Demo steps for progressive workflow
  const workflowSteps = [
    {
      id: 'setup',
      title: 'Portfolio Setup',
      description: 'Import and organize your properties',
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Connect your data sources and establish property ownership within the collaborative platform.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button size="sm" variant="primary">Import CSV</Button>
            <Button size="sm" variant="secondary">Connect MLS</Button>
          </div>
        </div>
      ),
      completed: true,
    },
    {
      id: 'analysis',
      title: 'Market Intelligence',
      description: 'Leverage community insights for enhanced analysis',
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Our AI analyzes your properties against community market data to identify opportunities.
          </p>
          <div className="p-3 bg-primary-50 rounded-apple">
            <p className="text-label-small font-medium text-primary-700">Analysis Complete</p>
            <p className="text-caption text-primary-600">23 properties flagged for review</p>
          </div>
        </div>
      ),
      completed: true,
    },
    {
      id: 'appeals',
      title: 'Professional Appeals',
      description: 'Generate firm-branded appeal packets',
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Create professional appeal documents with your firm's branding and no AI attribution.
          </p>
          <Button size="sm" variant="success">Generate Appeals</Button>
        </div>
      ),
    },
    {
      id: 'tracking',
      title: 'Success Monitoring', 
      description: 'Track outcomes and build success patterns',
      content: (
        <div className="space-y-4">
          <p className="text-body-small text-text-secondary">
            Monitor appeal outcomes and contribute to community success intelligence.
          </p>
        </div>
      ),
    },
  ];

  return (
    <IntelligentCanvas 
      mode={canvasMode}
      onModeChange={setCanvasMode}
      className="min-h-screen"
    >
      {/* Mode Selection Demo */}
      <Card 
        elevation="floating" 
        radius="xl" 
        padding="lg"
        data-section="mode-selection"
      >
        <CardHeader>
          <CardTitle level={2}>🍎 CHARLY 2.0 Design System Demo</CardTitle>
          <CardDescription>
            Experience the revolutionary interface that adapts to your workflow through 
            invisible excellence and progressive disclosure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Canvas Mode Selector */}
          <div>
            <h4 className="text-title-small font-medium mb-4">Intelligent Canvas Modes</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(['portfolio', 'analysis', 'intelligence', 'appeals', 'results'] as CanvasMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={canvasMode === mode ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCanvasMode(mode)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div>
            <h4 className="text-title-small font-medium mb-4">Apple-Quality Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiData.map((kpi, index) => (
                <MetricCard
                  key={index}
                  value={kpi.value}
                  label={kpi.label}
                  change={kpi.change}
                  icon={kpi.icon}
                  color={kpi.color}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progressive Disclosure Demo */}
      <Card 
        elevation="floating" 
        radius="xl" 
        padding="lg"
        data-section="progressive-disclosure"
      >
        <CardHeader>
          <CardTitle level={3}>Progressive Disclosure Patterns</CardTitle>
          <CardDescription>
            Information reveals itself naturally as users need it, creating an interface 
            that feels inevitable rather than overwhelming.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion 
            items={accordionItems}
            type="multiple"
            defaultValue={['market-analysis']}
          />
        </CardContent>
      </Card>

      {/* Workflow Demo */}
      <Card 
        elevation="floating" 
        radius="xl" 
        padding="lg"
        data-section="workflow"
      >
        <CardHeader>
          <CardTitle level={3}>Hero-Driven Workflow</CardTitle>
          <CardDescription>
            Each step builds confidence while maintaining professional appearance 
            through invisible technology.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StepDisclosure 
            steps={workflowSteps}
            currentStep={2}
            allowSkip={true}
          />
        </CardContent>
      </Card>

      {/* Feature Showcase */}
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        data-section="features"
      >
        <FeatureCard
          title="Invisible Technology"
          description="AI-powered analysis creates professional appeal documents with zero technology attribution, ensuring credibility with assessors and clients."
          icon={<BarChart3Icon />}
          action={<Button size="sm" variant="primary">Learn More</Button>}
        />
        
        <FeatureCard
          title="Collaborative Intelligence"
          description="Anonymous community data enhances your analysis while protecting privacy, creating network effects that benefit all users."
          icon={<TrendingUpIcon />}
          action={<Button size="sm" variant="primary">Explore</Button>}
        />
        
        <FeatureCard
          title="Professional Elevation"
          description="Every interaction elevates your professional image through sophisticated design and invisible sophistication."
          icon={<CheckCircleIcon />}
          action={<Button size="sm" variant="primary">Discover</Button>}
        />
      </div>

      {/* Expandable Demo */}
      <ExpandableCard
        title="Advanced Market Intelligence"
        subtitle="Deep dive into collaborative insights"
        icon={<BarChart3Icon />}
        preview={
          <div className="space-y-3">
            <div className="flex justify-between text-body-small">
              <span className="text-text-secondary">Market Confidence</span>
              <span className="font-medium text-success-600">94%</span>
            </div>
            <div className="flex justify-between text-body-small">
              <span className="text-text-secondary">Community Data Points</span>
              <span className="font-medium">2,847</span>
            </div>
            <div className="flex justify-between text-body-small">
              <span className="text-text-secondary">Last Updated</span>
              <span className="font-medium">2 minutes ago</span>
            </div>
          </div>
        }
        fullContent={
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-apple-lg">
              <h5 className="text-label-large font-medium text-primary-700 mb-2">
                Key Market Insights
              </h5>
              <ul className="space-y-2 text-body-small text-primary-600">
                <li>• Commercial properties showing 18% over-assessment in Q2</li>
                <li>• Residential appeals have 92% success rate in Travis County</li>
                <li>• Industrial properties trending toward fair value assessments</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-neutral-50 rounded-apple">
                <p className="text-headline-small font-bold text-neutral-900">$4.2M</p>
                <p className="text-caption text-text-secondary">Community Savings</p>
              </div>
              <div className="text-center p-3 bg-neutral-50 rounded-apple">
                <p className="text-headline-small font-bold text-neutral-900">89%</p>
                <p className="text-caption text-text-secondary">Success Rate</p>
              </div>
            </div>
          </div>
        }
        data-section="expandable"
      />
    </IntelligentCanvas>
  );
}