/**
 * Anthropic LLM Client
 * Implementation for Anthropic's API (Claude models)
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult } from './base-llm-client';
import { runCommand } from '../shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    
    // Create a temporary file to store the request body
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `anthropic-request-${Date.now()}.json`);
    
    // Create the request body (Anthropic format)
    const requestBody = {
      model: model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    };
    
    // Write the request body to the temporary file
    fs.writeFileSync(tempFile, JSON.stringify(requestBody, null, 2), 'utf8');
    
    try {
      // Use the temp file in the curl command with Anthropic auth header
      const response = runCommand(
        `curl -X POST ${endpoint} -H "Content-Type: application/json" -H "x-api-key: ${apiKey}" -H "anthropic-version: 2023-06-01" -d @${tempFile}`
      );
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      try {
        // Parse the response
        const parsedResponse = JSON.parse(response);
        
        if (parsedResponse.error) {
          throw new Error(`Anthropic API error: ${parsedResponse.error.message}`);
        }
        
        if (parsedResponse && parsedResponse.content && parsedResponse.content.length > 0) {
          // Extract the text from the content array
          const text = parsedResponse.content
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n');
            
          return {
            text: text.trim(),
            usage: parsedResponse.usage || {}
          };
        } else {
          throw new Error("Invalid response format from Anthropic API");
        }
      } catch (error) {
        console.error("Raw API response:", response);
        throw new Error(`Error parsing Anthropic response: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error calling Anthropic API: ${error}`);
    }
  }
  
  public getName(): string {
    return 'Anthropic Claude';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 