import type { RouterConfig } from './types.js'

export function createDefaultConfig(): RouterConfig {
  return {
    enabled: process.env.LLM_ROUTER_ENABLED === 'true',
    providers: {
      openai: {
        enabled: Boolean(process.env.OPENAI_API_KEY),
        apiKey: process.env.OPENAI_API_KEY || '',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        budget: {
          dailyLimitCents: parseInt(process.env.LLM_DAILY_BUDGET_CENTS || '5000'),
          perRequestLimitCents: parseInt(process.env.LLM_MAX_TOKENS_PER_REQ || '500'),
          tokenCostPerK: 2.5
        },
        priority: 2,
        retryAttempts: parseInt(process.env.LLM_RETRY_MAX || '3'),
        timeoutMs: parseInt(process.env.LLM_TIMEOUT_S || '30') * 1000
      },
      anthropic: {
        enabled: Boolean(process.env.ANTHROPIC_API_KEY),
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
        budget: {
          dailyLimitCents: parseInt(process.env.LLM_DAILY_BUDGET_CENTS || '5000'),
          perRequestLimitCents: parseInt(process.env.LLM_MAX_TOKENS_PER_REQ || '500'),
          tokenCostPerK: 3.0
        },
        priority: 3,
        retryAttempts: parseInt(process.env.LLM_RETRY_MAX || '3'),
        timeoutMs: parseInt(process.env.LLM_TIMEOUT_S || '30') * 1000
      },
      llama: {
        enabled: Boolean(process.env.LLAMA_ENDPOINT || process.env.LLAMA_LOCAL),
        apiKey: process.env.LLAMA_API_KEY || '',
        baseUrl: process.env.LLAMA_ENDPOINT || 'http://localhost:11434',
        models: ['llama-3.2-3b', 'llama-3.2-1b', 'llama-3.1-8b'],
        budget: {
          dailyLimitCents: parseInt(process.env.LLM_DAILY_BUDGET_CENTS || '1000'),
          perRequestLimitCents: parseInt(process.env.LLM_MAX_TOKENS_PER_REQ || '200'),
          tokenCostPerK: 0.1
        },
        priority: 1,
        retryAttempts: parseInt(process.env.LLM_RETRY_MAX || '2'),
        timeoutMs: parseInt(process.env.LLM_TIMEOUT_S || '60') * 1000
      }
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 60000
    },
    piiRedaction: {
      enabled: process.env.LLM_PII_REDACTION_ENABLED !== 'false',
      patterns: ['ssn', 'email', 'phone', 'credit_card', 'ein', 'address', 'ip_address']
    },
    logging: {
      level: (process.env.LLM_LOG_LEVEL as any) || 'info',
      sanitize: process.env.LLM_LOG_SANITIZE !== 'false'
    }
  }
}

export function validateConfig(config: RouterConfig): string[] {
  const errors: string[] = []
  
  if (!config.enabled) {
    return errors
  }
  
  const enabledProviders = Object.entries(config.providers)
    .filter(([, providerConfig]) => providerConfig.enabled)
  
  if (enabledProviders.length === 0) {
    errors.push('At least one provider must be enabled when router is enabled')
  }
  
  for (const [providerId, providerConfig] of enabledProviders) {
    if (!providerConfig.apiKey && providerId !== 'llama') {
      errors.push(`${providerId}: API key is required`)
    }
    
    if (providerConfig.budget.dailyLimitCents <= 0) {
      errors.push(`${providerId}: Daily budget limit must be positive`)
    }
    
    if (providerConfig.budget.perRequestLimitCents <= 0) {
      errors.push(`${providerId}: Per-request budget limit must be positive`)
    }
    
    if (providerConfig.timeoutMs <= 0) {
      errors.push(`${providerId}: Timeout must be positive`)
    }
    
    if (providerConfig.models.length === 0) {
      errors.push(`${providerId}: At least one model must be configured`)
    }
  }
  
  return errors
}