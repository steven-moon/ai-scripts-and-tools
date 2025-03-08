/**
 * Custom LLM Client
 * Implementation for custom providers using OpenAI API format
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult, LLMLogger } from './base-llm-client';
import { HttpResponse } from '../httpClient';

export interface CustomClientOptions extends LLMClientOptions {
  // API key for custom provider
  apiKey: string;
  
  // Name of the custom provider
  providerName?: string;
  
  // Model to use
  model?: string;
  
  // API endpoint
  endpoint: string;
}

export class CustomLLMClient extends BaseLLMClient {
  private providerName: string;
  
  constructor(options: CustomClientOptions) {
    super({
      ...options
    });
    
    if (!options.apiKey) {
      throw new Error('API key is required for custom provider');
    }
    
    if (!options.endpoint) {
      throw new Error('Endpoint is required for custom provider');
    }
    
    this.providerName = options.providerName || 'Custom Provider';
  }
  
  public async getCompletion(prompt: string, overrideOptions?: Partial<LLMClientOptions>): Promise<LLMCompletionResult> {
    const options = {
      ...this.options,
      ...overrideOptions
    };
    
    LLMLogger.info(`Using ${this.providerName} with model: ${options.model || 'default'}`);
    
    // Send the request using the common implementation
    return this.sendLLMRequest(prompt, options, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`
      }
    });
  }
  
  /**
   * Format the request body (using OpenAI-like format)
   */
  protected formatRequestBody(prompt: string, options: LLMClientOptions): any {
    const { model, maxTokens, temperature } = options;
    
    // Use OpenAI-compatible format
    return {
      model: model,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: temperature
    };
  }
  
  /**
   * Parse the response (assuming OpenAI-like format)
   */
  protected parseResponse(response: HttpResponse): LLMCompletionResult {
    try {
      const parsedResponse = JSON.parse(response.data);
      
      if (parsedResponse.error) {
        throw this.createError(
          `${this.providerName} API error: ${parsedResponse.error.message || JSON.stringify(parsedResponse.error)}`,
          parsedResponse.error.status || 400,
          parsedResponse.error
        );
      }
      
      if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
        throw this.createError(
          `Invalid response format from ${this.providerName} API: no choices returned`,
          400,
          parsedResponse
        );
      }
      
      // Extract text (handle both regular and chat API formats)
      const text = parsedResponse.choices[0].text?.trim() || 
                   parsedResponse.choices[0].message?.content?.trim();
                  
      if (!text) {
        throw this.createError(
          `No text content found in ${this.providerName} response`,
          400,
          parsedResponse.choices[0]
        );
      }
      
      return {
        text: text,
        usage: parsedResponse.usage || {}
      };
    } catch (error: any) {
      if (error.message && error.message.includes(`${this.providerName} API`)) {
        throw error; // Re-throw our own formatted errors
      }
      LLMLogger.error("Raw API response:", response.data);
      throw this.createError(`Error parsing ${this.providerName} response: ${error.message}`, 500);
    }
  }
  
  public getName(): string {
    return this.providerName;
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey && !!this.options.endpoint;
  }
} 