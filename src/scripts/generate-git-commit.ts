import fs from 'fs';
import { runCommand, askQuestion } from '../utils/shell';
import { queryLLM } from '../utils/llm';
import { LLMClientFactory, LLMConfig, LLMProviderType } from '../utils/llm/llm-client-factory';
import path from 'path';
import os from 'os';

/**
 * Truncate text to a maximum length, preserving the beginning and end
 * @param text - The text to truncate
 * @param maxLength - Maximum allowed length
 * @returns Truncated text
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const halfLength = Math.floor(maxLength / 2);
  const beginning = text.substring(0, halfLength);
  const end = text.substring(text.length - halfLength);
  
  return `${beginning}\n\n... [content truncated for brevity] ...\n\n${end}`;
}

/**
 * Process the commit message to fix formatting issues
 * @param message - The raw commit message from LLM
 * @returns Properly formatted commit message
 */
function processCommitMessage(message: string): string {
  // Replace literal "\n" with actual newlines
  let processed = message.replace(/\\n/g, '\n');
  
  // Replace literal "\n\n" to avoid double newlines
  processed = processed.replace(/\\n\\n/g, '\n\n');
  
  // Fix common formatting issues
  
  // Fix multiple consecutive newlines (more than 2)
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  // Remove any 'backtick' code block markers that might be included
  processed = processed.replace(/^```[\s\S]*?```$/gm, '');
  processed = processed.replace(/^```[\w]*$/gm, '');
  processed = processed.replace(/^```$/gm, '');
  
  // Ensure proper spacing between sections
  processed = processed.replace(/^([A-Z][^:]+):\s*$/gm, '\n$1:\n');
  
  // Make sure bullet points are properly formatted
  processed = processed.replace(/^[*•]\s*/gm, '- ');
  
  // Clean up any leading/trailing whitespace
  processed = processed.trim();
  
  return processed;
}

/**
 * Copy text to clipboard
 * @param text - Text to copy to clipboard
 */
function copyToClipboard(text: string): void {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      // macOS
      const proc = require('child_process').spawnSync('pbcopy', {
        input: text,
        encoding: 'utf-8'
      });
      if (proc.error) {
        throw new Error(`Failed to copy to clipboard: ${proc.error.message}`);
      }
      console.log('✓ Commit message copied to clipboard');
    } else if (platform === 'win32') {
      // Windows
      const proc = require('child_process').spawnSync('clip', {
        input: text,
        encoding: 'utf-8'
      });
      if (proc.error) {
        throw new Error(`Failed to copy to clipboard: ${proc.error.message}`);
      }
      console.log('✓ Commit message copied to clipboard');
    } else {
      // Linux/Unix
      try {
        const proc = require('child_process').spawnSync('xclip', ['-selection', 'clipboard'], {
          input: text,
          encoding: 'utf-8'
        });
        if (!proc.error) {
          console.log('✓ Commit message copied to clipboard');
          return;
        }
      } catch (e) {
        // xclip not available, try xsel
        try {
          const proc = require('child_process').spawnSync('xsel', ['-ib'], {
            input: text,
            encoding: 'utf-8'
          });
          if (!proc.error) {
            console.log('✓ Commit message copied to clipboard');
            return;
          }
        } catch (e) {
          console.error('Could not copy to clipboard: xclip or xsel not available');
        }
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
}

/**
 * Open text in editor for modification
 * @param text - Initial text to edit
 * @returns Modified text
 */
async function editInEditor(text: string): Promise<string> {
  const editor = process.env.EDITOR || process.env.VISUAL || 'vim';
  const tempFile = path.join(os.tmpdir(), `git-commit-${Date.now()}.txt`);
  
  // Write text to temporary file
  fs.writeFileSync(tempFile, text, 'utf8');
  
  // Spawn editor process
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    console.log(`Opening commit message in ${editor}...`);
    
    const editorProcess = spawn(editor, [tempFile], {
      stdio: 'inherit', // This makes the editor interactive
      shell: true
    });
    
    editorProcess.on('exit', (code: number) => {
      if (code === 0) {
        // Read the modified file
        const editedText = fs.readFileSync(tempFile, 'utf8');
        // Clean up temp file
        fs.unlinkSync(tempFile);
        resolve(editedText);
      } else {
        reject(new Error(`Editor process exited with code ${code}`));
      }
    });
  });
}

/**
 * Display provider and model information
 * @param factory - The LLM client factory instance
 * @param provider - The provider type (or undefined to use default)
 * @param model - The model name (or undefined to use default)
 */
function displayProviderInfo(factory: LLMClientFactory, provider?: LLMProviderType, model?: string): void {
  const config = factory.getConfig();
  const effectiveProvider = provider || config.provider;
  
  // Display the provider being used
  console.log(`Using provider: ${effectiveProvider}`);
  
  // Get the effective model that will be used based on defaults and overrides
  let effectiveModel = model;
  
  if (!effectiveModel) {
    // If no explicit model is provided, determine what model would be used
    if (config.model) {
      // Global model setting
      effectiveModel = config.model;
      console.log(`Using global model: ${effectiveModel}`);
    } else {
      // Provider-specific default model
      switch (effectiveProvider) {
        case 'openai':
          effectiveModel = config.openaiDefaultModel;
          if (effectiveModel) console.log(`Using OpenAI default model: ${effectiveModel}`);
          break;
        case 'anthropic':
          effectiveModel = config.anthropicDefaultModel;
          if (effectiveModel) console.log(`Using Anthropic default model: ${effectiveModel}`);
          break;
        case 'gemini':
          effectiveModel = config.geminiDefaultModel;
          if (effectiveModel) console.log(`Using Gemini default model: ${effectiveModel}`);
          break;
        case 'custom':
          effectiveModel = config.customDefaultModel;
          if (effectiveModel) console.log(`Using custom provider default model: ${effectiveModel}`);
          break;
        case 'local':
          effectiveModel = config.localModel;
          if (effectiveModel) console.log(`Using local default model: ${effectiveModel}`);
          break;
      }
    }
  } else {
    console.log(`Using specified model: ${effectiveModel}`);
  }
  
  if (!effectiveModel) {
    console.log('No model specified. Using provider default.');
  }
}

/**
 * Generate commit messages based on staged changes using a configured LLM
 */
async function main() {
  const args = process.argv.slice(2);
  let templateFile = '';
  let provider: LLMProviderType | undefined;
  let model: string | undefined;
  let shouldCopy = false;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' || args[i] === '-p') {
      provider = args[i + 1] as LLMProviderType;
      i++;
    } else if (args[i] === '--model' || args[i] === '-m') {
      model = args[i + 1];
      i++;
    } else if (args[i] === '--copy' || args[i] === '-c') {
      shouldCopy = true;
    } else if (!templateFile) {
      templateFile = args[i];
    }
  }

  if (!templateFile) {
    console.error("Usage: ts-node generate-git-commit.ts <template-file> [--provider local|openai|anthropic|gemini|custom] [--model MODEL_NAME] [--copy]");
    process.exit(1);
  }

  if (!fs.existsSync(templateFile)) {
    console.error(`Error: Template file '${templateFile}' not found.`);
    process.exit(1);
  }

  // Read template file
  let template = fs.readFileSync(templateFile, 'utf8');

  // Get git diff (limit to a reasonable size)
  const gitDiff = truncateText(runCommand('git diff --cached'), 8000);
  if (!gitDiff) {
    console.error('No staged changes found. Please stage your changes first.');
    process.exit(1);
  }

  // Get affected files and their code context
  const changedFiles = runCommand('git diff --cached --name-only')
    .split('\n')
    .filter(Boolean);

  // Build a concise context of changed files
  let codeContext = '';
  for (const file of changedFiles) {
    if (fs.existsSync(file)) {
      // For each file, only include the first 200 characters
      const fileContent = fs.readFileSync(file, 'utf8').substring(0, 200);
      codeContext += `\nFile: ${file}\n${fileContent}\n${fileContent.length > 200 ? '...' : ''}\n`;
    }
  }
  
  // Truncate the code context if it's too large
  codeContext = truncateText(codeContext, 4000);

  // Replace placeholders in template
  template = template.replace('{{CODE_DIFF}}', gitDiff).replace('{{CODE_CONTEXT}}', codeContext);

  console.log("Generating commit message...");
  
  try {
    // Get the LLM client factory and display current config
    const factory = LLMClientFactory.getInstance();
    
    // Display provider and model info
    displayProviderInfo(factory, provider, model);
    
    // Get the raw response from the LLM
    let rawCommitMessage = await queryLLM(template, {
      maxTokens: 2000,
      temperature: 0.5,
      provider: provider,
      model: model
    });

    // Process the message to fix formatting issues
    let generatedCommitMessage = processCommitMessage(rawCommitMessage);

    console.log('\nGenerated Commit Message:\n');
    console.log(generatedCommitMessage);
    console.log('\n');

    // Copy to clipboard if requested
    if (shouldCopy) {
      copyToClipboard(generatedCommitMessage);
    }
    
    const action = await askQuestion('What would you like to do? (u)se as is, (e)dit, (c)opy to clipboard, or (a)bort: ');
    
    if (action.toLowerCase() === 'e') {
      try {
        generatedCommitMessage = await editInEditor(generatedCommitMessage);
        console.log('\nEdited Commit Message:\n');
        console.log(generatedCommitMessage);
        console.log('\n');
        
        const useEdited = await askQuestion('Use this edited commit message? (y/N): ');
        if (useEdited.toLowerCase() !== 'y') {
          console.log('Commit aborted.');
          return;
        }
      } catch (error) {
        console.error('Error editing commit message:', error);
        const proceed = await askQuestion('Continue with original message? (y/N): ');
        if (proceed.toLowerCase() !== 'y') {
          console.log('Commit aborted.');
          return;
        }
      }
    } else if (action.toLowerCase() === 'c') {
      copyToClipboard(generatedCommitMessage);
      console.log('Commit message copied to clipboard. No commit was made.');
      return;
    } else if (action.toLowerCase() !== 'u') {
      console.log('Commit aborted.');
      return;
    }

    // Proceed with commit - ensure we're passing the message correctly to git
    // Using a temporary file approach to avoid shell escaping issues
    const tempCommitFile = path.join(os.tmpdir(), `git-commit-msg-${Date.now()}.txt`);
    fs.writeFileSync(tempCommitFile, generatedCommitMessage, 'utf8');
    runCommand(`git commit -F "${tempCommitFile}"`);
    fs.unlinkSync(tempCommitFile); // Clean up
    
    console.log('Commit successful.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
