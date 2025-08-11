/**
 * CHARLY 2.0 - ROI Tracking and Reporting Engine
 * Advanced financial metrics tracking, ROI calculations, and predictive modeling
 */

interface FinancialMetric {
  id: string;
  category: string;
  name: string;
  value: number;
  currency: string;
  timestamp: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  tags: string[];
  metadata: Record<string, unknown>;
}

interface ROICalculation {
  id: string;
  name: string;
  investment: number;
  returns: number;
  roi: number;
  roiPercentage: number;
  timeframe: number; // in days
  annualizedROI: number;
  category: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'projected';
  breakdown: InvestmentBreakdown[];
}

interface InvestmentBreakdown {
  category: string;
  amount: number;
  percentage: number;
  description: string;
  type: 'development' | 'marketing' | 'infrastructure' | 'personnel' | 'operations';
}

interface RevenueStream {
  id: string;
  name: string;
  type: 'subscription' | 'one-time' | 'usage-based' | 'commission' | 'licensing';
  monthlyRecurring: number;
  growthRate: number;
  churnRate: number;
  customerCount: number;
  averageValue: number;
  projectedValue: number;
  confidence: number;
}

interface CostCenter {
  id: string;
  name: string;
  category: 'fixed' | 'variable' | 'semi-variable';
  monthlyAmount: number;
  yearlyProjection: number;
  allocatedPercentage: number;
  department: string;
  optimizationPotential: number;
}

interface PerformanceKPI {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  trend: 'improving' | 'declining' | 'stable';
  impactOnROI: number;
  lastUpdated: number;
  historicalData: { date: string; value: number }[];
}

interface ROIProjection {
  timeframe: number; // months
  projectedROI: number;
  confidence: number;
  assumptions: string[];
  scenarioAnalysis: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
  keyDrivers: string[];
  risks: string[];
}

class ROITrackingEngine {
  private metrics: FinancialMetric[] = [];
  private calculations: ROICalculation[] = [];
  private revenueStreams: RevenueStream[] = [];
  private costCenters: CostCenter[] = [];
  private kpis: PerformanceKPI[] = [];
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();

  constructor() {
    this.initializeDefaultData();
    this.startPeriodicCalculations();
  }

  private initializeDefaultData(): void {
    // Initialize revenue streams
    this.revenueStreams = [
      {
        id: 'subscription-basic',
        name: 'Basic Subscription',
        type: 'subscription',
        monthlyRecurring: 125000,
        growthRate: 0.12,
        churnRate: 0.05,
        customerCount: 850,
        averageValue: 147,
        projectedValue: 185000,
        confidence: 0.85
      },
      {
        id: 'subscription-premium',
        name: 'Premium Subscription',
        type: 'subscription',
        monthlyRecurring: 280000,
        growthRate: 0.18,
        churnRate: 0.03,
        customerCount: 420,
        averageValue: 667,
        projectedValue: 420000,
        confidence: 0.90
      },
      {
        id: 'enterprise-contracts',
        name: 'Enterprise Contracts',
        type: 'one-time',
        monthlyRecurring: 180000,
        growthRate: 0.25,
        churnRate: 0.02,
        customerCount: 25,
        averageValue: 7200,
        projectedValue: 350000,
        confidence: 0.88
      }
    ];

    // Initialize cost centers
    this.costCenters = [
      {
        id: 'development',
        name: 'Development Team',
        category: 'fixed',
        monthlyAmount: 85000,
        yearlyProjection: 1020000,
        allocatedPercentage: 0.35,
        department: 'Engineering',
        optimizationPotential: 0.08
      },
      {
        id: 'infrastructure',
        name: 'Cloud Infrastructure',
        category: 'variable',
        monthlyAmount: 42000,
        yearlyProjection: 550000,
        allocatedPercentage: 0.18,
        department: 'Operations',
        optimizationPotential: 0.15
      },
      {
        id: 'marketing',
        name: 'Marketing & Sales',
        category: 'variable',
        monthlyAmount: 38000,
        yearlyProjection: 480000,
        allocatedPercentage: 0.16,
        department: 'Marketing',
        optimizationPotential: 0.12
      },
      {
        id: 'operations',
        name: 'Operations & Support',
        category: 'semi-variable',
        monthlyAmount: 28000,
        yearlyProjection: 350000,
        allocatedPercentage: 0.12,
        department: 'Operations',
        optimizationPotential: 0.10
      }
    ];

    // Initialize KPIs
    this.kpis = [
      {
        id: 'customer-acquisition-cost',
        name: 'Customer Acquisition Cost',
        currentValue: 185,
        targetValue: 150,
        unit: 'USD',
        trend: 'improving',
        impactOnROI: 0.25,
        lastUpdated: Date.now(),
        historicalData: []
      },
      {
        id: 'lifetime-value',
        name: 'Customer Lifetime Value',
        currentValue: 2850,
        targetValue: 3200,
        unit: 'USD',
        trend: 'improving',
        impactOnROI: 0.40,
        lastUpdated: Date.now(),
        historicalData: []
      },
      {
        id: 'monthly-churn-rate',
        name: 'Monthly Churn Rate',
        currentValue: 3.2,
        targetValue: 2.5,
        unit: 'percentage',
        trend: 'stable',
        impactOnROI: -0.30,
        lastUpdated: Date.now(),
        historicalData: []
      },
      {
        id: 'net-revenue-retention',
        name: 'Net Revenue Retention',
        currentValue: 118,
        targetValue: 125,
        unit: 'percentage',
        trend: 'improving',
        impactOnROI: 0.35,
        lastUpdated: Date.now(),
        historicalData: []
      }
    ];

    // Initialize ROI calculations
    this.calculations = [
      {
        id: 'platform-development',
        name: 'Platform Development Investment',
        investment: 850000,
        returns: 2450000,
        roi: 1600000,
        roiPercentage: 188.2,
        timeframe: 365,
        annualizedROI: 188.2,
        category: 'Product Development',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'completed',
        breakdown: [
          { category: 'Engineering Team', amount: 420000, percentage: 49.4, description: 'Development salaries and benefits', type: 'personnel' },
          { category: 'Infrastructure', amount: 180000, percentage: 21.2, description: 'Cloud services and hosting', type: 'infrastructure' },
          { category: 'Third-party Tools', amount: 120000, percentage: 14.1, description: 'Software licenses and APIs', type: 'operations' },
          { category: 'Marketing Launch', amount: 80000, percentage: 9.4, description: 'Product launch campaigns', type: 'marketing' },
          { category: 'Legal & Compliance', amount: 50000, percentage: 5.9, description: 'Legal review and compliance', type: 'operations' }
        ]
      },
      {
        id: 'ai-ml-infrastructure',
        name: 'AI/ML Infrastructure Investment',
        investment: 420000,
        returns: 1230000,
        roi: 810000,
        roiPercentage: 192.9,
        timeframe: 275,
        annualizedROI: 256.1,
        category: 'Technology Innovation',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-11-30'),
        status: 'completed',
        breakdown: [
          { category: 'ML Engineering', amount: 180000, percentage: 42.9, description: 'ML engineers and data scientists', type: 'personnel' },
          { category: 'GPU Infrastructure', amount: 120000, percentage: 28.6, description: 'High-performance computing resources', type: 'infrastructure' },
          { category: 'Data Processing', amount: 80000, percentage: 19.0, description: 'Data pipelines and storage', type: 'infrastructure' },
          { category: 'Model Training', amount: 40000, percentage: 9.5, description: 'Training data and compute costs', type: 'operations' }
        ]
      }
    ];
  }

  public addMetric(metric: Omit<FinancialMetric, 'id' | 'timestamp'>): string {
    const newMetric: FinancialMetric = {
      id: this.generateId('metric'),
      timestamp: Date.now(),
      ...metric
    };

    this.metrics.push(newMetric);
    this.emit('metric_added', newMetric);
    return newMetric.id;
  }

  public calculateROI(investment: number, returns: number, timeframeDays: number): ROICalculation {
    const roi = returns - investment;
    const roiPercentage = (roi / investment) * 100;
    const annualizedROI = (roiPercentage * 365) / timeframeDays;

    return {
      id: this.generateId('roi'),
      name: 'Custom ROI Calculation',
      investment,
      returns,
      roi,
      roiPercentage,
      timeframe: timeframeDays,
      annualizedROI,
      category: 'Custom',
      startDate: new Date(),
      status: 'projected',
      breakdown: []
    };
  }

  public addROICalculation(calculation: Omit<ROICalculation, 'id'>): string {
    const newCalculation: ROICalculation = {
      id: this.generateId('roi'),
      ...calculation
    };

    this.calculations.push(newCalculation);
    this.emit('roi_calculation_added', newCalculation);
    return newCalculation.id;
  }

  public getROIProjection(timeframeMonths: number): ROIProjection {
    const currentROI = this.calculateAverageROI();
    const growthRate = this.estimateGrowthRate();
    
    const projectedROI = currentROI * Math.pow(1 + growthRate, timeframeMonths / 12);
    
    return {
      timeframe: timeframeMonths,
      projectedROI,
      confidence: this.calculateConfidence(),
      assumptions: [
        'Market conditions remain stable',
        'Customer acquisition continues at current rate',
        'No major competitive threats emerge',
        'Technology platform scales efficiently'
      ],
      scenarioAnalysis: {
        optimistic: projectedROI * 1.3,
        realistic: projectedROI,
        pessimistic: projectedROI * 0.7
      },
      keyDrivers: [
        'Customer acquisition efficiency',
        'Revenue retention and expansion',
        'Operational cost optimization',
        'Market penetration growth'
      ],
      risks: [
        'Economic downturn affecting customer budgets',
        'Increased competition in property tax space',
        'Regulatory changes impacting business model',
        'Technology disruption requiring re-architecture'
      ]
    };
  }

  private calculateAverageROI(): number {
    if (this.calculations.length === 0) return 0;
    
    const totalROI = this.calculations.reduce((sum, calc) => sum + calc.roiPercentage, 0);
    return totalROI / this.calculations.length;
  }

  private estimateGrowthRate(): number {
    // Calculate growth rate based on revenue streams and KPIs
    const revenueGrowth = this.revenueStreams.reduce((sum, stream) => 
      sum + (stream.growthRate * stream.monthlyRecurring), 0
    ) / this.revenueStreams.reduce((sum, stream) => sum + stream.monthlyRecurring, 0);

    return Math.min(0.5, Math.max(0.05, revenueGrowth)); // Cap between 5% and 50%
  }

  private calculateConfidence(): number {
    // Calculate confidence based on data quality and historical accuracy
    const revenueConfidence = this.revenueStreams.reduce((sum, stream) => 
      sum + stream.confidence, 0) / this.revenueStreams.length;
    
    const dataQuality = Math.min(1, this.metrics.length / 100); // More data = higher confidence
    
    return Math.round((revenueConfidence * 0.7 + dataQuality * 0.3) * 100);
  }

  public getFinancialSummary(): {
    totalRevenue: number;
    totalCosts: number;
    netProfit: number;
    profitMargin: number;
    averageROI: number;
    projectedGrowth: number;
  } {
    const totalRevenue = this.revenueStreams.reduce((sum, stream) => 
      sum + stream.monthlyRecurring, 0) * 12;
    
    const totalCosts = this.costCenters.reduce((sum, center) => 
      sum + center.yearlyProjection, 0);
    
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = (netProfit / totalRevenue) * 100;
    const averageROI = this.calculateAverageROI();
    const projectedGrowth = this.estimateGrowthRate() * 100;

    return {
      totalRevenue,
      totalCosts,
      netProfit,
      profitMargin,
      averageROI,
      projectedGrowth
    };
  }

  public optimizeCosts(): {
    currentCosts: number;
    optimizedCosts: number;
    savings: number;
    recommendations: string[];
  } {
    const currentCosts = this.costCenters.reduce((sum, center) => 
      sum + center.monthlyAmount, 0) * 12;
    
    const optimizedCosts = this.costCenters.reduce((sum, center) => 
      sum + (center.monthlyAmount * (1 - center.optimizationPotential)), 0) * 12;
    
    const savings = currentCosts - optimizedCosts;
    
    const recommendations = this.costCenters
      .filter(center => center.optimizationPotential > 0.1)
      .map(center => `Optimize ${center.name}: ${(center.optimizationPotential * 100).toFixed(1)}% potential savings`)
      .slice(0, 5);

    return {
      currentCosts,
      optimizedCosts,
      savings,
      recommendations
    };
  }

  public getCustomerMetrics(): {
    totalCustomers: number;
    avgCustomerValue: number;
    customerLifetimeValue: number;
    acquisitionCost: number;
    paybackPeriod: number;
  } {
    const totalCustomers = this.revenueStreams.reduce((sum, stream) => 
      sum + stream.customerCount, 0);
    
    const totalRevenue = this.revenueStreams.reduce((sum, stream) => 
      sum + stream.monthlyRecurring, 0);
    
    const avgCustomerValue = totalRevenue / totalCustomers;
    
    const cltv = this.kpis.find(kpi => kpi.id === 'lifetime-value')?.currentValue || 0;
    const cac = this.kpis.find(kpi => kpi.id === 'customer-acquisition-cost')?.currentValue || 0;
    const paybackPeriod = cac / avgCustomerValue;

    return {
      totalCustomers,
      avgCustomerValue,
      customerLifetimeValue: cltv,
      acquisitionCost: cac,
      paybackPeriod
    };
  }

  public generateReport(format: 'summary' | 'detailed' | 'executive'): Record<string, unknown> {
    const summary = this.getFinancialSummary();
    const customerMetrics = this.getCustomerMetrics();
    const costOptimization = this.optimizeCosts();
    const projection = this.getROIProjection(12);

    switch (format) {
      case 'summary':
        return {
          revenue: summary.totalRevenue,
          profit: summary.netProfit,
          roi: summary.averageROI,
          customers: customerMetrics.totalCustomers,
          growth: summary.projectedGrowth
        };

      case 'detailed':
        return {
          financialSummary: summary,
          customerMetrics,
          costOptimization,
          roiProjection: projection,
          revenueStreams: this.revenueStreams,
          costCenters: this.costCenters,
          kpis: this.kpis,
          calculations: this.calculations
        };

      case 'executive':
        return {
          keyMetrics: {
            annualRevenue: summary.totalRevenue,
            netProfit: summary.netProfit,
            profitMargin: summary.profitMargin,
            roi: summary.averageROI
          },
          growth: {
            projectedGrowth: summary.projectedGrowth,
            customerGrowth: customerMetrics.totalCustomers,
            revenueGrowth: this.revenueStreams.reduce((sum, s) => sum + s.growthRate, 0) / this.revenueStreams.length
          },
          opportunities: {
            costSavings: costOptimization.savings,
            optimizationRecommendations: costOptimization.recommendations.slice(0, 3)
          },
          risks: projection.risks.slice(0, 3)
        };

      default:
        return summary;
    }
  }

  public updateKPI(kpiId: string, value: number): void {
    const kpi = this.kpis.find(k => k.id === kpiId);
    if (kpi) {
      // Add to historical data
      kpi.historicalData.push({
        date: new Date().toISOString(),
        value: kpi.currentValue
      });

      // Update current value
      const previousValue = kpi.currentValue;
      kpi.currentValue = value;
      kpi.lastUpdated = Date.now();

      // Update trend
      if (value > previousValue) {
        kpi.trend = kpi.impactOnROI > 0 ? 'improving' : 'declining';
      } else if (value < previousValue) {
        kpi.trend = kpi.impactOnROI > 0 ? 'declining' : 'improving';
      } else {
        kpi.trend = 'stable';
      }

      this.emit('kpi_updated', { kpi, previousValue, newValue: value });
    }
  }

  public addRevenueStream(stream: Omit<RevenueStream, 'id'>): string {
    const newStream: RevenueStream = {
      id: this.generateId('revenue'),
      ...stream
    };

    this.revenueStreams.push(newStream);
    this.emit('revenue_stream_added', newStream);
    return newStream.id;
  }

  public addCostCenter(center: Omit<CostCenter, 'id'>): string {
    const newCenter: CostCenter = {
      id: this.generateId('cost'),
      ...center
    };

    this.costCenters.push(newCenter);
    this.emit('cost_center_added', newCenter);
    return newCenter.id;
  }

  private startPeriodicCalculations(): void {
    // Recalculate metrics every hour
    setInterval(() => {
      this.recalculateMetrics();
    }, 3600000);

    // Update KPI trends every 6 hours
    setInterval(() => {
      this.updateKPITrends();
    }, 21600000);
  }

  private recalculateMetrics(): void {
    // Recalculate ROI for active investments
    this.calculations.forEach(calc => {
      if (calc.status === 'active') {
        // Update based on current performance
        const performance = this.calculateCurrentPerformance();
        calc.returns = calc.investment * (1 + performance);
        calc.roi = calc.returns - calc.investment;
        calc.roiPercentage = (calc.roi / calc.investment) * 100;
      }
    });

    this.emit('metrics_recalculated', { timestamp: Date.now() });
  }

  private calculateCurrentPerformance(): number {
    // Simplified performance calculation based on KPIs
    const performanceFactors = this.kpis.map(kpi => {
      const progress = kpi.currentValue / kpi.targetValue;
      return progress * Math.abs(kpi.impactOnROI);
    });

    return performanceFactors.reduce((sum, factor) => sum + factor, 0) / performanceFactors.length;
  }

  private updateKPITrends(): void {
    this.kpis.forEach(kpi => {
      if (kpi.historicalData.length >= 2) {
        const recent = kpi.historicalData.slice(-5);
        const trend = this.calculateTrend(recent.map(d => d.value));
        
        if (trend > 0.05) {
          kpi.trend = kpi.impactOnROI > 0 ? 'improving' : 'declining';
        } else if (trend < -0.05) {
          kpi.trend = kpi.impactOnROI > 0 ? 'declining' : 'improving';
        } else {
          kpi.trend = 'stable';
        }
      }
    });
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    return (last - first) / first;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Getters for dashboard integration
  public getMetrics(): FinancialMetric[] { return this.metrics; }
  public getCalculations(): ROICalculation[] { return this.calculations; }
  public getRevenueStreams(): RevenueStream[] { return this.revenueStreams; }
  public getCostCenters(): CostCenter[] { return this.costCenters; }
  public getKPIs(): PerformanceKPI[] { return this.kpis; }
}

// Singleton instance
export const roiTrackingEngine = new ROITrackingEngine();
export default ROITrackingEngine;