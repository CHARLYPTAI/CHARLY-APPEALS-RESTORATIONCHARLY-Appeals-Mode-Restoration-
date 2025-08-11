/**
 * 🍎 CHARLY 2.0 - ADAPTIVE ARCHITECTURE MAIN ENTRY POINT
 * 
 * Revolutionary architecture that eliminates traditional pages and creates
 * a truly adaptive interface that responds to context, intent, and emotion.
 */

import React from 'react';
import { SearchDrivenComposer } from './SearchDrivenInterface';
import { contextEngine } from './ContextEngine';
import { adaptiveState } from './AdaptiveState';
import { emotionalIntelligence } from './EmotionalIntelligence';
import { userBehaviorAnalytics } from './UserBehaviorAnalytics';
import { roiTrackingEngine } from './ROITrackingEngine';
import { predictiveModelingEngine } from './PredictiveModelingEngine';

// ============================================================================
// ADAPTIVE ARCHITECTURE COMPONENT
// ============================================================================

interface AdaptiveArchitectureProps {
  className?: string;
  debugMode?: boolean;
}

export const AdaptiveArchitecture: React.FC<AdaptiveArchitectureProps> = ({
  className = '',
  debugMode = false
}) => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [currentContext, setCurrentContext] = React.useState<unknown>(null);
  const [emotionalState, setEmotionalState] = React.useState<unknown>(null);

  // Initialize the adaptive architecture
  React.useEffect(() => {
    const initializeArchitecture = async () => {
      try {
        // Subscribe to context changes
        const contextUnsub = contextEngine.subscribe((context) => {
          setCurrentContext(context);
          // Track context changes for analytics
          userBehaviorAnalytics.trackAction({
            action: 'context_change',
            component: 'AdaptiveArchitecture',
            success: true,
            metadata: { newContext: context }
          });
        });

        // Subscribe to emotional intelligence
        const emotionUnsub = emotionalIntelligence.subscribeToAdaptations((adaptation) => {
          setEmotionalState(adaptation);
          // Track emotional state changes
          userBehaviorAnalytics.trackAction({
            action: 'emotional_state_change',
            component: 'EmotionalIntelligence',
            success: true,
            metadata: { adaptation }
          });
        });

        // Initialize analytics engines
        userBehaviorAnalytics.trackAction({
          action: 'architecture_initialization',
          component: 'AdaptiveArchitecture',
          success: true,
          metadata: { timestamp: Date.now() }
        });

        // Initialize current state
        setCurrentContext(contextEngine.getCurrentContext());
        setEmotionalState(emotionalIntelligence.getCurrentEmotionalProfile());

        setIsInitialized(true);

        // Cleanup
        return () => {
          contextUnsub();
          emotionUnsub();
        };
      } catch (error) {
        console.error('Failed to initialize adaptive architecture:', error);
        userBehaviorAnalytics.trackAction({
          action: 'architecture_initialization_error',
          component: 'AdaptiveArchitecture',
          success: false,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    };

    initializeArchitecture();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Initializing Adaptive Architecture
          </h2>
          <p className="text-gray-600">
            Preparing your personalized interface...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`adaptive-architecture ${className}`}>
      {/* Main Search-Driven Interface */}
      <SearchDrivenComposer />
      
      {/* Debug Panel (Development Only) */}
      {debugMode && process.env.NODE_ENV === 'development' && (
        <DebugPanel
          context={currentContext}
          emotionalState={emotionalState}
        />
      )}
    </div>
  );
};

// ============================================================================
// DEBUG PANEL
// ============================================================================

interface DebugPanelProps {
  context: unknown;
  emotionalState: unknown;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ context, emotionalState }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`bg-black/90 text-white rounded-lg transition-all duration-300 ${
        isExpanded ? 'w-96 h-80' : 'w-48 h-12'
      }`}>
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-sm font-medium">Adaptive Debug</span>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▲
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 text-xs overflow-y-auto max-h-64">
            {/* Context Info */}
            <div>
              <strong className="text-blue-400">Context:</strong>
              <div className="ml-2 space-y-1">
                <div>Mode: {context?.context || 'Unknown'}</div>
                <div>Intent: {context?.intent || 'Unknown'}</div>
                <div>Emotion: {context?.emotion || 'Unknown'}</div>
                <div>Confidence: {context?.confidenceLevel || 0}%</div>
              </div>
            </div>

            {/* Emotional State */}
            <div>
              <strong className="text-green-400">Emotional Intelligence:</strong>
              <div className="ml-2 space-y-1">
                <div>Primary: {emotionalState?.primaryEmotion || 'Unknown'}</div>
                <div>Trajectory: {emotionalState?.trajectory || 'Unknown'}</div>
                <div>Stability: {Math.round((emotionalState?.stability || 0) * 100)}%</div>
              </div>
            </div>

            {/* Interface Adaptation */}
            <div>
              <strong className="text-yellow-400">Interface:</strong>
              <div className="ml-2 space-y-1">
                <div>Density: {emotionalState?.density || 'Unknown'}</div>
                <div>Guidance: {emotionalState?.guidance || 'Unknown'}</div>
                <div>Color: {emotionalState?.colorScheme || 'Unknown'}</div>
              </div>
            </div>

            {/* Analytics Info */}
            <div>
              <strong className="text-orange-400">Analytics:</strong>
              <div className="ml-2 space-y-1">
                <div>Actions: {userBehaviorAnalytics.getMetrics().totalActions}</div>
                <div>Sessions: {userBehaviorAnalytics.getMetrics().activeSessions}</div>
                <div>ROI: {roiTrackingEngine.getFinancialSummary().averageROI.toFixed(1)}%</div>
                <div>Models: {predictiveModelingEngine.getAllModels().length}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <strong className="text-purple-400">Quick Tests:</strong>
              <div className="ml-2 mt-2 space-y-1">
                <button
                  onClick={() => emotionalIntelligence.forceEmotionalState('stressed')}
                  className="block w-full text-left px-2 py-1 bg-red-600 rounded text-xs hover:bg-red-700"
                >
                  Force Stressed
                </button>
                <button
                  onClick={() => emotionalIntelligence.forceEmotionalState('confident')}
                  className="block w-full text-left px-2 py-1 bg-green-600 rounded text-xs hover:bg-green-700"
                >
                  Force Confident
                </button>
                <button
                  onClick={() => contextEngine.forceContext({ context: 'analysis', intent: 'analyze' })}
                  className="block w-full text-left px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
                >
                  Force Analysis Mode
                </button>
                <button
                  onClick={() => userBehaviorAnalytics.flush()}
                  className="block w-full text-left px-2 py-1 bg-purple-600 rounded text-xs hover:bg-purple-700"
                >
                  Flush Analytics
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ARCHITECTURE INITIALIZATION HOOK
// ============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export function useAdaptiveArchitecture() {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initialize = async () => {
      try {
        // Ensure all engines are initialized
        const context = contextEngine.getCurrentContext();
        const state = adaptiveState.getState();
        // const emotion = emotionalIntelligence.getCurrentEmotionalProfile();

        if (context && state) {
          setIsReady(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initialize();
  }, []);

  return { isReady, error };
}

// ============================================================================
// ARCHITECTURE CONTEXT PROVIDER
// ============================================================================

interface AdaptiveArchitectureContextType {
  context: unknown;
  state: unknown;
  emotion: unknown;
  isReady: boolean;
}

const AdaptiveArchitectureContext = React.createContext<AdaptiveArchitectureContextType | null>(null);

export const AdaptiveArchitectureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [context, setContext] = React.useState<unknown>(null);
  const [state, setState] = React.useState<unknown>(null);
  const [emotion, setEmotion] = React.useState<unknown>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to all engines
    const contextUnsub = contextEngine.subscribe(setContext);
    const stateUnsub = adaptiveState.subscribe(setState);
    const emotionUnsub = emotionalIntelligence.subscribeToAdaptations(setEmotion);

    // Initialize
    setContext(contextEngine.getCurrentContext());
    setState(adaptiveState.getState());
    setEmotion(emotionalIntelligence.getCurrentEmotionalProfile());
    setIsReady(true);

    return () => {
      contextUnsub();
      stateUnsub();
      emotionUnsub();
    };
  }, []);

  const value: AdaptiveArchitectureContextType = {
    context,
    state,
    emotion,
    isReady
  };

  return (
    <AdaptiveArchitectureContext.Provider value={value}>
      {children}
    </AdaptiveArchitectureContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAdaptiveContext() {
  const context = React.useContext(AdaptiveArchitectureContext);
  if (!context) {
    throw new Error('useAdaptiveContext must be used within AdaptiveArchitectureProvider');
  }
  return context;
}

export default AdaptiveArchitecture;