/**
 * Google Gemini LLM Client
 * Implementation for Google's Gemini API
 */

import { BaseLLMClient, LLMClientOptions, LLMCompletionResult } from './base-llm-client';
import { runCommand } from '../shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface GeminiClientOptions extends LLMClientOptions {
  // API key for Google AI Studio
  apiKey: string;
  
  // Model to use (defaults to gemini-1.5-flash)
  model?: string;
  
  // API endpoint (defaults to standard Gemini endpoint)
  endpoint?: string;
}

export class GeminiLLMClient extends BaseLLMClient {
  private static DEFAULT_MODEL = 'gemini-1.5-flash';
  private static DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1';
  
  constructor(options: GeminiClientOptions) {
    super({
      model: GeminiLLMClient.DEFAULT_MODEL,
      endpoint: GeminiLLMClient.DEFAULT_ENDPOINT,
      ...options
    });
    
    if (!options.apiKey) {
      throw new Error('Google API key is required');
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
    const tempFile = path.join(tempDir, `gemini-request-${Date.now()}.json`);
    
    // Create the request body (Gemini format)
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature
      }
    };
    
    console.log("Gemini request body:", JSON.stringify(requestBody, null, 2));
    
    // Write the request body to the temporary file
    fs.writeFileSync(tempFile, JSON.stringify(requestBody, null, 2), 'utf8');
    console.log(`Request written to temp file: ${tempFile}`);
    
    // Ensure the model name has the correct format
    const formattedModel = this.formatModelName(model || '');
    
    // Construct the full URL with the API key
    // Format: {endpoint}/models/{model}:generateContent?key={apiKey}
    const fullUrl = `${endpoint}/models/${formattedModel}:generateContent?key=${apiKey}`;
    console.log(`API URL: ${fullUrl}`);
    
    try {
      // Create a more reliable curl command - write request to file and output to file
      console.log(`Using Gemini model: ${formattedModel}`);
      
      // Create a temporary output file
      const outputFile = path.join(tempDir, `gemini-response-${Date.now()}.json`);
      console.log(`Response will be written to: ${outputFile}`);
      
      // Run curl with both request and response as files
      const curlCommand = `curl -s -X POST "${fullUrl}" -H "Content-Type: application/json" -d @${tempFile} -o ${outputFile}`;
      console.log(`Executing: ${curlCommand}`);
      const curlResult = runCommand(curlCommand);
      console.log(`Curl command result: '${curlResult}'`);
      
      // Read the response from the output file
      let response = '';
      try {
        console.log(`Reading response from: ${outputFile}`);
        if (fs.existsSync(outputFile)) {
          response = fs.readFileSync(outputFile, 'utf8');
          console.log(`Response read successfully, length: ${response.length} bytes`);
          // console.log(`Response content: ${response}`);
          
          // Clean up the temporary files
          fs.unlinkSync(tempFile);
          fs.unlinkSync(outputFile);
        } else {
          console.error(`Response file does not exist: ${outputFile}`);
          throw new Error('Response file was not created');
        }
        
        // Check if response is empty - this would indicate the curl command failed
        if (!response || response.trim() === '') {
          throw new Error('Empty response from Gemini API. Check your API key and network connection.');
        }
        
        try {
          // Parse the response
          const parsedResponse = JSON.parse(response);
          
          if (parsedResponse.error) {
            throw new Error(`Gemini API error: ${parsedResponse.error.message}`);
          }
          
          if (parsedResponse && 
              parsedResponse.candidates && 
              parsedResponse.candidates.length > 0 && 
              parsedResponse.candidates[0].content &&
              parsedResponse.candidates[0].content.parts &&
              parsedResponse.candidates[0].content.parts.length > 0) {
            
            // Extract text from the response
            const text = parsedResponse.candidates[0].content.parts
              .filter((part: any) => part.text)
              .map((part: any) => part.text)
              .join('\n');
              
            return {
              text: text.trim(),
              usage: {
                promptTokens: parsedResponse.usageMetadata?.promptTokenCount || 0,
                completionTokens: parsedResponse.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: (parsedResponse.usageMetadata?.promptTokenCount || 0) + 
                            (parsedResponse.usageMetadata?.candidatesTokenCount || 0)
              }
            };
          } else {
            throw new Error("Invalid response format from Gemini API");
          }
        } catch (error) {
          console.error("Raw API response:", response);
          throw new Error(`Error parsing Gemini response: ${error}`);
        }
      } catch (readError) {
        console.error(`Error reading response file: ${readError}`);
        throw new Error('Failed to read API response');
      }
    } catch (error) {
      throw new Error(`Error calling Gemini API: ${error}`);
    }
  }
  
  /**
   * Format the model name to ensure it has the correct prefix
   * @param modelName - The input model name
   * @returns The properly formatted model name
   */
  private formatModelName(modelName: string): string {
    // If the model name already includes the "models/" prefix, return it as is
    if (modelName.startsWith('models/')) {
      return modelName;
    }
    
    // If model name doesn't have prefix, add it
    return `${modelName}`;
  }
  
  public getName(): string {
    return 'Google Gemini';
  }
  
  public isConfigured(): boolean {
    return !!this.options.apiKey;
  }
} 