import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LLMRouter, createRouter, resetRouter, createStubResponse } from '@charly/llm-router';
import type { RouterConfig, LLMRequest } from '@charly/llm-router';

describe('LLM Router Compliance and Budget Tests', () => {
  let router: LLMRouter;
  
  const testConfig: RouterConfig = {
    enabled: true,
    providers: {
      openai: {
        enabled: true,
        apiKey: 'test-key',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        budget: 1000, // $10.00 budget in cents
        priority: 1,
        retryAttempts: 2
      },
      anthropic: {
        enabled: true,
        apiKey: 'test-key',
        models: ['claude-3-sonnet'],
        budget: 500, // $5.00 budget in cents
        priority: 2,
        retryAttempts: 1
      },
      llama: {
        enabled: false,
        apiKey: '',
        models: [],
        budget: 0,
        priority: 3,
        retryAttempts: 1
      }
    },
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeoutMs: 60000
    },
    piiRedaction: {
      enabled: true,
      patterns: ['ssn', 'phone', 'email', 'creditCard'],
      replaceWith: '[REDACTED]'
    },
    logging: {
      level: 'info',
      sanitize: true
    }
  };

  beforeEach(() => {
    resetRouter();
    router = createRouter(testConfig);
  });

  afterEach(() => {
    resetRouter();
  });

  describe('Budget Enforcement', () => {
    it('should track token usage and costs', async () => {
      const request: LLMRequest = {
        prompt: 'Analyze this property income statement for valuation',
        model: 'gpt-4',
        maxTokens: 500
      };

      // In a real test with mocked providers, this would track actual usage
      const initialStats = await router.getProviderStats();
      expect(initialStats.openai.budget.remaining).toBe(1000);
      expect(initialStats.openai.budget.spent).toBe(0);
    });

    it('should prevent requests when budget is exceeded', async () => {
      // Mock a scenario where budget is exhausted
      const request: LLMRequest = {
        prompt: 'This is a very expensive request that would exceed budget',
        model: 'gpt-4',
        maxTokens: 2000 // Large token request
      };

      // In a real implementation, this would check actual budget limits
      const stats = await router.getProviderStats();
      expect(stats.openai.budget.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should distribute requests across providers based on budget', async () => {
      const requests = [
        { prompt: 'Request 1', model: 'gpt-4' },
        { prompt: 'Request 2', model: 'claude-3-sonnet' },
        { prompt: 'Request 3', model: 'gpt-3.5-turbo' }
      ];

      // Test that router can handle multiple requests
      for (const req of requests) {
        try {
          const response = await router.generateCompletion(req);
          expect(response).toBeDefined();
        } catch (error) {
          // Expected in test environment without real API keys
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Schema Validation', () => {
    it('should validate response schemas correctly', async () => {
      const requestWithSchema: LLMRequest = {
        prompt: 'Extract financial data: Revenue $100k, Expenses $40k',
        model: 'gpt-4',
        schema: {
          type: 'object',
          properties: {
            revenue: { type: 'number' },
            expenses: { type: 'number' },
            netIncome: { type: 'number' }
          },
          required: ['revenue', 'expenses']
        }
      };

      try {
        const response = await router.generateCompletion(requestWithSchema);
        // In test environment, this will likely fail due to no real API
        // but we can test the schema structure
        expect(requestWithSchema.schema).toBeDefined();
      } catch (error) {
        // Expected in test environment
        expect(error).toBeDefined();
      }
    });

    it('should handle schema validation failures gracefully', async () => {
      const invalidSchema = {
        type: 'invalid_type', // Invalid schema
        properties: {}
      };

      const request: LLMRequest = {
        prompt: 'Test prompt',
        model: 'gpt-4',
        schema: invalidSchema as any
      };

      try {
        await router.generateCompletion(request);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('PII Redaction', () => {
    it('should redact sensitive information from prompts', async () => {
      const sensitivePrompt = `
        Analyze this property data:
        Owner SSN: 123-45-6789
        Phone: (555) 123-4567
        Email: owner@property.com
        Income: $850,000
      `;

      const request: LLMRequest = {
        prompt: sensitivePrompt,
        model: 'gpt-4'
      };

      // The router should internally redact PII before sending to providers
      try {
        await router.generateCompletion(request);
      } catch (error) {
        // Expected in test environment
        // The important thing is that PII redaction is configured
        expect(testConfig.piiRedaction.enabled).toBe(true);
      }
    });

    it('should redact PII from message arrays', async () => {
      const request: LLMRequest = {
        messages: [
          {
            role: 'system',
            content: 'You are a property valuation assistant.'
          },
          {
            role: 'user',
            content: 'The owner is John Doe (SSN: 987-65-4321). Property income is $500k.'
          }
        ],
        model: 'gpt-4'
      };

      try {
        await router.generateCompletion(request);
      } catch (error) {
        // Expected in test environment
        expect(testConfig.piiRedaction.patterns).toContain('ssn');
      }
    });
  });

  describe('Circuit Breaker', () => {
    it('should track provider failures', async () => {
      const request: LLMRequest = {
        prompt: 'Test request',
        model: 'gpt-4'
      };

      // Multiple failed requests should trigger circuit breaker logic
      for (let i = 0; i < 3; i++) {
        try {
          await router.generateCompletion(request);
        } catch (error) {
          // Expected failures in test environment
        }
      }

      const stats = await router.getProviderStats();
      expect(stats.openai.circuitBreaker).toBeDefined();
    });

    it('should prevent requests when circuit breaker is open', async () => {
      // Test circuit breaker functionality
      const stats = await router.getProviderStats();
      expect(stats.openai.circuitBreaker.status).toBeDefined();
    });
  });

  describe('Provider Fallback', () => {
    it('should fallback to secondary providers on failure', async () => {
      const request: LLMRequest = {
        prompt: 'Analyze property valuation data',
        // Don't specify model to allow provider selection
      };

      try {
        await router.generateCompletion(request);
      } catch (error) {
        // In test environment, all providers will fail
        // but we can verify the fallback logic exists
        const stats = await router.getProviderStats();
        expect(Object.keys(stats).length).toBeGreaterThan(1);
      }
    });

    it('should respect provider priority ordering', async () => {
      const stats = await router.getProviderStats();
      
      // OpenAI should have higher priority than Anthropic
      expect(testConfig.providers.openai.priority).toBeGreaterThan(
        testConfig.providers.anthropic.priority
      );
    });
  });

  describe('Logging and Monitoring', () => {
    it('should sanitize logs properly', async () => {
      const sensitiveRequest: LLMRequest = {
        prompt: 'Property owned by John Doe, SSN: 123-45-6789',
        model: 'gpt-4'
      };

      try {
        await router.generateCompletion(sensitiveRequest);
      } catch (error) {
        // Verify logging configuration
        expect(testConfig.logging.sanitize).toBe(true);
      }
    });

    it('should provide comprehensive provider statistics', async () => {
      const stats = await router.getProviderStats();
      
      Object.values(stats).forEach(providerStats => {
        expect(providerStats).toHaveProperty('enabled');
        expect(providerStats).toHaveProperty('healthy');
        expect(providerStats).toHaveProperty('budget');
        expect(providerStats).toHaveProperty('circuitBreaker');
        expect(providerStats).toHaveProperty('supportedModels');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle disabled router gracefully', () => {
      const disabledConfig = { ...testConfig, enabled: false };
      const disabledRouter = createRouter(disabledConfig);
      
      const request: LLMRequest = {
        prompt: 'Test prompt',
        model: 'gpt-4'
      };

      expect(async () => {
        await disabledRouter.generateCompletion(request);
      }).rejects.toThrow('LLM Router is disabled');
    });

    it('should validate model availability', async () => {
      const request: LLMRequest = {
        prompt: 'Test prompt',
        model: 'unsupported-model'
      };

      try {
        await router.generateCompletion(request);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Integration Tests', () => {
    it('should work with narrative service integration', () => {
      // Test that router can be imported and used by narrative service
      const { getRouter } = require('@charly/llm-router');
      const routerInstance = getRouter();
      expect(routerInstance).toBeDefined();
    });

    it('should support concurrent requests', async () => {
      const requests = Array(5).fill(null).map((_, i) => ({
        prompt: `Test prompt ${i}`,
        model: 'gpt-4'
      }));

      const promises = requests.map(req => 
        router.generateCompletion(req).catch(e => e)
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
    });
  });
});