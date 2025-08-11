/**
 * 🍎 CHARLY 2.0 - CONTEXT DETECTION ALGORITHMS
 * 
 * Advanced algorithms that detect attorney context, intent, and emotional state
 * from user behavior patterns, creating truly adaptive interfaces.
 */

import { type AttorneyContext, type AttorneyIntent, type EmotionalState } from './ContextEngine';

// ============================================================================
// BEHAVIOR PATTERN TYPES
// ============================================================================

export interface UserAction {
  type: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  element?: string;
  page?: string;
}

export interface BehaviorPattern {
  name: string;
  confidence: number;
  indicators: string[];
  timeWindow: number;
  actions: UserAction[];
}

export interface ContextSignal {
  context: AttorneyContext;
  confidence: number;
  evidence: string[];
  timestamp: number;
}

export interface IntentSignal {
  intent: AttorneyIntent;
  confidence: number;
  evidence: string[];
  timestamp: number;
}

export interface EmotionalSignal {
  emotion: EmotionalState;
  confidence: number;
  evidence: string[];
  timestamp: number;
}

// ============================================================================
// CONTEXT DETECTION ALGORITHMS
// ============================================================================

export class ContextDetector {
  private actionHistory: UserAction[] = [];
  private patternCache: Map<string, BehaviorPattern> = new Map();
  private detectionWindow = 300000; // 5 minutes
  
  // ============================================================================
  // PATTERN RECOGNITION
  // ============================================================================
  
  addUserAction(action: UserAction): void {
    this.actionHistory.push(action);
    
    // Keep only actions within detection window
    const cutoff = Date.now() - this.detectionWindow;
    this.actionHistory = this.actionHistory.filter(a => a.timestamp > cutoff);
    
    // Clear outdated patterns
    this.patternCache.clear();
  }
  
  private getRecentActions(windowMs: number = 60000): UserAction[] {
    const cutoff = Date.now() - windowMs;
    return this.actionHistory.filter(a => a.timestamp > cutoff);
  }
  
  private detectBehaviorPattern(patternName: string): BehaviorPattern | null {
    if (this.patternCache.has(patternName)) {
      return this.patternCache.get(patternName)!;
    }
    
    const pattern = this.recognizePattern(patternName);
    if (pattern) {
      this.patternCache.set(patternName, pattern);
    }
    
    return pattern;
  }
  
  // ============================================================================
  // CONTEXT DETECTION
  // ============================================================================
  
  detectContext(): ContextSignal[] {
    const signals: ContextSignal[] = [];
    
    // Discovery patterns
    const discoverySignal = this.detectDiscoveryContext();
    if (discoverySignal) signals.push(discoverySignal);
    
    // Analysis patterns
    const analysisSignal = this.detectAnalysisContext();
    if (analysisSignal) signals.push(analysisSignal);
    
    // Preparation patterns
    const preparationSignal = this.detectPreparationContext();
    if (preparationSignal) signals.push(preparationSignal);
    
    // Filing patterns
    const filingSignal = this.detectFilingContext();
    if (filingSignal) signals.push(filingSignal);
    
    // Monitoring patterns
    const monitoringSignal = this.detectMonitoringContext();
    if (monitoringSignal) signals.push(monitoringSignal);
    
    return signals.sort((a, b) => b.confidence - a.confidence);
  }
  
  private detectDiscoveryContext(): ContextSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Search activity
    const searchActions = recentActions.filter(a => 
      a.type.includes('search') || a.type.includes('browse') || a.type.includes('filter')
    );
    if (searchActions.length > 0) {
      evidence.push(`${searchActions.length} search/browse actions`);
      confidence += Math.min(searchActions.length * 0.15, 0.4);
    }
    
    // Multiple property views without deep analysis
    const propertyViews = recentActions.filter(a => a.type === 'property_view');
    const analysisActions = recentActions.filter(a => a.type.includes('analyze'));
    if (propertyViews.length > 3 && analysisActions.length < propertyViews.length * 0.3) {
      evidence.push('Multiple property views with minimal analysis');
      confidence += 0.3;
    }
    
    // Market research activity
    const marketActions = recentActions.filter(a => 
      a.type.includes('market') || a.type.includes('comparable') || a.type.includes('trend')
    );
    if (marketActions.length > 0) {
      evidence.push('Market research activity');
      confidence += 0.2;
    }
    
    // Time-based patterns (discovery typically happens at start of session)
    const sessionStart = this.actionHistory.length > 0 ? this.actionHistory[0].timestamp : Date.now();
    const timeSinceStart = Date.now() - sessionStart;
    if (timeSinceStart < 600000) { // First 10 minutes
      evidence.push('Early in session');
      confidence += 0.1;
    }
    
    return confidence > 0.3 ? {
      context: 'discovery',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectAnalysisContext(): ContextSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Deep property analysis
    const analysisActions = recentActions.filter(a => 
      a.type.includes('analyze') || a.type.includes('compare') || a.type.includes('calculate')
    );
    if (analysisActions.length > 0) {
      evidence.push(`${analysisActions.length} analysis actions`);
      confidence += Math.min(analysisActions.length * 0.2, 0.5);
    }
    
    // Time spent on single property
    const propertyFocusTime = this.calculatePropertyFocusTime();
    if (propertyFocusTime > 120000) { // More than 2 minutes on one property
      evidence.push('Extended time on single property');
      confidence += 0.3;
    }
    
    // Financial calculations
    const financialActions = recentActions.filter(a => 
      a.type.includes('financial') || a.type.includes('noi') || a.type.includes('cap_rate')
    );
    if (financialActions.length > 0) {
      evidence.push('Financial analysis activity');
      confidence += 0.25;
    }
    
    // Comparison activities
    const comparisonActions = recentActions.filter(a => 
      a.type.includes('compare') || a.type.includes('side_by_side')
    );
    if (comparisonActions.length > 0) {
      evidence.push('Property comparison activity');
      confidence += 0.2;
    }
    
    return confidence > 0.4 ? {
      context: 'analysis',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectPreparationContext(): ContextSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Appeal building activity
    const appealActions = recentActions.filter(a => 
      a.type.includes('appeal') || a.type.includes('build') || a.type.includes('generate')
    );
    if (appealActions.length > 0) {
      evidence.push('Appeal building activity');
      confidence += Math.min(appealActions.length * 0.25, 0.6);
    }
    
    // Document handling
    const documentActions = recentActions.filter(a => 
      a.type.includes('document') || a.type.includes('template') || a.type.includes('upload')
    );
    if (documentActions.length > 0) {
      evidence.push('Document management activity');
      confidence += 0.3;
    }
    
    // Evidence collection
    const evidenceActions = recentActions.filter(a => 
      a.type.includes('evidence') || a.type.includes('photo') || a.type.includes('comp')
    );
    if (evidenceActions.length > 0) {
      evidence.push('Evidence collection activity');
      confidence += 0.25;
    }
    
    return confidence > 0.4 ? {
      context: 'preparation',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectFilingContext(): ContextSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Filing-specific actions
    const filingActions = recentActions.filter(a => 
      a.type.includes('submit') || a.type.includes('file') || a.type.includes('deadline')
    );
    if (filingActions.length > 0) {
      evidence.push('Filing activity detected');
      confidence += 0.5;
    }
    
    // Review and validation
    const reviewActions = recentActions.filter(a => 
      a.type.includes('review') || a.type.includes('validate') || a.type.includes('checklist')
    );
    if (reviewActions.length > 0) {
      evidence.push('Review and validation activity');
      confidence += 0.3;
    }
    
    // Jurisdiction research
    const jurisdictionActions = recentActions.filter(a => 
      a.type.includes('jurisdiction') || a.type.includes('requirement') || a.type.includes('form')
    );
    if (jurisdictionActions.length > 0) {
      evidence.push('Jurisdiction-specific research');
      confidence += 0.2;
    }
    
    return confidence > 0.4 ? {
      context: 'filing',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectMonitoringContext(): ContextSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Status tracking
    const statusActions = recentActions.filter(a => 
      a.type.includes('status') || a.type.includes('track') || a.type.includes('monitor')
    );
    if (statusActions.length > 0) {
      evidence.push('Status tracking activity');
      confidence += 0.4;
    }
    
    // Communication management
    const commActions = recentActions.filter(a => 
      a.type.includes('response') || a.type.includes('communication') || a.type.includes('update')
    );
    if (commActions.length > 0) {
      evidence.push('Communication management');
      confidence += 0.3;
    }
    
    // Timeline and deadline tracking
    const timelineActions = recentActions.filter(a => 
      a.type.includes('timeline') || a.type.includes('progress') || a.type.includes('milestone')
    );
    if (timelineActions.length > 0) {
      evidence.push('Timeline tracking');
      confidence += 0.25;
    }
    
    return confidence > 0.3 ? {
      context: 'monitoring',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  // ============================================================================
  // INTENT DETECTION
  // ============================================================================
  
  detectIntent(): IntentSignal[] {
    const signals: IntentSignal[] = [];
    
    // Explore intent
    const exploreSignal = this.detectExploreIntent();
    if (exploreSignal) signals.push(exploreSignal);
    
    // Analyze intent
    const analyzeSignal = this.detectAnalyzeIntent();
    if (analyzeSignal) signals.push(analyzeSignal);
    
    // Create intent
    const createSignal = this.detectCreateIntent();
    if (createSignal) signals.push(createSignal);
    
    // Submit intent
    const submitSignal = this.detectSubmitIntent();
    if (submitSignal) signals.push(submitSignal);
    
    // Track intent
    const trackSignal = this.detectTrackIntent();
    if (trackSignal) signals.push(trackSignal);
    
    // Learn intent
    const learnSignal = this.detectLearnIntent();
    if (learnSignal) signals.push(learnSignal);
    
    return signals.sort((a, b) => b.confidence - a.confidence);
  }
  
  private detectExploreIntent(): IntentSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Browsing behavior
    const browseActions = recentActions.filter(a => 
      a.type.includes('browse') || a.type.includes('search') || a.type.includes('discover')
    );
    if (browseActions.length > 0) {
      evidence.push('Browsing and search activity');
      confidence += Math.min(browseActions.length * 0.2, 0.5);
    }
    
    // Quick navigation patterns
    const navigationSpeed = this.calculateNavigationSpeed();
    if (navigationSpeed > 0.5) { // Fast navigation suggests exploration
      evidence.push('Rapid navigation pattern');
      confidence += 0.3;
    }
    
    return confidence > 0.3 ? {
      intent: 'explore',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectAnalyzeIntent(): IntentSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Deep analysis actions
    const analysisActions = recentActions.filter(a => 
      a.type.includes('analyze') || a.type.includes('calculate') || a.type.includes('evaluate')
    );
    if (analysisActions.length > 0) {
      evidence.push('Analysis and calculation activity');
      confidence += Math.min(analysisActions.length * 0.3, 0.6);
    }
    
    // Time investment
    const focusTime = this.calculateTotalFocusTime();
    if (focusTime > 180000) { // More than 3 minutes focused
      evidence.push('Extended focus time');
      confidence += 0.4;
    }
    
    return confidence > 0.4 ? {
      intent: 'analyze',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectCreateIntent(): IntentSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Creation actions
    const createActions = recentActions.filter(a => 
      a.type.includes('create') || a.type.includes('build') || a.type.includes('generate') || 
      a.type.includes('compose') || a.type.includes('draft')
    );
    if (createActions.length > 0) {
      evidence.push('Creation and building activity');
      confidence += Math.min(createActions.length * 0.25, 0.7);
    }
    
    return confidence > 0.3 ? {
      intent: 'create',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectSubmitIntent(): IntentSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Submission actions
    const submitActions = recentActions.filter(a => 
      a.type.includes('submit') || a.type.includes('send') || a.type.includes('file')
    );
    if (submitActions.length > 0) {
      evidence.push('Submission activity');
      confidence += 0.8; // High confidence for explicit submit actions
    }
    
    return confidence > 0.3 ? {
      intent: 'submit',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectTrackIntent(): IntentSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Tracking actions
    const trackActions = recentActions.filter(a => 
      a.type.includes('track') || a.type.includes('monitor') || a.type.includes('status')
    );
    if (trackActions.length > 0) {
      evidence.push('Tracking and monitoring activity');
      confidence += Math.min(trackActions.length * 0.3, 0.6);
    }
    
    return confidence > 0.3 ? {
      intent: 'track',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectLearnIntent(): IntentSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Learning actions
    const learnActions = recentActions.filter(a => 
      a.type.includes('help') || a.type.includes('tutorial') || a.type.includes('learn') ||
      a.type.includes('guide') || a.type.includes('documentation')
    );
    if (learnActions.length > 0) {
      evidence.push('Help and learning activity');
      confidence += Math.min(learnActions.length * 0.4, 0.7);
    }
    
    return confidence > 0.3 ? {
      intent: 'learn',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  // ============================================================================
  // EMOTIONAL STATE DETECTION
  // ============================================================================
  
  detectEmotionalState(): EmotionalSignal[] {
    const signals: EmotionalSignal[] = [];
    
    // Confident state
    const confidentSignal = this.detectConfidentState();
    if (confidentSignal) signals.push(confidentSignal);
    
    // Focused state
    const focusedSignal = this.detectFocusedState();
    if (focusedSignal) signals.push(focusedSignal);
    
    // Stressed state
    const stressedSignal = this.detectStressedState();
    if (stressedSignal) signals.push(stressedSignal);
    
    // Uncertain state
    const uncertainSignal = this.detectUncertainState();
    if (uncertainSignal) signals.push(uncertainSignal);
    
    // Excited state
    const excitedSignal = this.detectExcitedState();
    if (excitedSignal) signals.push(excitedSignal);
    
    // Frustrated state
    const frustratedSignal = this.detectFrustratedState();
    if (frustratedSignal) signals.push(frustratedSignal);
    
    return signals.sort((a, b) => b.confidence - a.confidence);
  }
  
  private detectConfidentState(): EmotionalSignal | null {
    // Analyze recent user actions for emotional state
    const evidence: string[] = [];
    let confidence = 0;
    
    // Smooth workflow patterns
    const errorRate = this.calculateErrorRate();
    if (errorRate < 0.1) {
      evidence.push('Low error rate');
      confidence += 0.3;
    }
    
    // Consistent action timing
    const actionConsistency = this.calculateActionConsistency();
    if (actionConsistency > 0.7) {
      evidence.push('Consistent action patterns');
      confidence += 0.2;
    }
    
    // Task completion rate
    const completionRate = this.calculateTaskCompletionRate();
    if (completionRate > 0.8) {
      evidence.push('High task completion rate');
      confidence += 0.3;
    }
    
    return confidence > 0.4 ? {
      emotion: 'confident',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectStressedState(): EmotionalSignal | null {
    // Analyze recent user actions for emotional state
    const evidence: string[] = [];
    let confidence = 0;
    
    // Rapid click patterns
    const clickFrequency = this.calculateClickFrequency();
    if (clickFrequency > 2.0) { // More than 2 clicks per second
      evidence.push('Rapid clicking pattern');
      confidence += 0.4;
    }
    
    // Error patterns
    const errorRate = this.calculateErrorRate();
    if (errorRate > 0.3) {
      evidence.push('High error rate');
      confidence += 0.3;
    }
    
    // Time pressure indicators
    const timePressure = this.detectTimePressure();
    if (timePressure > 0.6) {
      evidence.push('Time pressure indicators');
      confidence += 0.3;
    }
    
    return confidence > 0.5 ? {
      emotion: 'stressed',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectFrustratedState(): EmotionalSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Repeated failed actions
    const repeatFailures = this.countRepeatFailures();
    if (repeatFailures > 2) {
      evidence.push('Repeated failed actions');
      confidence += 0.5;
    }
    
    // Back navigation after errors
    const backAfterError = this.countBackAfterError();
    if (backAfterError > 1) {
      evidence.push('Back navigation after errors');
      confidence += 0.3;
    }
    
    // Help seeking behavior
    const helpActions = recentActions.filter(a => a.type.includes('help'));
    if (helpActions.length > 0) {
      evidence.push('Help seeking behavior');
      confidence += 0.2;
    }
    
    return confidence > 0.4 ? {
      emotion: 'frustrated',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectFocusedState(): EmotionalSignal | null {
    // Analyze recent user actions for emotional state
    const evidence: string[] = [];
    let confidence = 0;
    
    // Extended focus on single task
    const focusTime = this.calculateTotalFocusTime();
    if (focusTime > 300000) { // More than 5 minutes
      evidence.push('Extended focus time');
      confidence += 0.4;
    }
    
    // Minimal context switching
    const contextSwitches = this.countContextSwitches();
    if (contextSwitches < 3) {
      evidence.push('Minimal context switching');
      confidence += 0.3;
    }
    
    // Deep interaction patterns
    const interactionDepth = this.calculateInteractionDepth();
    if (interactionDepth > 0.7) {
      evidence.push('Deep interaction patterns');
      confidence += 0.3;
    }
    
    return confidence > 0.5 ? {
      emotion: 'focused',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectUncertainState(): EmotionalSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Help seeking
    const helpActions = recentActions.filter(a => 
      a.type.includes('help') || a.type.includes('guide') || a.type.includes('tutorial')
    );
    if (helpActions.length > 0) {
      evidence.push('Help seeking behavior');
      confidence += 0.4;
    }
    
    // Hesitation patterns (long pauses)
    const hesitationLevel = this.calculateHesitationLevel();
    if (hesitationLevel > 0.6) {
      evidence.push('Hesitation in actions');
      confidence += 0.3;
    }
    
    // Exploration without commitment
    const explorationRate = this.calculateExplorationWithoutCommitment();
    if (explorationRate > 0.7) {
      evidence.push('Exploration without commitment');
      confidence += 0.3;
    }
    
    return confidence > 0.4 ? {
      emotion: 'uncertain',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  private detectExcitedState(): EmotionalSignal | null {
    const recentActions = this.getRecentActions();
    const evidence: string[] = [];
    let confidence = 0;
    
    // Success actions
    const successActions = recentActions.filter(a => 
      a.type.includes('success') || a.type.includes('complete') || a.type.includes('win')
    );
    if (successActions.length > 0) {
      evidence.push('Success indicators');
      confidence += 0.6;
    }
    
    // Rapid positive progression
    const progressionRate = this.calculatePositiveProgressionRate();
    if (progressionRate > 0.8) {
      evidence.push('Rapid positive progression');
      confidence += 0.4;
    }
    
    return confidence > 0.5 ? {
      emotion: 'excited',
      confidence,
      evidence,
      timestamp: Date.now()
    } : null;
  }
  
  // ============================================================================
  // UTILITY CALCULATIONS
  // ============================================================================
  
  private calculatePropertyFocusTime(): number {
    // Calculate time spent focused on a single property
    const propertyViews = this.actionHistory.filter(a => a.type === 'property_view');
    if (propertyViews.length === 0) return 0;
    
    const lastProperty = propertyViews[propertyViews.length - 1];
    const focusStart = lastProperty.timestamp;
    const focusEnd = Date.now();
    
    return focusEnd - focusStart;
  }
  
  private calculateNavigationSpeed(): number {
    // Calculate how quickly user navigates (actions per minute)
    const recentActions = this.getRecentActions();
    if (recentActions.length < 2) return 0;
    
    const timeSpan = Date.now() - recentActions[0].timestamp;
    return (recentActions.length / timeSpan) * 60000; // Actions per minute
  }
  
  private calculateTotalFocusTime(): number {
    // Calculate total time user has been actively working
    const recentActions = this.getRecentActions();
    if (recentActions.length === 0) return 0;
    
    return Date.now() - recentActions[0].timestamp;
  }
  
  private calculateErrorRate(): number {
    const recentActions = this.getRecentActions();
    if (recentActions.length === 0) return 0;
    
    const errorActions = recentActions.filter(a => a.type.includes('error'));
    return errorActions.length / recentActions.length;
  }
  
  private calculateActionConsistency(): number {
    // Measure consistency in action timing
    const recentActions = this.getRecentActions();
    if (recentActions.length < 3) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < recentActions.length; i++) {
      intervals.push(recentActions[i].timestamp - recentActions[i-1].timestamp);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return 1 / (1 + Math.sqrt(variance) / avgInterval); // Higher = more consistent
  }
  
  private calculateTaskCompletionRate(): number {
    // Estimate task completion based on action sequences
    const recentActions = this.getRecentActions();
    const completionActions = recentActions.filter(a => 
      a.type.includes('complete') || a.type.includes('submit') || a.type.includes('save')
    );
    
    return Math.min(completionActions.length / 3, 1); // Normalize to 0-1
  }
  
  private calculateClickFrequency(): number {
    const recentActions = this.getRecentActions(10000); // Last 10 seconds
    const clickActions = recentActions.filter(a => a.type === 'click');
    
    return clickActions.length / 10; // Clicks per second
  }
  
  private detectTimePressure(): number {
    // Detect if user is under time pressure
    const recentActions = this.getRecentActions();
    const deadlineActions = recentActions.filter(a => a.type.includes('deadline'));
    const urgentActions = recentActions.filter(a => a.type.includes('urgent'));
    
    return Math.min((deadlineActions.length + urgentActions.length) / 5, 1);
  }
  
  private countRepeatFailures(): number {
    const recentActions = this.getRecentActions();
    let repeatCount = 0;
    let lastAction = '';
    
    for (const action of recentActions) {
      if (action.type.includes('error') && action.type === lastAction) {
        repeatCount++;
      }
      lastAction = action.type;
    }
    
    return repeatCount;
  }
  
  private countBackAfterError(): number {
    const recentActions = this.getRecentActions();
    let count = 0;
    
    for (let i = 1; i < recentActions.length; i++) {
      if (recentActions[i-1].type.includes('error') && 
          recentActions[i].type.includes('back')) {
        count++;
      }
    }
    
    return count;
  }
  
  private countContextSwitches(): number {
    const recentActions = this.getRecentActions();
    let switches = 0;
    let lastContext = '';
    
    for (const action of recentActions) {
      const currentContext = action.page || action.metadata?.context || '';
      if (currentContext !== lastContext && lastContext !== '') {
        switches++;
      }
      lastContext = currentContext;
    }
    
    return switches;
  }
  
  private calculateInteractionDepth(): number {
    // Measure how deeply user interacts with features
    const recentActions = this.getRecentActions();
    const deepActions = recentActions.filter(a => 
      a.type.includes('analyze') || a.type.includes('calculate') || 
      a.type.includes('detailed') || a.duration && a.duration > 30000
    );
    
    return deepActions.length / Math.max(recentActions.length, 1);
  }
  
  private calculateHesitationLevel(): number {
    // Detect hesitation through long pauses
    const recentActions = this.getRecentActions();
    if (recentActions.length < 2) return 0;
    
    let longPauses = 0;
    for (let i = 1; i < recentActions.length; i++) {
      const gap = recentActions[i].timestamp - recentActions[i-1].timestamp;
      if (gap > 10000) { // More than 10 seconds
        longPauses++;
      }
    }
    
    return longPauses / Math.max(recentActions.length - 1, 1);
  }
  
  private calculateExplorationWithoutCommitment(): number {
    // Detect browsing without taking action
    const recentActions = this.getRecentActions();
    const explorationActions = recentActions.filter(a => 
      a.type.includes('view') || a.type.includes('browse')
    );
    const commitmentActions = recentActions.filter(a => 
      a.type.includes('select') || a.type.includes('analyze') || a.type.includes('save')
    );
    
    return explorationActions.length / Math.max(explorationActions.length + commitmentActions.length, 1);
  }
  
  private calculatePositiveProgressionRate(): number {
    // Detect rapid positive progression through tasks
    const recentActions = this.getRecentActions();
    const progressActions = recentActions.filter(a => 
      a.type.includes('complete') || a.type.includes('progress') || a.type.includes('next')
    );
    
    return progressActions.length / Math.max(recentActions.length, 1);
  }
  
  private recognizePattern(): BehaviorPattern | null {
    // Placeholder for more sophisticated pattern recognition
    // Could use ML models or rule-based pattern matching
    return null;
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  getStrongestContext(): AttorneyContext | null {
    const signals = this.detectContext();
    return signals.length > 0 ? signals[0].context : null;
  }
  
  getStrongestIntent(): AttorneyIntent | null {
    const signals = this.detectIntent();
    return signals.length > 0 ? signals[0].intent : null;
  }
  
  getStrongestEmotion(): EmotionalState | null {
    const signals = this.detectEmotionalState();
    return signals.length > 0 ? signals[0].emotion : null;
  }
  
  getConfidenceScores() {
    return {
      context: this.detectContext(),
      intent: this.detectIntent(),
      emotion: this.detectEmotionalState()
    };
  }
}

export const contextDetector = new ContextDetector();