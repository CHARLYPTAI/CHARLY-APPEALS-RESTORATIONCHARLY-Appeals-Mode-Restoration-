import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LLMRouter } from '../../src/router.js'
import { RouterConfig, LLMRequest } from '../../src/types.js'
import { createDefaultConfig } from '../../src/config.js'

describe('LLMRouter', () => {
  let router: LLMRouter
  let config: RouterConfig

  beforeEach(() => {
    config = {
      enabled: true,
      providers: {
        openai: {
          enabled: true,
          apiKey: 'test-key',
          models: ['gpt-4o-mini'],
          budget: {
            dailyLimitCents: 1000,
            perRequestLimitCents: 100,
            tokenCostPerK: 0.15
          },
          priority: 1,
          retryAttempts: 2,
          timeoutMs: 30000
        },
        anthropic: {
          enabled: false,
          apiKey: '',
          models: [],
          budget: {
            dailyLimitCents: 1000,
            perRequestLimitCents: 100,
            tokenCostPerK: 3.0
          },
          priority: 2,
          retryAttempts: 2,
          timeoutMs: 30000
        },
        llama: {
          enabled: false,
          apiKey: '',
          models: [],
          budget: {
            dailyLimitCents: 500,
            perRequestLimitCents: 50,
            tokenCostPerK: 0.1
          },
          priority: 3,
          retryAttempts: 1,
          timeoutMs: 60000
        }
      },
      circuitBreaker: {
        failureThreshold: 3,
        resetTimeoutMs: 30000
      },
      piiRedaction: {
        enabled: true,
        patterns: ['email', 'phone']
      },
      logging: {
        level: 'info',
        sanitize: true
      }
    }
  })

  describe('initialization', () => {
    it('should create router with valid config', () => {
      expect(() => new LLMRouter(config)).not.toThrow()
    })

    it('should throw when disabled but generateCompletion called', async () => {
      config.enabled = false
      router = new LLMRouter(config)
      
      const request: LLMRequest = { prompt: 'test' }
      await expect(router.generateCompletion(request)).rejects.toThrow('LLM Router is disabled')
    })
  })

  describe('PII redaction', () => {
    beforeEach(() => {
      router = new LLMRouter(config)
    })

    it('should redact email addresses from prompts', async () => {
      const request: LLMRequest = {
        prompt: 'Contact me at john.doe@example.com for details'
      }

      vi.spyOn(router as any, 'selectProviders').mockResolvedValue([])
      
      try {
        await router.generateCompletion(request)
      } catch (error: any) {
        expect(error.message).toBe('No available providers for request')
      }
    })

    it('should redact phone numbers from messages', async () => {
      const request: LLMRequest = {
        messages: [
          { role: 'user', content: 'My number is 555-123-4567' }
        ]
      }

      vi.spyOn(router as any, 'selectProviders').mockResolvedValue([])
      
      try {
        await router.generateCompletion(request)
      } catch (error: any) {
        expect(error.message).toBe('No available providers for request')
      }
    })
  })

  describe('provider stats', () => {
    beforeEach(() => {
      router = new LLMRouter(config)
    })

    it('should return stats for all providers', async () => {
      const stats = await router.getProviderStats()
      
      expect(stats).toHaveProperty('openai')
      expect(stats.openai).toHaveProperty('enabled', true)
      expect(stats.openai).toHaveProperty('budget')
      expect(stats.openai).toHaveProperty('circuitBreaker')
      expect(stats.openai).toHaveProperty('supportedModels')
    })
  })
})