import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import { LLMProvider } from '../types.js'
import type { LLMRequest, LLMResponse, LLMError, ProviderConfig } from '../types.js'

export class AnthropicProvider extends LLMProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic Claude'
  
  private client: Anthropic
  private tokenCosts = new Map([
    ['claude-3-5-sonnet-20241022', { input: 3.0, output: 15.0 }],
    ['claude-3-5-haiku-20241022', { input: 0.25, output: 1.25 }],
    ['claude-3-opus-20240229', { input: 15.0, output: 75.0 }],
    ['claude-3-sonnet-20240229', { input: 3.0, output: 15.0 }],
    ['claude-3-haiku-20240307', { input: 0.25, output: 1.25 }]
  ])

  constructor(config: ProviderConfig) {
    super(config)
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeoutMs
    })
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
      return true
    } catch (error: any) {
      if (error?.status === 401) return false
      return true
    }
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const requestId = uuidv4()
    const model = request.model || 'claude-3-5-haiku-20241022'
    
    try {
      const messages: Anthropic.MessageParam[] = []
      
      if (request.messages) {
        messages.push(...request.messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })))
      } else if (request.prompt) {
        messages.push({ role: 'user', content: request.prompt })
      }

      const completion = await this.client.messages.create({
        model,
        messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        system: request.systemPrompt
      })

      const content = completion.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('')

      if (!content) {
        throw new Error('No content in Anthropic response')
      }

      return {
        content,
        tokenUsage: {
          promptTokens: completion.usage.input_tokens,
          completionTokens: completion.usage.output_tokens,
          totalTokens: completion.usage.input_tokens + completion.usage.output_tokens
        },
        model,
        provider: this.id,
        requestId,
        finishReason: this.mapFinishReason(completion.stop_reason)
      }
    } catch (error) {
      throw this.mapError(error, requestId, model)
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5)
  }

  getSupportedModels(): string[] {
    return this.config.models
  }

  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = this.tokenCosts.get(model)
    if (!costs) return 0
    
    const inputCost = (promptTokens / 1000) * costs.input
    const outputCost = (completionTokens / 1000) * costs.output
    return Math.round((inputCost + outputCost) * 100)
  }

  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'end_turn': return 'stop'
      case 'max_tokens': return 'length'
      case 'stop_sequence': return 'stop'
      default: return 'error'
    }
  }

  private mapError(error: any, requestId: string, model?: string): LLMError {
    const baseError = {
      provider: this.id,
      model,
      requestId
    }

    if (error?.status === 429) {
      return {
        ...baseError,
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        retryable: true
      }
    }

    if (error?.status === 401) {
      return {
        ...baseError,
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
        retryable: false
      }
    }

    if (error?.status === 400) {
      return {
        ...baseError,
        code: 'BAD_REQUEST',
        message: error?.message || 'Bad request',
        retryable: false
      }
    }

    if (error?.status >= 500) {
      return {
        ...baseError,
        code: 'SERVER_ERROR',
        message: 'Anthropic server error',
        retryable: true
      }
    }

    return {
      ...baseError,
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'Unknown error',
      retryable: false
    }
  }
}