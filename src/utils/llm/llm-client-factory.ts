/**
 * LLM Client Factory
 * Factory for creating LLM clients based on configuration
 */

import { BaseLLMClient, LLMClientOptions } from './base-llm-client';
import { LocalLLMClient } from './local-llm-client';
import { OpenAILLMClient } from './openai-llm-client';
import { AnthropicLLMClient } from './anthropic-llm-client';
import { GeminiLLMClient } from './gemini-llm-client';
import { CustomLLMClient } from './custom-llm-client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export type LLMProviderType = 'local' | 'openai' | 'anthropic' | 'gemini' | 'custom';

export interface LLMConfig {
  provider: LLMProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // API keys and endpoints
  openaiApiKey?: string;
  openaiEndpoint?: string;
  openaiDefaultModel?: string;
  
  anthropicApiKey?: string;
  anthropicEndpoint?: string;
  anthropicDefaultModel?: string;
  
  geminiApiKey?: string;
  geminiEndpoint?: string;
  geminiDefaultModel?: string;
  
  localEndpoint?: string;
  localModel?: string;
  
  customProviderName?: string;
  customApiKey?: string;
  customEndpoint?: string;
  customDefaultModel?: string;
}

export class LLMClientFactory {
  private static instance: LLMClientFactory;
  private config: LLMConfig = {
    provider: 'local' // Default configuration to avoid undefined
  };
  
  private constructor() {
    // Load configuration from .env file
    this.loadConfig();
  }
  
  /**
   * Get the singleton instance of the factory
   */
  public static getInstance(): LLMClientFactory {
    if (!LLMClientFactory.instance) {
      LLMClientFactory.instance = new LLMClientFactory();
    }
    return LLMClientFactory.instance;
  }
  
  /**
   * Load configuration from .env file
   */
  private loadConfig(): void {
    // Try to load .env file
    const envPath = path.resolve(process.cwd(), '.env');
    const fallbackEnvPath = path.resolve(process.cwd(), '../.env');
    
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else if (fs.existsSync(fallbackEnvPath)) {
      dotenv.config({ path: fallbackEnvPath });
    } else {
      console.warn('No .env file found. Using default configuration or environment variables.');
      dotenv.config(); // Still try to load from process.env
    }
    
    // Create configuration from environment variables
    this.config = {
      provider: (process.env.LLM_PROVIDER as LLMProviderType) || 'local',
      
      // General settings
      model: process.env.LLM_MODEL,
      temperature: process.env.LLM_TEMPERATURE ? parseFloat(process.env.LLM_TEMPERATURE) : undefined,
      maxTokens: process.env.LLM_MAX_TOKENS ? parseInt(process.env.LLM_MAX_TOKENS, 10) : undefined,
      
      // OpenAI settings
      openaiApiKey: process.env.OPENAI_API_KEY,
      openaiEndpoint: process.env.OPENAI_ENDPOINT,
      openaiDefaultModel: process.env.OPENAI_DEFAULT_MODEL,
      
      // Anthropic settings
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      anthropicEndpoint: process.env.ANTHROPIC_ENDPOINT,
      anthropicDefaultModel: process.env.ANTHROPIC_DEFAULT_MODEL,
      
      // Gemini settings
      geminiApiKey: process.env.GEMINI_API_KEY,
      geminiEndpoint: process.env.GEMINI_ENDPOINT,
      geminiDefaultModel: process.env.GEMINI_DEFAULT_MODEL,
      
      // Local LLM settings
      localEndpoint: process.env.LOCAL_LLM_ENDPOINT,
      localModel: process.env.LOCAL_LLM_MODEL,
      
      // Custom provider settings
      customProviderName: process.env.CUSTOM_PROVIDER_NAME,
      customApiKey: process.env.CUSTOM_API_KEY,
      customEndpoint: process.env.CUSTOM_ENDPOINT,
      customDefaultModel: process.env.CUSTOM_DEFAULT_MODEL
    };
  }
  
  /**
   * Get the appropriate model for a given provider
   * 
   * @param config The configuration
   * @param provider The provider type
   * @returns The model to use
   */
  private getModelForProvider(config: LLMConfig, provider: LLMProviderType): string | undefined {
    // First check if a general model is specified
    if (config.model) {
      return config.model;
    }
    
    // If not, use the provider-specific default model
    switch (provider) {
      case 'openai':
        return config.openaiDefaultModel;
      case 'anthropic':
        return config.anthropicDefaultModel;
      case 'gemini':
        return config.geminiDefaultModel;
      case 'custom':
        return config.customDefaultModel;
      case 'local':
        return config.localModel;
      default:
        return undefined;
    }
  }
  
  /**
   * Create an LLM client based on the configuration
   * 
   * @param overrideConfig Optional configuration to override the default
   * @returns The LLM client
   */
  public createClient(overrideConfig: Partial<LLMConfig> = {}): BaseLLMClient {
    // Merge default config with any overrides
    const config = { ...this.config, ...overrideConfig };
    
    const { provider } = config;
    
    // Create client based on provider
    switch (provider) {
      case 'openai':
        if (!config.openaiApiKey) {
          throw new Error('OpenAI API key is required for OpenAI provider');
        }
        
        return new OpenAILLMClient({
          apiKey: config.openaiApiKey,
          model: this.getModelForProvider(config, 'openai'),
          endpoint: config.openaiEndpoint,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        });
        
      case 'anthropic':
        if (!config.anthropicApiKey) {
          throw new Error('Anthropic API key is required for Anthropic provider');
        }
        
        return new AnthropicLLMClient({
          apiKey: config.anthropicApiKey,
          model: this.getModelForProvider(config, 'anthropic'),
          endpoint: config.anthropicEndpoint,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        });
        
      case 'gemini':
        if (!config.geminiApiKey) {
          throw new Error('Google API key is required for Gemini provider');
        }
        
        return new GeminiLLMClient({
          apiKey: config.geminiApiKey,
          model: this.getModelForProvider(config, 'gemini'),
          endpoint: config.geminiEndpoint,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        });
      
      case 'custom':
        if (!config.customApiKey) {
          throw new Error('API key is required for custom provider');
        }
        
        if (!config.customEndpoint) {
          throw new Error('Endpoint is required for custom provider');
        }
        
        return new CustomLLMClient({
          apiKey: config.customApiKey,
          endpoint: config.customEndpoint,
          model: this.getModelForProvider(config, 'custom'),
          providerName: config.customProviderName,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        });
        
      case 'local':
      default:
        return new LocalLLMClient({
          model: this.getModelForProvider(config, 'local'),
          endpoint: config.localEndpoint,
          temperature: config.temperature,
          maxTokens: config.maxTokens
        });
    }
  }
  
  /**
   * Get the current configuration
   */
  public getConfig(): LLMConfig {
    return { ...this.config };
  }
  
  /**
   * Update the configuration
   * 
   * @param newConfig New configuration to merge with existing
   */
  public updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
} 