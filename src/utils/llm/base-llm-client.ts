/**
 * Base LLM Client
 * Abstract class that defines the interface for all LLM clients
 */

import { HttpClient, HttpResponse, HttpRequestOptions } from '../httpClient';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

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

// Interface for error responses from LLM providers
export interface LLMErrorResponse {
  status?: number;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Centralized logger for LLM clients
 */
export class LLMLogger {
  static debug(message: string, data?: any): void {
    if (process.env.LLM_DEBUG === 'true') {
      console.log(`[LLM-DEBUG] ${message}`, data || '');
    }
  }

  static info(message: string, data?: any): void {
    console.log(`[LLM-INFO] ${message}`, data || '');
  }

  static error(message: string, error?: any): void {
    console.error(`[LLM-ERROR] ${message}`, error || '');
  }
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
  
  /**
   * Format the request body according to provider requirements
   * This method should be implemented by each provider client
   */
  protected abstract formatRequestBody(prompt: string, options: LLMClientOptions): any;
  
  /**
   * Parse the response according to provider format
   * This method should be implemented by each provider client
   */
  protected abstract parseResponse(response: HttpResponse): LLMCompletionResult;
  
  /**
   * Common method to send an API request to an LLM provider
   * Reduces code duplication across different clients
   */
  protected async sendLLMRequest(
    prompt: string, 
    options: LLMClientOptions, 
    httpOptions: HttpRequestOptions
  ): Promise<LLMCompletionResult> {
    const { endpoint } = options;
    
    if (!endpoint) {
      throw this.createError('API endpoint not specified', 400);
    }
    
    // Format request body based on provider requirements
    const requestBody = this.formatRequestBody(prompt, options);
    
    try {
      LLMLogger.debug(`Sending request to ${endpoint}`, { 
        provider: this.getName(),
        model: options.model 
      });
      
      // Make the API request
      const response = await HttpClient.post(endpoint, requestBody, httpOptions);
      
      // Check for HTTP error status codes
      if (response.status >= 400) {
        throw this.createError(
          `API returned error status: ${response.status}`,
          response.status,
          response.data
        );
      }
      
      // Parse the response based on provider format
      return this.parseResponse(response);
    } catch (error: any) {
      // Enhance error with more context
      const enhancedError = this.createError(
        `Error calling ${this.getName()} API: ${error.message}`,
        error.status || 500,
        error.details
      );
      
      LLMLogger.error(`API request failed: ${enhancedError.message}`, enhancedError);
      throw enhancedError;
    }
  }
  
  /**
   * Create a standardized error object
   */
  protected createError(message: string, status?: number, details?: any): Error & LLMErrorResponse {
    const error = new Error(message) as Error & LLMErrorResponse;
    error.status = status;
    error.message = message;
    error.details = details;
    return error;
  }
  
  /**
   * Create a temporary file asynchronously
   */
  protected async createTempFile(
    content: string | Buffer | object,
    prefix: string = 'temp',
    suffix: string = '.json'
  ): Promise<string> {
    const tempDir = os.tmpdir();
    const fileName = `${prefix}-${Date.now()}${suffix}`;
    const filePath = path.join(tempDir, fileName);
    
    // Convert content to string if it's an object
    const fileContent = typeof content === 'object' && !(content instanceof Buffer)
      ? JSON.stringify(content, null, 2)
      : content;
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    return filePath;
  }
  
  /**
   * Read a file asynchronously
   */
  protected async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
  }
  
  /**
   * Delete a file asynchronously
   */
  protected async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      LLMLogger.error(`Failed to delete temporary file: ${filePath}`, error);
    }
  }
  
  /**
   * Execute an operation with a temporary file
   */
  protected async withTempFile<T>(
    content: string | Buffer | object,
    operation: (filePath: string) => Promise<T> | T,
    prefix: string = 'temp',
    suffix: string = '.json'
  ): Promise<T> {
    const filePath = await this.createTempFile(content, prefix, suffix);
    try {
      return await operation(filePath);
    } finally {
      await this.deleteFile(filePath);
    }
  }
} 