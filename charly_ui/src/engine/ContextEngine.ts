/**
 * 🍎 CHARLY 2.0 - CONTEXT ENGINE
 * 
 * Revolutionary adaptive interface engine that responds to:
 * - Context: Where attorney is in their workflow
 * - Intent: What attorney wants to accomplish  
 * - Emotion: How attorney feels (stress, confidence, urgency)
 * 
 * Eliminates traditional page navigation - interface becomes what's needed.
 */

// ============================================================================
// CORE CONTEXT TYPES
// ============================================================================

export type AttorneyContext = 
  | 'discovery'      // Exploring properties, market research
  | 'analysis'       // Deep-diving into specific property
  | 'preparation'    // Building appeal packets  
  | 'filing'         // Submitting appeals
  | 'monitoring'     // Tracking appeal progress
  | 'celebration'    // Success outcomes

export type AttorneyIntent =
  | 'explore'        // Browse, discover, research
  | 'analyze'        // Understand, compare, evaluate  
  | 'create'         // Build, generate, compose
  | 'submit'         // File, send, deliver
  | 'track'          // Monitor, follow-up, manage
  | 'learn'          // Understand, get help, tutorial

export type EmotionalState = 
  | 'confident'      // Experienced, flowing, competent
  | 'focused'        // Deep work, concentrated  
  | 'stressed'       // Overwhelmed, pressure, deadlines
  | 'uncertain'      // Questioning, need guidance
  | 'excited'        // New opportunities, wins
  | 'frustrated'     // Blocked, struggling, errors

export interface ContextSnapshot {
  // Core context
  context: AttorneyContext;
  intent: AttorneyIntent;
  emotion: EmotionalState;
  
  // Workflow state
  selectedProperties: string[];
  activeWorkflows: string[];
  recentActions: string[];
  
  // Temporal context
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late';
  workSession: 'starting' | 'continuing' | 'wrapping';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  
  // Environmental context
  deviceType: 'desktop' | 'tablet' | 'mobile';
  connectionQuality: 'excellent' | 'good' | 'poor';
  
  // Experience context
  userExperience: 'novice' | 'intermediate' | 'expert';
  confidenceLevel: number; // 0-100
  
  timestamp: number;
}

// ============================================================================
// INTERFACE COMPOSITION TYPES
// ============================================================================

export type InterfaceLayout = 
  | 'hero'           // Single focused task
  | 'dashboard'      // Overview with multiple options
  | 'workflow'       // Step-by-step process
  | 'comparison'     // Side-by-side analysis
  | 'creation'       // Building/composing mode
  | 'minimal'        // Distraction-free focus

export type ComponentDensity = 'minimal' | 'comfortable' | 'dense';
export type InformationDepth = 'overview' | 'detailed' | 'expert';

export interface InterfaceComposition {
  layout: InterfaceLayout;
  density: ComponentDensity;
  depth: InformationDepth;
  
  // Dynamic component assembly
  primaryComponents: string[];
  secondaryComponents: string[];
  hiddenComponents: string[];
  
  // Visual adaptation
  colorScheme: 'light' | 'dark' | 'auto';
  spacing: 'tight' | 'normal' | 'relaxed';
  fontSize: 'small' | 'normal' | 'large';
  
  // Interaction adaptation
  confirmationLevel: 'minimal' | 'standard' | 'paranoid';
  shortcutsEnabled: boolean;
  gesturesEnabled: boolean;
}

// ============================================================================
// CONTEXT ENGINE CORE
// ============================================================================

export class ContextEngine {
  private currentContext: ContextSnapshot;
  private contextHistory: ContextSnapshot[] = [];
  private listeners: Set<(context: ContextSnapshot) => void> = new Set();
  
  constructor() {
    this.currentContext = this.initializeContext();
    this.startContextMonitoring();
  }
  
  // ============================================================================
  // CONTEXT DETECTION
  // ============================================================================
  
  private initializeContext(): ContextSnapshot {
    return {
      context: 'discovery',
      intent: 'explore', 
      emotion: 'confident',
      selectedProperties: [],
      activeWorkflows: [],
      recentActions: [],
      timeOfDay: this.detectTimeOfDay(),
      workSession: 'starting',
      urgency: 'low',
      deviceType: this.detectDeviceType(),
      connectionQuality: 'excellent',
      userExperience: 'intermediate',
      confidenceLevel: 75,
      timestamp: Date.now()
    };
  }
  
  private detectTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'late' {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon'; 
    if (hour >= 17 && hour < 22) return 'evening';
    return 'late';
  }
  
  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth;
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }
  
  // ============================================================================
  // CONTEXT EVOLUTION
  // ============================================================================
  
  updateContext(updates: Partial<ContextSnapshot>): void {
    const previousContext = { ...this.currentContext };
    
    this.currentContext = {
      ...this.currentContext,
      ...updates,
      timestamp: Date.now()
    };
    
    // Store in history
    this.contextHistory.push(previousContext);
    
    // Keep only last 50 context snapshots
    if (this.contextHistory.length > 50) {
      this.contextHistory = this.contextHistory.slice(-50);
    }
    
    // Notify listeners
    this.notifyListeners();
  }
  
  // Intelligent context transitions based on user actions
  evolveContext(action: string): void {
    const context = this.detectContextFromAction(action);
    const intent = this.detectIntentFromAction(action);
    const emotion = this.detectEmotionFromAction(action);
    
    this.updateContext({
      context,
      intent, 
      emotion,
      recentActions: [action, ...this.currentContext.recentActions].slice(0, 10)
    });
  }
  
  private detectContextFromAction(action: string): AttorneyContext {
    // Smart context detection based on user actions
    if (action.includes('search') || action.includes('browse')) return 'discovery';
    if (action.includes('analyze') || action.includes('compare')) return 'analysis';
    if (action.includes('generate') || action.includes('create')) return 'preparation';
    if (action.includes('submit') || action.includes('file')) return 'filing';
    if (action.includes('track') || action.includes('monitor')) return 'monitoring';
    if (action.includes('success') || action.includes('win')) return 'celebration';
    
    return this.currentContext.context; // No change if unclear
  }
  
  private detectIntentFromAction(action: string): AttorneyIntent {
    if (action.includes('search') || action.includes('discover')) return 'explore';
    if (action.includes('analyze') || action.includes('evaluate')) return 'analyze';
    if (action.includes('create') || action.includes('build')) return 'create';
    if (action.includes('submit') || action.includes('send')) return 'submit';
    if (action.includes('track') || action.includes('monitor')) return 'track';
    if (action.includes('help') || action.includes('learn')) return 'learn';
    
    return this.currentContext.intent;
  }
  
  private detectEmotionFromAction(action: string): EmotionalState {
    // Detect emotional patterns from user behavior
    const recentErrors = this.currentContext.recentActions.filter(a => a.includes('error')).length;
    const rapidActions = this.contextHistory.length > 5 && 
      (Date.now() - this.contextHistory[this.contextHistory.length - 5].timestamp) < 30000;
    
    if (recentErrors > 2) return 'frustrated';
    if (rapidActions) return 'stressed';
    if (action.includes('success') || action.includes('complete')) return 'excited';
    if (action.includes('help') || action.includes('unclear')) return 'uncertain';
    if (this.currentContext.selectedProperties.length > 0) return 'focused';
    
    return 'confident'; // Default positive state
  }
  
  // ============================================================================
  // INTERFACE COMPOSITION
  // ============================================================================
  
  composeInterface(): InterfaceComposition {
    const { context, intent, emotion, deviceType, userExperience } = this.currentContext;
    
    // Determine optimal layout
    const layout = this.selectLayout(context, intent, emotion);
    
    // Determine information density  
    const density = this.selectDensity(deviceType, emotion, userExperience);
    
    // Determine information depth
    const depth = this.selectDepth(userExperience, emotion, intent);
    
    // Compose dynamic components
    const components = this.selectComponents(context);
    
    // Visual adaptations
    const visual = this.selectVisualAdaptations(emotion);
    
    return {
      layout,
      density,
      depth,
      ...components,
      ...visual,
      confirmationLevel: emotion === 'stressed' ? 'paranoid' : 'standard',
      shortcutsEnabled: userExperience !== 'novice',
      gesturesEnabled: deviceType !== 'desktop'
    };
  }
  
  private selectLayout(context: AttorneyContext, intent: AttorneyIntent, emotion: EmotionalState): InterfaceLayout {
    // Stressed users need focused, single-task layouts
    if (emotion === 'stressed' || emotion === 'frustrated') return 'hero';
    
    // Creation tasks need specialized layouts
    if (intent === 'create') return 'creation';
    
    // Analysis needs comparison views
    if (context === 'analysis' && intent === 'analyze') return 'comparison';
    
    // Filing needs step-by-step guidance
    if (context === 'filing') return 'workflow';
    
    // Discovery benefits from dashboard overview
    if (context === 'discovery') return 'dashboard';
    
    return 'dashboard'; // Safe default
  }
  
  private selectDensity(deviceType: 'desktop' | 'tablet' | 'mobile', emotion: EmotionalState, experience: 'novice' | 'intermediate' | 'expert'): ComponentDensity {
    if (deviceType === 'mobile') return 'minimal';
    if (emotion === 'stressed' || experience === 'novice') return 'comfortable';
    if (experience === 'expert') return 'dense';
    return 'comfortable';
  }
  
  private selectDepth(experience: 'novice' | 'intermediate' | 'expert', emotion: EmotionalState, intent: AttorneyIntent): InformationDepth {
    if (emotion === 'stressed' || experience === 'novice') return 'overview';
    if (experience === 'expert' || intent === 'analyze') return 'expert';
    return 'detailed';
  }
  
  private selectComponents(context: AttorneyContext) {
    const componentMap = {
      discovery: {
        primary: ['PropertySearch', 'MarketOverview', 'RecentActivity'],
        secondary: ['SavedSearches', 'MarketTrends', 'QuickActions'],
        hidden: ['DetailedAnalysis', 'AppealBuilder']
      },
      analysis: {
        primary: ['PropertyDetails', 'FinancialAnalysis', 'MarketComparison'],
        secondary: ['SimilarProperties', 'HistoricalData', 'AIInsights'],
        hidden: ['SearchFilters', 'BulkActions']
      },
      preparation: {
        primary: ['AppealBuilder', 'DocumentGenerator', 'EvidenceUpload'],
        secondary: ['TemplateLibrary', 'ReviewChecklist', 'PreviewMode'],
        hidden: ['MarketSearch', 'PropertyBrowser']
      },
      filing: {
        primary: ['SubmissionForm', 'DocumentReview', 'FilingChecklist'],
        secondary: ['DeadlineTracker', 'RequirementsList', 'ContactInfo'],
        hidden: ['PropertySearch', 'MarketData']
      },
      monitoring: {
        primary: ['AppealStatus', 'CaseTracker', 'ResponseManager'],
        secondary: ['DocumentLibrary', 'CommunicationLog', 'NextSteps'],
        hidden: ['PropertySearch', 'NewAppeal']
      },
      celebration: {
        primary: ['SuccessMetrics', 'SavingsCalculator', 'ShareSuccess'],
        secondary: ['NextOpportunities', 'ClientCommunication', 'TeamUpdate'],
        hidden: ['MarketSearch', 'NewAnalysis']
      }
    };
    
    return componentMap[context] || componentMap.discovery;
  }
  
  private selectVisualAdaptations(emotion: EmotionalState) {
    return {
      colorScheme: 'light' as const,
      spacing: emotion === 'stressed' ? 'relaxed' as const : 'normal' as const,
      fontSize: emotion === 'frustrated' ? 'large' as const : 'normal' as const
    };
  }
  
  // ============================================================================
  // CONTEXT MONITORING
  // ============================================================================
  
  private startContextMonitoring(): void {
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor temporal changes
    this.monitorTemporalChanges();
    
    // Monitor environmental changes
    this.monitorEnvironmentalChanges();
  }
  
  private monitorUserInteractions(): void {
    // Track mouse movement patterns for stress detection
    let lastMoveTime = 0;
    let moveCount = 0;
    
    document.addEventListener('mousemove', () => {
      const now = Date.now();
      if (now - lastMoveTime > 100) { // Debounce
        moveCount++;
        lastMoveTime = now;
        
        // Rapid mouse movement suggests stress/frustration
        if (moveCount > 50) { // High movement in short time
          this.updateContext({ emotion: 'stressed' });
          moveCount = 0; // Reset counter
        }
      }
    });
    
    // Track click patterns
    let clickTimes: number[] = [];
    document.addEventListener('click', () => {
      const now = Date.now();
      clickTimes.push(now);
      clickTimes = clickTimes.filter(time => now - time < 5000); // Keep last 5 seconds
      
      // Rapid clicking suggests frustration
      if (clickTimes.length > 8) {
        this.updateContext({ emotion: 'frustrated' });
      }
    });
  }
  
  private monitorTemporalChanges(): void {
    // Update time of day every hour
    setInterval(() => {
      this.updateContext({ timeOfDay: this.detectTimeOfDay() });
    }, 3600000); // 1 hour
  }
  
  private monitorEnvironmentalChanges(): void {
    // Monitor window resize for device type changes
    window.addEventListener('resize', () => {
      this.updateContext({ deviceType: this.detectDeviceType() });
    });
    
    // Monitor connection quality (simplified)
    if ('connection' in navigator) {
      const updateConnection = () => {
        const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
        const effectiveType = connection?.effectiveType || 'unknown';
        
        let quality: 'excellent' | 'good' | 'poor' = 'excellent';
        if (effectiveType === 'slow-2g' || effectiveType === '2g') quality = 'poor';
        else if (effectiveType === '3g') quality = 'good';
        
        this.updateContext({ connectionQuality: quality });
      };
      
      updateConnection();
      (navigator as unknown as { connection?: { addEventListener?: (event: string, handler: () => void) => void } }).connection?.addEventListener('change', updateConnection);
    }
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  getCurrentContext(): ContextSnapshot {
    return { ...this.currentContext };
  }
  
  getContextHistory(): ContextSnapshot[] {
    return [...this.contextHistory];
  }
  
  subscribe(listener: (context: ContextSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentContext));
  }
  
  // Force a specific context (for testing or manual override)
  forceContext(context: Partial<ContextSnapshot>): void {
    this.updateContext(context);
  }
  
  // Get recommended interface composition
  getInterfaceComposition(): InterfaceComposition {
    return this.composeInterface();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const contextEngine = new ContextEngine();