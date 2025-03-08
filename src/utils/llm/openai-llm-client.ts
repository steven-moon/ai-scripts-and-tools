/**
 * OpenAI LLM Client
 * Implementation for OpenAI's API (GPT models)
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult, LLMLogger } from './base-llm-client';
import { HttpResponse } from '../httpClient';

export interface OpenAIClientOptions extends LLMClientOptions {
  // API key for OpenAI
  apiKey: string;
  
  // Model to use (defaults to gpt-3.5-turbo-instruct)
  model?: string;
  
  // API endpoint (defaults to standard OpenAI endpoint)
  endpoint?: string;
}

export class OpenAILLMClient extends BaseLLMClient {
  private static DEFAULT_MODEL = 'gpt-3.5-turbo-instruct';
  private static DEFAULT_ENDPOINT = 'https://api.openai.com/v1/completions';
  private static CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  
  // List of models that require the chat API
  private static CHAT_MODELS = [
    'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4o-2024'
  ];
  
  constructor(options: OpenAIClientOptions) {
    super({
      model: OpenAILLMClient.DEFAULT_MODEL,
      endpoint: OpenAILLMClient.DEFAULT_ENDPOINT,
      ...options
    });
    
    if (!options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }
  
  /**
   * Determine if a model requires the chat completions API
   */
  private isChatModel(model: string): boolean {
    return OpenAILLMClient.CHAT_MODELS.some(chatModel => 
      model.toLowerCase().includes(chatModel.toLowerCase())
    );
  }
  
  public async getCompletion(prompt: string, overrideOptions?: Partial<LLMClientOptions>): Promise<LLMCompletionResult> {
    const options = {
      ...this.options,
      ...overrideOptions
    };
    
    const { model } = options;
    
    // Determine if we need to use the chat API based on the model name
    const usesChatAPI = this.isChatModel(model || '');
    
    // Set the correct endpoint based on the model type
    if (usesChatAPI) {
      options.endpoint = OpenAILLMClient.CHAT_ENDPOINT;
    }
    
    LLMLogger.info(`Using OpenAI ${usesChatAPI ? 'chat' : 'completions'} API for model: ${model}`);
    
    // Send the request using the common implementation
    return this.sendLLMRequest(prompt, options, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`
      }
    });
  }
  
  /**
   * Format the request body according to OpenAI's requirements
   */
  protected formatRequestBody(prompt: string, options: LLMClientOptions): any {
    const { model, maxTokens, temperature } = options;
    const usesChatAPI = this.isChatModel(model || '');
    
    if (usesChatAPI) {
      // Chat completions format
      return {
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature
      };
    } else {
      // Regular completions format
      return {
        model: model,
        prompt: prompt,
        max_tokens: maxTokens,
        temperature: temperature
      };
    }
  }
  
  /**
   * Parse the response according to OpenAI's format
   */
  protected parseResponse(response: HttpResponse): LLMCompletionResult {
    try {
      const parsedResponse = JSON.parse(response.data);
      
      if (parsedResponse.error) {
        throw this.createError(`OpenAI API error: ${parsedResponse.error.message}`, 
          parsedResponse.error.status || 400, 
          parsedResponse.error);
      }
      
      if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
        throw this.createError("Invalid response format from OpenAI API: no choices returned", 400);
      }
      
      const usesChatAPI = parsedResponse.choices[0].message !== undefined;
      
      // Extract text based on API type
      let text = '';
      
      if (usesChatAPI) {
        if (parsedResponse.choices[0].message && parsedResponse.choices[0].message.content) {
          text = parsedResponse.choices[0].message.content.trim();
          LLMLogger.debug("Extracted text from chat response", { length: text.length });
        } else {
          throw this.createError("Invalid chat response format from OpenAI API", 400, parsedResponse.choices[0]);
        }
      } else {
        if (parsedResponse.choices[0].text) {
          text = parsedResponse.choices[0].text.trim();
          LLMLogger.debug("Extracted text from completions response", { length: text.length });
        } else {
          throw this.createError("Invalid completions response format from OpenAI API", 400, parsedResponse.choices[0]);
        }
      }
        
      return {
        text: text,
        usage: parsedResponse.usage || {}
      };
    } catch (error: any) {
      if (error.message && error.message.includes('OpenAI API')) {
        throw error; // Re-throw our own formatted errors
      }
      LLMLogger.error("Raw API response:", response.data);
      throw this.createError(`Error parsing OpenAI response: ${error.message}`, 500);
    }
  }
  
  public getName(): string {
    return 'OpenAI';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 