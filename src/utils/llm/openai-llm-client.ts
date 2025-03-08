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
    
    const { model, maxTokens, temperature, apiKey } = options;
    
    // Determine if we need to use the chat API based on the model name
    const usesChatAPI = this.isChatModel(model || '');
    
    // Set the correct endpoint based on the model type
    const endpoint = usesChatAPI ? OpenAILLMClient.CHAT_ENDPOINT : options.endpoint;
    
    console.log(`Using OpenAI ${usesChatAPI ? 'chat' : 'completions'} API for model: ${model}`);
    
    // Create a temporary file to store the request body
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `openai-request-${Date.now()}.json`);
    
    // Create the request body based on the API type
    let requestBody;
    
    if (usesChatAPI) {
      // Chat completions format
      requestBody = {
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
      requestBody = {
        model: model,
        prompt: prompt,
        max_tokens: maxTokens,
        temperature: temperature
      };
    }
    
    // Write the request body to the temporary file
    fs.writeFileSync(tempFile, JSON.stringify(requestBody, null, 2), 'utf8');
    
    try {
      // Use the temp file in the curl command with OpenAI auth header
      const response = runCommand(
        `curl -X POST ${endpoint} -H "Content-Type: application/json" -H "Authorization: Bearer ${apiKey}" -d @${tempFile}`
      );
      
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      // Debug the raw response to see what we're getting
      if (response.length < 1000) {
        console.log("Raw API response:", response);
      } else {
        console.log(`Raw API response length: ${response.length} characters`);
      }
      
      try {
        // Parse the response
        const parsedResponse = JSON.parse(response);
        
        if (parsedResponse.error) {
          throw new Error(`OpenAI API error: ${parsedResponse.error.message}`);
        }
        
        if (parsedResponse && parsedResponse.choices && parsedResponse.choices.length > 0) {
          // Debug the choices structure
          console.log("API response structure:", JSON.stringify(parsedResponse.choices[0], null, 2));
          
          // Extract text based on API type
          let text = '';
          
          if (usesChatAPI) {
            if (parsedResponse.choices[0].message && parsedResponse.choices[0].message.content) {
              text = parsedResponse.choices[0].message.content.trim();
              console.log("Extracted text from chat response:", text);
            } else {
              console.error("Chat response format unexpected:", JSON.stringify(parsedResponse.choices[0]));
              throw new Error("Invalid chat response format from OpenAI API");
            }
          } else {
            if (parsedResponse.choices[0].text) {
              text = parsedResponse.choices[0].text.trim();
              console.log("Extracted text from completions response:", text);
            } else {
              console.error("Completions response format unexpected:", JSON.stringify(parsedResponse.choices[0]));
              throw new Error("Invalid completions response format from OpenAI API");
            }
          }
            
          return {
            text: text,
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