import { performance } from 'perf_hooks';
import { sanitizeForLogging } from '../utils/log-sanitizer.js';
import type { PropertyData } from './performance-agent.js';

export interface WorkflowStep {
  name: string;
  estimatedDurationMs: number;
  errorProbability: number;
  dependencies: string[];
  isAIIntensive: boolean;
  isIOIntensive: boolean;
}

export interface WorkflowResult {
  propertyId: string;
  workflowType: 'residential' | 'commercial';
  steps: StepResult[];
  totalDuration: number;
  success: boolean;
  errors: string[];
  warnings: string[];
  aiUsage: {
    requests: number;
    totalTokens: number;
    cost: number;
  };
}

export interface StepResult {
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Simulates realistic property tax appeal workflows
 * with authentic timing patterns and error scenarios
 */
export class WorkflowSimulator {
  private residentialWorkflow: WorkflowStep[];
  private commercialWorkflow: WorkflowStep[];
  private simulateNetworkLatency: boolean;
  private simulateSystemLoad: boolean;

  constructor(options: {
    simulateNetworkLatency?: boolean;
    simulateSystemLoad?: boolean;
  } = {}) {
    this.simulateNetworkLatency = options.simulateNetworkLatency ?? true;
    this.simulateSystemLoad = options.simulateSystemLoad ?? true;
    
    this.initializeWorkflows();
  }

  private initializeWorkflows(): void {
    // Residential Property Tax Appeal Workflow
    this.residentialWorkflow = [
      {
        name: 'property_validation',
        estimatedDurationMs: 25,
        errorProbability: 0.02,
        dependencies: [],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'ownership_verification',
        estimatedDurationMs: 35,
        errorProbability: 0.01,
        dependencies: ['property_validation'],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'assessment_data_retrieval',
        estimatedDurationMs: 45,
        errorProbability: 0.03,
        dependencies: ['property_validation'],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'comparable_sales_analysis',
        estimatedDurationMs: 120,
        errorProbability: 0.05,
        dependencies: ['assessment_data_retrieval'],
        isAIIntensive: true,
        isIOIntensive: true
      },
      {
        name: 'property_condition_assessment',
        estimatedDurationMs: 80,
        errorProbability: 0.02,
        dependencies: ['assessment_data_retrieval'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'valuation_calculation',
        estimatedDurationMs: 60,
        errorProbability: 0.03,
        dependencies: ['comparable_sales_analysis', 'property_condition_assessment'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'appeal_strength_analysis',
        estimatedDurationMs: 90,
        errorProbability: 0.04,
        dependencies: ['valuation_calculation'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'document_generation',
        estimatedDurationMs: 150,
        errorProbability: 0.02,
        dependencies: ['appeal_strength_analysis'],
        isAIIntensive: true,
        isIOIntensive: true
      },
      {
        name: 'compliance_check',
        estimatedDurationMs: 40,
        errorProbability: 0.01,
        dependencies: ['document_generation'],
        isAIIntensive: false,
        isIOIntensive: false
      },
      {
        name: 'final_review',
        estimatedDurationMs: 30,
        errorProbability: 0.01,
        dependencies: ['compliance_check'],
        isAIIntensive: false,
        isIOIntensive: false
      }
    ];

    // Commercial Property Tax Appeal Workflow (more complex)
    this.commercialWorkflow = [
      {
        name: 'property_validation',
        estimatedDurationMs: 40,
        errorProbability: 0.02,
        dependencies: [],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'ownership_verification',
        estimatedDurationMs: 60,
        errorProbability: 0.02,
        dependencies: ['property_validation'],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'assessment_data_retrieval',
        estimatedDurationMs: 80,
        errorProbability: 0.03,
        dependencies: ['property_validation'],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'financial_document_analysis',
        estimatedDurationMs: 250,
        errorProbability: 0.08,
        dependencies: ['ownership_verification'],
        isAIIntensive: true,
        isIOIntensive: true
      },
      {
        name: 'income_approach_valuation',
        estimatedDurationMs: 180,
        errorProbability: 0.06,
        dependencies: ['financial_document_analysis', 'assessment_data_retrieval'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'sales_comparison_analysis',
        estimatedDurationMs: 200,
        errorProbability: 0.07,
        dependencies: ['assessment_data_retrieval'],
        isAIIntensive: true,
        isIOIntensive: true
      },
      {
        name: 'cost_approach_analysis',
        estimatedDurationMs: 160,
        errorProbability: 0.05,
        dependencies: ['assessment_data_retrieval'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'market_trend_analysis',
        estimatedDurationMs: 140,
        errorProbability: 0.04,
        dependencies: ['sales_comparison_analysis'],
        isAIIntensive: true,
        isIOIntensive: true
      },
      {
        name: 'reconciliation_analysis',
        estimatedDurationMs: 120,
        errorProbability: 0.05,
        dependencies: ['income_approach_valuation', 'sales_comparison_analysis', 'cost_approach_analysis'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'appeal_strength_analysis',
        estimatedDurationMs: 110,
        errorProbability: 0.04,
        dependencies: ['reconciliation_analysis', 'market_trend_analysis'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'narrative_report_generation',
        estimatedDurationMs: 300,
        errorProbability: 0.03,
        dependencies: ['appeal_strength_analysis'],
        isAIIntensive: true,
        isIOIntensive: true
      },
      {
        name: 'supporting_documentation',
        estimatedDurationMs: 180,
        errorProbability: 0.02,
        dependencies: ['narrative_report_generation'],
        isAIIntensive: false,
        isIOIntensive: true
      },
      {
        name: 'legal_compliance_review',
        estimatedDurationMs: 90,
        errorProbability: 0.02,
        dependencies: ['supporting_documentation'],
        isAIIntensive: true,
        isIOIntensive: false
      },
      {
        name: 'final_review_and_approval',
        estimatedDurationMs: 60,
        errorProbability: 0.01,
        dependencies: ['legal_compliance_review'],
        isAIIntensive: false,
        isIOIntensive: false
      }
    ];
  }

  /**
   * Simulates a complete property tax appeal workflow
   */
  async simulateWorkflow(property: PropertyData): Promise<WorkflowResult> {
    const workflow = property.propertyType === 'residential' 
      ? this.residentialWorkflow 
      : this.commercialWorkflow;

    const result: WorkflowResult = {
      propertyId: property.id,
      workflowType: property.propertyType,
      steps: [],
      totalDuration: 0,
      success: true,
      errors: [],
      warnings: [],
      aiUsage: {
        requests: 0,
        totalTokens: 0,
        cost: 0
      }
    };

    const completedSteps = new Set<string>();
    const stepResults = new Map<string, StepResult>();

    try {
      // Execute workflow steps in dependency order
      for (const step of workflow) {
        // Check if dependencies are met
        const dependenciesMet = step.dependencies.every(dep => completedSteps.has(dep));
        
        if (!dependenciesMet) {
          result.errors.push(`Step ${step.name} dependencies not met: ${step.dependencies.join(', ')}`);
          result.success = false;
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, property, result.aiUsage);
        result.steps.push(stepResult);
        stepResults.set(step.name, stepResult);

        if (stepResult.success) {
          completedSteps.add(step.name);
        } else {
          result.success = false;
          result.errors.push(`Step ${step.name} failed: ${stepResult.error || 'Unknown error'}`);
          
          // Some steps can continue on failure, others cannot
          if (this.isCriticalStep(step.name)) {
            break;
          }
        }
      }

      result.totalDuration = result.steps.reduce((sum, step) => sum + step.duration, 0);

      // Add workflow-specific warnings
      this.addWorkflowWarnings(result, property);

    } catch (error) {
      result.success = false;
      result.errors.push(`Workflow execution failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Executes a single workflow step with realistic timing and error simulation
   */
  private async executeStep(
    step: WorkflowStep, 
    property: PropertyData, 
    aiUsage: { requests: number; totalTokens: number; cost: number }
  ): Promise<StepResult> {
    const startTime = performance.now();
    
    const stepResult: StepResult = {
      stepName: step.name,
      startTime,
      endTime: 0,
      duration: 0,
      success: true,
      data: {}
    };

    try {
      // Simulate step execution
      const actualDuration = await this.simulateStepExecution(step, property);
      
      // Simulate random failures
      if (Math.random() < step.errorProbability) {
        throw new Error(this.generateStepError(step.name));
      }

      // Track AI usage for AI-intensive steps
      if (step.isAIIntensive) {
        const aiRequest = this.simulateAIRequest(step.name, property);
        aiUsage.requests += aiRequest.requests;
        aiUsage.totalTokens += aiRequest.tokens;
        aiUsage.cost += aiRequest.cost;
        
        stepResult.data.aiRequest = aiRequest;
      }

      // Simulate step-specific data generation
      stepResult.data = {
        ...stepResult.data,
        ...this.generateStepData(step.name, property)
      };

      // Wait for actual duration
      await this.sleep(actualDuration);

    } catch (error) {
      stepResult.success = false;
      stepResult.error = error.message;
    } finally {
      stepResult.endTime = performance.now();
      stepResult.duration = stepResult.endTime - stepResult.startTime;
    }

    return stepResult;
  }

  /**
   * Simulates realistic step execution timing with variability
   */
  private async simulateStepExecution(step: WorkflowStep, property: PropertyData): Promise<number> {
    let baseDuration = step.estimatedDurationMs;
    
    // Add complexity factors
    if (property.propertyType === 'commercial') {
      baseDuration *= 1.3; // Commercial properties are more complex
    }
    
    if (property.assessedValue > 1000000) {
      baseDuration *= 1.2; // High-value properties require more scrutiny
    }

    // Add system load simulation
    if (this.simulateSystemLoad) {
      const loadFactor = 0.8 + (Math.random() * 0.4); // 0.8x to 1.2x
      baseDuration *= loadFactor;
    }

    // Add network latency for IO-intensive steps
    if (step.isIOIntensive && this.simulateNetworkLatency) {
      const networkLatency = 5 + (Math.random() * 20); // 5-25ms
      baseDuration += networkLatency;
    }

    // Add AI processing overhead for AI-intensive steps
    if (step.isAIIntensive) {
      const aiOverhead = 50 + (Math.random() * 100); // 50-150ms
      baseDuration += aiOverhead;
    }

    // Add natural variability (±20%)
    const variability = 0.8 + (Math.random() * 0.4);
    baseDuration *= variability;

    return Math.max(5, Math.round(baseDuration)); // Minimum 5ms
  }

  /**
   * Simulates AI request for AI-intensive steps
   */
  private simulateAIRequest(stepName: string, property: PropertyData): {
    requests: number;
    tokens: number;
    cost: number;
  } {
    // Different steps use different amounts of AI
    const aiIntensity = {
      'comparable_sales_analysis': { requests: 2, baseTokens: 800 },
      'property_condition_assessment': { requests: 1, baseTokens: 400 },
      'valuation_calculation': { requests: 1, baseTokens: 600 },
      'appeal_strength_analysis': { requests: 2, baseTokens: 1000 },
      'document_generation': { requests: 3, baseTokens: 1500 },
      'financial_document_analysis': { requests: 4, baseTokens: 2000 },
      'income_approach_valuation': { requests: 2, baseTokens: 1200 },
      'sales_comparison_analysis': { requests: 3, baseTokens: 1400 },
      'cost_approach_analysis': { requests: 2, baseTokens: 1000 },
      'market_trend_analysis': { requests: 2, baseTokens: 900 },
      'reconciliation_analysis': { requests: 2, baseTokens: 1100 },
      'narrative_report_generation': { requests: 5, baseTokens: 2500 },
      'legal_compliance_review': { requests: 1, baseTokens: 500 }
    };

    const intensity = aiIntensity[stepName] || { requests: 1, baseTokens: 300 };
    
    // Add variability
    const requests = intensity.requests + Math.floor(Math.random() * 2);
    const tokens = intensity.baseTokens + Math.floor(Math.random() * 200);
    
    // Estimate cost (rough approximation: $0.002 per 1K tokens)
    const cost = (tokens / 1000) * 0.002;

    return { requests, tokens, cost };
  }

  /**
   * Generates step-specific data based on the step type
   */
  private generateStepData(stepName: string, property: PropertyData): any {
    const dataGenerators = {
      'property_validation': () => ({
        validationStatus: 'passed',
        propertyFound: true,
        coordinatesVerified: true
      }),
      
      'ownership_verification': () => ({
        ownershipConfirmed: true,
        ownerName: 'Property Owner',
        titleClear: true
      }),
      
      'assessment_data_retrieval': () => ({
        currentAssessment: property.assessedValue,
        taxYear: property.taxYear,
        assessmentDate: '2024-01-01',
        propertyClass: property.propertyType === 'residential' ? 'R1' : 'C1'
      }),
      
      'comparable_sales_analysis': () => ({
        comparablesFound: 3 + Math.floor(Math.random() * 7),
        avgSalePrice: property.assessedValue * (0.85 + Math.random() * 0.3),
        priceVariance: 0.05 + Math.random() * 0.15,
        confidence: 0.7 + Math.random() * 0.3
      }),
      
      'valuation_calculation': () => ({
        estimatedValue: property.assessedValue * (0.9 + Math.random() * 0.2),
        valuationMethod: 'sales_comparison',
        confidenceLevel: 0.8 + Math.random() * 0.2
      }),
      
      'appeal_strength_analysis': () => ({
        appealViability: Math.random() > 0.3,
        expectedReduction: 0.05 + Math.random() * 0.2,
        successProbability: 0.4 + Math.random() * 0.5,
        riskFactors: []
      }),
      
      'document_generation': () => ({
        documentsGenerated: ['appeal_form', 'supporting_analysis', 'comparable_data'],
        pageCount: 8 + Math.floor(Math.random() * 15),
        qualityScore: 0.85 + Math.random() * 0.15
      })
    };

    const generator = dataGenerators[stepName];
    return generator ? generator() : {};
  }

  /**
   * Generates realistic error messages for step failures
   */
  private generateStepError(stepName: string): string {
    const errorMessages = {
      'property_validation': 'Property address not found in tax records',
      'ownership_verification': 'Ownership documentation incomplete',
      'assessment_data_retrieval': 'Tax assessment database temporarily unavailable',
      'comparable_sales_analysis': 'Insufficient comparable sales data',
      'property_condition_assessment': 'Property inspection data incomplete',
      'valuation_calculation': 'Valuation algorithm encountered calculation error',
      'appeal_strength_analysis': 'Appeal viability analysis inconclusive',
      'document_generation': 'Document template rendering failed',
      'financial_document_analysis': 'Financial statements format not recognized',
      'income_approach_valuation': 'Income data insufficient for reliable valuation',
      'sales_comparison_analysis': 'No suitable comparable properties found',
      'cost_approach_analysis': 'Construction cost data unavailable',
      'market_trend_analysis': 'Market data source temporarily unavailable',
      'reconciliation_analysis': 'Valuation approaches show excessive variance',
      'narrative_report_generation': 'Report generation service overloaded',
      'legal_compliance_review': 'Compliance requirements not met'
    };

    return errorMessages[stepName] || `Unexpected error in ${stepName}`;
  }

  /**
   * Determines if a step is critical (workflow should stop on failure)
   */
  private isCriticalStep(stepName: string): boolean {
    const criticalSteps = [
      'property_validation',
      'ownership_verification',
      'assessment_data_retrieval'
    ];
    
    return criticalSteps.includes(stepName);
  }

  /**
   * Adds workflow-specific warnings based on results
   */
  private addWorkflowWarnings(result: WorkflowResult, property: PropertyData): void {
    // Check for slow performance
    if (result.totalDuration > (property.propertyType === 'residential' ? 800 : 2000)) {
      result.warnings.push('Workflow execution exceeded expected duration');
    }

    // Check for high AI usage
    if (result.aiUsage.cost > 0.50) {
      result.warnings.push('High AI usage detected - consider optimization');
    }

    // Check for high error rate in steps
    const failedSteps = result.steps.filter(s => !s.success).length;
    if (failedSteps > 0) {
      result.warnings.push(`${failedSteps} workflow steps failed`);
    }

    // Property-specific warnings
    if (property.propertyType === 'commercial' && result.totalDuration < 1000) {
      result.warnings.push('Commercial property processed unusually quickly - verify completeness');
    }

    if (property.assessedValue > 2000000 && result.aiUsage.requests < 5) {
      result.warnings.push('High-value property may require additional AI analysis');
    }
  }

  /**
   * Gets workflow statistics for a property type
   */
  getWorkflowStats(propertyType: 'residential' | 'commercial'): {
    totalSteps: number;
    estimatedDuration: number;
    aiIntensiveSteps: number;
    ioIntensiveSteps: number;
  } {
    const workflow = propertyType === 'residential' 
      ? this.residentialWorkflow 
      : this.commercialWorkflow;

    return {
      totalSteps: workflow.length,
      estimatedDuration: workflow.reduce((sum, step) => sum + step.estimatedDurationMs, 0),
      aiIntensiveSteps: workflow.filter(step => step.isAIIntensive).length,
      ioIntensiveSteps: workflow.filter(step => step.isIOIntensive).length
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create a workflow simulator with standard settings
 */
export function createWorkflowSimulator(environment: 'test' | 'staging' | 'production' = 'production'): WorkflowSimulator {
  const config = {
    test: {
      simulateNetworkLatency: false,
      simulateSystemLoad: false
    },
    staging: {
      simulateNetworkLatency: true,
      simulateSystemLoad: false
    },
    production: {
      simulateNetworkLatency: true,
      simulateSystemLoad: true
    }
  };

  return new WorkflowSimulator(config[environment]);
}