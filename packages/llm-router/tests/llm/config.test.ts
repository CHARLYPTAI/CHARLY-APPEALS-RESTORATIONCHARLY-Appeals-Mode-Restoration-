import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createDefaultConfig, validateConfig } from '../../src/config.js'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createDefaultConfig', () => {
    it('should create disabled config when no environment variables set', () => {
      delete process.env.LLM_ROUTER_ENABLED
      delete process.env.OPENAI_API_KEY
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.LLAMA_ENDPOINT
      delete process.env.LLAMA_LOCAL

      const config = createDefaultConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.providers.openai.enabled).toBe(false)
      expect(config.providers.anthropic.enabled).toBe(false)
      expect(config.providers.llama.enabled).toBe(false)
    })

    it('should enable router when LLM_ROUTER_ENABLED is true', () => {
      process.env.LLM_ROUTER_ENABLED = 'true'
      
      const config = createDefaultConfig()
      expect(config.enabled).toBe(true)
    })

    it('should enable OpenAI when API key is present', () => {
      process.env.OPENAI_API_KEY = 'test-key'
      
      const config = createDefaultConfig()
      expect(config.providers.openai.enabled).toBe(true)
      expect(config.providers.openai.apiKey).toBe('test-key')
    })

    it('should enable Anthropic when API key is present', () => {
      process.env.ANTHROPIC_API_KEY = 'test-key'
      
      const config = createDefaultConfig()
      expect(config.providers.anthropic.enabled).toBe(true)
      expect(config.providers.anthropic.apiKey).toBe('test-key')
    })

    it('should enable LLaMA when endpoint is present', () => {
      process.env.LLAMA_ENDPOINT = 'http://localhost:11434'
      
      const config = createDefaultConfig()
      expect(config.providers.llama.enabled).toBe(true)
      expect(config.providers.llama.baseUrl).toBe('http://localhost:11434')
    })

    it('should enable LLaMA when local flag is present', () => {
      process.env.LLAMA_LOCAL = 'true'
      
      const config = createDefaultConfig()
      expect(config.providers.llama.enabled).toBe(true)
    })

    it('should respect budget environment variables', () => {
      process.env.LLM_DAILY_BUDGET_CENTS = '10000'
      process.env.LLM_MAX_TOKENS_PER_REQ = '1000'
      
      const config = createDefaultConfig()
      expect(config.providers.openai.budget.dailyLimitCents).toBe(10000)
      expect(config.providers.openai.budget.perRequestLimitCents).toBe(1000)
    })

    it('should respect retry and timeout environment variables', () => {
      process.env.LLM_RETRY_MAX = '5'
      process.env.LLM_TIMEOUT_S = '60'
      
      const config = createDefaultConfig()
      expect(config.providers.openai.retryAttempts).toBe(5)
      expect(config.providers.openai.timeoutMs).toBe(60000)
    })

    it('should respect logging environment variables', () => {
      process.env.LLM_LOG_LEVEL = 'debug'
      process.env.LLM_LOG_SANITIZE = 'false'
      
      const config = createDefaultConfig()
      expect(config.logging.level).toBe('debug')
      expect(config.logging.sanitize).toBe(false)
    })

    it('should disable PII redaction when explicitly disabled', () => {
      process.env.LLM_PII_REDACTION_ENABLED = 'false'
      
      const config = createDefaultConfig()
      expect(config.piiRedaction.enabled).toBe(false)
    })

    it('should set correct provider priorities', () => {
      const config = createDefaultConfig()
      expect(config.providers.llama.priority).toBe(1) // Lowest cost
      expect(config.providers.openai.priority).toBe(2)
      expect(config.providers.anthropic.priority).toBe(3) // Highest quality
    })
  })

  describe('validateConfig', () => {
    it('should return no errors for disabled router', () => {
      const config = createDefaultConfig()
      config.enabled = false
      
      const errors = validateConfig(config)
      expect(errors).toEqual([])
    })

    it('should require at least one enabled provider', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = false
      config.providers.anthropic.enabled = false
      config.providers.llama.enabled = false
      
      const errors = validateConfig(config)
      expect(errors).toContain('At least one provider must be enabled when router is enabled')
    })

    it('should require API keys for non-LLaMA providers', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = true
      config.providers.openai.apiKey = ''
      config.providers.anthropic.enabled = true
      config.providers.anthropic.apiKey = ''
      
      const errors = validateConfig(config)
      expect(errors).toContain('openai: API key is required')
      expect(errors).toContain('anthropic: API key is required')
    })

    it('should not require API key for LLaMA', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.llama.enabled = true
      config.providers.llama.apiKey = ''
      config.providers.openai.enabled = false
      config.providers.anthropic.enabled = false
      
      const errors = validateConfig(config)
      expect(errors.some(e => e.includes('llama: API key is required'))).toBe(false)
    })

    it('should validate positive budget limits', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = true
      config.providers.openai.apiKey = 'test'
      config.providers.openai.budget.dailyLimitCents = -100
      config.providers.openai.budget.perRequestLimitCents = 0
      
      const errors = validateConfig(config)
      expect(errors).toContain('openai: Daily budget limit must be positive')
      expect(errors).toContain('openai: Per-request budget limit must be positive')
    })

    it('should validate positive timeout', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = true
      config.providers.openai.apiKey = 'test'
      config.providers.openai.timeoutMs = -1000
      
      const errors = validateConfig(config)
      expect(errors).toContain('openai: Timeout must be positive')
    })

    it('should require at least one model per provider', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = true
      config.providers.openai.apiKey = 'test'
      config.providers.openai.models = []
      
      const errors = validateConfig(config)
      expect(errors).toContain('openai: At least one model must be configured')
    })

    it('should return no errors for valid config', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = true
      config.providers.openai.apiKey = 'test-key'
      config.providers.anthropic.enabled = false
      config.providers.llama.enabled = false
      
      const errors = validateConfig(config)
      expect(errors).toEqual([])
    })

    it('should validate multiple providers simultaneously', () => {
      const config = createDefaultConfig()
      config.enabled = true
      config.providers.openai.enabled = true
      config.providers.openai.apiKey = ''
      config.providers.anthropic.enabled = true
      config.providers.anthropic.apiKey = 'valid-key'
      config.providers.anthropic.budget.dailyLimitCents = -500
      
      const errors = validateConfig(config)
      expect(errors).toContain('openai: API key is required')
      expect(errors).toContain('anthropic: Daily budget limit must be positive')
      expect(errors.length).toBe(2)
    })
  })
})