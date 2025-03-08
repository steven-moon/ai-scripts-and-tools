/**
 * Local LLM Client
 * Implementation for local LLM servers like Ollama or LM Studio
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult } from './base-llm-client';
import { runCommand } from '../shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    
    const { model, maxTokens, temperature, endpoint } = options;
    
    // Create a temporary file to store the request body
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `llm-request-${Date.now()}.json`);
    
    // Create the request body
    const requestBody = {
      model: model,
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: temperature
    };
    
    // Write the request body to the temporary file
    fs.writeFileSync(tempFile, JSON.stringify(requestBody, null, 2), 'utf8');
    
    try {
      // Use the temp file in the curl command
      const response = runCommand(
        `curl -X POST ${endpoint} -H "Content-Type: application/json" -d @${tempFile}`
      );
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      try {
        // Parse the response
        const parsedResponse = JSON.parse(response);
        if (parsedResponse && parsedResponse.choices && parsedResponse.choices.length > 0) {
          return {
            text: parsedResponse.choices[0].text.trim(),
            usage: parsedResponse.usage || {}
          };
        } else {
          throw new Error("Invalid response format from LLM API");
        }
      } catch (error) {
        console.error("Raw API response:", response);
        throw new Error(`Error parsing LLM response: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error calling LLM API: ${error}`);
    }
  }
  
  public getName(): string {
    return 'Local LLM';
  }
  
  public isConfigured(): boolean {
    return !!this.options.endpoint;
  }
} 