// Mock implementation of @charly/llm-router for testing

export interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class MockLLMRouter {
  async invoke(request: LLMRequest): Promise<LLMResponse> {
    return {
      content: `Mock response for: ${request.prompt.substring(0, 50)}...`,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150
      }
    };
  }
}

export function getRouter(): MockLLMRouter {
  return new MockLLMRouter();
}