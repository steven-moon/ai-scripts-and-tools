/**
 * Utility functions for interacting with language models
 */

import { runCommand } from './shell';

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

  const response = runCommand(
    `curl -X POST ${endpoint} -H "Content-Type: application/json" -d '{
      "model": "${model}",
      "prompt": ${JSON.stringify(prompt)},
      "max_tokens": ${maxTokens},
      "temperature": ${temperature}
    }'`
  );

  try {
    return JSON.parse(response).choices[0].text.trim();
  } catch (error) {
    throw new Error(`Error parsing LLM response: ${error}`);
  }
} 