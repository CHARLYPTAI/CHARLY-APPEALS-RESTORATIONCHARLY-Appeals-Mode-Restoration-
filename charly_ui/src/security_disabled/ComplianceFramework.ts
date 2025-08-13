/**
 * CHARLY 2.0 - Enterprise Compliance Framework
 * SOC 2 Type II, GDPR, and Multi-Regulatory Compliance Management
 * Apple CTO Enterprise Security Standards
 */

interface ComplianceRequirement {
  id: string;
  framework: 'SOC2' | 'GDPR' | 'ISO27001' | 'HIPAA' | 'PCI-DSS';
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  evidence: string[];
  lastAssessed: Date;
  nextAssessment: Date;
  owner: string;
  controls: ComplianceControl[];
  risks: ComplianceRisk[];
  remediationPlan?: RemediationPlan;
}

interface ComplianceControl {
  id: string;
  type: 'preventive' | 'detective' | 'corrective';
  description: string;
  implementation: string;
  effectiveness: 'low' | 'medium' | 'high';
  automated: boolean;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  lastTested: Date;
  testResults: ControlTestResult[];
}

interface ControlTestResult {
  date: Date;
  tester: string;
  passed: boolean;
  notes: string;
  evidence: string[];
}

interface ComplianceRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  mitigation: string;
  residualRisk: number;
}

interface RemediationPlan {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetDate: Date;
  assignedTo: string;
  status: 'planned' | 'in-progress' | 'completed' | 'overdue';
  tasks: RemediationTask[];
  budget?: number;
  approvals: string[];
}

interface RemediationTask {
  id: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  assignee: string;
  estimatedHours: number;
  actualHours?: number;
}

interface ComplianceAudit {
  id: string;
  framework: string;
  auditor: string;
  startDate: Date;
  endDate?: Date;
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  scope: string[];
  findings: AuditFinding[];
  overallScore: number;
  recommendations: string[];
  followUpDate?: Date;
}

interface AuditFinding {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  evidence: string[];
  recommendation: string;
  status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
  dueDate: Date;
}

interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  dataController: string;
  dataProcessor?: string;
  lawfulBasis: string;
  dataCategories: DataCategory[];
  dataSubjects: string[];
  purposes: string[];
  recipients: string[];
  transferredOutsideEU: boolean;
  retentionPeriod: string;
  securityMeasures: string[];
  dataSubjectRights: DataSubjectRight[];
  dpia?: DataProtectionImpactAssessment;
}

interface DataCategory {
  type: 'personal' | 'sensitive' | 'financial' | 'health' | 'biometric' | 'location';
  description: string;
  examples: string[];
  encryption: boolean;
  accessControls: string[];
}

interface DataSubjectRight {
  right: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  implemented: boolean;
  process: string;
  responseTime: string;
  automatedProcess: boolean;
}

interface DataProtectionImpactAssessment {
  id: string;
  conducted: boolean;
  date?: Date;
  assessor: string;
  riskLevel: 'low' | 'medium' | 'high';
  mitigationMeasures: string[];
  approved: boolean;
  approver?: string;
  reviewDate: Date;
}

interface IncidentResponse {
  id: string;
  type: 'data-breach' | 'security-incident' | 'privacy-violation' | 'system-failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedDate: Date;
  detectedDate: Date;
  description: string;
  affectedSystems: string[];
  affectedData: string[];
  affectedIndividuals: number;
  containmentActions: string[];
  investigationStatus: 'open' | 'investigating' | 'resolved' | 'closed';
  regulatorNotificationRequired: boolean;
  regulatorNotificationDate?: Date;
  individualNotificationRequired: boolean;
  individualNotificationDate?: Date;
  rootCause?: string;
  correctiveActions: string[];
  lessonsLearned: string[];
}

class ComplianceFrameworkManager {
  private requirements: Map<string, ComplianceRequirement> = new Map();
  private audits: Map<string, ComplianceAudit> = new Map();
  private dataActivities: Map<string, DataProcessingActivity> = new Map();
  private incidents: Map<string, IncidentResponse> = new Map();

  constructor() {
    this.initializeSOC2Requirements();
    this.initializeGDPRRequirements();
    this.initializeISO27001Requirements();
  }

  /**
   * Initialize SOC 2 Type II requirements
   */
  private initializeSOC2Requirements(): void {
    const soc2Requirements: ComplianceRequirement[] = [
      {
        id: 'SOC2-SEC-001',
        framework: 'SOC2',
        category: 'Security',
        title: 'Access Controls',
        description: 'Logical and physical access controls to protect against unauthorized access',
        severity: 'critical',
        status: 'compliant',
        evidence: ['Access control policies', 'User access reviews', 'Security logs'],
        lastAssessed: new Date('2024-12-01'),
        nextAssessment: new Date('2025-03-01'),
        owner: 'Security Team',
        controls: [
          {
            id: 'AC-001',
            type: 'preventive',
            description: 'Multi-factor authentication for all privileged accounts',
            implementation: 'MFA Manager with TOTP/SMS/Hardware keys',
            effectiveness: 'high',
            automated: true,
            frequency: 'continuous',
            lastTested: new Date('2024-12-15'),
            testResults: [
              {
                date: new Date('2024-12-15'),
                tester: 'Security Auditor',
                passed: true,
                notes: 'All privileged accounts have MFA enabled',
                evidence: ['MFA configuration logs', 'User access audit']
              }
            ]
          }
        ],
        risks: [
          {
            id: 'RISK-001',
            description: 'Unauthorized access to sensitive data',
            likelihood: 'low',
            impact: 'critical',
            riskScore: 6,
            mitigation: 'Multi-factor authentication and access monitoring',
            residualRisk: 2
          }
        ]
      },
      {
        id: 'SOC2-AVAIL-001',
        framework: 'SOC2',
        category: 'Availability',
        title: 'System Monitoring',
        description: 'Continuous monitoring of system availability and performance',
        severity: 'high',
        status: 'compliant',
        evidence: ['Monitoring dashboards', 'Uptime reports', 'Incident logs'],
        lastAssessed: new Date('2024-12-01'),
        nextAssessment: new Date('2025-03-01'),
        owner: 'Operations Team',
        controls: [
          {
            id: 'MON-001',
            type: 'detective',
            description: 'Real-time system availability monitoring',
            implementation: 'SecurityMonitor with 24/7 alerting',
            effectiveness: 'high',
            automated: true,
            frequency: 'continuous',
            lastTested: new Date('2024-12-15'),
            testResults: [
              {
                date: new Date('2024-12-15'),
                tester: 'Operations Manager',
                passed: true,
                notes: 'Monitoring systems operational with 99.9% uptime',
                evidence: ['Uptime metrics', 'Alert logs']
              }
            ]
          }
        ],
        risks: [
          {
            id: 'RISK-002',
            description: 'System downtime affecting service availability',
            likelihood: 'medium',
            impact: 'high',
            riskScore: 6,
            mitigation: 'Redundant systems and automated failover',
            residualRisk: 3
          }
        ]
      }
    ];

    soc2Requirements.forEach(req => this.requirements.set(req.id, req));
  }

  /**
   * Initialize GDPR requirements
   */
  private initializeGDPRRequirements(): void {
    const gdprRequirements: ComplianceRequirement[] = [
      {
        id: 'GDPR-ART-32',
        framework: 'GDPR',
        category: 'Security',
        title: 'Security of Processing',
        description: 'Appropriate technical and organizational measures for data security',
        severity: 'critical',
        status: 'compliant',
        evidence: ['Encryption policies', 'Security assessments', 'Incident response plans'],
        lastAssessed: new Date('2024-12-01'),
        nextAssessment: new Date('2025-06-01'),
        owner: 'Data Protection Officer',
        controls: [
          {
            id: 'GDPR-ENC-001',
            type: 'preventive',
            description: 'Encryption of personal data at rest and in transit',
            implementation: 'DataProtection module with AES-256-GCM encryption',
            effectiveness: 'high',
            automated: true,
            frequency: 'continuous',
            lastTested: new Date('2024-12-15'),
            testResults: [
              {
                date: new Date('2024-12-15'),
                tester: 'Security Auditor',
                passed: true,
                notes: 'All personal data encrypted with approved algorithms',
                evidence: ['Encryption audit', 'Data classification review']
              }
            ]
          }
        ],
        risks: [
          {
            id: 'GDPR-RISK-001',
            description: 'Unauthorized access to personal data',
            likelihood: 'low',
            impact: 'critical',
            riskScore: 6,
            mitigation: 'Strong encryption and access controls',
            residualRisk: 2
          }
        ]
      },
      {
        id: 'GDPR-ART-25',
        framework: 'GDPR',
        category: 'Privacy by Design',
        title: 'Data Protection by Design and Default',
        description: 'Implementation of data protection principles by design and default',
        severity: 'high',
        status: 'compliant',
        evidence: ['Privacy impact assessments', 'System design documentation'],
        lastAssessed: new Date('2024-12-01'),
        nextAssessment: new Date('2025-06-01'),
        owner: 'Development Team',
        controls: [
          {
            id: 'GDPR-PBD-001',
            type: 'preventive',
            description: 'Privacy controls embedded in system design',
            implementation: 'InputValidation and privacy controls in all forms',
            effectiveness: 'high',
            automated: true,
            frequency: 'continuous',
            lastTested: new Date('2024-12-15'),
            testResults: [
              {
                date: new Date('2024-12-15'),
                tester: 'Privacy Officer',
                passed: true,
                notes: 'All data collection forms implement privacy by design',
                evidence: ['Code review', 'Privacy assessment']
              }
            ]
          }
        ],
        risks: [
          {
            id: 'GDPR-RISK-002',
            description: 'Non-compliance with privacy by design principles',
            likelihood: 'medium',
            impact: 'high',
            riskScore: 6,
            mitigation: 'Embedded privacy controls and regular assessments',
            residualRisk: 3
          }
        ]
      }
    ];

    gdprRequirements.forEach(req => this.requirements.set(req.id, req));
  }

  /**
   * Initialize ISO 27001 requirements
   */
  private initializeISO27001Requirements(): void {
    const iso27001Requirements: ComplianceRequirement[] = [
      {
        id: 'ISO-A.9.1.1',
        framework: 'ISO27001',
        category: 'Access Control',
        title: 'Access Control Policy',
        description: 'Establishment and maintenance of access control policy',
        severity: 'high',
        status: 'compliant',
        evidence: ['Access control policy document', 'Policy acknowledgments'],
        lastAssessed: new Date('2024-12-01'),
        nextAssessment: new Date('2025-12-01'),
        owner: 'CISO',
        controls: [
          {
            id: 'ISO-AC-001',
            type: 'preventive',
            description: 'Documented access control policy',
            implementation: 'RBACManager with role-based permissions',
            effectiveness: 'high',
            automated: false,
            frequency: 'annually',
            lastTested: new Date('2024-12-01'),
            testResults: [
              {
                date: new Date('2024-12-01'),
                tester: 'Internal Auditor',
                passed: true,
                notes: 'Access control policy reviewed and updated',
                evidence: ['Policy document', 'Review meeting minutes']
              }
            ]
          }
        ],
        risks: [
          {
            id: 'ISO-RISK-001',
            description: 'Inadequate access controls leading to data breach',
            likelihood: 'medium',
            impact: 'high',
            riskScore: 6,
            mitigation: 'Regular policy reviews and access audits',
            residualRisk: 3
          }
        ]
      }
    ];

    iso27001Requirements.forEach(req => this.requirements.set(req.id, req));
  }

  /**
   * Get compliance dashboard data
   */
  getComplianceDashboard(): {
    overallScore: number;
    frameworkScores: { [framework: string]: number };
    criticalFindings: number;
    openItems: number;
    recentAssessments: ComplianceRequirement[];
  } {
    const requirements = Array.from(this.requirements.values());
    
    const frameworkScores: { [framework: string]: number } = {};
    const frameworkCounts: { [framework: string]: number } = {};

    let totalScore = 0;
    let criticalFindings = 0;
    let openItems = 0;

    requirements.forEach(req => {
      const score = this.calculateRequirementScore(req);
      totalScore += score;

      if (!frameworkScores[req.framework]) {
        frameworkScores[req.framework] = 0;
        frameworkCounts[req.framework] = 0;
      }
      frameworkScores[req.framework] += score;
      frameworkCounts[req.framework]++;

      if (req.severity === 'critical' && req.status !== 'compliant') {
        criticalFindings++;
      }

      if (req.status === 'non-compliant' || req.status === 'partial') {
        openItems++;
      }
    });

    // Calculate average scores
    Object.keys(frameworkScores).forEach(framework => {
      frameworkScores[framework] = frameworkScores[framework] / frameworkCounts[framework];
    });

    const overallScore = requirements.length > 0 ? totalScore / requirements.length : 0;

    const recentAssessments = requirements
      .sort((a, b) => b.lastAssessed.getTime() - a.lastAssessed.getTime())
      .slice(0, 5);

    return {
      overallScore,
      frameworkScores,
      criticalFindings,
      openItems,
      recentAssessments
    };
  }

  /**
   * Calculate score for a requirement
   */
  private calculateRequirementScore(requirement: ComplianceRequirement): number {
    switch (requirement.status) {
      case 'compliant': return 100;
      case 'partial': return 60;
      case 'non-compliant': return 20;
      case 'not-applicable': return 100;
      default: return 0;
    }
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(framework?: string): {
    summary: Record<string, unknown>;
    requirements: ComplianceRequirement[];
    recommendations: string[];
    actionItems: RemediationTask[];
  } {
    const requirements = framework 
      ? Array.from(this.requirements.values()).filter(req => req.framework === framework)
      : Array.from(this.requirements.values());

    const summary = this.getComplianceDashboard();
    
    const recommendations = this.generateRecommendations(requirements);
    
    const actionItems = requirements
      .filter(req => req.remediationPlan)
      .flatMap(req => req.remediationPlan!.tasks)
      .filter(task => task.status !== 'completed');

    return {
      summary,
      requirements,
      recommendations,
      actionItems
    };
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(requirements: ComplianceRequirement[]): string[] {
    const recommendations: string[] = [];

    const nonCompliantCritical = requirements.filter(
      req => req.severity === 'critical' && req.status !== 'compliant'
    );

    if (nonCompliantCritical.length > 0) {
      recommendations.push(
        `Address ${nonCompliantCritical.length} critical compliance findings immediately`
      );
    }

    const overdueAssessments = requirements.filter(
      req => req.nextAssessment < new Date()
    );

    if (overdueAssessments.length > 0) {
      recommendations.push(
        `Schedule assessments for ${overdueAssessments.length} overdue requirements`
      );
    }

    const lowEffectivenessControls = requirements.filter(
      req => req.controls.some(control => control.effectiveness === 'low')
    );

    if (lowEffectivenessControls.length > 0) {
      recommendations.push(
        'Review and enhance controls with low effectiveness ratings'
      );
    }

    return recommendations;
  }

  /**
   * Create data processing activity
   */
  createDataProcessingActivity(activity: Omit<DataProcessingActivity, 'id'>): DataProcessingActivity {
    const id = `DPA-${Date.now()}`;
    const fullActivity: DataProcessingActivity = { id, ...activity };
    this.dataActivities.set(id, fullActivity);
    return fullActivity;
  }

  /**
   * Report security incident
   */
  reportIncident(incident: Omit<IncidentResponse, 'id'>): IncidentResponse {
    const id = `INC-${Date.now()}`;
    const fullIncident: IncidentResponse = { id, ...incident };
    this.incidents.set(id, fullIncident);

    // Determine if regulatory notification is required
    this.assessRegulatoryNotificationRequirement(fullIncident);

    return fullIncident;
  }

  /**
   * Assess regulatory notification requirements
   */
  private assessRegulatoryNotificationRequirement(incident: IncidentResponse): void {
    // GDPR Article 33 - 72 hour notification requirement
    if (incident.type === 'data-breach' && incident.affectedIndividuals > 0) {
      incident.regulatorNotificationRequired = true;
    }

    // SOC 2 incident notification requirements
    if (incident.severity === 'critical') {
      incident.regulatorNotificationRequired = true;
    }
  }

  /**
   * Get compliance metrics for monitoring
   */
  getComplianceMetrics(): {
    complianceScore: number;
    controlEffectiveness: number;
    incidentTrends: unknown[];
    auditReadiness: number;
  } {
    const dashboard = this.getComplianceDashboard();
    
    const controls = Array.from(this.requirements.values())
      .flatMap(req => req.controls);
    
    const effectivenessScores = controls.map(control => {
      switch (control.effectiveness) {
        case 'high': return 100;
        case 'medium': return 70;
        case 'low': return 40;
        default: return 0;
      }
    });

    const controlEffectiveness = effectivenessScores.length > 0 
      ? effectivenessScores.reduce((a, b) => a + b, 0) / effectivenessScores.length
      : 0;

    const incidents = Array.from(this.incidents.values());
    const incidentTrends = this.calculateIncidentTrends(incidents);

    const auditReadiness = this.calculateAuditReadiness();

    return {
      complianceScore: dashboard.overallScore,
      controlEffectiveness,
      incidentTrends,
      auditReadiness
    };
  }

  /**
   * Calculate incident trends
   */
  private calculateIncidentTrends(incidents: IncidentResponse[]): unknown[] {
    const last6Months = new Date();
    last6Months.setMonth(last6Months.getMonth() - 6);

    const recentIncidents = incidents.filter(
      incident => incident.reportedDate >= last6Months
    );

    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      
      const monthIncidents = recentIncidents.filter(incident => {
        const incidentMonth = incident.reportedDate.getMonth();
        const incidentYear = incident.reportedDate.getFullYear();
        return incidentMonth === month.getMonth() && incidentYear === month.getFullYear();
      });

      monthlyTrends.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: monthIncidents.length,
        severity: {
          critical: monthIncidents.filter(i => i.severity === 'critical').length,
          high: monthIncidents.filter(i => i.severity === 'high').length,
          medium: monthIncidents.filter(i => i.severity === 'medium').length,
          low: monthIncidents.filter(i => i.severity === 'low').length
        }
      });
    }

    return monthlyTrends;
  }

  /**
   * Calculate audit readiness score
   */
  private calculateAuditReadiness(): number {
    const requirements = Array.from(this.requirements.values());
    let score = 0;
    let maxScore = 0;

    requirements.forEach(req => {
      maxScore += 100;

      // Evidence availability
      if (req.evidence.length > 0) score += 25;

      // Control testing
      const testedControls = req.controls.filter(
        control => control.lastTested > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
      if (testedControls.length === req.controls.length) score += 25;

      // Assessment currency
      const assessmentAge = Date.now() - req.lastAssessed.getTime();
      const ageInDays = assessmentAge / (1000 * 60 * 60 * 24);
      if (ageInDays <= 90) score += 25;
      else if (ageInDays <= 180) score += 15;
      else if (ageInDays <= 365) score += 10;

      // Compliance status
      if (req.status === 'compliant') score += 25;
      else if (req.status === 'partial') score += 15;
    });

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  /**
   * Export compliance data
   */
  exportComplianceData(format: 'json' | 'csv' | 'xml'): string {
    const data = {
      requirements: Array.from(this.requirements.values()),
      audits: Array.from(this.audits.values()),
      dataActivities: Array.from(this.dataActivities.values()),
      incidents: Array.from(this.incidents.values()),
      exportDate: new Date().toISOString()
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return this.convertToCSV(data);
      case 'xml':
        return this.convertToXML(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertToCSV(data: unknown): string {
    // Simple CSV conversion for requirements
    const headers = ['ID', 'Framework', 'Title', 'Status', 'Severity', 'Last Assessed'];
    const rows = data.requirements.map((req: ComplianceRequirement) => [
      req.id,
      req.framework,
      req.title,
      req.status,
      req.severity,
      req.lastAssessed.toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private convertToXML(data: unknown): string {
    // Simple XML conversion
    return `<?xml version="1.0" encoding="UTF-8"?>
<compliance-export>
  <export-date>${data.exportDate}</export-date>
  <requirements>
    ${data.requirements.map((req: ComplianceRequirement) => `
    <requirement>
      <id>${req.id}</id>
      <framework>${req.framework}</framework>
      <title>${req.title}</title>
      <status>${req.status}</status>
      <severity>${req.severity}</severity>
      <last-assessed>${req.lastAssessed.toISOString()}</last-assessed>
    </requirement>
    `).join('')}
  </requirements>
</compliance-export>`;
  }
}

// Export singleton instance
export const complianceFramework = new ComplianceFrameworkManager();

// Export types and classes
export {
  ComplianceFrameworkManager,
  ComplianceRequirement,
  ComplianceControl,
  ComplianceAudit,
  DataProcessingActivity,
  IncidentResponse,
  RemediationPlan
};