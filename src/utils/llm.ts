/**
 * Utility functions for interacting with language models
 */

import { runCommand } from './shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface LLMOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  endpoint?: string;
}

/**
 * Send a prompt to a local LLM server (like LM Studio)
 * @param prompt - The prompt to send to the model
 * @param options - Configuration options for the LLM request
 * @returns The generated text from the model
 */
export async function queryLocalLLM(
  prompt: string, 
  options: LLMOptions = {}
): Promise<string> {
  const {
    model = 'llama-3.2-3b-instruct',
    maxTokens = 100,
    temperature = 0.7,
    endpoint = 'http://127.0.0.1:1234/v1/completions'
  } = options;

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
        return parsedResponse.choices[0].text.trim();
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