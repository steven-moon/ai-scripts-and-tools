/**
 * Utility functions for interacting with language models
 */

// Re-export all types and classes from the submodules
export * from './llm/base-llm-client';
export * from './llm/local-llm-client';
export * from './llm/openai-llm-client';
export * from './llm/anthropic-llm-client';
export * from './llm/gemini-llm-client';
export * from './llm/custom-llm-client';
export * from './llm/llm-client-factory';

import { LLMClientFactory, LLMConfig } from './llm/llm-client-factory';

export interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: 'local' | 'openai' | 'anthropic' | 'gemini' | 'custom';
  endpoint?: string;
}

/**
 * Send a prompt to an LLM service based on configuration
 * @param prompt - The prompt to send to the model
 * @param options - Configuration options for the LLM request
 * @returns The generated text from the model
 */
export async function queryLLM(
  prompt: string, 
  options: LLMOptions = {}
): Promise<string> {
  try {
    // Get the LLM client factory instance
    const factory = LLMClientFactory.getInstance();
    
    // Create config from options
    const config: Partial<LLMConfig> = {
      provider: options.provider,
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature
    };
    
    // If a specific endpoint is provided, set it for the appropriate provider
    if (options.endpoint) {
      switch (options.provider) {
        case 'openai':
          config.openaiEndpoint = options.endpoint;
          break;
        case 'anthropic':
          config.anthropicEndpoint = options.endpoint;
          break;
        case 'gemini':
          config.geminiEndpoint = options.endpoint;
          break;
        case 'custom':
          config.customEndpoint = options.endpoint;
          break;
        case 'local':
        default:
          config.localEndpoint = options.endpoint;
          break;
      }
    }
    
    // Create the appropriate client
    const client = factory.createClient(config);
    
    console.log(`Using LLM provider: ${client.getName()}`);
    
    // Get completion
    const result = await client.getCompletion(prompt, {
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      model: options.model
    });
    
    // Log usage if available
    if (result.usage) {
      console.log(`Tokens used: ${result.usage.totalTokens || 'Unknown'} (Prompt: ${result.usage.promptTokens || 'Unknown'}, Completion: ${result.usage.completionTokens || 'Unknown'})`);
    }
    
    return result.text;
  } catch (error) {
    throw new Error(`Error querying LLM: ${error}`);
  }
}

// Keep this for backward compatibility
export const queryLocalLLM = queryLLM; 