import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export type WorkflowMode = 'PORTFOLIO' | 'INTELLIGENCE' | 'APPEALS' | 'FILING' | 'RESULTS';

interface WorkflowContext {
  mode: WorkflowMode;
  data?: any;
  previousMode?: WorkflowMode;
  breadcrumb?: string[];
}

interface WorkflowNavigationProps {
  currentMode: WorkflowMode;
  onModeChange: (mode: WorkflowMode, context?: any) => void;
  userRole?: 'attorney' | 'analyst' | 'admin';
  workflowData?: any;
}

const workflowDefinitions = {
  PORTFOLIO: {
    icon: '📊',
    title: 'Portfolio',
    description: 'Property overview and health metrics',
    primaryColor: 'primary',
    gradient: 'from-primary-50 to-primary-100',
    availableTransitions: ['INTELLIGENCE', 'APPEALS', 'FILING', 'RESULTS']
  },
  INTELLIGENCE: {
    icon: '🧠',
    title: 'Intelligence',
    description: 'AI-powered opportunity ranking',
    primaryColor: 'success',
    gradient: 'from-success-50 to-success-100',
    availableTransitions: ['PORTFOLIO', 'APPEALS', 'FILING']
  },
  APPEALS: {
    icon: '⚖️',
    title: 'Appeals',
    description: 'Valuation analysis and case building',
    primaryColor: 'warning',
    gradient: 'from-warning-50 to-warning-100',
    availableTransitions: ['PORTFOLIO', 'INTELLIGENCE', 'FILING']
  },
  FILING: {
    icon: '📄',
    title: 'Filing',
    description: 'Submission and deadline management',
    primaryColor: 'neutral',
    gradient: 'from-neutral-50 to-neutral-100',
    availableTransitions: ['PORTFOLIO', 'APPEALS', 'RESULTS']
  },
  RESULTS: {
    icon: '🏆',
    title: 'Results',
    description: 'Outcome tracking and reporting',
    primaryColor: 'success',
    gradient: 'from-success-50 via-primary-50 to-success-100',
    availableTransitions: ['PORTFOLIO', 'INTELLIGENCE', 'FILING']
  }
};

export function WorkflowNavigation({ 
  currentMode, 
  onModeChange, 
  userRole = 'attorney',
  workflowData 
}: WorkflowNavigationProps) {
  const [contextualActions, setContextualActions] = useState<any[]>([]);
  const [transitionAnimation, setTransitionAnimation] = useState(false);

  const currentWorkflow = workflowDefinitions[currentMode];

  // Detect contextual actions based on current mode and data
  useEffect(() => {
    const detectContextualActions = () => {
      const actions = [];

      switch (currentMode) {
        case 'PORTFOLIO':
          if (workflowData?.flaggedProperties?.length > 0) {
            actions.push({
              icon: '🎯',
              label: 'View Opportunities',
              mode: 'INTELLIGENCE',
              urgent: true
            });
          }
          if (workflowData?.upcomingDeadlines?.length > 0) {
            actions.push({
              icon: '⏰',
              label: 'Check Deadlines',
              mode: 'FILING',
              urgent: true
            });
          }
          break;

        case 'INTELLIGENCE':
          if (workflowData?.selectedOpportunities?.length > 0) {
            actions.push({
              icon: '⚖️',
              label: 'Analyze Selected',
              mode: 'APPEALS',
              context: { properties: workflowData.selectedOpportunities }
            });
          }
          break;

        case 'APPEALS':
          if (workflowData?.completedAnalyses?.length > 0) {
            actions.push({
              icon: '📄',
              label: 'Prepare Filing',
              mode: 'FILING',
              context: { analyses: workflowData.completedAnalyses }
            });
          }
          break;

        case 'FILING':
          if (workflowData?.submittedAppeals?.length > 0) {
            actions.push({
              icon: '🏆',
              label: 'Track Results',
              mode: 'RESULTS',
              context: { appeals: workflowData.submittedAppeals }
            });
          }
          break;

        case 'RESULTS':
          actions.push({
            icon: '📊',
            label: 'Back to Portfolio',
            mode: 'PORTFOLIO'
          });
          break;
      }

      setContextualActions(actions);
    };

    detectContextualActions();
  }, [currentMode, workflowData]);

  const handleModeTransition = async (newMode: WorkflowMode, context?: any) => {
    setTransitionAnimation(true);
    
    // Smooth transition delay
    setTimeout(() => {
      onModeChange(newMode, context);
      setTransitionAnimation(false);
    }, 300);
  };

  const getModeProgress = () => {
    if (!workflowData) return 0;

    switch (currentMode) {
      case 'PORTFOLIO':
        return workflowData.propertiesLoaded ? 100 : 0;
      case 'INTELLIGENCE':
        return workflowData.opportunitiesAnalyzed ? 100 : 0;
      case 'APPEALS':
        return workflowData.analysisProgress || 0;
      case 'FILING':
        return workflowData.filingProgress || 0;
      case 'RESULTS':
        return workflowData.resultsCompiled ? 100 : 0;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Mode Header with Adaptive Background */}
      <div className={`relative overflow-hidden rounded-apple-2xl p-8 bg-gradient-to-r ${currentWorkflow.gradient}`}>
        <div className={`absolute inset-0 bg-gradient-to-r ${currentWorkflow.gradient} transition-all duration-500 ${transitionAnimation ? 'opacity-0' : 'opacity-100'}`}></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{currentWorkflow.icon}</div>
              <div>
                <h1 className="text-headline-large font-bold text-neutral-900">
                  {currentWorkflow.title}
                </h1>
                <p className="text-body-large text-neutral-700">
                  {currentWorkflow.description}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-label-medium font-medium text-neutral-700">Progress</p>
                <p className="text-title-medium font-bold text-neutral-900">
                  {getModeProgress()}%
                </p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-neutral-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    className="text-neutral-700"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - getModeProgress() / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Actions - Intelligent Suggestions */}
      {contextualActions.length > 0 && (
        <div className="bg-white rounded-apple-xl p-6 shadow-apple-lg border border-neutral-200">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">💡</span>
            <h3 className="text-title-medium font-semibold text-neutral-900">
              Suggested Next Steps
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contextualActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleModeTransition(action.mode, action.context)}
                className={`p-4 rounded-apple-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] hover:shadow-apple-md ${
                  action.urgent 
                    ? 'border-warning-200 bg-warning-50 hover:border-warning-300' 
                    : 'border-neutral-200 bg-neutral-50 hover:border-primary-200 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{action.icon}</span>
                  <div>
                    <p className="text-body-medium font-medium text-neutral-900">
                      {action.label}
                    </p>
                    {action.urgent && (
                      <p className="text-caption text-warning-600 font-medium">
                        Attention required
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Workflow Navigation */}
      <div className="bg-white rounded-apple-xl p-6 shadow-apple-lg border border-neutral-200">
        <h3 className="text-title-medium font-semibold text-neutral-900 mb-4">
          Workflow Navigation
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(workflowDefinitions).map(([mode, config]) => {
            const isActive = mode === currentMode;
            const isAvailable = currentWorkflow.availableTransitions.includes(mode as WorkflowMode) || isActive;
            
            return (
              <button
                key={mode}
                onClick={() => !isActive && isAvailable && handleModeTransition(mode as WorkflowMode)}
                disabled={!isAvailable}
                className={`p-4 rounded-apple-lg border-2 transition-all duration-200 text-center ${
                  isActive
                    ? `border-${config.primaryColor}-300 bg-${config.primaryColor}-100 shadow-apple-md`
                    : isAvailable
                    ? 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-apple-md hover:scale-[1.02]'
                    : 'border-neutral-100 bg-neutral-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-2xl">{config.icon}</div>
                  <div>
                    <p className={`text-label-medium font-medium ${
                      isActive ? 'text-neutral-900' : 'text-neutral-700'
                    }`}>
                      {config.title}
                    </p>
                    {isActive && (
                      <div className="w-full h-1 bg-primary-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workflow Breadcrumb */}
      {workflowData?.breadcrumb && workflowData.breadcrumb.length > 0 && (
        <div className="flex items-center space-x-2 text-body-medium text-neutral-600">
          {workflowData.breadcrumb.map((item: string, index: number) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-neutral-400">→</span>}
              <span className={index === workflowData.breadcrumb.length - 1 ? 'text-neutral-900 font-medium' : ''}>
                {item}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Workflow Tips */}
      <div className="bg-gradient-to-r from-primary-50 to-success-50 rounded-apple-lg p-4 border border-primary-200">
        <div className="flex items-start space-x-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-body-medium font-medium text-neutral-900 mb-1">
              Pro Tip for {currentWorkflow.title}
            </p>
            <p className="text-body-small text-neutral-700">
              {currentMode === 'PORTFOLIO' && 'Use filters to focus on flagged properties with highest appeal potential.'}
              {currentMode === 'INTELLIGENCE' && 'Sort by potential savings or success probability to prioritize your efforts.'}
              {currentMode === 'APPEALS' && 'Review comparable properties and market data before finalizing your analysis.'}
              {currentMode === 'FILING' && 'Check jurisdiction-specific requirements and deadlines before submitting.'}
              {currentMode === 'RESULTS' && 'Track patterns in successful appeals to improve future strategies.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowNavigation;