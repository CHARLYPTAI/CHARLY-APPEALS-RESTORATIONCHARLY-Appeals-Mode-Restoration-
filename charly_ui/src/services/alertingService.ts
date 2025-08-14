// ============================================================================
// CHARLY PLATFORM - ALERTING & INCIDENT RESPONSE SERVICE
// Apple CTO Phase 3D - Automated Alerting Implementation
// ============================================================================

interface AlertRule {
  id: string;
  name: string;
  condition: (data: unknown) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // Minutes before re-alerting
  enabled: boolean;
}

interface Alert {
  id: string;
  rule_id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  resolved: boolean;
  data: unknown;
}

class AlertingService {
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private lastAlertTimes: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    // Apple CTO Performance Alert Rules
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: (data) => data.error_rate > 1, // > 1%
        severity: 'high',
        cooldown: 5,
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow API Response Time',
        condition: (data) => data.avg_response_time > 2000, // > 2 seconds
        severity: 'medium',
        cooldown: 10,
        enabled: true
      },
      {
        id: 'critical_security_event',
        name: 'Critical Security Event',
        condition: (data) => data.critical_security_events > 0,
        severity: 'critical',
        cooldown: 0, // Immediate alerting
        enabled: true
      },
      {
        id: 'poor_web_vitals',
        name: 'Poor Web Vitals Performance',
        condition: (data) => {
          const vitals = data.web_vitals || {};
          return vitals.lcp > 4000 || vitals.fid > 300 || vitals.cls > 0.25;
        },
        severity: 'medium',
        cooldown: 15,
        enabled: true
      },
      {
        id: 'system_degradation',
        name: 'System Performance Degradation',
        condition: (data) => data.system_status === 'degraded',
        severity: 'high',
        cooldown: 5,
        enabled: true
      },
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        condition: (data) => data.failed_logins > 5,
        severity: 'medium',
        cooldown: 30,
        enabled: true
      }
    ];
  }

  // Check all alert rules against current data
  async checkAlerts(data: unknown) {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(data)) {
          await this.triggerAlert(rule, data);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }
  }

  // Trigger an alert if cooldown period has passed
  private async triggerAlert(rule: AlertRule, data: unknown) {
    const now = Date.now();
    const lastAlert = this.lastAlertTimes.get(rule.id) || 0;
    const cooldownMs = rule.cooldown * 60 * 1000;

    if (now - lastAlert < cooldownMs) {
      return; // Still in cooldown period
    }

    const alert: Alert = {
      id: `alert_${now}_${rule.id}`,
      rule_id: rule.id,
      title: rule.name,
      message: this.generateAlertMessage(rule, data),
      severity: rule.severity,
      timestamp: now,
      resolved: false,
      data
    };

    this.alerts.push(alert);
    this.lastAlertTimes.set(rule.id, now);

    // Send alert through various channels
    await this.sendAlert(alert);
  }

  // Generate contextual alert message
  private generateAlertMessage(rule: AlertRule, data: unknown): string {
    switch (rule.id) {
      case 'high_error_rate':
        return `Error rate is ${data.error_rate.toFixed(2)}% (threshold: 1%)`;
      
      case 'slow_response_time':
        return `Average API response time is ${data.avg_response_time}ms (threshold: 2000ms)`;
      
      case 'critical_security_event':
        return `${data.critical_security_events} critical security event(s) detected`;
      
      case 'poor_web_vitals': {
        const vitals = data.web_vitals || {};
        const issues = [];
        if (vitals.lcp > 4000) issues.push(`LCP: ${vitals.lcp}ms`);
        if (vitals.fid > 300) issues.push(`FID: ${vitals.fid}ms`);
        if (vitals.cls > 0.25) issues.push(`CLS: ${vitals.cls}`);
        return `Poor Web Vitals detected: ${issues.join(', ')}`;
      }
      
      case 'system_degradation':
        return `System status is degraded. Current performance metrics below thresholds.`;
      
      case 'multiple_failed_logins':
        return `${data.failed_logins} failed login attempts detected`;
      
      default:
        return `Alert condition met for ${rule.name}`;
    }
  }

  // Send alert through configured channels
  private async sendAlert(alert: Alert) {
    console.warn(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}`);

    // Console notification (development)
    if (import.meta.env.DEV) {
      this.showBrowserNotification(alert);
    }

    // In production, this would send to:
    // - Slack webhook
    // - PagerDuty
    // - Email notifications
    // - SMS for critical alerts
    await this.sendToIntegrations(alert);
  }

  // Show browser notification (development)
  private showBrowserNotification(alert: Alert) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`CHARLY Alert: ${alert.title}`, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.rule_id
      });
    }
  }

  // Send to external integrations
  private async sendToIntegrations(alert: Alert) {
    // Slack integration
    const slackWebhook = import.meta.env.VITE_SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      try {
        await fetch(slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CHARLY Platform Alert`,
            attachments: [{
              color: this.getSeverityColor(alert.severity),
              title: alert.title,
              text: alert.message,
              ts: Math.floor(alert.timestamp / 1000)
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }

    // PagerDuty integration for critical alerts
    if (alert.severity === 'critical') {
      const pagerDutyKey = import.meta.env.VITE_PAGERDUTY_INTEGRATION_KEY;
      if (pagerDutyKey) {
        try {
          await fetch('https://events.pagerduty.com/v2/enqueue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              routing_key: pagerDutyKey,
              event_action: 'trigger',
              dedup_key: alert.rule_id,
              payload: {
                summary: `${alert.title}: ${alert.message}`,
                severity: alert.severity,
                source: 'CHARLY Platform',
                component: 'monitoring',
                group: 'platform',
                class: 'performance'
              }
            })
          });
        } catch (error) {
          console.error('Failed to send PagerDuty alert:', error);
        }
      }
    }
  }

  // Get severity color for integrations
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc3545'; // Red
      case 'high': return '#fd7e14';     // Orange
      case 'medium': return '#ffc107';   // Yellow
      case 'low': return '#28a745';      // Green
      default: return '#6c757d';         // Gray
    }
  }

  // Resolve an alert
  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alert.title}`);
    }
  }

  // Get active alerts
  getActiveAlerts(): Alert[] {
    return this.alerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get alert summary
  getAlertSummary() {
    const activeAlerts = this.getActiveAlerts();
    
    return {
      total_active: activeAlerts.length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      low: activeAlerts.filter(a => a.severity === 'low').length,
      latest_alert: activeAlerts[0] || null
    };
  }

  // Request notification permissions
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
}

// Export singleton instance
export const alertingService = new AlertingService();

// React hook for alerting
export function useAlerting() {
  return {
    checkAlerts: alertingService.checkAlerts.bind(alertingService),
    getActiveAlerts: alertingService.getActiveAlerts.bind(alertingService),
    getAlertSummary: alertingService.getAlertSummary.bind(alertingService),
    resolveAlert: alertingService.resolveAlert.bind(alertingService),
    requestNotificationPermission: alertingService.requestNotificationPermission.bind(alertingService)
  };
}

export default alertingService;