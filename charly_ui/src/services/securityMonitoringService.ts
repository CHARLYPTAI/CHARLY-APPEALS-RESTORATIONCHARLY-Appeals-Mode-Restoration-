// ============================================================================
// CHARLY PLATFORM - SECURITY MONITORING SERVICE
// Apple CTO Phase 3D - Security Event Logging & Compliance
// ============================================================================

import { trackError } from '../lib/sentry';

interface SecurityEvent {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  user_agent?: string;
  endpoint?: string;
  details: Record<string, unknown>;
  timestamp: number;
}

class SecurityMonitoringService {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000; // Keep last 1000 events in memory

  // Log security events
  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Store locally
    this.events.push(securityEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift(); // Remove oldest event
    }

    // Send to backend
    try {
      await fetch('/api/metrics/security-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(securityEvent)
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      trackError(error as Error, { securityEvent });
    }

    // Alert on critical events
    if (event.severity === 'critical') {
      this.triggerCriticalAlert(securityEvent);
    }
  }

  // Monitor authentication events
  logAuthEvent(type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout', details: Record<string, unknown> = {}) {
    const severity = type === 'login_failure' ? 'medium' : 'low';
    
    this.logSecurityEvent({
      event_type: `auth_${type}`,
      severity,
      details: {
        ...details,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Monitor API access
  logAPIAccess(endpoint: string, method: string, status: number, details: Record<string, unknown> = {}) {
    const severity = status >= 400 ? 'medium' : 'low';
    
    this.logSecurityEvent({
      event_type: 'api_access',
      severity,
      endpoint,
      details: {
        method,
        status,
        ...details
      }
    });
  }

  // Monitor suspicious activities
  logSuspiciousActivity(activity: string, details: Record<string, unknown> = {}) {
    this.logSecurityEvent({
      event_type: 'suspicious_activity',
      severity: 'high',
      details: {
        activity,
        ...details,
        location: window.location.href
      }
    });
  }

  // Monitor data access
  logDataAccess(resource: string, action: string, details: Record<string, unknown> = {}) {
    this.logSecurityEvent({
      event_type: 'data_access',
      severity: 'low',
      details: {
        resource,
        action,
        ...details
      }
    });
  }

  // Monitor compliance events
  logComplianceEvent(type: string, details: Record<string, unknown> = {}) {
    this.logSecurityEvent({
      event_type: `compliance_${type}`,
      severity: 'medium',
      details
    });
  }

  // Trigger critical alert
  private triggerCriticalAlert(event: SecurityEvent) {
    console.error('🚨 CRITICAL SECURITY ALERT:', event);
    
    // In production, this would trigger:
    // - PagerDuty alerts
    // - Slack notifications
    // - Email alerts to security team
    // - Automated incident response
  }

  // Get recent security events
  getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  // Get security summary
  getSecuritySummary() {
    const recentEvents = this.getRecentEvents(60);
    
    return {
      total_events: recentEvents.length,
      critical_events: recentEvents.filter(e => e.severity === 'critical').length,
      high_events: recentEvents.filter(e => e.severity === 'high').length,
      event_types: this.groupBy(recentEvents, 'event_type'),
      last_critical_event: recentEvents
        .filter(e => e.severity === 'critical')
        .sort((a, b) => b.timestamp - a.timestamp)[0] || null
    };
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const groupKey = String(item[key]);
      acc[groupKey] = (acc[groupKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitoringService();

// React hook for security monitoring
export function useSecurityMonitoring() {
  return {
    logAuthEvent: securityMonitor.logAuthEvent.bind(securityMonitor),
    logAPIAccess: securityMonitor.logAPIAccess.bind(securityMonitor),
    logSuspiciousActivity: securityMonitor.logSuspiciousActivity.bind(securityMonitor),
    logDataAccess: securityMonitor.logDataAccess.bind(securityMonitor),
    logComplianceEvent: securityMonitor.logComplianceEvent.bind(securityMonitor),
    getSecuritySummary: securityMonitor.getSecuritySummary.bind(securityMonitor)
  };
}

export default securityMonitor;