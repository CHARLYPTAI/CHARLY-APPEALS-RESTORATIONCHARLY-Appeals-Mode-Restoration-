/**
 * 🍎 CHARLY 2.0 - SEARCH ANALYTICS ENGINE
 * 
 * Advanced analytics and optimization for search patterns, user behavior,
 * and interface effectiveness. Drives continuous improvement of search intelligence.
 */

import { AttorneyContext, AttorneyIntent } from './ContextEngine';
import { SearchQuery } from './SearchDrivenInterface';

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface SearchSession {
  id: string;
  startTime: number;
  endTime?: number;
  queries: SearchQuery[];
  context: AttorneyContext;
  outcomes: SessionOutcome[];
  satisfaction?: number; // 1-5 rating
  efficiency: number; // Time to complete vs average
}

export interface SessionOutcome {
  type: 'property_selected' | 'appeal_created' | 'filing_submitted' | 'analysis_completed' | 'session_abandoned';
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface SearchMetrics {
  totalQueries: number;
  uniqueQueries: number;
  averageConfidence: number;
  topContexts: Array<{ context: AttorneyContext; count: number; percentage: number }>;
  topIntents: Array<{ intent: AttorneyIntent; count: number; percentage: number }>;
  successRate: number;
  averageSessionLength: number;
  queryComplexity: number;
  voiceUsageRate: number;
}

export interface OptimizationInsight {
  id: string;
  type: 'performance' | 'usability' | 'accuracy' | 'efficiency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  confidence: number;
  evidence: string[];
}

export interface UserBehaviorPattern {
  id: string;
  name: string;
  description: string;
  frequency: number;
  contexts: AttorneyContext[];
  triggers: string[];
  outcomes: string[];
  confidence: number;
}

// ============================================================================
// SEARCH ANALYTICS ENGINE
// ============================================================================

export class SearchAnalyticsEngine {
  private sessions: Map<string, SearchSession> = new Map();
  private currentSession: SearchSession | null = null;
  private metrics: SearchMetrics | null = null;
  private patterns: UserBehaviorPattern[] = [];
  private insights: OptimizationInsight[] = [];
  
  constructor() {
    this.loadStoredData();
    this.startNewSession();
  }
  
  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('charly_search_analytics');
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = new Map(data.sessions || []);
        this.patterns = data.patterns || [];
        this.insights = data.insights || [];
      }
    } catch (error) {
      console.warn('Failed to load search analytics:', error);
    }
  }
  
  private saveData(): void {
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        patterns: this.patterns,
        insights: this.insights
      };
      localStorage.setItem('charly_search_analytics', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save search analytics:', error);
    }
  }
  
  public startNewSession(): void {
    // End current session if exists
    if (this.currentSession) {
      this.endSession();
    }
    
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      queries: [],
      context: 'discovery',
      outcomes: [],
      efficiency: 1.0
    };
  }
  
  public endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.sessions.set(this.currentSession.id, this.currentSession);
      this.saveData();
      this.analyzeSession(this.currentSession);
      this.currentSession = null;
    }
  }
  
  public recordQuery(query: SearchQuery): void {
    if (this.currentSession) {
      this.currentSession.queries.push(query);
      
      // Update session context based on latest query
      this.currentSession.context = query.context || this.currentSession.context;
      
      // Save incrementally
      this.saveData();
    }
  }
  
  public recordOutcome(outcome: SessionOutcome): void {
    if (this.currentSession) {
      this.currentSession.outcomes.push(outcome);
      this.saveData();
    }
  }
  
  public recordSatisfaction(rating: number): void {
    if (this.currentSession) {
      this.currentSession.satisfaction = Math.max(1, Math.min(5, rating));
      this.saveData();
    }
  }
  
  private analyzeSession(session: SearchSession): void {
    // Calculate efficiency
    const avgSessionTime = this.getAverageSessionTime(session.context);
    const sessionDuration = (session.endTime || Date.now()) - session.startTime;
    session.efficiency = avgSessionTime > 0 ? avgSessionTime / sessionDuration : 1.0;
    
    // Update patterns
    this.updateBehaviorPatterns(session);
    
    // Generate insights
    this.generateInsights();
  }
  
  private getAverageSessionTime(context: AttorneyContext): number {
    const contextSessions = Array.from(this.sessions.values())
      .filter(s => s.context === context && s.endTime);
    
    if (contextSessions.length === 0) return 0;
    
    const totalTime = contextSessions.reduce((sum, s) => 
      sum + (s.endTime! - s.startTime), 0
    );
    
    return totalTime / contextSessions.length;
  }
  
  private updateBehaviorPatterns(session: SearchSession): void {
    // Analyze query sequences
    const querySequence = session.queries.map(q => `${q.context}_${q.intent}`);
    
    // Look for common patterns
    if (querySequence.length >= 3) {
      const patternKey = querySequence.join('->');
      let pattern = this.patterns.find(p => p.id === patternKey);
      
      if (!pattern) {
        pattern = {
          id: patternKey,
          name: `${session.context} workflow pattern`,
          description: `Common sequence: ${querySequence.slice(0, 3).join(' → ')}`,
          frequency: 0,
          contexts: [session.context],
          triggers: session.queries.slice(0, 1).map(q => q.query),
          outcomes: session.outcomes.map(o => o.type),
          confidence: 0.5
        };
        this.patterns.push(pattern);
      }
      
      pattern.frequency += 1;
      pattern.confidence = Math.min(1.0, pattern.confidence + 0.1);
    }
  }
  
  private generateInsights(): void {
    const recentSessions = this.getRecentSessions(7); // Last 7 days
    
    // Low confidence queries insight
    const lowConfidenceQueries = recentSessions.flatMap(s => s.queries)
      .filter(q => q.confidence && q.confidence < 0.6);
    
    if (lowConfidenceQueries.length > 10) {
      this.addInsight({
        id: 'low_confidence_queries',
        type: 'accuracy',
        priority: 'medium',
        title: 'Search Understanding Needs Improvement',
        description: `${lowConfidenceQueries.length} queries had low confidence scores`,
        impact: 'Users may not find what they need quickly',
        recommendation: 'Improve natural language processing patterns',
        confidence: 0.8,
        evidence: lowConfidenceQueries.slice(0, 5).map(q => q.query)
      });
    }
    
    // Session abandonment insight
    const abandonedSessions = recentSessions.filter(s => 
      s.outcomes.length === 0 && s.queries.length > 2
    );
    
    if (abandonedSessions.length > 5) {
      this.addInsight({
        id: 'session_abandonment',
        type: 'usability',
        priority: 'high',
        title: 'High Session Abandonment Rate',
        description: `${abandonedSessions.length} sessions were abandoned without completion`,
        impact: 'Users are not achieving their goals',
        recommendation: 'Review user journey and reduce friction points',
        confidence: 0.9,
        evidence: [`${abandonedSessions.length} abandoned sessions in last 7 days`]
      });
    }
    
    // Voice usage insight
    const voiceQueries = recentSessions.flatMap(s => s.queries)
      .filter(q => q.query.includes('[voice]')); // Assuming voice queries are marked
    
    const totalQueries = recentSessions.flatMap(s => s.queries).length;
    const voiceUsageRate = totalQueries > 0 ? voiceQueries.length / totalQueries : 0;
    
    if (voiceUsageRate < 0.1 && totalQueries > 50) {
      this.addInsight({
        id: 'low_voice_usage',
        type: 'efficiency',
        priority: 'low',
        title: 'Voice Search Underutilized',
        description: `Only ${(voiceUsageRate * 100).toFixed(1)}% of queries use voice`,
        impact: 'Users missing out on hands-free efficiency',
        recommendation: 'Promote voice search features more prominently',
        confidence: 0.7,
        evidence: [`Voice usage: ${voiceUsageRate * 100}%`]
      });
    }
    
    // Performance insight
    const slowSessions = recentSessions.filter(s => s.efficiency < 0.5);
    if (slowSessions.length > 3) {
      this.addInsight({
        id: 'slow_sessions',
        type: 'performance',
        priority: 'medium',
        title: 'Session Efficiency Below Average',
        description: `${slowSessions.length} sessions took longer than average`,
        impact: 'Users spending more time than necessary',
        recommendation: 'Optimize search results and suggestions',
        confidence: 0.8,
        evidence: [`${slowSessions.length} slow sessions detected`]
      });
    }
  }
  
  private addInsight(insight: OptimizationInsight): void {
    // Remove existing insight with same ID
    this.insights = this.insights.filter(i => i.id !== insight.id);
    this.insights.push(insight);
    
    // Keep only top 10 insights
    this.insights.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
    
    if (this.insights.length > 10) {
      this.insights = this.insights.slice(0, 10);
    }
  }
  
  private getRecentSessions(days: number): SearchSession[] {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return Array.from(this.sessions.values())
      .filter(s => s.startTime > cutoff);
  }
  
  public getMetrics(): SearchMetrics {
    const allSessions = Array.from(this.sessions.values());
    const allQueries = allSessions.flatMap(s => s.queries);
    
    if (allQueries.length === 0) {
      return {
        totalQueries: 0,
        uniqueQueries: 0,
        averageConfidence: 0,
        topContexts: [],
        topIntents: [],
        successRate: 0,
        averageSessionLength: 0,
        queryComplexity: 0,
        voiceUsageRate: 0
      };
    }
    
    // Calculate context distribution
    const contextCounts = new Map<AttorneyContext, number>();
    allQueries.forEach(q => {
      if (q.context) {
        contextCounts.set(q.context, (contextCounts.get(q.context) || 0) + 1);
      }
    });
    
    const topContexts = Array.from(contextCounts.entries())
      .map(([context, count]) => ({
        context,
        count,
        percentage: (count / allQueries.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate intent distribution
    const intentCounts = new Map<AttorneyIntent, number>();
    allQueries.forEach(q => {
      if (q.intent) {
        intentCounts.set(q.intent, (intentCounts.get(q.intent) || 0) + 1);
      }
    });
    
    const topIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({
        intent,
        count,
        percentage: (count / allQueries.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate success rate
    const successfulSessions = allSessions.filter(s => s.outcomes.length > 0);
    const successRate = allSessions.length > 0 ? successfulSessions.length / allSessions.length : 0;
    
    // Calculate other metrics
    const uniqueQueries = new Set(allQueries.map(q => q.query.toLowerCase())).size;
    const averageConfidence = allQueries.reduce((sum, q) => sum + (q.confidence || 0), 0) / allQueries.length;
    const averageSessionLength = allSessions.length > 0 ? 
      allSessions.reduce((sum, s) => sum + s.queries.length, 0) / allSessions.length : 0;
    
    const queryComplexity = allQueries.reduce((sum, q) => 
      sum + q.query.trim().split(/\s+/).length, 0
    ) / allQueries.length;
    
    const voiceQueries = allQueries.filter(q => q.query.includes('[voice]')).length;
    const voiceUsageRate = voiceQueries / allQueries.length;
    
    this.metrics = {
      totalQueries: allQueries.length,
      uniqueQueries,
      averageConfidence,
      topContexts,
      topIntents,
      successRate,
      averageSessionLength,
      queryComplexity,
      voiceUsageRate
    };
    
    return this.metrics;
  }
  
  public getInsights(): OptimizationInsight[] {
    return [...this.insights];
  }
  
  public getBehaviorPatterns(): UserBehaviorPattern[] {
    return [...this.patterns].sort((a, b) => b.frequency - a.frequency);
  }
  
  public getCurrentSession(): SearchSession | null {
    return this.currentSession;
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public exportData(): {
    sessions: SearchSession[];
    metrics: SearchMetrics;
    insights: OptimizationInsight[];
    patterns: UserBehaviorPattern[];
  } {
    return {
      sessions: Array.from(this.sessions.values()),
      metrics: this.getMetrics(),
      insights: this.getInsights(),
      patterns: this.getBehaviorPatterns()
    };
  }
}

// Export singleton instance
export const searchAnalyticsEngine = new SearchAnalyticsEngine();