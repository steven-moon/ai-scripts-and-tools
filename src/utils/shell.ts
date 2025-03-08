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
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    return '';
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