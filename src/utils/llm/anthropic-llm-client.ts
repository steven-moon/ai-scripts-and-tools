/**
 * Anthropic LLM Client
 * Implementation for Anthropic's API (Claude models)
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult, LLMLogger } from './base-llm-client';
import { HttpResponse } from '../httpClient';

export interface AnthropicClientOptions extends LLMClientOptions {
  // API key for Anthropic
  apiKey: string;
  
  // Model to use (defaults to claude-3-sonnet-20240229)
  model?: string;
  
  // API endpoint (defaults to standard Anthropic endpoint)
  endpoint?: string;
}

export class AnthropicLLMClient extends BaseLLMClient {
  private static DEFAULT_MODEL = 'claude-3-sonnet-20240229';
  private static DEFAULT_ENDPOINT = 'https://api.anthropic.com/v1/messages';
  
  constructor(options: AnthropicClientOptions) {
    super({
      model: AnthropicLLMClient.DEFAULT_MODEL,
      endpoint: AnthropicLLMClient.DEFAULT_ENDPOINT,
      ...options
    });
    
    if (!options.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }
  
  public async getCompletion(prompt: string, overrideOptions?: Partial<LLMClientOptions>): Promise<LLMCompletionResult> {
    const options = {
      ...this.options,
      ...overrideOptions
    };
    
    LLMLogger.info(`Using Anthropic API with model: ${options.model}`);
    
    // Send the request using the common implementation
    return this.sendLLMRequest(prompt, options, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': options.apiKey as string,
        'anthropic-version': '2023-06-01'
      }
    });
  }
  
  /**
   * Format the request body according to Anthropic's requirements
   */
  protected formatRequestBody(prompt: string, options: LLMClientOptions): any {
    const { model, maxTokens, temperature } = options;
    
    // Anthropic's message format
    return {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    };
  }
  
  /**
   * Parse the response according to Anthropic's format
   */
  protected parseResponse(response: HttpResponse): LLMCompletionResult {
    try {
      const parsedResponse = JSON.parse(response.data);
      
      if (parsedResponse.error) {
        throw this.createError(`Anthropic API error: ${parsedResponse.error.message}`, 
          parsedResponse.error.status || 400, 
          parsedResponse.error);
      }
      
      if (!parsedResponse.content || parsedResponse.content.length === 0) {
        throw this.createError("Invalid response format from Anthropic API: no content returned", 400);
      }
      
      // Extract text from response
      let text = '';
      
      // Anthropic returns an array of content blocks
      for (const block of parsedResponse.content) {
        if (block.type === 'text') {
          text += block.text;
        }
      }
      
      if (!text) {
        throw this.createError("No text content found in Anthropic response", 400, parsedResponse.content);
      }
      
      return {
        text: text.trim(),
        usage: parsedResponse.usage || {}
      };
    } catch (error: any) {
      if (error.message && error.message.includes('Anthropic API')) {
        throw error; // Re-throw our own formatted errors
      }
      LLMLogger.error("Raw API response:", response.data);
      throw this.createError(`Error parsing Anthropic response: ${error.message}`, 500);
    }
  }
  
  public getName(): string {
    return 'Anthropic';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 