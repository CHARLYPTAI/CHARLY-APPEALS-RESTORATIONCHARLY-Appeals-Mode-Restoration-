import { PIIRedactor } from './pii-redaction.js'

export interface LogEntry {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  requestId?: string
  provider?: string
  model?: string
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  costCents?: number
  duration?: number
  error?: any
  metadata?: Record<string, any>
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  sanitize: boolean
  redactor?: PIIRedactor
}

export class StructuredLogger {
  private redactor?: PIIRedactor
  
  constructor(private config: LoggerConfig) {
    this.redactor = config.redactor
  }

  debug(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog('debug')) {
      this.log('debug', message, meta)
    }
  }

  info(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog('info')) {
      this.log('info', message, meta)
    }
  }

  warn(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog('warn')) {
      this.log('warn', message, meta)
    }
  }

  error(message: string, meta?: Partial<LogEntry>): void {
    if (this.shouldLog('error')) {
      this.log('error', message, meta)
    }
  }

  logRequest(requestId: string, provider: string, model: string, meta?: Record<string, any>): void {
    this.info('LLM request initiated', {
      requestId,
      provider,
      model,
      metadata: meta
    })
  }

  logResponse(requestId: string, provider: string, model: string, tokenUsage: LogEntry['tokenUsage'], costCents: number, duration: number): void {
    this.info('LLM request completed', {
      requestId,
      provider,
      model,
      tokenUsage,
      costCents,
      duration
    })
  }

  logError(requestId: string, provider: string, error: any, meta?: Record<string, any>): void {
    this.error('LLM request failed', {
      requestId,
      provider,
      error: this.sanitizeError(error),
      metadata: meta
    })
  }

  logBudgetViolation(provider: string, requestId: string, attemptedCost: number, remainingBudget: number): void {
    this.warn('Budget limit exceeded', {
      provider,
      requestId,
      metadata: {
        attemptedCostCents: attemptedCost,
        remainingBudgetCents: remainingBudget
      }
    })
  }

  logCircuitBreakerEvent(provider: string, event: 'opened' | 'closed' | 'half-open', failureCount?: number): void {
    this.warn(`Circuit breaker ${event}`, {
      provider,
      metadata: {
        event,
        failureCount
      }
    })
  }

  logValidationFailure(requestId: string, errors: string[]): void {
    this.warn('Response validation failed', {
      requestId,
      metadata: {
        validationErrors: errors
      }
    })
  }

  private log(level: LogEntry['level'], message: string, meta?: Partial<LogEntry>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message: this.sanitizeText(message),
      ...meta
    }

    if (entry.metadata) {
      entry.metadata = this.sanitizeObject(entry.metadata)
    }

    console.log(JSON.stringify(entry))
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const configLevel = levels.indexOf(this.config.level)
    const messageLevel = levels.indexOf(level)
    return messageLevel >= configLevel
  }

  private sanitizeText(text: string): string {
    if (!this.config.sanitize || !this.redactor) {
      return text
    }
    return this.redactor.redact(text)
  }

  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    if (!this.config.sanitize) {
      return obj
    }

    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeText(value)
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  private sanitizeError(error: any): any {
    if (!error) return error

    const sanitized: any = {
      message: this.sanitizeText(error.message || ''),
      code: error.code,
      status: error.status || error.response?.status
    }

    if (error.stack && !this.config.sanitize) {
      sanitized.stack = error.stack
    }

    return sanitized
  }
}