/**
 * 🍎 CHARLY 2.0 - EMOTIONAL INTELLIGENCE ENGINE
 * 
 * Advanced emotional intelligence system that detects attorney emotional state
 * and adapts the interface to provide optimal support and reduce stress.
 */

import { contextEngine, type EmotionalState } from './ContextEngine';
// import { contextDetector } from './ContextDetector';

// ============================================================================
// EMOTIONAL INTELLIGENCE TYPES
// ============================================================================

export interface EmotionalProfile {
  primaryEmotion: EmotionalState;
  secondaryEmotions: EmotionalState[];
  confidence: number;
  stability: number; // How stable/consistent the emotional state is
  trajectory: 'improving' | 'stable' | 'declining';
  triggers: string[]; // What caused the emotional state
  duration: number; // How long they've been in this state
}

export interface StressIndicators {
  rapidClicking: number; // Clicks per second
  errorRate: number; // Errors per action
  hesitationLevel: number; // Long pauses between actions
  backtrackingFrequency: number; // How often they go back/undo
  helpSeekingBehavior: number; // How often they seek help
  timeUnderPressure: number; // Urgency indicators
}

export interface ConfidenceIndicators {
  taskCompletionRate: number; // Successfully completed tasks
  navigationEfficiency: number; // Direct vs wandering navigation
  decisionSpeed: number; // How quickly they make decisions
  expertFeatureUsage: number; // Using advanced features
  errorRecoveryRate: number; // How well they recover from errors
}

export interface SupportRecommendation {
  type: 'ui_adaptation' | 'guidance' | 'simplification' | 'encouragement' | 'assistance';
  description: string;
  implementation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  trigger: string;
}

export interface InterfaceAdaptation {
  density: 'minimal' | 'comfortable' | 'dense';
  guidance: 'none' | 'subtle' | 'prominent' | 'step_by_step';
  confirmations: 'minimal' | 'standard' | 'verbose';
  helpVisibility: 'hidden' | 'subtle' | 'prominent';
  colorScheme: 'calm' | 'neutral' | 'energizing';
  animations: 'none' | 'subtle' | 'smooth' | 'engaging';
}

// ============================================================================
// EMOTIONAL INTELLIGENCE ENGINE
// ============================================================================

export class EmotionalIntelligenceEngine {
  private emotionalHistory: EmotionalProfile[] = [];
  private stressThreshold = 0.7;
  private confidenceThreshold = 0.8;
  private adaptationListeners: Set<(adaptation: InterfaceAdaptation) => void> = new Set();
  
  constructor() {
    this.startEmotionalMonitoring();
  }
  
  // ============================================================================
  // EMOTIONAL STATE ANALYSIS
  // ============================================================================
  
  analyzeEmotionalState(): EmotionalProfile {
    const stressIndicators = this.calculateStressIndicators();
    const confidenceIndicators = this.calculateConfidenceIndicators();
    // Analyze current context for emotional assessment
    
    // Determine primary emotion based on indicators
    const primaryEmotion = this.determinePrimaryEmotion(stressIndicators, confidenceIndicators);
    
    // Calculate secondary emotions
    const secondaryEmotions = this.determineSecondaryEmotions(stressIndicators, confidenceIndicators);
    
    // Calculate confidence in emotional assessment
    const confidence = this.calculateEmotionalConfidence(stressIndicators, confidenceIndicators);
    
    // Analyze emotional stability
    const stability = this.calculateEmotionalStability();
    
    // Determine trajectory
    const trajectory = this.calculateEmotionalTrajectory();
    
    // Identify triggers
    const triggers = this.identifyEmotionalTriggers(primaryEmotion);
    
    // Calculate duration in current state
    const duration = this.calculateStateDuration(primaryEmotion);
    
    const profile: EmotionalProfile = {
      primaryEmotion,
      secondaryEmotions,
      confidence,
      stability,
      trajectory,
      triggers,
      duration
    };
    
    // Store in history
    this.emotionalHistory.push(profile);
    if (this.emotionalHistory.length > 50) {
      this.emotionalHistory = this.emotionalHistory.slice(-50);
    }
    
    return profile;
  }
  
  private calculateStressIndicators(): StressIndicators {
    // Get recent behavioral data from context detector
    // Analyze behavioral data for stress calculation
    
    // Calculate stress indicators based on behavior patterns
    return {
      rapidClicking: this.calculateRapidClicking(),
      errorRate: this.calculateErrorRate(),
      hesitationLevel: this.calculateHesitationLevel(),
      backtrackingFrequency: this.calculateBacktrackingFrequency(),
      helpSeekingBehavior: this.calculateHelpSeekingBehavior(),
      timeUnderPressure: this.calculateTimeUnderPressure()
    };
  }
  
  private calculateConfidenceIndicators(): ConfidenceIndicators {
    return {
      taskCompletionRate: this.calculateTaskCompletionRate(),
      navigationEfficiency: this.calculateNavigationEfficiency(),
      decisionSpeed: this.calculateDecisionSpeed(),
      expertFeatureUsage: this.calculateExpertFeatureUsage(),
      errorRecoveryRate: this.calculateErrorRecoveryRate()
    };
  }
  
  private determinePrimaryEmotion(stress: StressIndicators, confidence: ConfidenceIndicators): EmotionalState {
    // Weighted scoring for different emotional states
    const scores = {
      stressed: this.calculateStressScore(stress),
      frustrated: this.calculateFrustrationScore(stress),
      confident: this.calculateConfidenceScore(confidence),
      focused: this.calculateFocusScore(stress, confidence),
      uncertain: this.calculateUncertaintyScore(stress, confidence),
      excited: this.calculateExcitementScore(confidence)
    };
    
    // Find highest scoring emotion
    const maxScore = Math.max(...Object.values(scores));
    const primaryEmotion = Object.keys(scores).find(
      key => scores[key as keyof typeof scores] === maxScore
    ) as EmotionalState;
    
    return primaryEmotion || 'confident';
  }
  
  private determineSecondaryEmotions(stress: StressIndicators, confidence: ConfidenceIndicators): EmotionalState[] {
    const scores = {
      stressed: this.calculateStressScore(stress),
      frustrated: this.calculateFrustrationScore(stress),
      confident: this.calculateConfidenceScore(confidence),
      focused: this.calculateFocusScore(stress, confidence),
      uncertain: this.calculateUncertaintyScore(stress, confidence),
      excited: this.calculateExcitementScore(confidence)
    };
    
    // Get emotions with scores above threshold, sorted by score
    return Object.entries(scores)
      .filter(([, score]) => score > 0.3)
      .sort(([, a], [, b]) => b - a)
      .slice(1, 3) // Skip primary emotion, take next 2
      .map(([emotion]) => emotion as EmotionalState);
  }
  
  // ============================================================================
  // EMOTIONAL SCORING ALGORITHMS
  // ============================================================================
  
  private calculateStressScore(stress: StressIndicators): number {
    let score = 0;
    
    // Rapid clicking indicates stress
    if (stress.rapidClicking > 2.0) score += 0.4;
    else if (stress.rapidClicking > 1.5) score += 0.2;
    
    // High error rate indicates stress
    if (stress.errorRate > 0.3) score += 0.3;
    else if (stress.errorRate > 0.2) score += 0.15;
    
    // Time pressure increases stress
    if (stress.timeUnderPressure > 0.7) score += 0.3;
    else if (stress.timeUnderPressure > 0.5) score += 0.15;
    
    return Math.min(score, 1);
  }
  
  private calculateFrustrationScore(stress: StressIndicators): number {
    let score = 0;
    
    // High error rate with backtracking suggests frustration
    if (stress.errorRate > 0.25 && stress.backtrackingFrequency > 0.3) {
      score += 0.5;
    }
    
    // Help seeking after errors suggests frustration
    if (stress.helpSeekingBehavior > 0.3) score += 0.3;
    
    // Repeated hesitation suggests frustration
    if (stress.hesitationLevel > 0.6) score += 0.2;
    
    return Math.min(score, 1);
  }
  
  private calculateConfidenceScore(confidence: ConfidenceIndicators): number {
    let score = 0;
    
    // High completion rate indicates confidence
    if (confidence.taskCompletionRate > 0.8) score += 0.4;
    else if (confidence.taskCompletionRate > 0.6) score += 0.2;
    
    // Efficient navigation indicates confidence
    if (confidence.navigationEfficiency > 0.8) score += 0.3;
    else if (confidence.navigationEfficiency > 0.6) score += 0.15;
    
    // Using expert features indicates confidence
    if (confidence.expertFeatureUsage > 0.5) score += 0.3;
    else if (confidence.expertFeatureUsage > 0.3) score += 0.15;
    
    return Math.min(score, 1);
  }
  
  private calculateFocusScore(stress: StressIndicators, confidence: ConfidenceIndicators): number {
    let score = 0;
    
    // Low backtracking with good completion suggests focus
    if (stress.backtrackingFrequency < 0.2 && confidence.taskCompletionRate > 0.6) {
      score += 0.4;
    }
    
    // Consistent decision speed suggests focus
    if (confidence.decisionSpeed > 0.6 && confidence.decisionSpeed < 0.9) {
      score += 0.3;
    }
    
    // Low help seeking with progress suggests focus
    if (stress.helpSeekingBehavior < 0.2 && confidence.taskCompletionRate > 0.5) {
      score += 0.3;
    }
    
    return Math.min(score, 1);
  }
  
  private calculateUncertaintyScore(stress: StressIndicators, confidence: ConfidenceIndicators): number {
    let score = 0;
    
    // High hesitation suggests uncertainty
    if (stress.hesitationLevel > 0.6) score += 0.4;
    else if (stress.hesitationLevel > 0.4) score += 0.2;
    
    // Help seeking suggests uncertainty
    if (stress.helpSeekingBehavior > 0.4) score += 0.3;
    else if (stress.helpSeekingBehavior > 0.2) score += 0.15;
    
    // Low expert feature usage suggests uncertainty
    if (confidence.expertFeatureUsage < 0.2) score += 0.3;
    
    return Math.min(score, 1);
  }
  
  private calculateExcitementScore(confidence: ConfidenceIndicators): number {
    let score = 0;
    
    // Very high completion rate with fast decisions suggests excitement
    if (confidence.taskCompletionRate > 0.9 && confidence.decisionSpeed > 0.8) {
      score += 0.6;
    }
    
    // Using many expert features suggests excitement/engagement
    if (confidence.expertFeatureUsage > 0.7) score += 0.4;
    
    return Math.min(score, 1);
  }
  
  // ============================================================================
  // BEHAVIORAL METRICS CALCULATION
  // ============================================================================
  
  private calculateRapidClicking(): number {
    // Placeholder - would analyze actual click patterns
    return Math.random() * 3; // 0-3 clicks per second
  }
  
  private calculateErrorRate(): number {
    // Placeholder - would analyze actual error patterns
    return Math.random() * 0.5; // 0-50% error rate
  }
  
  private calculateHesitationLevel(): number {
    // Placeholder - would analyze pause patterns
    return Math.random(); // 0-1 hesitation level
  }
  
  private calculateBacktrackingFrequency(): number {
    // Placeholder - would analyze back/undo patterns
    return Math.random() * 0.5; // 0-50% backtracking rate
  }
  
  private calculateHelpSeekingBehavior(): number {
    // Placeholder - would analyze help usage
    return Math.random() * 0.3; // 0-30% help seeking rate
  }
  
  private calculateTimeUnderPressure(): number {
    // Placeholder - would analyze deadline/urgency indicators
    return Math.random(); // 0-1 pressure level
  }
  
  private calculateTaskCompletionRate(): number {
    // Placeholder - would analyze actual task completions
    return 0.6 + Math.random() * 0.4; // 60-100% completion rate
  }
  
  private calculateNavigationEfficiency(): number {
    // Placeholder - would analyze navigation patterns
    return 0.5 + Math.random() * 0.5; // 50-100% efficiency
  }
  
  private calculateDecisionSpeed(): number {
    // Placeholder - would analyze decision timing
    return Math.random(); // 0-1 decision speed
  }
  
  private calculateExpertFeatureUsage(): number {
    // Placeholder - would analyze advanced feature usage
    return Math.random() * 0.8; // 0-80% expert feature usage
  }
  
  private calculateErrorRecoveryRate(): number {
    // Placeholder - would analyze error recovery
    return 0.7 + Math.random() * 0.3; // 70-100% recovery rate
  }
  
  // ============================================================================
  // EMOTIONAL STATE ANALYSIS
  // ============================================================================
  
  private calculateEmotionalConfidence(stress: StressIndicators, confidence: ConfidenceIndicators): number {
    // Higher confidence when we have clear indicators
    let conf = 0.5;
    
    // Strong stress signals increase confidence in stress detection
    if (stress.rapidClicking > 2 || stress.errorRate > 0.3) conf += 0.2;
    
    // Strong confidence signals increase confidence in confidence detection
    if (confidence.taskCompletionRate > 0.8 && confidence.navigationEfficiency > 0.7) conf += 0.2;
    
    // Clear behavioral patterns increase confidence
    if (stress.hesitationLevel > 0.7 || stress.helpSeekingBehavior > 0.4) conf += 0.1;
    
    return Math.min(conf, 1);
  }
  
  private calculateEmotionalStability(): number {
    if (this.emotionalHistory.length < 3) return 0.5;
    
    // Analyze consistency of recent emotional states
    const recentStates = this.emotionalHistory.slice(-5);
    const primaryEmotions = recentStates.map(state => state.primaryEmotion);
    
    // Count unique emotions in recent history
    const uniqueEmotions = new Set(primaryEmotions).size;
    
    // More unique emotions = less stability
    return Math.max(0, 1 - (uniqueEmotions / 5));
  }
  
  private calculateEmotionalTrajectory(): 'improving' | 'stable' | 'declining' {
    if (this.emotionalHistory.length < 3) return 'stable';
    
    const recentStates = this.emotionalHistory.slice(-3);
    
    // Analyze trajectory based on positive vs negative emotions
    const emotionalScores = recentStates.map(state => {
      const positive = ['confident', 'excited', 'focused'];
      const negative = ['stressed', 'frustrated', 'uncertain'];
      
      if (positive.includes(state.primaryEmotion)) return 1;
      if (negative.includes(state.primaryEmotion)) return -1;
      return 0;
    });
    
    const trend = emotionalScores[2] - emotionalScores[0];
    
    if (trend > 0) return 'improving';
    if (trend < 0) return 'declining';
    return 'stable';
  }
  
  private identifyEmotionalTriggers(emotion: EmotionalState): string[] {
    const triggers: string[] = [];
    
    // Analyze what might have caused this emotional state
    switch (emotion) {
      case 'stressed':
        triggers.push('Time pressure', 'Complex task', 'Multiple errors');
        break;
      case 'frustrated':
        triggers.push('Repeated failures', 'Unclear interface', 'Technical issues');
        break;
      case 'confident':
        triggers.push('Successful completions', 'Familiar workflow', 'Clear progress');
        break;
      case 'focused':
        triggers.push('Engaging task', 'Clear objectives', 'Good flow state');
        break;
      case 'uncertain':
        triggers.push('New feature', 'Complex decision', 'Lack of guidance');
        break;
      case 'excited':
        triggers.push('Major success', 'New discovery', 'Goal achievement');
        break;
    }
    
    return triggers;
  }
  
  private calculateStateDuration(emotion: EmotionalState): number {
    if (this.emotionalHistory.length === 0) return 0;
    
    // Find how long they've been in this emotional state
    let duration = 0;
    for (let i = this.emotionalHistory.length - 1; i >= 0; i--) {
      if (this.emotionalHistory[i].primaryEmotion === emotion) {
        duration += 60000; // Assume 1-minute intervals
      } else {
        break;
      }
    }
    
    return duration;
  }
  
  // ============================================================================
  // SUPPORT RECOMMENDATIONS
  // ============================================================================
  
  generateSupportRecommendations(profile: EmotionalProfile): SupportRecommendation[] {
    const recommendations: SupportRecommendation[] = [];
    
    // Stress-based recommendations
    if (profile.primaryEmotion === 'stressed' || profile.secondaryEmotions.includes('stressed')) {
      recommendations.push({
        type: 'ui_adaptation',
        description: 'Simplify interface to reduce cognitive load',
        implementation: 'Switch to minimal density, hide secondary options',
        priority: 'high',
        trigger: 'High stress indicators detected'
      });
      
      recommendations.push({
        type: 'guidance',
        description: 'Provide step-by-step guidance',
        implementation: 'Show prominent workflow indicators and next steps',
        priority: 'high',
        trigger: 'Stress with task complexity'
      });
    }
    
    // Frustration-based recommendations
    if (profile.primaryEmotion === 'frustrated' || profile.secondaryEmotions.includes('frustrated')) {
      recommendations.push({
        type: 'assistance',
        description: 'Offer immediate help',
        implementation: 'Show contextual help popup or assistance chat',
        priority: 'critical',
        trigger: 'Repeated errors or help-seeking behavior'
      });
      
      recommendations.push({
        type: 'simplification',
        description: 'Simplify current task',
        implementation: 'Break down complex task into smaller steps',
        priority: 'high',
        trigger: 'Frustration with complex workflow'
      });
    }
    
    // Uncertainty-based recommendations
    if (profile.primaryEmotion === 'uncertain' || profile.secondaryEmotions.includes('uncertain')) {
      recommendations.push({
        type: 'guidance',
        description: 'Provide clear guidance and examples',
        implementation: 'Show inline help, examples, and clear next steps',
        priority: 'medium',
        trigger: 'Hesitation and help-seeking patterns'
      });
    }
    
    // Confidence-based recommendations
    if (profile.primaryEmotion === 'confident') {
      recommendations.push({
        type: 'ui_adaptation',
        description: 'Enable advanced features and dense layout',
        implementation: 'Switch to dense mode, show expert options',
        priority: 'low',
        trigger: 'High confidence and task completion'
      });
    }
    
    return recommendations;
  }
  
  // ============================================================================
  // INTERFACE ADAPTATION
  // ============================================================================
  
  generateInterfaceAdaptation(profile: EmotionalProfile): InterfaceAdaptation {
    const adaptation: InterfaceAdaptation = {
      density: 'comfortable',
      guidance: 'subtle',
      confirmations: 'standard',
      helpVisibility: 'subtle',
      colorScheme: 'neutral',
      animations: 'smooth'
    };
    
    // Adapt based on primary emotion
    switch (profile.primaryEmotion) {
      case 'stressed':
        adaptation.density = 'minimal';
        adaptation.guidance = 'prominent';
        adaptation.confirmations = 'verbose';
        adaptation.helpVisibility = 'prominent';
        adaptation.colorScheme = 'calm';
        adaptation.animations = 'subtle';
        break;
        
      case 'frustrated':
        adaptation.density = 'minimal';
        adaptation.guidance = 'step_by_step';
        adaptation.confirmations = 'verbose';
        adaptation.helpVisibility = 'prominent';
        adaptation.colorScheme = 'calm';
        adaptation.animations = 'none';
        break;
        
      case 'confident':
        adaptation.density = 'dense';
        adaptation.guidance = 'none';
        adaptation.confirmations = 'minimal';
        adaptation.helpVisibility = 'hidden';
        adaptation.colorScheme = 'energizing';
        adaptation.animations = 'engaging';
        break;
        
      case 'focused':
        adaptation.density = 'comfortable';
        adaptation.guidance = 'subtle';
        adaptation.confirmations = 'minimal';
        adaptation.helpVisibility = 'hidden';
        adaptation.colorScheme = 'neutral';
        adaptation.animations = 'subtle';
        break;
        
      case 'uncertain':
        adaptation.density = 'comfortable';
        adaptation.guidance = 'prominent';
        adaptation.confirmations = 'standard';
        adaptation.helpVisibility = 'prominent';
        adaptation.colorScheme = 'calm';
        adaptation.animations = 'smooth';
        break;
        
      case 'excited':
        adaptation.density = 'comfortable';
        adaptation.guidance = 'subtle';
        adaptation.confirmations = 'minimal';
        adaptation.helpVisibility = 'subtle';
        adaptation.colorScheme = 'energizing';
        adaptation.animations = 'engaging';
        break;
    }
    
    return adaptation;
  }
  
  // ============================================================================
  // MONITORING AND EVENTS
  // ============================================================================
  
  private startEmotionalMonitoring(): void {
    // Analyze emotional state every 30 seconds
    setInterval(() => {
      const profile = this.analyzeEmotionalState();
      const adaptation = this.generateInterfaceAdaptation(profile);
      
      // Notify listeners of adaptation changes
      this.notifyAdaptationListeners(adaptation);
      
      // Update context engine with emotional state
      contextEngine.updateContext({
        emotion: profile.primaryEmotion,
        confidenceLevel: Math.round(profile.confidence * 100)
      });
      
    }, 30000); // Every 30 seconds
  }
  
  subscribeToAdaptations(listener: (adaptation: InterfaceAdaptation) => void): () => void {
    this.adaptationListeners.add(listener);
    return () => this.adaptationListeners.delete(listener);
  }
  
  private notifyAdaptationListeners(adaptation: InterfaceAdaptation): void {
    this.adaptationListeners.forEach(listener => listener(adaptation));
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  getCurrentEmotionalProfile(): EmotionalProfile | null {
    return this.emotionalHistory.length > 0 ? 
           this.emotionalHistory[this.emotionalHistory.length - 1] : null;
  }
  
  getEmotionalHistory(): EmotionalProfile[] {
    return [...this.emotionalHistory];
  }
  
  isUserStressed(): boolean {
    const profile = this.getCurrentEmotionalProfile();
    return profile ? 
           (profile.primaryEmotion === 'stressed' || 
            profile.secondaryEmotions.includes('stressed')) : false;
  }
  
  isUserConfident(): boolean {
    const profile = this.getCurrentEmotionalProfile();
    return profile ? 
           (profile.primaryEmotion === 'confident' || 
            profile.secondaryEmotions.includes('confident')) : false;
  }
  
  needsHelp(): boolean {
    const profile = this.getCurrentEmotionalProfile();
    return profile ? 
           (profile.primaryEmotion === 'frustrated' || 
            profile.primaryEmotion === 'uncertain' ||
            profile.secondaryEmotions.includes('frustrated') ||
            profile.secondaryEmotions.includes('uncertain')) : false;
  }
  
  // Force a specific emotional state (for testing)
  forceEmotionalState(emotion: EmotionalState): void {
    const mockProfile: EmotionalProfile = {
      primaryEmotion: emotion,
      secondaryEmotions: [],
      confidence: 0.8,
      stability: 0.7,
      trajectory: 'stable',
      triggers: ['Manual override'],
      duration: 0
    };
    
    this.emotionalHistory.push(mockProfile);
    
    const adaptation = this.generateInterfaceAdaptation(mockProfile);
    this.notifyAdaptationListeners(adaptation);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const emotionalIntelligence = new EmotionalIntelligenceEngine();