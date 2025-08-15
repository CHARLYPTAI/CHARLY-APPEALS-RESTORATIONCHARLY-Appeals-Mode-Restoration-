import { describe, it, expect, beforeEach } from 'vitest'
import { BudgetTracker } from '../../src/budget-tracker.js'
import { BudgetConfig, TokenUsageRecord } from '../../src/types.js'

describe('BudgetTracker', () => {
  let budgetTracker: BudgetTracker
  let budgetConfig: Map<string, BudgetConfig>

  beforeEach(() => {
    budgetConfig = new Map([
      ['openai', {
        dailyLimitCents: 1000,
        perRequestLimitCents: 100,
        tokenCostPerK: 2.5
      }],
      ['anthropic', {
        dailyLimitCents: 2000,
        perRequestLimitCents: 200,
        tokenCostPerK: 3.0
      }]
    ])
    budgetTracker = new BudgetTracker(budgetConfig)
  })

  describe('budget enforcement', () => {
    it('should allow requests within per-request limit', async () => {
      const allowed = await budgetTracker.checkBudget('openai', 50)
      expect(allowed).toBe(true)
    })

    it('should reject requests exceeding per-request limit', async () => {
      const allowed = await budgetTracker.checkBudget('openai', 150)
      expect(allowed).toBe(false)
    })

    it('should allow requests within daily limit', async () => {
      const record: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 50,
        timestamp: new Date(),
        requestId: 'test-request-1'
      }
      
      await budgetTracker.recordUsage(record)
      
      const allowed = await budgetTracker.checkBudget('openai', 50)
      expect(allowed).toBe(true)
    })

    it('should reject requests exceeding daily limit', async () => {
      const record: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
        costCents: 950,
        timestamp: new Date(),
        requestId: 'test-request-1'
      }
      
      await budgetTracker.recordUsage(record)
      
      const allowed = await budgetTracker.checkBudget('openai', 100)
      expect(allowed).toBe(false)
    })

    it('should return false for unknown provider', async () => {
      const allowed = await budgetTracker.checkBudget('unknown', 50)
      expect(allowed).toBe(false)
    })
  })

  describe('usage tracking', () => {
    it('should track daily costs correctly', async () => {
      const record1: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 50,
        timestamp: new Date(),
        requestId: 'test-request-1'
      }
      
      const record2: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
        costCents: 75,
        timestamp: new Date(),
        requestId: 'test-request-2'
      }
      
      await budgetTracker.recordUsage(record1)
      await budgetTracker.recordUsage(record2)
      
      const dailyCost = budgetTracker.getDailyCost('openai')
      expect(dailyCost).toBe(125)
    })

    it('should track daily tokens correctly', async () => {
      const record: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 50,
        timestamp: new Date(),
        requestId: 'test-request-1'
      }
      
      await budgetTracker.recordUsage(record)
      
      const dailyTokens = budgetTracker.getDailyTokens('openai')
      expect(dailyTokens).toBe(150)
    })

    it('should calculate remaining budget correctly', async () => {
      const record: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 300,
        timestamp: new Date(),
        requestId: 'test-request-1'
      }
      
      await budgetTracker.recordUsage(record)
      
      const remaining = budgetTracker.getRemainingBudget('openai')
      expect(remaining).toBe(700)
    })

    it('should provide comprehensive usage stats', async () => {
      const record: TokenUsageRecord = {
        providerId: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
        costCents: 250,
        timestamp: new Date(),
        requestId: 'test-request-1'
      }
      
      await budgetTracker.recordUsage(record)
      
      const stats = budgetTracker.getUsageStats('openai')
      expect(stats).toEqual({
        dailyCostCents: 250,
        dailyTokens: 150,
        remainingBudgetCents: 750,
        requestCount: 1
      })
    })
  })
})