/**
 * Anthropic LLM Client
 * Implementation for Anthropic's API (Claude models)
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult } from './base-llm-client';
import { HttpClient } from '../httpClient';
import { TempFileManager } from '../tempFile';

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
    
    const { model, maxTokens, temperature, apiKey, endpoint } = options;
    
    // Create the request body (Anthropic format)
    const requestBody = {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    };
    
    try {
      // Make the HTTP request using our HttpClient
      const response = await HttpClient.post(
        endpoint as string,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey as string,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      try {
        // Parse the response
        const parsedResponse = JSON.parse(response.data);
        
        if (parsedResponse.error) {
          throw new Error(`Anthropic API error: ${parsedResponse.error.message}`);
        }
        
        if (parsedResponse && parsedResponse.content && parsedResponse.content.length > 0) {
          // Extract text from response
          let text = '';
          
          // Anthropic returns an array of content blocks
          for (const block of parsedResponse.content) {
            if (block.type === 'text') {
              text += block.text;
            }
          }
          
          return {
            text: text.trim(),
            usage: parsedResponse.usage || {}
          };
        } else {
          throw new Error("Invalid response format from Anthropic API");
        }
      } catch (error) {
        console.error("Raw API response:", response.data);
        throw new Error(`Error parsing Anthropic response: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error calling Anthropic API: ${error}`);
    }
  }
  
  public getName(): string {
    return 'Anthropic';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 