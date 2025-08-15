export interface LLMRequest {
  prompt: string
  messages?: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  maxTokens?: number
  temperature?: number
  model?: string
  schema?: object
  systemPrompt?: string
}

export interface LLMResponse {
  content: string
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
  requestId: string
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  validated?: boolean
  redacted?: boolean
}

export interface LLMError {
  code: string
  message: string
  provider: string
  model?: string
  retryable: boolean
  requestId: string
}

export interface BudgetConfig {
  dailyLimitCents: number
  perRequestLimitCents: number
  tokenCostPerK: number
}

export interface ProviderConfig {
  enabled: boolean
  apiKey: string
  baseUrl?: string
  models: string[]
  budget: BudgetConfig
  priority: number
  retryAttempts: number
  timeoutMs: number
}

export interface RouterConfig {
  enabled: boolean
  providers: {
    openai: ProviderConfig
    anthropic: ProviderConfig
    llama: ProviderConfig
  }
  circuitBreaker: {
    failureThreshold: number
    resetTimeoutMs: number
  }
  piiRedaction: {
    enabled: boolean
    patterns: string[]
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    sanitize: boolean
  }
}

export interface TokenUsageRecord {
  providerId: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costCents: number
  timestamp: Date
  requestId: string
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failureCount: number
  lastFailureTime?: Date
  nextRetryTime?: Date
}

export abstract class LLMProvider {
  abstract readonly id: string
  abstract readonly name: string
  
  constructor(protected config: ProviderConfig) {}
  
  abstract isHealthy(): Promise<boolean>
  abstract generateCompletion(request: LLMRequest): Promise<LLMResponse>
  abstract estimateTokens(text: string): number
  abstract getSupportedModels(): string[]
}