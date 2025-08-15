import React from 'react';
import { useTheme } from '../design-system/ThemeProvider';
import { PageTransition, SlideUp, FadeIn, StaggerContainer } from '../components/MotionWrapper';

// Route components with Jony Ive design philosophy
function PortfolioPage() {
  const { colors } = useTheme();
  
  return (
    <PageTransition>
      <div className="space-y-12">
        {/* Page Header - Clean and minimal */}
        <SlideUp>
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100">
              Portfolio
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Manage your property portfolio and track assessment appeals with intelligent insights.
            </p>
          </div>
        </SlideUp>
      
        {/* Progressive Disclosure - Show only essentials */}
        <StaggerContainer className="grid gap-8 lg:grid-cols-3" staggerDelay={150}>
          {/* Primary Action Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Properties
              </h2>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Property
              </button>
            </div>
            
            <FadeIn delay={400}>
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="font-medium">Start by adding your first property</p>
                <p className="text-sm mt-1 opacity-75">Get intelligent tax assessment analysis</p>
              </div>
            </FadeIn>
          </div>
          
          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-light text-gray-900 dark:text-gray-100">0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Properties</div>
                </div>
                <div>
                  <div className="text-2xl font-light text-gray-900 dark:text-gray-100">$0</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                </div>
              </div>
            </div>
          </div>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

function AnalysisPage() {
  return (
    <PageTransition>
      <div className="space-y-12">
        <SlideUp>
          <div className="space-y-3">
            <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100">
              Analysis
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Advanced property valuation tools and income approach modeling.
            </p>
          </div>
        </SlideUp>
        
        <FadeIn delay={200}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-xl font-medium mb-2">Valuation Analysis</p>
              <p className="opacity-75">Property analysis tools will be available here</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}

function IntelligencePage() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100">
          Intelligence
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Market insights, trends, and AI-powered property assessments.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <p className="text-xl font-medium mb-2">Market Intelligence</p>
          <p className="opacity-75">AI insights and market trends coming soon</p>
        </div>
      </div>
    </div>
  );
}

function AppealsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100">
          Appeals
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Manage property tax appeals and generate professional dossiers.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125.504-1.125 1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-xl font-medium mb-2">Appeal Management</p>
          <p className="opacity-75">Professional appeal packet generation</p>
        </div>
      </div>
    </div>
  );
}

function ResultsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100">
          Results
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Track appeal outcomes and measure tax savings performance.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
          </svg>
          <p className="text-xl font-medium mb-2">Results & Reporting</p>
          <p className="opacity-75">Comprehensive appeal results tracking</p>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-light tracking-tight text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Configure preferences, integrations, and platform settings.
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xl font-medium mb-2">Platform Settings</p>
          <p className="opacity-75">Configuration options will be available here</p>
        </div>
      </div>
    </div>
  );
}

// Simple routing (would use React Router in real app)
export const routes = {
  '/portfolio': PortfolioPage,
  '/analysis': AnalysisPage,
  '/intelligence': IntelligencePage,
  '/appeals': AppealsPage,
  '/results': ResultsPage,
  '/settings': SettingsPage,
};

export function Router({ currentPath = '/portfolio' }: { currentPath?: string }) {
  const Component = routes[currentPath as keyof typeof routes] || PortfolioPage;
  return <Component />;
}