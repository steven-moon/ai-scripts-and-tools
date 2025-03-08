/**
 * Custom LLM Client
 * Implementation for custom providers using OpenAI API format
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult } from './base-llm-client';
import { runCommand } from '../shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    
    const { model, maxTokens, temperature, apiKey, endpoint } = options;
    
    // Create a temporary file to store the request body
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `custom-request-${Date.now()}.json`);
    
    // Create the request body (OpenAI format)
    const requestBody = {
      model: model,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: temperature
    };
    
    // Write the request body to the temporary file
    fs.writeFileSync(tempFile, JSON.stringify(requestBody, null, 2), 'utf8');
    
    try {
      // Use the temp file in the curl command with auth header
      const response = runCommand(
        `curl -X POST ${endpoint} -H "Content-Type: application/json" -H "Authorization: Bearer ${apiKey}" -d @${tempFile}`
      );
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      try {
        // Parse the response (assuming OpenAI format)
        const parsedResponse = JSON.parse(response);
        
        if (parsedResponse.error) {
          throw new Error(`${this.providerName} API error: ${parsedResponse.error.message || JSON.stringify(parsedResponse.error)}`);
        }
        
        if (parsedResponse && parsedResponse.choices && parsedResponse.choices.length > 0) {
          return {
            text: parsedResponse.choices[0].text?.trim() || 
                  parsedResponse.choices[0].message?.content?.trim() ||
                  '',
            usage: parsedResponse.usage || {}
          };
        } else {
          throw new Error(`Invalid response format from ${this.providerName} API`);
        }
      } catch (error) {
        console.error("Raw API response:", response);
        throw new Error(`Error parsing ${this.providerName} response: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error calling ${this.providerName} API: ${error}`);
    }
  }
  
  public getName(): string {
    return this.providerName;
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey && !!this.options.endpoint;
  }
} 