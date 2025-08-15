import type { TokenUsageRecord, BudgetConfig } from './types.js'

export class BudgetTracker {
  private dailyUsage = new Map<string, TokenUsageRecord[]>()
  
  constructor(private config: Map<string, BudgetConfig>) {}

  async checkBudget(providerId: string, estimatedCostCents: number): Promise<boolean> {
    const budget = this.config.get(providerId)
    if (!budget) return false

    if (estimatedCostCents > budget.perRequestLimitCents) {
      return false
    }

    const dailyCost = this.getDailyCost(providerId)
    if (dailyCost + estimatedCostCents > budget.dailyLimitCents) {
      return false
    }

    return true
  }

  async recordUsage(record: TokenUsageRecord): Promise<void> {
    const today = this.getDateKey(new Date())
    const key = `${record.providerId}:${today}`
    
    if (!this.dailyUsage.has(key)) {
      this.dailyUsage.set(key, [])
    }
    
    this.dailyUsage.get(key)!.push(record)
    
    this.cleanupOldRecords()
  }

  getDailyCost(providerId: string): number {
    const today = this.getDateKey(new Date())
    const key = `${providerId}:${today}`
    const records = this.dailyUsage.get(key) || []
    
    return records.reduce((total, record) => total + record.costCents, 0)
  }

  getDailyTokens(providerId: string): number {
    const today = this.getDateKey(new Date())
    const key = `${providerId}:${today}`
    const records = this.dailyUsage.get(key) || []
    
    return records.reduce((total, record) => total + record.totalTokens, 0)
  }

  getRemainingBudget(providerId: string): number {
    const budget = this.config.get(providerId)
    if (!budget) return 0
    
    const dailyCost = this.getDailyCost(providerId)
    return Math.max(0, budget.dailyLimitCents - dailyCost)
  }

  getUsageStats(providerId: string): {
    dailyCostCents: number
    dailyTokens: number
    remainingBudgetCents: number
    requestCount: number
  } {
    const today = this.getDateKey(new Date())
    const key = `${providerId}:${today}`
    const records = this.dailyUsage.get(key) || []
    
    return {
      dailyCostCents: this.getDailyCost(providerId),
      dailyTokens: this.getDailyTokens(providerId),
      remainingBudgetCents: this.getRemainingBudget(providerId),
      requestCount: records.length
    }
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private cleanupOldRecords(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)
    const cutoffKey = this.getDateKey(cutoffDate)
    
    for (const [key] of this.dailyUsage) {
      const [, dateStr] = key.split(':')
      if (dateStr < cutoffKey) {
        this.dailyUsage.delete(key)
      }
    }
  }
}