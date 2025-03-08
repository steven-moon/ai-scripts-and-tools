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

import { LLMClientFactory, LLMProviderType, LLMConfig } from './llm/llm-client-factory';
import { runCommand } from './shell';

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
    
    // Store the original configuration in case we need to restore it
    const originalConfig = { ...factory.getConfig() };
    
    try {
      // Check environment variables first
      const envProvider = process.env.LLM_PROVIDER as LLMProviderType;
      if (envProvider) {
        console.log(`queryLLM found provider in environment: "${envProvider}"`);
        factory.updateConfig({ provider: envProvider });
      }
      
      // Apply all option overrides directly to the factory configuration
      // These take precedence over environment variables
      if (options.provider) {
        console.log(`queryLLM using provider from options: "${options.provider}"`);
        factory.updateConfig({ provider: options.provider });
      }
      
      if (options.model) {
        factory.updateConfig({ model: options.model });
      }
      
      if (options.temperature !== undefined) {
        factory.updateConfig({ temperature: options.temperature });
      }
      
      if (options.maxTokens !== undefined) {
        factory.updateConfig({ maxTokens: options.maxTokens });
      }
      
      // Apply endpoint changes if provided
      if (options.endpoint) {
        switch (options.provider) {
          case 'openai':
            factory.updateConfig({ openaiEndpoint: options.endpoint });
            break;
          case 'anthropic':
            factory.updateConfig({ anthropicEndpoint: options.endpoint });
            break;
          case 'gemini':
            factory.updateConfig({ geminiEndpoint: options.endpoint });
            break;
          case 'custom':
            factory.updateConfig({ customEndpoint: options.endpoint });
            break;
          case 'local':
          default:
            factory.updateConfig({ localEndpoint: options.endpoint });
            break;
        }
      }
      
      // Create the client using the factory's updated configuration
      // This will use the configuration we just updated
      const client = factory.createClient();
      
      console.log(`Using LLM provider: ${client.getName()}`);
      
      // Get completion
      const result = await client.getCompletion(prompt);
      
      // Log usage if available
      if (result.usage) {
        console.log(`Tokens used: ${result.usage.totalTokens || 'Unknown'} (Prompt: ${result.usage.promptTokens || 'Unknown'}, Completion: ${result.usage.completionTokens || 'Unknown'})`);
      }
      
      return result.text;
    } finally {
      // Restore the original configuration to prevent side effects
      factory.updateConfig(originalConfig);
    }
  } catch (error) {
    throw new Error(`Error querying LLM: ${error}`);
  }
}

// Keep this for backward compatibility
export const queryLocalLLM = queryLLM; 