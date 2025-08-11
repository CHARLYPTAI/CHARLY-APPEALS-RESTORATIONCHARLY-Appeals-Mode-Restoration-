/**
 * 🍎 CHARLY 2.0 - INTENT PREDICTION ENGINE
 * 
 * Advanced behavioral analysis and intent prediction for attorneys.
 * Learns from patterns to anticipate next actions and optimize interface.
 */

import { AttorneyContext, AttorneyIntent } from './ContextEngine';
import { SearchQuery } from './SearchDrivenInterface';

// ============================================================================
// BEHAVIORAL PATTERN TYPES
// ============================================================================

export interface BehavioralPattern {
  id: string;
  name: string;
  contexts: AttorneyContext[];
  intents: AttorneyIntent[];
  triggerConditions: TriggerCondition[];
  confidence: number;
  frequency: number;
  lastSeen: number;
}

export interface TriggerCondition {
  type: 'time_pattern' | 'sequence_pattern' | 'entity_pattern' | 'emotional_pattern';
  pattern: string | string[] | { start: number; end: number } | { sequence: string[]; window: number };
  weight: number;
}

export interface WorkflowPrediction {
  nextContext: AttorneyContext;
  nextIntent: AttorneyIntent;
  confidence: number;
  timeToNext: number; // minutes
  suggestedActions: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AttorneyProfile {
  id: string;
  experienceLevel: 'novice' | 'intermediate' | 'expert';
  workingHours: { start: number; end: number };
  preferredContexts: AttorneyContext[];
  behavioralPatterns: BehavioralPattern[];
  deadlinePattern: 'early_bird' | 'last_minute' | 'steady_pace';
  stressResponse: 'methodical' | 'rapid_fire' | 'collaborative';
  learningStyle: 'visual' | 'step_by_step' | 'exploratory';
}

// ============================================================================
// INTENT PREDICTION ENGINE
// ============================================================================

export class IntentPredictionEngine {
  private patterns: Map<string, BehavioralPattern> = new Map();
  private attorneyProfile: AttorneyProfile | null = null;
  private sessionHistory: SearchQuery[] = [];
  private workflowTransitions: Map<string, Map<string, number>> = new Map();
  private timeBasedPatterns: Map<number, AttorneyContext[]> = new Map();
  
  constructor() {
    this.initializeDefaultPatterns();
    this.loadProfile();
    this.initializeWorkflowTransitions();
  }
  
  private initializeDefaultPatterns(): void {
    // Morning discovery pattern
    this.patterns.set('morning_discovery', {
      id: 'morning_discovery',
      name: 'Morning Discovery Session',
      contexts: ['discovery', 'analysis'],
      intents: ['explore', 'analyze'],
      triggerConditions: [
        { type: 'time_pattern', pattern: { hour: [7, 8, 9, 10] }, weight: 1.5 },
        { type: 'sequence_pattern', pattern: 'session_start', weight: 1.2 }
      ],
      confidence: 0.8,
      frequency: 0,
      lastSeen: 0
    });
    
    // Deadline preparation pattern
    this.patterns.set('deadline_prep', {
      id: 'deadline_prep',
      name: 'Deadline Preparation Rush',
      contexts: ['preparation', 'filing'],
      intents: ['create', 'submit'],
      triggerConditions: [
        { type: 'entity_pattern', pattern: { type: 'date', urgency: 'high' }, weight: 2.0 },
        { type: 'emotional_pattern', pattern: 'stressed', weight: 1.8 }
      ],
      confidence: 0.9,
      frequency: 0,
      lastSeen: 0
    });
    
    // Analysis deep dive pattern
    this.patterns.set('analysis_deep_dive', {
      id: 'analysis_deep_dive',
      name: 'Property Analysis Deep Dive',
      contexts: ['analysis', 'preparation'],
      intents: ['analyze', 'create'],
      triggerConditions: [
        { type: 'entity_pattern', pattern: { type: 'property', specificity: 'high' }, weight: 1.6 },
        { type: 'sequence_pattern', pattern: 'property_selected', weight: 1.4 }
      ],
      confidence: 0.85,
      frequency: 0,
      lastSeen: 0
    });
    
    // Portfolio review pattern
    this.patterns.set('portfolio_review', {
      id: 'portfolio_review',
      name: 'Portfolio Review Session',
      contexts: ['discovery', 'monitoring'],
      intents: ['explore', 'track'],
      triggerConditions: [
        { type: 'time_pattern', pattern: { dayOfWeek: [1, 5] }, weight: 1.3 }, // Monday/Friday
        { type: 'sequence_pattern', pattern: 'bulk_operation', weight: 1.2 }
      ],
      confidence: 0.75,
      frequency: 0,
      lastSeen: 0
    });
  }
  
  private initializeWorkflowTransitions(): void {
    // Discovery -> Analysis transitions
    this.workflowTransitions.set('discovery_explore', new Map([
      ['analysis_analyze', 0.4],
      ['discovery_explore', 0.3],
      ['preparation_create', 0.2],
      ['monitoring_track', 0.1]
    ]));
    
    // Analysis -> Preparation transitions
    this.workflowTransitions.set('analysis_analyze', new Map([
      ['preparation_create', 0.5],
      ['analysis_analyze', 0.2],
      ['discovery_explore', 0.2],
      ['filing_submit', 0.1]
    ]));
    
    // Preparation -> Filing transitions
    this.workflowTransitions.set('preparation_create', new Map([
      ['filing_submit', 0.6],
      ['preparation_create', 0.2],
      ['analysis_analyze', 0.15],
      ['monitoring_track', 0.05]
    ]));
    
    // Filing -> Monitoring transitions
    this.workflowTransitions.set('filing_submit', new Map([
      ['monitoring_track', 0.7],
      ['discovery_explore', 0.15],
      ['celebration_celebrate', 0.1],
      ['filing_submit', 0.05]
    ]));
    
    // Monitoring -> Discovery transitions
    this.workflowTransitions.set('monitoring_track', new Map([
      ['discovery_explore', 0.4],
      ['monitoring_track', 0.3],
      ['analysis_analyze', 0.2],
      ['celebration_celebrate', 0.1]
    ]));
  }
  
  public recordQuery(query: SearchQuery): void {
    this.sessionHistory.push(query);
    
    // Keep only last 20 queries for session analysis
    if (this.sessionHistory.length > 20) {
      this.sessionHistory.shift();
    }
    
    this.updatePatterns(query);
    this.analyzeSequencePatterns();
  }
  
  private updatePatterns(query: SearchQuery): void {
    const currentTime = Date.now();
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Update pattern frequencies
    for (const [, pattern] of this.patterns) {
      let matches = 0;
      
      for (const condition of pattern.triggerConditions) {
        switch (condition.type) {
          case 'time_pattern':
            if (this.matchesTimePattern(condition.pattern, hour, dayOfWeek)) {
              matches += condition.weight;
            }
            break;
            
          case 'sequence_pattern':
            if (this.matchesSequencePattern(condition.pattern)) {
              matches += condition.weight;
            }
            break;
            
          case 'entity_pattern':
            if (this.matchesEntityPattern(condition.pattern, query)) {
              matches += condition.weight;
            }
            break;
        }
      }
      
      if (matches > 1.0) {
        pattern.frequency += 1;
        pattern.lastSeen = currentTime;
        pattern.confidence = Math.min(pattern.confidence + 0.05, 1.0);
      }
    }
  }
  
  private matchesTimePattern(pattern: { hour?: number[]; dayOfWeek?: number[] }, hour: number, dayOfWeek: number): boolean {
    if (pattern.hour && pattern.hour.includes(hour)) return true;
    if (pattern.dayOfWeek && pattern.dayOfWeek.includes(dayOfWeek)) return true;
    return false;
  }
  
  private matchesSequencePattern(pattern: string): boolean {
    const recentQueries = this.sessionHistory.slice(-3);
    
    switch (pattern) {
      case 'session_start':
        return this.sessionHistory.length === 1;
        
      case 'property_selected':
        return recentQueries.some(q => 
          q.context === 'discovery' && 
          this.sessionHistory[this.sessionHistory.length - 1]?.context === 'analysis'
        );
        
      case 'bulk_operation':
        return recentQueries.filter(q => 
          q.query.toLowerCase().includes('all') || 
          q.query.toLowerCase().includes('bulk')
        ).length > 0;
        
      default:
        return false;
    }
  }
  
  private matchesEntityPattern(pattern: { type?: string; urgency?: string }, query: SearchQuery): boolean {
    // This would analyze entities in the query
    // For now, simplified implementation
    if (pattern.type === 'date' && pattern.urgency === 'high') {
      return query.query.toLowerCase().includes('deadline') || 
             query.query.toLowerCase().includes('urgent');
    }
    
    if (pattern.type === 'property' && pattern.specificity === 'high') {
      return /\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|blvd|boulevard)/i.test(query.query);
    }
    
    return false;
  }
  
  private analyzeSequencePatterns(): void {
    if (this.sessionHistory.length < 2) return;
    
    const currentState = `${this.sessionHistory[this.sessionHistory.length - 1]?.context}_${this.sessionHistory[this.sessionHistory.length - 1]?.intent}`;
    const previousState = `${this.sessionHistory[this.sessionHistory.length - 2]?.context}_${this.sessionHistory[this.sessionHistory.length - 2]?.intent}`;
    
    // Update transition probabilities
    if (!this.workflowTransitions.has(previousState)) {
      this.workflowTransitions.set(previousState, new Map());
    }
    
    const transitions = this.workflowTransitions.get(previousState)!;
    const currentCount = transitions.get(currentState) || 0;
    transitions.set(currentState, currentCount + 1);
    
    // Normalize probabilities
    const total = Array.from(transitions.values()).reduce((sum, count) => sum + count, 0);
    for (const [state, count] of transitions) {
      transitions.set(state, count / total);
    }
  }
  
  public predictNextAction(currentContext: AttorneyContext, currentIntent: AttorneyIntent): WorkflowPrediction {
    const currentState = `${currentContext}_${currentIntent}`;
    const transitions = this.workflowTransitions.get(currentState);
    
    if (!transitions) {
      return this.getDefaultPrediction();
    }
    
    // Get most likely next state
    const sortedTransitions = Array.from(transitions.entries())
      .sort(([, a], [, b]) => b - a);
    
    const [nextState, probability] = sortedTransitions[0];
    const [nextContext, nextIntent] = nextState.split('_') as [AttorneyContext, AttorneyIntent];
    
    // Factor in behavioral patterns
    const patternBoost = this.getPatternBoost(nextContext, nextIntent);
    const finalConfidence = Math.min(probability + patternBoost, 1.0);
    
    // Estimate time to next action
    const timeToNext = this.estimateTimeToNext(currentContext, nextContext);
    
    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(nextContext, nextIntent);
    
    // Determine urgency
    const urgencyLevel = this.determineUrgency(currentContext, nextContext);
    
    return {
      nextContext,
      nextIntent,
      confidence: finalConfidence,
      timeToNext,
      suggestedActions,
      urgencyLevel
    };
  }
  
  private getPatternBoost(context: AttorneyContext, intent: AttorneyIntent): number {
    let boost = 0;
    const currentTime = Date.now();
    
    for (const pattern of this.patterns.values()) {
      if (pattern.contexts.includes(context) && pattern.intents.includes(intent)) {
        // Recent patterns get higher boost
        const recency = Math.max(0, 1 - (currentTime - pattern.lastSeen) / (24 * 60 * 60 * 1000));
        boost += pattern.confidence * recency * 0.2;
      }
    }
    
    return Math.min(boost, 0.3);
  }
  
  private estimateTimeToNext(currentContext: AttorneyContext, nextContext: AttorneyContext): number {
    // Time estimates in minutes based on context transitions
    const timeMap = {
      'discovery_analysis': 5,
      'analysis_preparation': 15,
      'preparation_filing': 10,
      'filing_monitoring': 2,
      'monitoring_discovery': 30
    };
    
    const key = `${currentContext}_${nextContext}`;
    return timeMap[key] || 10; // Default 10 minutes
  }
  
  private generateSuggestedActions(context: AttorneyContext, intent: AttorneyIntent): string[] {
    const actionMap = {
      'discovery_explore': [
        'Browse properties in your active areas',
        'Check for new overassessed properties',
        'Review market trends'
      ],
      'analysis_analyze': [
        'Deep dive into property details',
        'Compare with similar properties',
        'Calculate potential savings'
      ],
      'preparation_create': [
        'Start building appeal packet',
        'Gather evidence documents',
        'Review jurisdiction requirements'
      ],
      'filing_submit': [
        'Final review before submission',
        'Submit to assessor office',
        'Set up tracking reminders'
      ],
      'monitoring_track': [
        'Check appeal status',
        'Review deadlines',
        'Follow up on pending cases'
      ]
    };
    
    const key = `${context}_${intent}`;
    return actionMap[key] || ['Continue with current workflow'];
  }
  
  private determineUrgency(currentContext: AttorneyContext, nextContext: AttorneyContext): 'low' | 'medium' | 'high' | 'critical' {
    // Check for deadline-related patterns
    const recentQueries = this.sessionHistory.slice(-3);
    const hasDeadlineKeywords = recentQueries.some(q => 
      q.query.toLowerCase().includes('deadline') || 
      q.query.toLowerCase().includes('urgent') ||
      q.query.toLowerCase().includes('due')
    );
    
    if (hasDeadlineKeywords) return 'critical';
    if (currentContext === 'preparation' && nextContext === 'filing') return 'high';
    if (currentContext === 'filing') return 'medium';
    
    return 'low';
  }
  
  private getDefaultPrediction(): WorkflowPrediction {
    return {
      nextContext: 'discovery',
      nextIntent: 'explore',
      confidence: 0.5,
      timeToNext: 10,
      suggestedActions: ['Continue exploring properties'],
      urgencyLevel: 'low'
    };
  }
  
  private loadProfile(): void {
    try {
      const saved = localStorage.getItem('charly_attorney_profile');
      if (saved) {
        this.attorneyProfile = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load attorney profile:', error);
    }
  }
  
  public getWorkflowInsights(): {
    currentPattern: string | null;
    sessionProgress: number;
    expectedDuration: number;
    bottlenecks: string[];
  } {
    const currentPattern = this.detectCurrentPattern();
    const sessionProgress = this.calculateSessionProgress();
    const expectedDuration = this.estimateSessionDuration();
    const bottlenecks = this.identifyBottlenecks();
    
    return {
      currentPattern,
      sessionProgress,
      expectedDuration,
      bottlenecks
    };
  }
  
  private detectCurrentPattern(): string | null {
    const recentContexts = this.sessionHistory.slice(-5).map(q => q.context);
    // Build context sequence for pattern matching
    
    for (const pattern of this.patterns.values()) {
      if (pattern.contexts.some(context => recentContexts.includes(context))) {
        return pattern.name;
      }
    }
    
    return null;
  }
  
  private calculateSessionProgress(): number {
    if (this.sessionHistory.length === 0) return 0;
    
    const contexts = this.sessionHistory.map(q => q.context);
    // Calculate progress based on workflow stages
    
    // Progress based on workflow completion
    const workflowStages = ['discovery', 'analysis', 'preparation', 'filing', 'monitoring'];
    const completedStages = workflowStages.filter(stage => contexts.includes(stage as AttorneyContext)).length;
    
    return completedStages / workflowStages.length;
  }
  
  private estimateSessionDuration(): number {
    // Based on current pattern and historical data
    const currentPattern = this.detectCurrentPattern();
    
    const durationMap = {
      'Morning Discovery Session': 45,
      'Deadline Preparation Rush': 90,
      'Property Analysis Deep Dive': 60,
      'Portfolio Review Session': 30
    };
    
    return durationMap[currentPattern] || 40; // Default 40 minutes
  }
  
  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const recentQueries = this.sessionHistory.slice(-5);
    
    // Check for repeated similar queries (confusion indicator)
    const querySimilarity = new Map<string, number>();
    recentQueries.forEach(q => {
      const key = `${q.context}_${q.intent}`;
      querySimilarity.set(key, (querySimilarity.get(key) || 0) + 1);
    });
    
    for (const [pattern, count] of querySimilarity) {
      if (count > 2) {
        bottlenecks.push(`Repeated ${pattern} queries suggest confusion`);
      }
    }
    
    // Check for context switching without completion
    const contexts = recentQueries.map(q => q.context);
    const uniqueContexts = new Set(contexts);
    if (uniqueContexts.size > 3 && recentQueries.length < 10) {
      bottlenecks.push('Frequent context switching may indicate uncertainty');
    }
    
    return bottlenecks;
  }
}

// Export singleton instance
export const intentPredictionEngine = new IntentPredictionEngine();