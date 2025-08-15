import { LLMProvider } from './types.js'
import type { LLMRequest, LLMResponse, LLMError, RouterConfig, TokenUsageRecord } from './types.js'
import { OpenAIProvider } from './providers/openai.js'
import { AnthropicProvider } from './providers/anthropic.js'
import { LlamaProvider } from './providers/llama.js'
import { BudgetTracker } from './budget-tracker.js'
import { CircuitBreaker } from './circuit-breaker.js'
import { PIIRedactor } from './pii-redaction.js'
import { SchemaValidator } from './schema-validator.js'
import { StructuredLogger } from './logger.js'
import { v4 as uuidv4 } from 'uuid'

export class LLMRouter {
  private providers = new Map<string, LLMProvider>()
  private budgetTracker: BudgetTracker
  private circuitBreaker: CircuitBreaker
  private piiRedactor: PIIRedactor
  private schemaValidator: SchemaValidator
  private logger: StructuredLogger
  private enabled: boolean

  constructor(private config: RouterConfig) {
    this.enabled = config.enabled
    
    this.budgetTracker = new BudgetTracker(new Map([
      ['openai', config.providers.openai.budget],
      ['anthropic', config.providers.anthropic.budget],
      ['llama', config.providers.llama.budget]
    ]))
    
    this.circuitBreaker = new CircuitBreaker(
      config.circuitBreaker.failureThreshold,
      config.circuitBreaker.resetTimeoutMs
    )
    
    this.piiRedactor = new PIIRedactor(config.piiRedaction)
    this.schemaValidator = new SchemaValidator()
    
    this.logger = new StructuredLogger({
      level: config.logging.level,
      sanitize: config.logging.sanitize,
      redactor: this.piiRedactor
    })
    
    this.initializeProviders()
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    if (!this.enabled) {
      throw new Error('LLM Router is disabled')
    }

    const requestId = uuidv4()
    const startTime = Date.now()
    
    const sanitizedRequest = this.sanitizeRequest(request)
    
    try {
      const providers = await this.selectProviders(sanitizedRequest)
      
      for (const provider of providers) {
        try {
          const canExecute = await this.circuitBreaker.canExecute(provider.id)
          if (!canExecute) {
            this.logger.warn(`Circuit breaker open for provider ${provider.id}`, { requestId })
            continue
          }

          const estimatedCost = this.estimateRequestCost(provider, sanitizedRequest)
          const canAfford = await this.budgetTracker.checkBudget(provider.id, estimatedCost)
          
          if (!canAfford) {
            const remaining = this.budgetTracker.getRemainingBudget(provider.id)
            this.logger.logBudgetViolation(provider.id, requestId, estimatedCost, remaining)
            continue
          }

          this.logger.logRequest(requestId, provider.id, sanitizedRequest.model || 'default')
          
          const response = await this.executeWithRetry(provider, sanitizedRequest, requestId)
          const duration = Date.now() - startTime
          
          const processedResponse = await this.processResponse(response, sanitizedRequest.schema)
          
          const actualCost = this.calculateActualCost(provider, response)
          const usageRecord: TokenUsageRecord = {
            providerId: provider.id,
            model: response.model,
            promptTokens: response.tokenUsage.promptTokens,
            completionTokens: response.tokenUsage.completionTokens,
            totalTokens: response.tokenUsage.totalTokens,
            costCents: actualCost,
            timestamp: new Date(),
            requestId
          }
          
          await this.budgetTracker.recordUsage(usageRecord)
          await this.circuitBreaker.recordSuccess(provider.id)
          
          this.logger.logResponse(
            requestId,
            provider.id,
            response.model,
            response.tokenUsage,
            actualCost,
            duration
          )
          
          return {
            ...processedResponse,
            requestId
          }
          
        } catch (error: any) {
          await this.circuitBreaker.recordFailure(provider.id)
          this.logger.logError(requestId, provider.id, error)
          
          if (!error.retryable || providers.indexOf(provider) === providers.length - 1) {
            throw error
          }
          
          continue
        }
      }
      
      throw new Error('No available providers for request')
      
    } catch (error: any) {
      this.logger.error('Router request failed', { requestId, error })
      throw error
    }
  }

  async getProviderStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {}
    
    for (const [id, provider] of this.providers) {
      const budgetStats = this.budgetTracker.getUsageStats(id)
      const circuitStats = this.circuitBreaker.getStats(id)
      const isHealthy = await provider.isHealthy()
      
      stats[id] = {
        enabled: this.config.providers[id as keyof typeof this.config.providers]?.enabled || false,
        healthy: isHealthy,
        budget: budgetStats,
        circuitBreaker: circuitStats,
        supportedModels: provider.getSupportedModels()
      }
    }
    
    return stats
  }

  private initializeProviders(): void {
    if (this.config.providers.openai.enabled) {
      this.providers.set('openai', new OpenAIProvider(this.config.providers.openai))
    }
    
    if (this.config.providers.anthropic.enabled) {
      this.providers.set('anthropic', new AnthropicProvider(this.config.providers.anthropic))
    }
    
    if (this.config.providers.llama.enabled) {
      this.providers.set('llama', new LlamaProvider(this.config.providers.llama))
    }
  }

  private sanitizeRequest(request: LLMRequest): LLMRequest {
    const sanitized = { ...request }
    
    if (sanitized.prompt) {
      sanitized.prompt = this.piiRedactor.redact(sanitized.prompt)
    }
    
    if (sanitized.systemPrompt) {
      sanitized.systemPrompt = this.piiRedactor.redact(sanitized.systemPrompt)
    }
    
    if (sanitized.messages) {
      sanitized.messages = sanitized.messages.map(msg => ({
        ...msg,
        content: this.piiRedactor.redact(msg.content)
      }))
    }
    
    return sanitized
  }

  private async selectProviders(request: LLMRequest): Promise<LLMProvider[]> {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => {
        const config = this.config.providers[provider.id as keyof typeof this.config.providers]
        return config?.enabled && (!request.model || config.models.includes(request.model))
      })
      .sort((a, b) => {
        const configA = this.config.providers[a.id as keyof typeof this.config.providers]
        const configB = this.config.providers[b.id as keyof typeof this.config.providers]
        return (configB?.priority || 0) - (configA?.priority || 0)
      })
    
    if (availableProviders.length === 0) {
      throw new Error('No available providers for request')
    }
    
    return availableProviders
  }

  private async executeWithRetry(provider: LLMProvider, request: LLMRequest, requestId: string): Promise<LLMResponse> {
    const config = this.config.providers[provider.id as keyof typeof this.config.providers]
    const maxRetries = config?.retryAttempts || 3
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await provider.generateCompletion(request)
      } catch (error: any) {
        if (!error.retryable || attempt === maxRetries) {
          throw error
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private async processResponse(response: LLMResponse, schema?: object): Promise<LLMResponse> {
    let processedResponse = { ...response }
    
    if (schema) {
      const validation = await this.schemaValidator.validateResponse(response.content, schema)
      
      if (validation.valid) {
        processedResponse.content = JSON.stringify(validation.data)
        processedResponse.validated = true
      } else {
        this.logger.logValidationFailure(response.requestId, validation.errors || [])
        processedResponse.validated = false
      }
    }
    
    processedResponse.redacted = true
    return processedResponse
  }

  private estimateRequestCost(provider: LLMProvider, request: LLMRequest): number {
    const promptText = request.prompt || request.messages?.map(m => m.content).join(' ') || ''
    const estimatedPromptTokens = provider.estimateTokens(promptText)
    const estimatedCompletionTokens = request.maxTokens || 1000
    
    if ('calculateCost' in provider && typeof provider.calculateCost === 'function') {
      return (provider as any).calculateCost(
        request.model || 'default',
        estimatedPromptTokens,
        estimatedCompletionTokens
      )
    }
    
    return 0
  }

  private calculateActualCost(provider: LLMProvider, response: LLMResponse): number {
    if ('calculateCost' in provider && typeof provider.calculateCost === 'function') {
      return (provider as any).calculateCost(
        response.model,
        response.tokenUsage.promptTokens,
        response.tokenUsage.completionTokens
      )
    }
    
    return 0
  }
}