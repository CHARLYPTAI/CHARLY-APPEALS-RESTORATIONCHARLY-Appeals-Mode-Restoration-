import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import { LLMProvider } from '../types.js'
import type { LLMRequest, LLMResponse, LLMError, ProviderConfig } from '../types.js'

export class OpenAIProvider extends LLMProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  
  private client: OpenAI
  private tokenCosts = new Map([
    ['gpt-4o', { input: 2.5, output: 10.0 }],
    ['gpt-4o-mini', { input: 0.15, output: 0.6 }],
    ['gpt-4-turbo', { input: 10.0, output: 30.0 }],
    ['gpt-3.5-turbo', { input: 0.5, output: 1.5 }]
  ])

  constructor(config: ProviderConfig) {
    super(config)
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeoutMs
    })
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.models.list()
      return true
    } catch (error) {
      return false
    }
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const requestId = uuidv4()
    const model = request.model || 'gpt-4o-mini'
    
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
      
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt })
      }
      
      if (request.messages) {
        messages.push(...request.messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })))
      } else if (request.prompt) {
        messages.push({ role: 'user', content: request.prompt })
      }

      const completion = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        response_format: request.schema ? { type: 'json_object' } : undefined
      })

      const choice = completion.choices[0]
      if (!choice?.message?.content) {
        throw new Error('No content in OpenAI response')
      }

      return {
        content: choice.message.content,
        tokenUsage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        model,
        provider: this.id,
        requestId,
        finishReason: this.mapFinishReason(choice.finish_reason)
      }
    } catch (error) {
      throw this.mapError(error, requestId, model)
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  getSupportedModels(): string[] {
    return this.config.models
  }

  calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const costs = this.tokenCosts.get(model)
    if (!costs) return 0
    
    const inputCost = (promptTokens / 1000) * costs.input
    const outputCost = (completionTokens / 1000) * costs.output
    return Math.round((inputCost + outputCost) * 100) // Convert to cents
  }

  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop': return 'stop'
      case 'length': return 'length'
      case 'content_filter': return 'content_filter'
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

    if (error?.status >= 500) {
      return {
        ...baseError,
        code: 'SERVER_ERROR',
        message: 'OpenAI server error',
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