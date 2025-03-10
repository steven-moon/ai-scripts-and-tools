/**
 * Shell utility functions for executing commands and handling user input
 */

import { execSync } from 'child_process';
import readline from 'readline';

/**
 * Executes a shell command and returns the output
 * @param command - The shell command to execute
 * @returns The command output as string or empty string if error
 */
export function runCommand(command: string): string {
  try {
    // Increase maxBuffer to accommodate larger git diffs
    return execSync(command, { 
      encoding: 'utf8',
      maxBuffer: 100 * 1024 * 1024 // 10MB buffer
    }).trim();
  } catch (error) {
    const errorMessage = `Error executing command: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Prompts the user for input from the command line
 * @param query - The prompt message to display
 * @returns A promise that resolves with the user's input
 */
export function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
} 