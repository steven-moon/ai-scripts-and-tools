/**
 * Base LLM Client
 * Abstract class that defines the interface for all LLM clients
 */

export interface LLMClientOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  endpoint?: string;
}

export interface LLMCompletionResult {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export abstract class BaseLLMClient {
  protected options: LLMClientOptions;

  constructor(options: LLMClientOptions = {}) {
    this.options = {
      temperature: 0.5,
      maxTokens: 500,
      ...options,
    };
  }

  /**
   * Get completion from the LLM
   * 
   * @param prompt The prompt to send to the LLM
   * @param options Override options for this specific request
   * @returns Promise with completion result
   */
  public abstract getCompletion(prompt: string, options?: Partial<LLMClientOptions>): Promise<LLMCompletionResult>;

  /**
   * Get the name of the LLM client
   * 
   * @returns The name of the LLM client
   */
  public abstract getName(): string;

  /**
   * Check if the client is properly configured
   * 
   * @returns True if the client is configured, false otherwise
   */
  public abstract isConfigured(): boolean;
} 