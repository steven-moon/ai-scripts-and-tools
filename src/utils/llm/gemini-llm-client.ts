/**
 * Google Gemini LLM Client
 * Implementation for Google's Gemini API
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult, LLMLogger } from './base-llm-client';
import { HttpResponse } from '../httpClient';

export interface GeminiClientOptions extends LLMClientOptions {
  // API key for Google AI Studio
  apiKey: string;
  
  // Model to use (defaults to gemini-1.5-flash)
  model?: string;
  
  // API endpoint (defaults to standard Gemini endpoint)
  endpoint?: string;
}

export class GeminiLLMClient extends BaseLLMClient {
  private static DEFAULT_MODEL = 'gemini-1.5-flash';
  private static DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1';
  
  constructor(options: GeminiClientOptions) {
    super({
      model: GeminiLLMClient.DEFAULT_MODEL,
      endpoint: GeminiLLMClient.DEFAULT_ENDPOINT,
      ...options
    });
    
    if (!options.apiKey) {
      throw new Error('Google API key is required');
    }
  }
  
  public async getCompletion(prompt: string, overrideOptions?: Partial<LLMClientOptions>): Promise<LLMCompletionResult> {
    const options = {
      ...this.options,
      ...overrideOptions
    };
    
    // Ensure the model name has the correct format
    const formattedModel = this.formatModelName(options.model || '');
    options.model = formattedModel;
    
    // Format the full URL with model and API key
    const apiUrl = `${options.endpoint}/models/${formattedModel}:generateContent?key=${options.apiKey}`;
    
    LLMLogger.info(`Using Gemini model: ${formattedModel}`);
    
    // Override the endpoint with the full URL
    options.endpoint = apiUrl;
    
    // Send the request using the common implementation
    return this.sendLLMRequest(prompt, options, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  /**
   * Format the request body according to Gemini's requirements
   */
  protected formatRequestBody(prompt: string, options: LLMClientOptions): any {
    const { maxTokens, temperature } = options;
    
    // Gemini message format
    return {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature
      }
    };
  }
  
  /**
   * Parse the response according to Gemini's format
   */
  protected parseResponse(response: HttpResponse): LLMCompletionResult {
    try {
      const parsedResponse = JSON.parse(response.data);
      
      if (parsedResponse.error) {
        throw this.createError(`Gemini API error: ${parsedResponse.error.message}`, 
          parsedResponse.error.code || 400, 
          parsedResponse.error);
      }
      
      if (!parsedResponse.candidates || 
          parsedResponse.candidates.length === 0 || 
          !parsedResponse.candidates[0].content ||
          !parsedResponse.candidates[0].content.parts ||
          parsedResponse.candidates[0].content.parts.length === 0) {
        throw this.createError("Invalid response format from Gemini API", 400, parsedResponse);
      }
      
      // Extract text from the response
      const text = parsedResponse.candidates[0].content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('\n');
      
      if (!text) {
        throw this.createError("No text content found in Gemini response", 400, parsedResponse.candidates[0]);
      }
        
      return {
        text: text.trim(),
        usage: {
          promptTokens: parsedResponse.usageMetadata?.promptTokenCount || 0,
          completionTokens: parsedResponse.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: (parsedResponse.usageMetadata?.promptTokenCount || 0) + 
                      (parsedResponse.usageMetadata?.candidatesTokenCount || 0)
        }
      };
    } catch (error: any) {
      if (error.message && error.message.includes('Gemini API')) {
        throw error; // Re-throw our own formatted errors
      }
      LLMLogger.error("Raw API response:", response.data);
      throw this.createError(`Error parsing Gemini response: ${error.message}`, 500);
    }
  }
  
  /**
   * Format the model name to ensure it has the correct prefix
   */
  private formatModelName(modelName: string): string {
    // If the model name already includes the "models/" prefix, return it as is
    if (modelName.startsWith('models/')) {
      return modelName;
    }
    
    // If model name doesn't have prefix, add it
    return `${modelName}`;
  }
  
  public getName(): string {
    return 'Google Gemini';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 