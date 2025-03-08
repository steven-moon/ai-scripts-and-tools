/**
 * OpenAI LLM Client
 * Implementation for OpenAI's API (GPT models)
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult } from './base-llm-client';
import { runCommand } from '../shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
  
  public async getCompletion(prompt: string, overrideOptions?: Partial<LLMClientOptions>): Promise<LLMCompletionResult> {
    const options = {
      ...this.options,
      ...overrideOptions
    };
    
    const { model, maxTokens, temperature, apiKey, endpoint } = options;
    
    // Create a temporary file to store the request body
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `openai-request-${Date.now()}.json`);
    
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
      // Use the temp file in the curl command with OpenAI auth header
      const response = runCommand(
        `curl -X POST ${endpoint} -H "Content-Type: application/json" -H "Authorization: Bearer ${apiKey}" -d @${tempFile}`
      );
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      try {
        // Parse the response
        const parsedResponse = JSON.parse(response);
        
        if (parsedResponse.error) {
          throw new Error(`OpenAI API error: ${parsedResponse.error.message}`);
        }
        
        if (parsedResponse && parsedResponse.choices && parsedResponse.choices.length > 0) {
          return {
            text: parsedResponse.choices[0].text.trim(),
            usage: parsedResponse.usage || {}
          };
        } else {
          throw new Error("Invalid response format from OpenAI API");
        }
      } catch (error) {
        console.error("Raw API response:", response);
        throw new Error(`Error parsing OpenAI response: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error calling OpenAI API: ${error}`);
    }
  }
  
  public getName(): string {
    return 'OpenAI';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 