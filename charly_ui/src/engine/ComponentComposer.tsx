/**
 * 🍎 CHARLY 2.0 - DYNAMIC COMPONENT COMPOSITION ENGINE
 * 
 * Revolutionary system that assembles interfaces dynamically based on context.
 * No more static pages - components appear when needed, disappear when irrelevant.
 */

import React, { useMemo, Suspense, lazy } from 'react';
import { contextEngine, type InterfaceComposition, type AttorneyContext } from './ContextEngine';
import { adaptiveState, type AdaptiveState } from './AdaptiveState';
// Import hooks for re-export only

// ============================================================================
// COMPONENT REGISTRY
// ============================================================================

// Lazy-loaded components for optimal performance
const ComponentRegistry = {
  // Discovery Components
  PropertySearch: lazy(() => import('../components/v2/PropertySearch')),
  MarketOverview: lazy(() => import('../components/v2/MarketOverview')),
  RecentActivity: lazy(() => import('../components/v2/RecentActivity')),
  SavedSearches: lazy(() => import('../components/v2/SavedSearches')),
  MarketTrends: lazy(() => import('../components/v2/MarketTrends')),
  QuickActions: lazy(() => import('../components/v2/QuickActions')),
  
  // Analysis Components
  PropertyDetails: lazy(() => import('../components/v2/PropertyDetails')),
  FinancialAnalysis: lazy(() => import('../components/v2/FinancialAnalysis')),
  MarketComparison: lazy(() => import('../components/v2/MarketComparison')),
  SimilarProperties: lazy(() => import('../components/v2/SimilarProperties')),
  HistoricalData: lazy(() => import('../components/v2/HistoricalData')),
  AIInsights: lazy(() => import('../components/v2/AIInsights')),
  
  // Preparation Components
  AppealBuilder: lazy(() => import('../components/v2/AppealBuilder')),
  DocumentGenerator: lazy(() => import('../components/v2/DocumentGenerator')),
  EvidenceUpload: lazy(() => import('../components/v2/EvidenceUpload')),
  TemplateLibrary: lazy(() => import('../components/v2/TemplateLibrary')),
  ReviewChecklist: lazy(() => import('../components/v2/ReviewChecklist')),
  PreviewMode: lazy(() => import('../components/v2/PreviewMode')),
  
  // Filing Components
  SubmissionForm: lazy(() => import('../components/v2/SubmissionForm')),
  DocumentReview: lazy(() => import('../components/v2/DocumentReview')),
  FilingChecklist: lazy(() => import('../components/v2/FilingChecklist')),
  DeadlineTracker: lazy(() => import('../components/v2/DeadlineTracker')),
  RequirementsList: lazy(() => import('../components/v2/RequirementsList')),
  ContactInfo: lazy(() => import('../components/v2/ContactInfo')),
  
  // Monitoring Components
  AppealStatus: lazy(() => import('../components/v2/AppealStatus')),
  CaseTracker: lazy(() => import('../components/v2/CaseTracker')),
  ResponseManager: lazy(() => import('../components/v2/ResponseManager')),
  DocumentLibrary: lazy(() => import('../components/v2/DocumentLibrary')),
  CommunicationLog: lazy(() => import('../components/v2/CommunicationLog')),
  NextSteps: lazy(() => import('../components/v2/NextSteps')),
  
  // Celebration Components
  SuccessMetrics: lazy(() => import('../components/v2/SuccessMetrics')),
  SavingsCalculator: lazy(() => import('../components/v2/SavingsCalculator')),
  ShareSuccess: lazy(() => import('../components/v2/ShareSuccess')),
  NextOpportunities: lazy(() => import('../components/v2/NextOpportunities')),
  ClientCommunication: lazy(() => import('../components/v2/ClientCommunication')),
  TeamUpdate: lazy(() => import('../components/v2/TeamUpdate')),
  
  // Universal Components
  SearchBar: lazy(() => import('../components/v2/SearchBar')),
  NotificationCenter: lazy(() => import('../components/v2/NotificationCenter')),
  HelpAssistant: lazy(() => import('../components/v2/HelpAssistant')),
  ProgressIndicator: lazy(() => import('../components/v2/ProgressIndicator')),
  ContextSwitcher: lazy(() => import('../components/v2/ContextSwitcher')),
  
  // Fallback components for missing ones
  Placeholder: lazy(() => import('../components/v2/Placeholder')),
  LoadingSpinner: lazy(() => import('../components/v2/LoadingSpinner'))
};

// ============================================================================
// LAYOUT ENGINES
// ============================================================================

interface LayoutProps {
  children: React.ReactNode;
  composition?: InterfaceComposition;
  state?: AdaptiveState;
}

// Hero Layout - Single focused task
const HeroLayout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Focus Mode Active
          </h1>
          <p className="text-gray-600">
            Distraction-free environment for deep work
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  </div>
);

// Dashboard Layout - Overview with multiple options
const DashboardLayout: React.FC<LayoutProps> = ({ children, composition, state }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {children}
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            <ComponentRenderer 
              componentName="NotificationCenter" 
              composition={composition}
              state={state}
            />
            <ComponentRenderer 
              componentName="HelpAssistant" 
              composition={composition}
              state={state}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Workflow Layout - Step-by-step process
const WorkflowLayout: React.FC<LayoutProps> = ({ children, composition, state }) => (
  <div className="min-h-screen bg-white">
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="container mx-auto px-6 py-4">
        <ComponentRenderer 
          componentName="ProgressIndicator" 
          composition={composition}
          state={state}
        />
      </div>
    </div>
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  </div>
);

// Comparison Layout - Side-by-side analysis
const ComparisonLayout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-6 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  </div>
);

// Creation Layout - Building/composing mode
const CreationLayout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-white">
    <div className="flex">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-6">
          {children}
        </div>
      </div>
      <div className="w-80 bg-gray-50 border-l border-gray-200">
        <div className="sticky top-0 p-6 space-y-6">
          <ComponentRenderer 
            componentName="ReviewChecklist" 
            composition={composition}
            state={state}
          />
          <ComponentRenderer 
            componentName="PreviewMode" 
            composition={composition}
            state={state}
          />
        </div>
      </div>
    </div>
  </div>
);

// Minimal Layout - Distraction-free focus
const MinimalLayout: React.FC<LayoutProps> = ({ children }) => (
  <div className="min-h-screen bg-white">
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  </div>
);

const LayoutRegistry = {
  hero: HeroLayout,
  dashboard: DashboardLayout,
  workflow: WorkflowLayout,
  comparison: ComparisonLayout,
  creation: CreationLayout,
  minimal: MinimalLayout
};

// ============================================================================
// COMPONENT RENDERER
// ============================================================================

interface ComponentRendererProps {
  componentName: string;
  composition: InterfaceComposition;
  state: AdaptiveState;
  className?: string;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ 
  componentName, 
  composition, 
  state, 
  className 
}) => {
  const Component = ComponentRegistry[componentName as keyof typeof ComponentRegistry] || 
                   ComponentRegistry.Placeholder;
  
  const componentProps = useMemo(() => {
    // Pass context-specific props to components
    const baseProps = {
      composition,
      state,
      className
    };
    
    // Add component-specific props based on context
    switch (componentName) {
      case 'PropertySearch':
        return {
          ...baseProps,
          searchQuery: state.discovery?.searchQuery || '',
          filters: state.discovery?.filters || {},
          onSearch: (query: string) => {
            adaptiveState.dispatch({ type: 'SEARCH_QUERY_CHANGED', payload: query });
            contextEngine.evolveContext('search_properties', { query });
          }
        };
        
      case 'PropertyDetails':
        return {
          ...baseProps,
          property: state.analysis?.selectedProperty,
          onAnalyze: () => {
            contextEngine.evolveContext('analyze_property');
          }
        };
        
      case 'AppealBuilder':
        return {
          ...baseProps,
          appeal: state.preparation?.appeal,
          templates: state.preparation?.templates || [],
          onSave: (appeal: unknown) => {
            adaptiveState.dispatch({ type: 'APPEAL_CREATED', payload: appeal });
            contextEngine.evolveContext('appeal_created');
          }
        };
        
      default:
        return baseProps;
    }
  }, [componentName, composition, state, className]);
  
  return (
    <Suspense fallback={
      <div className="animate-pulse bg-gray-100 rounded-lg h-32 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <Component {...componentProps} />
    </Suspense>
  );
};

// ============================================================================
// ADAPTIVE COMPOSER
// ============================================================================

export interface AdaptiveComposerProps {
  context?: AttorneyContext;
  className?: string;
}

export const AdaptiveComposer: React.FC<AdaptiveComposerProps> = ({ 
  context, 
  className 
}) => {
  const [composition, setComposition] = React.useState<InterfaceComposition | null>(null);
  const [state, setState] = React.useState<AdaptiveState | null>(null);
  
  // Subscribe to context and state changes
  React.useEffect(() => {
    const contextUnsub = contextEngine.subscribe(() => {
      setComposition(contextEngine.getInterfaceComposition());
    });
    
    const stateUnsub = adaptiveState.subscribe(setState);
    
    // Initialize
    setComposition(contextEngine.getInterfaceComposition());
    setState(adaptiveState.getState());
    
    return () => {
      contextUnsub();
      stateUnsub();
    };
  }, []);
  
  // Force specific context if provided
  React.useEffect(() => {
    if (context) {
      contextEngine.forceContext({ context });
    }
  }, [context]);
  
  if (!composition || !state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ComponentRenderer 
          componentName="LoadingSpinner" 
          composition={{} as InterfaceComposition}
          state={{} as AdaptiveState}
        />
      </div>
    );
  }
  
  // Select appropriate layout engine
  const LayoutComponent = LayoutRegistry[composition.layout as keyof typeof LayoutRegistry] || 
                          LayoutRegistry.dashboard;
  
  // Render primary components based on composition
  const primaryComponents = composition.primaryComponents.map((componentName, index) => (
    <ComponentRenderer
      key={`${componentName}-${index}`}
      componentName={componentName}
      composition={composition}
      state={state}
      className={getDensityClassName(composition.density)}
    />
  ));
  
  // Render secondary components (contextual sidebars, etc.)
  const secondaryComponents = composition.secondaryComponents.map((componentName, index) => (
    <ComponentRenderer
      key={`${componentName}-secondary-${index}`}
      componentName={componentName}
      composition={composition}
      state={state}
      className="opacity-80"
    />
  ));
  
  return (
    <div className={className}>
      <LayoutComponent composition={composition} state={state}>
        {primaryComponents}
        {secondaryComponents}
      </LayoutComponent>
      
      {/* Universal components that appear in all contexts */}
      <div className="fixed bottom-6 right-6 z-50">
        <ComponentRenderer
          componentName="ContextSwitcher"
          composition={composition}
          state={state}
        />
      </div>
    </div>
  );
};

// ============================================================================
// UTILITIES
// ============================================================================

function getDensityClassName(density: string): string {
  switch (density) {
    case 'minimal':
      return 'p-8 space-y-8';
    case 'comfortable':
      return 'p-6 space-y-6';
    case 'dense':
      return 'p-4 space-y-4';
    default:
      return 'p-6 space-y-6';
  }
}


// Import hooks from './ComponentComposerHooks' directly for use outside this file

export default AdaptiveComposer;