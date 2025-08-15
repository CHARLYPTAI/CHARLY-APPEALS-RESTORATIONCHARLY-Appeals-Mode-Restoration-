export { LLMRouter } from './router.js'
export type { 
  LLMRequest, 
  LLMResponse, 
  LLMError, 
  RouterConfig,
  ProviderConfig,
  BudgetConfig,
  TokenUsageRecord
} from './types.js'
export { LLMProvider } from './types.js'
export { createDefaultConfig, validateConfig } from './config.js'
export { OpenAIProvider } from './providers/openai.js'
export { AnthropicProvider } from './providers/anthropic.js'
export { LlamaProvider } from './providers/llama.js'
export { SchemaValidator } from './schema-validator.js'
export { PIIRedactor } from './pii-redaction.js'
export { StructuredLogger } from './logger.js'

import { LLMRouter } from './router.js'
import type { RouterConfig, LLMResponse } from './types.js'
import { createDefaultConfig, validateConfig } from './config.js'

let routerInstance: LLMRouter | null = null

export function createRouter(config?: RouterConfig): LLMRouter {
  if (!config) {
    config = createDefaultConfig()
    
    const errors = validateConfig(config)
    if (errors.length > 0) {
      throw new Error(`Router configuration errors: ${errors.join(', ')}`)
    }
  }
  
  routerInstance = new LLMRouter(config)
  return routerInstance
}

export function getRouter(): LLMRouter {
  if (!routerInstance) {
    routerInstance = createRouter()
  }
  return routerInstance
}

export function resetRouter(): void {
  routerInstance = null
}

export function createStubResponse(content: string, requestId?: string): LLMResponse {
  return {
    content,
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    },
    model: 'stub',
    provider: 'stub',
    requestId: requestId || 'stub-request',
    finishReason: 'stop',
    validated: false,
    redacted: false
  }
}