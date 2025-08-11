/**
 * CHARLY 2.0 - User Behavior Analytics Engine
 * Advanced tracking system for user interactions, patterns, and success metrics
 */

interface UserAction {
  id: string;
  userId: string;
  action: string;
  component: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  metadata: Record<string, unknown>;
  sessionId: string;
  userAgent: string;
  pathway: string[];
}

interface UserSession {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  actions: UserAction[];
  outcome: 'completed' | 'abandoned' | 'error' | 'timeout';
  totalInteractions: number;
  uniqueComponents: string[];
  conversionEvents: string[];
}

interface BehaviorPattern {
  patternId: string;
  name: string;
  frequency: number;
  averageDuration: number;
  successRate: number;
  commonPathways: string[][];
  userSegments: string[];
  correlatedOutcomes: string[];
}

interface UserSegment {
  segmentId: string;
  name: string;
  criteria: Record<string, unknown>;
  userCount: number;
  behaviorMetrics: {
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
    featureAdoption: Record<string, number>;
    satisfactionScore: number;
  };
}

// Performance metric interface for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _PerformanceMetric {
  metric: string;
  value: number;
  timestamp: number;
  context: Record<string, unknown>;
  trend: 'increasing' | 'decreasing' | 'stable';
  benchmarkComparison: number;
}

class UserBehaviorAnalytics {
  private actions: UserAction[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private patterns: BehaviorPattern[] = [];
  private segments: UserSegment[] = [];
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private isTracking: boolean = true;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds

  constructor() {
    this.initializeTracking();
    this.setupEventListeners();
    this.startPeriodicFlush();
  }

  private initializeTracking(): void {
    // Initialize user segments
    this.segments = [
      {
        segmentId: 'power-users',
        name: 'Power Users',
        criteria: { actionsPerSession: '>= 20', successRate: '>= 0.9' },
        userCount: 0,
        behaviorMetrics: {
          avgSessionDuration: 0,
          bounceRate: 0,
          conversionRate: 0,
          featureAdoption: {},
          satisfactionScore: 0
        }
      },
      {
        segmentId: 'new-users',
        name: 'New Users',
        criteria: { sessionCount: '<= 3', registrationDate: 'last_7_days' },
        userCount: 0,
        behaviorMetrics: {
          avgSessionDuration: 0,
          bounceRate: 0,
          conversionRate: 0,
          featureAdoption: {},
          satisfactionScore: 0
        }
      },
      {
        segmentId: 'struggling-users',
        name: 'Struggling Users',
        criteria: { successRate: '<= 0.7', errorCount: '>= 5' },
        userCount: 0,
        behaviorMetrics: {
          avgSessionDuration: 0,
          bounceRate: 0,
          conversionRate: 0,
          featureAdoption: {},
          satisfactionScore: 0
        }
      }
    ];

    // Initialize behavior patterns
    this.patterns = [
      {
        patternId: 'efficient-analysis',
        name: 'Efficient Property Analysis',
        frequency: 0,
        averageDuration: 0,
        successRate: 0,
        commonPathways: [],
        userSegments: [],
        correlatedOutcomes: []
      },
      {
        patternId: 'exploration-heavy',
        name: 'Exploration Heavy Users',
        frequency: 0,
        averageDuration: 0,
        successRate: 0,
        commonPathways: [],
        userSegments: [],
        correlatedOutcomes: []
      },
      {
        patternId: 'goal-oriented',
        name: 'Goal-Oriented Workflow',
        frequency: 0,
        averageDuration: 0,
        successRate: 0,
        commonPathways: [],
        userSegments: [],
        correlatedOutcomes: []
      }
    ];
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.trackAction({
          action: document.hidden ? 'page_hidden' : 'page_visible',
          component: 'browser',
          success: true,
          metadata: { visibility: document.hidden ? 'hidden' : 'visible' }
        });
      });

      // Track user interactions
      document.addEventListener('click', this.handleClick.bind(this));
      document.addEventListener('keydown', this.handleKeydown.bind(this));
      
      // Track errors
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const component = this.getComponentName(target);
    
    this.trackAction({
      action: 'click',
      component,
      success: true,
      metadata: {
        tagName: target.tagName,
        className: target.className,
        textContent: target.textContent?.slice(0, 100),
        position: { x: event.clientX, y: event.clientY }
      }
    });
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Track significant keyboard interactions
    if (event.key === 'Enter' || event.key === 'Escape' || event.ctrlKey || event.metaKey) {
      const target = event.target as HTMLElement;
      const component = this.getComponentName(target);
      
      this.trackAction({
        action: 'keyboard',
        component,
        success: true,
        metadata: {
          key: event.key,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey
        }
      });
    }
  }

  private handleError(event: ErrorEvent): void {
    this.trackAction({
      action: 'error',
      component: 'javascript',
      success: false,
      metadata: {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error?.toString()
      }
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.trackAction({
      action: 'unhandled_promise_rejection',
      component: 'javascript',
      success: false,
      metadata: {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      }
    });
  }

  private getComponentName(element: HTMLElement): string {
    // Try to identify component from data attributes
    if (element.dataset.component) {
      return element.dataset.component;
    }
    
    // Try to identify from class names
    const className = element.className;
    if (typeof className === 'string') {
      const componentMatch = className.match(/([A-Z][a-zA-Z]+)/);
      if (componentMatch) {
        return componentMatch[1];
      }
    }
    
    // Fall back to tag name
    return element.tagName.toLowerCase();
  }

  public trackAction(actionData: Partial<UserAction>): void {
    if (!this.isTracking) return;

    const action: UserAction = {
      id: this.generateId(),
      userId: this.getCurrentUserId(),
      sessionId: this.getCurrentSessionId(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      pathway: this.getCurrentPathway(),
      action: actionData.action || 'unknown',
      component: actionData.component || 'unknown',
      success: actionData.success ?? true,
      metadata: actionData.metadata || {},
      ...actionData
    };

    this.actions.push(action);
    this.updateSession(action);
    this.analyzePatterns();

    // Emit event for real-time listeners
    this.emit('action_tracked', action);

    // Auto-flush if batch size reached
    if (this.actions.length >= this.batchSize) {
      this.flush();
    }
  }

  public trackPageView(page: string, metadata: Record<string, unknown> = {}): void {
    this.trackAction({
      action: 'page_view',
      component: 'router',
      metadata: { page, ...metadata }
    });
  }

  public trackFeatureUsage(feature: string, metadata: Record<string, unknown> = {}): void {
    this.trackAction({
      action: 'feature_usage',
      component: feature,
      metadata
    });
  }

  public trackConversion(event: string, value?: number, metadata: Record<string, unknown> = {}): void {
    this.trackAction({
      action: 'conversion',
      component: 'business',
      metadata: { event, value, ...metadata }
    });
  }

  public trackPerformance(metric: string, value: number, context: Record<string, unknown> = {}): void {
    this.trackAction({
      action: 'performance_metric',
      component: 'system',
      metadata: { metric, value, context }
    });
  }

  private updateSession(action: UserAction): void {
    let session = this.sessions.get(action.sessionId);
    
    if (!session) {
      session = {
        sessionId: action.sessionId,
        userId: action.userId,
        startTime: action.timestamp,
        actions: [],
        outcome: 'completed',
        totalInteractions: 0,
        uniqueComponents: [],
        conversionEvents: []
      };
      this.sessions.set(action.sessionId, session);
    }

    session.actions.push(action);
    session.totalInteractions++;
    session.endTime = action.timestamp;

    // Track unique components
    if (!session.uniqueComponents.includes(action.component)) {
      session.uniqueComponents.push(action.component);
    }

    // Track conversion events
    if (action.action === 'conversion') {
      session.conversionEvents.push(action.metadata.event);
    }

    // Update outcome based on actions
    if (!action.success && action.action === 'error') {
      session.outcome = 'error';
    } else if (action.action === 'page_view' && action.metadata.page === 'exit') {
      session.outcome = 'abandoned';
    }
  }

  private analyzePatterns(): void {
    // Analyze recent actions for patterns
    const recentActions = this.actions.slice(-100);
    
    // Update pattern frequencies and metrics
    this.patterns.forEach(pattern => {
      const matchingActions = this.getPatternMatches(pattern, recentActions);
      pattern.frequency = matchingActions.length;
      
      if (matchingActions.length > 0) {
        pattern.averageDuration = matchingActions.reduce((sum, action) => 
          sum + (action.duration || 0), 0) / matchingActions.length;
        pattern.successRate = matchingActions.filter(a => a.success).length / matchingActions.length;
      }
    });

    // Update user segments
    this.updateUserSegments();
  }

  private getPatternMatches(pattern: BehaviorPattern, actions: UserAction[]): UserAction[] {
    // Simplified pattern matching - in production, this would be more sophisticated
    switch (pattern.patternId) {
      case 'efficient-analysis':
        return actions.filter(a => 
          a.component === 'PropertyAnalysis' && 
          (a.duration || 0) < 300000 && // Less than 5 minutes
          a.success
        );
      case 'exploration-heavy':
        return actions.filter(a => 
          a.action === 'page_view' && 
          this.getUniqueComponentsInSession(a.sessionId) > 5
        );
      case 'goal-oriented':
        return actions.filter(a => 
          a.action === 'conversion' && 
          this.getSessionDuration(a.sessionId) < 600000 // Less than 10 minutes
        );
      default:
        return [];
    }
  }

  private getUniqueComponentsInSession(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session?.uniqueComponents.length || 0;
  }

  private getSessionDuration(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session || !session.endTime) return 0;
    return session.endTime - session.startTime;
  }

  private updateUserSegments(): void {
    this.segments.forEach(segment => {
      const matchingUsers = this.getUsersMatchingCriteria(segment.criteria);
      segment.userCount = matchingUsers.length;
      
      if (matchingUsers.length > 0) {
        segment.behaviorMetrics = this.calculateSegmentMetrics(matchingUsers);
      }
    });
  }

  private getUsersMatchingCriteria(criteria: Record<string, unknown>): string[] {
    // Simplified criteria matching
    const userStats = this.calculateUserStats();
    return Object.keys(userStats).filter(userId => {
      const stats = userStats[userId];
      return this.matchesCriteria(stats, criteria);
    });
  }

  private matchesCriteria(stats: Record<string, unknown>, criteria: Record<string, unknown>): boolean {
    // Simplified criteria evaluation
    for (const [key, value] of Object.entries(criteria)) {
      if (typeof value === 'string' && value.includes('>=')) {
        const threshold = parseFloat(value.split('>=')[1].trim());
        if (stats[key] < threshold) return false;
      } else if (typeof value === 'string' && value.includes('<=')) {
        const threshold = parseFloat(value.split('<=')[1].trim());
        if (stats[key] > threshold) return false;
      }
    }
    return true;
  }

  private calculateUserStats(): Record<string, unknown> {
    const stats: Record<string, unknown> = {};
    
    this.sessions.forEach(session => {
      if (!stats[session.userId]) {
        stats[session.userId] = {
          sessionCount: 0,
          totalActions: 0,
          successRate: 0,
          avgSessionDuration: 0
        };
      }
      
      const userStats = stats[session.userId];
      userStats.sessionCount++;
      userStats.totalActions += session.totalInteractions;
      
      const successfulActions = session.actions.filter(a => a.success).length;
      userStats.successRate = (userStats.successRate + (successfulActions / session.actions.length)) / userStats.sessionCount;
      
      const sessionDuration = session.endTime ? session.endTime - session.startTime : 0;
      userStats.avgSessionDuration = (userStats.avgSessionDuration + sessionDuration) / userStats.sessionCount;
    });
    
    return stats;
  }

  private calculateSegmentMetrics(userIds: string[]): Record<string, unknown> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => userIds.includes(session.userId));
    
    if (userSessions.length === 0) {
      return {
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        featureAdoption: {},
        satisfactionScore: 0
      };
    }

    const avgSessionDuration = userSessions.reduce((sum, session) => 
      sum + (session.endTime ? session.endTime - session.startTime : 0), 0) / userSessions.length;
    
    const bounceRate = userSessions.filter(session => 
      session.totalInteractions <= 1).length / userSessions.length;
    
    const conversionRate = userSessions.filter(session => 
      session.conversionEvents.length > 0).length / userSessions.length;
    
    const featureAdoption: Record<string, number> = {};
    userSessions.forEach(session => {
      session.uniqueComponents.forEach(component => {
        featureAdoption[component] = (featureAdoption[component] || 0) + 1;
      });
    });
    
    // Normalize feature adoption
    Object.keys(featureAdoption).forEach(feature => {
      featureAdoption[feature] = featureAdoption[feature] / userSessions.length;
    });

    return {
      avgSessionDuration,
      bounceRate,
      conversionRate,
      featureAdoption,
      satisfactionScore: Math.min(95, 60 + (conversionRate * 40)) // Simplified calculation
    };
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  public async flush(): Promise<void> {
    if (this.actions.length === 0) return;

    const actionsToFlush = [...this.actions];
    this.actions = [];

    try {
      // In production, send to analytics service
      await this.sendToAnalyticsService(actionsToFlush);
      this.emit('flush_complete', { actionCount: actionsToFlush.length });
    } catch (error) {
      // Re-add actions if flush failed
      this.actions.unshift(...actionsToFlush);
      this.emit('flush_error', error);
    }
  }

  private async sendToAnalyticsService(actions: UserAction[]): Promise<void> {
    // Simulated API call - in production, this would be a real endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Flushed ${actions.length} analytics actions to service`);
        resolve();
      }, 100);
    });
  }

  private generateId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string {
    // In production, get from authentication system
    return localStorage.getItem('charly_user_id') || 'anonymous';
  }

  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('charly_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('charly_session_id', sessionId);
    }
    return sessionId;
  }

  private getCurrentPathway(): string[] {
    // Track user's navigation pathway
    const pathway = sessionStorage.getItem('charly_pathway');
    return pathway ? JSON.parse(pathway) : [];
  }

  public on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: (...args: unknown[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  public getMetrics(): {
    totalActions: number;
    activeSessions: number;
    patterns: BehaviorPattern[];
    segments: UserSegment[];
    recentActivity: UserAction[];
  } {
    return {
      totalActions: this.actions.length,
      activeSessions: this.sessions.size,
      patterns: this.patterns,
      segments: this.segments,
      recentActivity: this.actions.slice(-20)
    };
  }

  public getUserJourney(userId: string): UserAction[] {
    return this.actions
      .filter(action => action.userId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public getSessionAnalysis(sessionId: string): UserSession | null {
    return this.sessions.get(sessionId) || null;
  }

  public startTracking(): void {
    this.isTracking = true;
  }

  public stopTracking(): void {
    this.isTracking = false;
  }

  public clearData(): void {
    this.actions = [];
    this.sessions.clear();
    this.patterns.forEach(pattern => {
      pattern.frequency = 0;
      pattern.averageDuration = 0;
      pattern.successRate = 0;
    });
  }
}

// Singleton instance
export const userBehaviorAnalytics = new UserBehaviorAnalytics();
export default UserBehaviorAnalytics;