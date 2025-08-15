import type { CircuitBreakerState } from './types.js'

export class CircuitBreaker {
  private states = new Map<string, CircuitBreakerState>()
  
  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async canExecute(providerId: string): Promise<boolean> {
    const state = this.getState(providerId)
    
    switch (state.state) {
      case 'closed':
        return true
        
      case 'open':
        if (state.nextRetryTime && Date.now() >= state.nextRetryTime.getTime()) {
          this.transitionToHalfOpen(providerId)
          return true
        }
        return false
        
      case 'half-open':
        return true
        
      default:
        return false
    }
  }

  async recordSuccess(providerId: string): Promise<void> {
    const state = this.getState(providerId)
    
    if (state.state === 'half-open') {
      this.transitionToClosed(providerId)
    } else if (state.state === 'closed') {
      this.resetFailureCount(providerId)
    }
  }

  async recordFailure(providerId: string): Promise<void> {
    const state = this.getState(providerId)
    state.failureCount++
    state.lastFailureTime = new Date()
    
    if (state.failureCount >= this.failureThreshold) {
      this.transitionToOpen(providerId)
    }
  }

  getState(providerId: string): CircuitBreakerState {
    if (!this.states.has(providerId)) {
      this.states.set(providerId, {
        state: 'closed',
        failureCount: 0
      })
    }
    return this.states.get(providerId)!
  }

  getStats(providerId: string): {
    state: string
    failureCount: number
    lastFailureTime?: Date
    nextRetryTime?: Date
  } {
    const state = this.getState(providerId)
    return {
      state: state.state,
      failureCount: state.failureCount,
      lastFailureTime: state.lastFailureTime,
      nextRetryTime: state.nextRetryTime
    }
  }

  private transitionToClosed(providerId: string): void {
    this.states.set(providerId, {
      state: 'closed',
      failureCount: 0
    })
  }

  private transitionToOpen(providerId: string): void {
    const state = this.getState(providerId)
    state.state = 'open'
    state.nextRetryTime = new Date(Date.now() + this.resetTimeoutMs)
  }

  private transitionToHalfOpen(providerId: string): void {
    const state = this.getState(providerId)
    state.state = 'half-open'
    state.nextRetryTime = undefined
  }

  private resetFailureCount(providerId: string): void {
    const state = this.getState(providerId)
    if (state.failureCount > 0) {
      state.failureCount = Math.max(0, state.failureCount - 1)
    }
  }
}