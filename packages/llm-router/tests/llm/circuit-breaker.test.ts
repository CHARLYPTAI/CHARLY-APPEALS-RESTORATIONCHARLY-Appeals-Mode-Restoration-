import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CircuitBreaker } from '../../src/circuit-breaker.js'

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 30000) // 3 failures, 30s reset
  })

  describe('circuit states', () => {
    it('should start in closed state', async () => {
      const canExecute = await circuitBreaker.canExecute('test-provider')
      expect(canExecute).toBe(true)
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.state).toBe('closed')
      expect(stats.failureCount).toBe(0)
    })

    it('should remain closed after successful requests', async () => {
      await circuitBreaker.recordSuccess('test-provider')
      await circuitBreaker.recordSuccess('test-provider')
      
      const canExecute = await circuitBreaker.canExecute('test-provider')
      expect(canExecute).toBe(true)
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.state).toBe('closed')
    })

    it('should open after threshold failures', async () => {
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      
      const canExecute = await circuitBreaker.canExecute('test-provider')
      expect(canExecute).toBe(false)
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.state).toBe('open')
      expect(stats.failureCount).toBe(3)
    })

    it('should transition to half-open after timeout', async () => {
      vi.useFakeTimers()
      
      // Trigger circuit breaker
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      
      expect(await circuitBreaker.canExecute('test-provider')).toBe(false)
      
      // Fast-forward past reset timeout
      vi.advanceTimersByTime(35000)
      
      const canExecute = await circuitBreaker.canExecute('test-provider')
      expect(canExecute).toBe(true)
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.state).toBe('half-open')
      
      vi.useRealTimers()
    })

    it('should close from half-open on success', async () => {
      vi.useFakeTimers()
      
      // Open circuit
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      
      // Move to half-open
      vi.advanceTimersByTime(35000)
      await circuitBreaker.canExecute('test-provider')
      
      // Success should close circuit
      await circuitBreaker.recordSuccess('test-provider')
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.state).toBe('closed')
      expect(stats.failureCount).toBe(0)
      
      vi.useRealTimers()
    })

    it('should reopen from half-open on failure', async () => {
      vi.useFakeTimers()
      
      // Open circuit
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      await circuitBreaker.recordFailure('test-provider')
      
      // Move to half-open
      vi.advanceTimersByTime(35000)
      await circuitBreaker.canExecute('test-provider')
      
      // Failure should reopen circuit
      await circuitBreaker.recordFailure('test-provider')
      
      const canExecute = await circuitBreaker.canExecute('test-provider')
      expect(canExecute).toBe(false)
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.state).toBe('open')
      
      vi.useRealTimers()
    })
  })

  describe('failure count management', () => {
    it('should increment failure count on each failure', async () => {
      await circuitBreaker.recordFailure('test-provider')
      expect(circuitBreaker.getStats('test-provider').failureCount).toBe(1)
      
      await circuitBreaker.recordFailure('test-provider')
      expect(circuitBreaker.getStats('test-provider').failureCount).toBe(2)
    })

    it('should track last failure time', async () => {
      const beforeFailure = new Date()
      await circuitBreaker.recordFailure('test-provider')
      const afterFailure = new Date()
      
      const stats = circuitBreaker.getStats('test-provider')
      expect(stats.lastFailureTime).toBeDefined()
      expect(stats.lastFailureTime!.getTime()).toBeGreaterThanOrEqual(beforeFailure.getTime())
      expect(stats.lastFailureTime!.getTime()).toBeLessThanOrEqual(afterFailure.getTime())
    })
  })

  describe('multiple providers', () => {
    it('should maintain separate state per provider', async () => {
      await circuitBreaker.recordFailure('provider-1')
      await circuitBreaker.recordFailure('provider-1')
      await circuitBreaker.recordFailure('provider-1')
      
      await circuitBreaker.recordFailure('provider-2')
      
      expect(await circuitBreaker.canExecute('provider-1')).toBe(false)
      expect(await circuitBreaker.canExecute('provider-2')).toBe(true)
      
      expect(circuitBreaker.getStats('provider-1').state).toBe('open')
      expect(circuitBreaker.getStats('provider-2').state).toBe('closed')
    })
  })
})