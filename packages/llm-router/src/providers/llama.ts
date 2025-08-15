import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { LLMProvider } from '../types.js'
import type { LLMRequest, LLMResponse, LLMError, ProviderConfig } from '../types.js'

export class LlamaProvider extends LLMProvider {
  readonly id = 'llama'
  readonly name = 'LLaMA'
  
  private client: AxiosInstance
  private tokenCosts = new Map([
    ['llama-3.1-8b', { input: 0.1, output: 0.1 }],
    ['llama-3.1-70b', { input: 0.5, output: 0.8 }],
    ['llama-3.1-405b', { input: 2.0, output: 3.0 }],
    ['llama-3.2-1b', { input: 0.05, output: 0.05 }],
    ['llama-3.2-3b', { input: 0.1, output: 0.1 }]
  ])

  constructor(config: ProviderConfig) {
    super(config)
    this.client = axios.create({
      baseURL: config.baseUrl || 'http://localhost:11434',
      timeout: config.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    })
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags')
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  async generateCompletion(request: LLMRequest): Promise<LLMResponse> {
    const requestId = uuidv4()
    const model = request.model || 'llama-3.2-3b'
    
    try {
      let prompt = ''
      
      if (request.systemPrompt) {
        prompt += `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n${request.systemPrompt}<|eot_id|>\n`
      }
      
      if (request.messages) {
        for (const msg of request.messages) {
          prompt += `<|start_header_id|>${msg.role}<|end_header_id|>\n${msg.content}<|eot_id|>\n`
        }
        prompt += '<|start_header_id|>assistant<|end_header_id|>\n'
      } else if (request.prompt) {
        prompt += `<|start_header_id|>user<|end_header_id|>\n${request.prompt}<|eot_id|>\n<|start_header_id|>assistant<|end_header_id|>\n`
      }

      const response = await this.client.post('/api/generate', {
        model,
        prompt,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 1000
        },
        stream: false
      })

      if (!response.data?.response) {
        throw new Error('No content in LLaMA response')
      }

      const promptTokens = this.estimateTokens(prompt)
      const completionTokens = this.estimateTokens(response.data.response)

      return {
        content: response.data.response,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        },
        model,
        provider: this.id,
        requestId,
        finishReason: response.data.done ? 'stop' : 'length'
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
    return Math.round((inputCost + outputCost) * 100)
  }

  private mapError(error: any, requestId: string, model?: string): LLMError {
    const baseError = {
      provider: this.id,
      model,
      requestId
    }

    if (error?.response?.status === 429) {
      return {
        ...baseError,
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        retryable: true
      }
    }

    if (error?.response?.status === 401) {
      return {
        ...baseError,
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
        retryable: false
      }
    }

    if (error?.response?.status === 404) {
      return {
        ...baseError,
        code: 'MODEL_NOT_FOUND',
        message: `Model ${model} not found`,
        retryable: false
      }
    }

    if (error?.code === 'ECONNREFUSED') {
      return {
        ...baseError,
        code: 'CONNECTION_REFUSED',
        message: 'LLaMA server not reachable',
        retryable: true
      }
    }

    if (error?.response?.status >= 500) {
      return {
        ...baseError,
        code: 'SERVER_ERROR',
        message: 'LLaMA server error',
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