/**
 * CHARLY 2.0 - Security Monitoring and Audit Logging System
 * Enterprise-grade security event monitoring, threat detection, and compliance logging
 */

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 
    | 'authentication' 
    | 'authorization' 
    | 'data_access' 
    | 'data_modification' 
    | 'configuration_change' 
    | 'security_incident' 
    | 'user_management' 
    | 'system_event';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  outcome: 'success' | 'failure' | 'pending';
  details: Record<string, unknown>;
  riskScore: number;
  correlationId?: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  deviceFingerprint?: string;
  complianceRelevant: boolean;
  retentionCategory: 'short' | 'medium' | 'long' | 'permanent';
}

interface SecurityAlert {
  id: string;
  type: 'anomaly' | 'threshold_breach' | 'pattern_match' | 'compliance_violation' | 'critical_event';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  sourceEvents: string[]; // AuditEvent IDs
  affectedUsers: string[];
  affectedResources: string[];
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  metadata: Record<string, unknown>;
}

interface SecurityMetrics {
  timestamp: Date;
  loginAttempts: {
    successful: number;
    failed: number;
    mfaRequired: number;
    fromNewLocations: number;
  };
  accessPatterns: {
    totalRequests: number;
    uniqueUsers: number;
    privilegedActions: number;
    afterHoursActivity: number;
  };
  threatIndicators: {
    blockedIPs: number;
    suspiciousPatterns: number;
    rateLimitHits: number;
    injectionAttempts: number;
  };
  dataAccess: {
    sensitiveDataViews: number;
    dataExports: number;
    dataModifications: number;
    bulkOperations: number;
  };
  systemHealth: {
    activeUsers: number;
    activeSessions: number;
    errorRate: number;
    averageResponseTime: number;
  };
}

interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  eventTypes: string[];
  conditions: MonitoringCondition[];
  actions: MonitoringAction[];
  threshold?: {
    count: number;
    timeWindow: number; // milliseconds
  };
  cooldownPeriod?: number; // milliseconds
  lastTriggered?: Date;
  triggerCount: number;
}

interface MonitoringCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex';
  value: unknown;
  caseSensitive?: boolean;
}

interface MonitoringAction {
  type: 'alert' | 'block_user' | 'block_ip' | 'notify' | 'log' | 'webhook';
  parameters: Record<string, unknown>;
}

interface ComplianceReport {
  id: string;
  type: 'soc2' | 'gdpr' | 'hipaa' | 'pci_dss' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  events: AuditEvent[];
  summary: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    securityIncidents: number;
    dataAccessEvents: number;
    complianceViolations: SecurityAlert[];
  };
  generatedAt: Date;
  generatedBy: string;
}

class SecurityMonitor {
  private auditLog: AuditEvent[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private monitoringRules: Map<string, MonitoringRule> = new Map();
  private metrics: SecurityMetrics[] = [];
  private realTimeSubscribers: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private eventQueue: AuditEvent[] = [];
  private isProcessing = false;
  private retentionPolicies: Map<string, number> = new Map(); // category -> days

  constructor() {
    this.initializeRetentionPolicies();
    this.initializeDefaultRules();
    this.startEventProcessor();
    this.startMetricsCollection();
    this.setupCleanupTasks();
  }

  private initializeRetentionPolicies(): void {
    this.retentionPolicies.set('short', 30);     // 30 days
    this.retentionPolicies.set('medium', 365);   // 1 year
    this.retentionPolicies.set('long', 2555);    // 7 years
    this.retentionPolicies.set('permanent', -1); // Never delete
  }

  private initializeDefaultRules(): void {
    // Failed login attempts
    this.addMonitoringRule({
      id: 'failed_login_attempts',
      name: 'Multiple Failed Login Attempts',
      description: 'Detect potential brute force attacks',
      enabled: true,
      eventTypes: ['authentication'],
      conditions: [
        { field: 'action', operator: 'equals', value: 'login' },
        { field: 'outcome', operator: 'equals', value: 'failure' }
      ],
      threshold: {
        count: 5,
        timeWindow: 15 * 60 * 1000 // 15 minutes
      },
      actions: [
        { type: 'alert', parameters: { severity: 'high' } },
        { type: 'block_ip', parameters: { duration: 60 * 60 * 1000 } } // 1 hour
      ],
      triggerCount: 0
    });

    // Privileged access outside business hours
    this.addMonitoringRule({
      id: 'after_hours_admin',
      name: 'After Hours Administrative Access',
      description: 'Monitor administrative actions outside business hours',
      enabled: true,
      eventTypes: ['authorization', 'user_management', 'configuration_change'],
      conditions: [
        { field: 'riskScore', operator: 'greater_than', value: 50 }
      ],
      actions: [
        { type: 'alert', parameters: { severity: 'medium' } },
        { type: 'notify', parameters: { recipients: ['security@charly.com'] } }
      ],
      triggerCount: 0
    });

    // Bulk data export
    this.addMonitoringRule({
      id: 'bulk_data_export',
      name: 'Bulk Data Export',
      description: 'Monitor large data exports',
      enabled: true,
      eventTypes: ['data_access'],
      conditions: [
        { field: 'action', operator: 'equals', value: 'export' },
        { field: 'details.recordCount', operator: 'greater_than', value: 1000 }
      ],
      actions: [
        { type: 'alert', parameters: { severity: 'medium' } },
        { type: 'log', parameters: { level: 'warning' } }
      ],
      triggerCount: 0
    });

    // Sensitive data access from new location
    this.addMonitoringRule({
      id: 'new_location_sensitive_access',
      name: 'Sensitive Data Access from New Location',
      description: 'Detect access to sensitive data from unfamiliar locations',
      enabled: true,
      eventTypes: ['data_access'],
      conditions: [
        { field: 'resource', operator: 'contains', value: 'sensitive' },
        { field: 'details.newLocation', operator: 'equals', value: true }
      ],
      actions: [
        { type: 'alert', parameters: { severity: 'high' } },
        { type: 'notify', parameters: { method: 'email_and_sms' } }
      ],
      triggerCount: 0
    });

    // Configuration changes
    this.addMonitoringRule({
      id: 'critical_config_change',
      name: 'Critical Configuration Changes',
      description: 'Monitor changes to security-critical configurations',
      enabled: true,
      eventTypes: ['configuration_change'],
      conditions: [
        { field: 'resource', operator: 'regex', value: '(security|auth|permission|role)' }
      ],
      actions: [
        { type: 'alert', parameters: { severity: 'critical' } },
        { type: 'notify', parameters: { immediate: true } }
      ],
      triggerCount: 0
    });
  }

  // Event Logging
  public async logEvent(eventData: Partial<AuditEvent>): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      eventType: eventData.eventType || 'system_event',
      severity: eventData.severity || 'info',
      userId: eventData.userId,
      sessionId: eventData.sessionId,
      ipAddress: eventData.ipAddress || 'unknown',
      userAgent: eventData.userAgent || 'unknown',
      resource: eventData.resource || 'unknown',
      action: eventData.action || 'unknown',
      outcome: eventData.outcome || 'success',
      details: eventData.details || {},
      riskScore: eventData.riskScore || this.calculateRiskScore(eventData),
      correlationId: eventData.correlationId || this.generateCorrelationId(),
      geolocation: eventData.geolocation,
      deviceFingerprint: eventData.deviceFingerprint,
      complianceRelevant: eventData.complianceRelevant || this.isComplianceRelevant(eventData),
      retentionCategory: eventData.retentionCategory || this.determineRetentionCategory(eventData)
    };

    // Add to queue for processing
    this.eventQueue.push(event);
    
    // Trigger immediate processing for critical events
    if (event.severity === 'critical') {
      this.processEventQueue();
    }

    return event.id;
  }

  // Real-time event processing
  private startEventProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 1000); // Process every second
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const eventsToProcess = [...this.eventQueue];
      this.eventQueue = [];
      
      for (const event of eventsToProcess) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('[SecurityMonitor] Event processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: AuditEvent): Promise<void> {
    // Add to audit log
    this.auditLog.push(event);
    
    // Check monitoring rules
    await this.evaluateMonitoringRules(event);
    
    // Real-time notifications
    this.notifySubscribers(event);
    
    // Update metrics
    this.updateMetrics(event);
    
    // Compliance logging
    if (event.complianceRelevant) {
      await this.processComplianceEvent(event);
    }
    
    // Anomaly detection
    await this.detectAnomalies(event);
  }

  // Monitoring Rules
  private async evaluateMonitoringRules(event: AuditEvent): Promise<void> {
    for (const rule of this.monitoringRules.values()) {
      if (!rule.enabled) continue;
      
      // Check if event type matches
      if (!rule.eventTypes.includes(event.eventType)) continue;
      
      // Check cooldown period
      if (rule.lastTriggered && rule.cooldownPeriod) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownPeriod) continue;
      }
      
      // Evaluate conditions
      const conditionsMet = rule.conditions.every(condition => 
        this.evaluateCondition(condition, event)
      );
      
      if (!conditionsMet) continue;
      
      // Check threshold if specified
      if (rule.threshold) {
        const recentEvents = this.getRecentEvents(
          rule.eventTypes,
          rule.threshold.timeWindow,
          rule.conditions
        );
        
        if (recentEvents.length < rule.threshold.count) continue;
      }
      
      // Rule triggered - execute actions
      await this.executeRuleActions(rule, event);
      
      rule.lastTriggered = new Date();
      rule.triggerCount++;
    }
  }

  private evaluateCondition(condition: MonitoringCondition, event: AuditEvent): boolean {
    const fieldValue = this.getFieldValue(condition.field, event);
    
    if (fieldValue === undefined || fieldValue === null) return false;
    
    const conditionValue = condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'regex':
        return new RegExp(conditionValue, condition.caseSensitive ? 'g' : 'gi').test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(field: string, event: AuditEvent): unknown {
    const parts = field.split('.');
    let value: unknown = event;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private async executeRuleActions(rule: MonitoringRule, event: AuditEvent): Promise<void> {
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, rule, event);
      } catch (error) {
        console.error(`[SecurityMonitor] Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private async executeAction(action: MonitoringAction, rule: MonitoringRule, event: AuditEvent): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.createSecurityAlert({
          type: 'pattern_match',
          severity: action.parameters.severity || 'medium',
          title: `Rule Triggered: ${rule.name}`,
          description: rule.description,
          sourceEvents: [event.id],
          affectedUsers: event.userId ? [event.userId] : [],
          affectedResources: [event.resource],
          metadata: { ruleId: rule.id, ...action.parameters }
        });
        break;
        
      case 'block_user':
        if (event.userId) {
          await this.blockUser(event.userId, action.parameters.duration || 3600000); // 1 hour default
        }
        break;
        
      case 'block_ip':
        await this.blockIP(event.ipAddress, action.parameters.duration || 3600000); // 1 hour default
        break;
        
      case 'notify':
        await this.sendNotification(rule, event, action.parameters);
        break;
        
      case 'log':
        console.log(`[SecurityMonitor] Rule ${rule.name} triggered:`, {
          event: event.id,
          level: action.parameters.level || 'info'
        });
        break;
        
      case 'webhook':
        await this.callWebhook(action.parameters.url, { rule, event, action });
        break;
    }
  }

  // Security Alerts
  private async createSecurityAlert(alertData: Partial<SecurityAlert>): Promise<string> {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      type: alertData.type || 'anomaly',
      severity: alertData.severity || 'medium',
      title: alertData.title || 'Security Event Detected',
      description: alertData.description || 'A security event has been detected',
      timestamp: new Date(),
      sourceEvents: alertData.sourceEvents || [],
      affectedUsers: alertData.affectedUsers || [],
      affectedResources: alertData.affectedResources || [],
      status: 'new',
      metadata: alertData.metadata || {}
    };
    
    this.securityAlerts.push(alert);
    
    // Notify subscribers
    this.notifySubscribers(alert, 'alert');
    
    // Auto-escalate critical alerts
    if (alert.severity === 'critical') {
      await this.escalateAlert(alert);
    }
    
    return alert.id;
  }

  // Anomaly Detection
  private async detectAnomalies(event: AuditEvent): Promise<void> {
    // Time-based anomalies
    await this.detectTimeAnomalies(event);
    
    // Location-based anomalies
    await this.detectLocationAnomalies(event);
    
    // Behavior anomalies
    await this.detectBehaviorAnomalies(event);
    
    // Volume anomalies
    await this.detectVolumeAnomalies(event);
  }

  private async detectTimeAnomalies(event: AuditEvent): Promise<void> {
    if (!event.userId) return;
    
    const hour = event.timestamp.getHours();
    const isWeekend = [0, 6].includes(event.timestamp.getDay());
    
    // Check for unusual hour access
    if ((hour < 6 || hour > 22) || isWeekend) {
      const userHistory = this.getUserEventHistory(event.userId, 30); // 30 days
      const usualHours = userHistory.map(e => e.timestamp.getHours());
      const avgHour = usualHours.reduce((sum, h) => sum + h, 0) / usualHours.length;
      
      if (Math.abs(hour - avgHour) > 4) { // More than 4 hours different
        await this.createSecurityAlert({
          type: 'anomaly',
          severity: 'medium',
          title: 'Unusual Access Time',
          description: `User accessed system outside typical hours`,
          sourceEvents: [event.id],
          affectedUsers: [event.userId],
          metadata: { anomalyType: 'time', hour, avgHour }
        });
      }
    }
  }

  private async detectLocationAnomalies(event: AuditEvent): Promise<void> {
    if (!event.userId || !event.geolocation) return;
    
    const userHistory = this.getUserEventHistory(event.userId, 30); // 30 days
    const previousLocations = userHistory
      .filter(e => e.geolocation)
      .map(e => e.geolocation);
    
    if (previousLocations.length > 0) {
      const isNewLocation = !previousLocations.some(loc => 
        loc!.country === event.geolocation!.country &&
        loc!.region === event.geolocation!.region
      );
      
      if (isNewLocation) {
        await this.createSecurityAlert({
          type: 'anomaly',
          severity: 'high',
          title: 'New Location Access',
          description: `User accessed system from new location: ${event.geolocation.city}, ${event.geolocation.country}`,
          sourceEvents: [event.id],
          affectedUsers: [event.userId],
          metadata: { 
            anomalyType: 'location',
            newLocation: event.geolocation,
            previousLocations: previousLocations.slice(-5) // Last 5 locations
          }
        });
        
        // Mark event as new location for other rules
        event.details.newLocation = true;
      }
    }
  }

  private async detectBehaviorAnomalies(event: AuditEvent): Promise<void> {
    if (!event.userId) return;
    
    const userHistory = this.getUserEventHistory(event.userId, 7); // 7 days
    const resourceAccess = userHistory.filter(e => e.resource === event.resource);
    
    // Check if this is a new resource for the user
    if (resourceAccess.length === 0 && event.eventType === 'data_access') {
      await this.createSecurityAlert({
        type: 'anomaly',
        severity: 'medium',
        title: 'New Resource Access',
        description: `User accessed new resource: ${event.resource}`,
        sourceEvents: [event.id],
        affectedUsers: [event.userId],
        metadata: { anomalyType: 'behavior', resource: event.resource }
      });
    }
  }

  private async detectVolumeAnomalies(event: AuditEvent): Promise<void> {
    if (!event.userId) return;
    
    const recentEvents = this.getUserEventHistory(event.userId, 1); // Last 1 hour
    const eventsInLastHour = recentEvents.filter(e => 
      Date.now() - e.timestamp.getTime() < 60 * 60 * 1000
    );
    
    const userAverage = this.getUserAverageActivity(event.userId);
    
    if (eventsInLastHour.length > userAverage * 3) { // 3x normal activity
      await this.createSecurityAlert({
        type: 'anomaly',
        severity: 'high',
        title: 'Unusual Activity Volume',
        description: `User activity is ${Math.round(eventsInLastHour.length / userAverage)}x normal level`,
        sourceEvents: eventsInLastHour.map(e => e.id),
        affectedUsers: [event.userId],
        metadata: { 
          anomalyType: 'volume',
          currentActivity: eventsInLastHour.length,
          averageActivity: userAverage
        }
      });
    }
  }

  // Metrics Collection
  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private collectMetrics(): void {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const recentEvents = this.auditLog.filter(event => event.timestamp >= lastHour);
    
    const metrics: SecurityMetrics = {
      timestamp: now,
      loginAttempts: {
        successful: recentEvents.filter(e => 
          e.eventType === 'authentication' && 
          e.action === 'login' && 
          e.outcome === 'success'
        ).length,
        failed: recentEvents.filter(e => 
          e.eventType === 'authentication' && 
          e.action === 'login' && 
          e.outcome === 'failure'
        ).length,
        mfaRequired: recentEvents.filter(e => 
          e.eventType === 'authentication' && 
          e.details.mfaRequired
        ).length,
        fromNewLocations: recentEvents.filter(e => 
          e.details.newLocation
        ).length
      },
      accessPatterns: {
        totalRequests: recentEvents.length,
        uniqueUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
        privilegedActions: recentEvents.filter(e => e.riskScore > 70).length,
        afterHoursActivity: recentEvents.filter(e => {
          const hour = e.timestamp.getHours();
          return hour < 6 || hour > 22;
        }).length
      },
      threatIndicators: {
        blockedIPs: 0, // Would be populated from APISecurityManager
        suspiciousPatterns: recentEvents.filter(e => e.riskScore > 80).length,
        rateLimitHits: 0, // Would be populated from APISecurityManager
        injectionAttempts: recentEvents.filter(e => 
          e.details.threatType === 'injection'
        ).length
      },
      dataAccess: {
        sensitiveDataViews: recentEvents.filter(e => 
          e.eventType === 'data_access' && 
          e.details.sensitive
        ).length,
        dataExports: recentEvents.filter(e => e.action === 'export').length,
        dataModifications: recentEvents.filter(e => 
          e.eventType === 'data_modification'
        ).length,
        bulkOperations: recentEvents.filter(e => 
          e.details.bulkOperation
        ).length
      },
      systemHealth: {
        activeUsers: new Set(recentEvents.map(e => e.userId).filter(Boolean)).size,
        activeSessions: new Set(recentEvents.map(e => e.sessionId).filter(Boolean)).size,
        errorRate: recentEvents.filter(e => e.outcome === 'failure').length / Math.max(recentEvents.length, 1),
        averageResponseTime: 0 // Would be calculated from performance data
      }
    };
    
    this.metrics.push(metrics);
    
    // Keep only last 24 hours of metrics
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
  }

  // Utility Methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `cor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateRiskScore(eventData: Partial<AuditEvent>): number {
    let score = 0;
    
    // Base score by event type
    const eventScores = {
      authentication: 10,
      authorization: 20,
      data_access: 30,
      data_modification: 50,
      configuration_change: 70,
      security_incident: 90,
      user_management: 60,
      system_event: 5
    };
    
    score += eventScores[eventData.eventType || 'system_event'] || 0;
    
    // Increase score for failures
    if (eventData.outcome === 'failure') {
      score += 20;
    }
    
    // Increase score for sensitive resources
    if (eventData.resource?.includes('sensitive') || eventData.resource?.includes('admin')) {
      score += 30;
    }
    
    // Time-based scoring
    if (eventData.timestamp) {
      const hour = eventData.timestamp.getHours();
      if (hour < 6 || hour > 22) {
        score += 15; // After hours
      }
    }
    
    return Math.min(score, 100);
  }

  private isComplianceRelevant(eventData: Partial<AuditEvent>): boolean {
    const complianceEvents = [
      'authentication',
      'authorization',
      'data_access',
      'data_modification',
      'configuration_change',
      'user_management'
    ];
    
    return complianceEvents.includes(eventData.eventType || '');
  }

  private determineRetentionCategory(eventData: Partial<AuditEvent>): 'short' | 'medium' | 'long' | 'permanent' {
    if (eventData.eventType === 'security_incident' || (eventData.riskScore || 0) > 80) {
      return 'permanent';
    }
    
    if (eventData.eventType === 'data_modification' || eventData.eventType === 'configuration_change') {
      return 'long';
    }
    
    if (eventData.eventType === 'authentication' || eventData.eventType === 'authorization') {
      return 'medium';
    }
    
    return 'short';
  }

  private getUserEventHistory(userId: string, days: number): AuditEvent[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.auditLog.filter(event => 
      event.userId === userId && event.timestamp >= cutoff
    );
  }

  private getUserAverageActivity(userId: string): number {
    const history = this.getUserEventHistory(userId, 7); // 7 days
    return history.length / 7 / 24; // Events per hour average
  }

  private getRecentEvents(eventTypes: string[], timeWindow: number, conditions?: MonitoringCondition[]): AuditEvent[] {
    const cutoff = new Date(Date.now() - timeWindow);
    
    return this.auditLog.filter(event => {
      if (event.timestamp < cutoff) return false;
      if (!eventTypes.includes(event.eventType)) return false;
      
      if (conditions) {
        return conditions.every(condition => this.evaluateCondition(condition, event));
      }
      
      return true;
    });
  }

  // Public API
  public addMonitoringRule(rule: MonitoringRule): void {
    this.monitoringRules.set(rule.id, rule);
  }

  public removeMonitoringRule(ruleId: string): void {
    this.monitoringRules.delete(ruleId);
  }

  public getSecurityAlerts(status?: string): SecurityAlert[] {
    if (status) {
      return this.securityAlerts.filter(alert => alert.status === status);
    }
    return [...this.securityAlerts];
  }

  public getAuditLog(filters?: {
    userId?: string;
    eventType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditEvent[] {
    let filteredLog = [...this.auditLog];
    
    if (filters) {
      if (filters.userId) {
        filteredLog = filteredLog.filter(event => event.userId === filters.userId);
      }
      if (filters.eventType) {
        filteredLog = filteredLog.filter(event => event.eventType === filters.eventType);
      }
      if (filters.severity) {
        filteredLog = filteredLog.filter(event => event.severity === filters.severity);
      }
      if (filters.startDate) {
        filteredLog = filteredLog.filter(event => event.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLog = filteredLog.filter(event => event.timestamp <= filters.endDate!);
      }
    }
    
    return filteredLog;
  }

  public getMetrics(hours: number = 24): SecurityMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  public generateComplianceReport(type: string, startDate: Date, endDate: Date): ComplianceReport {
    const relevantEvents = this.auditLog.filter(event => 
      event.complianceRelevant &&
      event.timestamp >= startDate &&
      event.timestamp <= endDate
    );
    
    const eventsByType: Record<string, number> = {};
    relevantEvents.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    });
    
    const securityIncidents = this.securityAlerts.filter(alert =>
      alert.timestamp >= startDate &&
      alert.timestamp <= endDate &&
      alert.severity === 'critical'
    );
    
    return {
      id: `rpt_${Date.now()}`,
      type: type as string,
      period: { start: startDate, end: endDate },
      events: relevantEvents,
      summary: {
        totalEvents: relevantEvents.length,
        eventsByType,
        securityIncidents: securityIncidents.length,
        dataAccessEvents: relevantEvents.filter(e => e.eventType === 'data_access').length,
        complianceViolations: securityIncidents
      },
      generatedAt: new Date(),
      generatedBy: 'system'
    };
  }

  // Event subscription
  public subscribe(eventType: string, callback: (...args: unknown[]) => void): () => void {
    if (!this.realTimeSubscribers.has(eventType)) {
      this.realTimeSubscribers.set(eventType, []);
    }
    this.realTimeSubscribers.get(eventType)!.push(callback);
    
    return () => {
      const subscribers = this.realTimeSubscribers.get(eventType);
      if (subscribers) {
        const index = subscribers.indexOf(callback);
        if (index > -1) subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(data: unknown, eventType: string = 'event'): void {
    const subscribers = this.realTimeSubscribers.get(eventType) || [];
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[SecurityMonitor] Subscriber notification failed:', error);
      }
    });
  }

  // Cleanup
  private setupCleanupTasks(): void {
    // Clean up old events based on retention policy
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private cleanupOldEvents(): void {
    const now = Date.now();
    
    this.auditLog = this.auditLog.filter(event => {
      const retentionDays = this.retentionPolicies.get(event.retentionCategory);
      if (!retentionDays || retentionDays === -1) return true; // Permanent retention
      
      const eventAge = now - event.timestamp.getTime();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
      
      return eventAge < retentionMs;
    });
  }

  // Placeholder methods (would integrate with external services)
  private async escalateAlert(alert: SecurityAlert): Promise<void> {
    console.log(`[SecurityMonitor] CRITICAL ALERT: ${alert.title}`);
    // Would send to incident response system
  }

  private async blockUser(userId: string, duration: number): Promise<void> {
    console.log(`[SecurityMonitor] Blocking user ${userId} for ${duration}ms`);
    // Would integrate with authentication system
  }

  private async blockIP(ipAddress: string, duration: number): Promise<void> {
    console.log(`[SecurityMonitor] Blocking IP ${ipAddress} for ${duration}ms`);
    // Would integrate with API security manager
  }

  private async sendNotification(rule: MonitoringRule, event: AuditEvent, params: Record<string, unknown>): Promise<void> {
    console.log(`[SecurityMonitor] Notification for rule ${rule.name}:`, params);
    // Would integrate with notification service
  }

  private async callWebhook(url: string, data: unknown): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[SecurityMonitor] Webhook call failed:', error);
    }
  }
}

// Export class and singleton instance
export { SecurityMonitor };
export const securityMonitor = new SecurityMonitor();
export default securityMonitor;