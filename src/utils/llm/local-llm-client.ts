/**
 * Local LLM Client
 * Implementation for local LLM servers like Ollama or LM Studio
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult, LLMLogger } from './base-llm-client';
import { HttpResponse } from '../httpClient';

export interface LocalLLMClientOptions extends LLMClientOptions {
  // Default model for local LLMs
  model?: string;
  
  // Default endpoint for local LLMs
  endpoint?: string;
}

export class LocalLLMClient extends BaseLLMClient {
  private static DEFAULT_MODEL = 'llama-3.2-3b-instruct';
  private static DEFAULT_ENDPOINT = 'http://127.0.0.1:1234/v1/completions';
  
  constructor(options: LocalLLMClientOptions = {}) {
    super({
      model: LocalLLMClient.DEFAULT_MODEL,
      endpoint: LocalLLMClient.DEFAULT_ENDPOINT,
      ...options
    });
  }
  
  public async getCompletion(prompt: string, overrideOptions?: Partial<LLMClientOptions>): Promise<LLMCompletionResult> {
    const options = {
      ...this.options,
      ...overrideOptions
    };
    
    LLMLogger.info(`Using Local LLM with model: ${options.model || 'default'}`);
    
    // Send the request using the common implementation
    return this.sendLLMRequest(prompt, options, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Format the request body for local LLM servers
   */
  protected formatRequestBody(prompt: string, options: LLMClientOptions): any {
    const { model, maxTokens, temperature } = options;
    
    // OpenAI-compatible format used by most local LLM servers
    return {
      model: model,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: temperature
    };
  }
  
  /**
   * Parse the response from local LLM servers
   */
  protected parseResponse(response: HttpResponse): LLMCompletionResult {
    try {
      const parsedResponse = JSON.parse(response.data);
      
      if (parsedResponse.error) {
        throw this.createError(`Local LLM API error: ${parsedResponse.error.message || JSON.stringify(parsedResponse.error)}`, 
          parsedResponse.error.status || 400, 
          parsedResponse.error);
      }
      
      if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
        throw this.createError("Invalid response format from Local LLM API: no choices returned", 400, parsedResponse);
      }
      
      if (!parsedResponse.choices[0].text) {
        throw this.createError("No text content found in Local LLM response", 400, parsedResponse.choices[0]);
      }
      
      return {
        text: parsedResponse.choices[0].text.trim(),
        usage: parsedResponse.usage || {}
      };
    } catch (error: any) {
      if (error.message && error.message.includes('Local LLM API')) {
        throw error; // Re-throw our own formatted errors
      }
      LLMLogger.error("Raw API response:", response.data);
      throw this.createError(`Error parsing Local LLM response: ${error.message}`, 500);
    }
  }
  
  public getName(): string {
    return 'Local LLM';
  }
  
  public isConfigured(): boolean {
    return !!this.options.endpoint;
  }
} 