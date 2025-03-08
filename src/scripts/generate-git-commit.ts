import fs from 'fs';
import { runCommand, askQuestion } from '../utils/shell';
import { queryLLM } from '../utils/llm';
import { LLMClientFactory, LLMConfig, LLMProviderType } from '../utils/llm/llm-client-factory';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { copyToClipboard } from '../utils/clipboard';

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
  // Debug the incoming message
  console.log("Raw commit message length:", message.length);
  
  // Handle empty or extremely short responses
  if (!message || message.trim().length < 5) {
    console.warn("Warning: Received very short or empty commit message from LLM");
    return "Update project files\n\nThis commit includes various updates and changes to project files.";
  }
  
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
  
  // Handle prefixes that some models might add
  processed = processed.replace(/^Here's a commit message:$/gim, '');
  processed = processed.replace(/^Commit message:$/gim, '');
  
  // Ensure proper spacing between sections
  processed = processed.replace(/^([A-Z][^:]+):\s*$/gm, '\n$1:\n');
  
  // Make sure bullet points are properly formatted
  processed = processed.replace(/^[*•]\s*/gm, '- ');
  
  // Clean up any leading/trailing whitespace
  processed = processed.trim();
  
  // Enforce a sensible minimum length
  if (processed.length < 10) {
    console.warn("Warning: Processed commit message is too short, using default message");
    return "Update project files\n\nThis commit includes various updates and changes to project files.";
  }
  
  console.log("Processed commit message:", processed);
  return processed;
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
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Debug the received arguments
  console.log('DEBUG: Received arguments:', args);

  // Store the original working directory where the script was called from
  const originalCwd = process.env.ORIGINAL_CWD || process.cwd();
  
  // Critical fix: If we're not in a git repository in the current working directory,
  // this might be because we're running from the AI scripts directory but want to 
  // apply to the actual user's directory
  try {
    if (!runCommand(`cd "${originalCwd}" && git rev-parse --is-inside-work-tree`).trim()) {
      console.error(`Not in a git repository: ${originalCwd}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error checking git repository: ${error}`);
    process.exit(1);
  }
  
  console.log(`Working directory for git operations: ${originalCwd}`);
  
  let templateFile = '';
  let provider: LLMProviderType | undefined;
  let model: string | undefined;
  let shouldCopy = false;
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle the case where '--provider openai' is passed as a single argument
    if (arg.startsWith('--provider ')) {
      const providerValue = arg.substring('--provider '.length).trim();
      provider = providerValue as LLMProviderType;
      console.log(`Provider set from combined argument: "${provider}"`);
    } 
    // Handle standard separate arguments
    else if (arg === '--provider' || arg === '-p') {
      if (i + 1 < args.length) {
        provider = args[i + 1] as LLMProviderType;
        console.log(`Provider set from separate arguments: "${provider}"`);
        i++;
      }
    } else if (arg.startsWith('--model ')) {
      model = arg.substring('--model '.length).trim();
    } else if (arg === '--model' || arg === '-m') {
      if (i + 1 < args.length) {
        model = args[i + 1];
        i++;
      }
    } else if (arg === '--copy' || arg === '-c') {
      shouldCopy = true;
    } else if (!templateFile) {
      templateFile = arg;
    }
  }
  
  // Explicitly set the environment variable if a provider was specified
  if (provider) {
    process.env.LLM_PROVIDER = provider;
    console.log(`Set LLM_PROVIDER environment variable to: "${provider}"`);
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
  
  // Debug the configuration before any overrides
  const initialConfig = LLMClientFactory.getInstance().getConfig();
  console.log(`DEBUG: Initial provider before override: "${initialConfig.provider}"`);

  // Function to run git commands in the original directory
  const runGitCommand = (command: string): string => {
    try {
      return runCommand(`cd "${originalCwd}" && ${command}`);
    } catch (error) {
      console.error(`Error running git command: ${error}`);
      return '';
    }
  };

  // Get git diff (limit to a reasonable size)
  let gitDiff = '';
  try {
    gitDiff = truncateText(runGitCommand('git diff --cached'), 8000);
  } catch (error) {
    console.error('Error getting git diff:', error);
    console.log('Trying alternative approach...');
    
    // Try a more lightweight way to check if there are staged changes
    const stagedFiles = runGitCommand('git diff --cached --name-only');
    if (!stagedFiles.trim()) {
      console.error('No staged changes found. Please stage your changes first.');
      process.exit(1);
    }
    
    // If we can at least get the list of files, we'll proceed with a simpler context
    gitDiff = `Changes in files: ${stagedFiles.split('\n').join(', ')}`;
  }
  
  if (!gitDiff.trim()) {
    console.error('No staged changes found. Please stage your changes first.');
    process.exit(1);
  }

  // Get affected files and their code context
  const changedFiles = runGitCommand('git diff --cached --name-only')
    .split('\n')
    .filter(Boolean);

  // Build a concise context of changed files
  let codeContext = '';
  for (const file of changedFiles) {
    const fullFilePath = path.join(originalCwd, file);
    // Check if the path exists and is a file (not a directory)
    if (fs.existsSync(fullFilePath) && fs.statSync(fullFilePath).isFile()) {
      try {
        // For each file, only include the first 200 characters
        const fileContent = fs.readFileSync(fullFilePath, 'utf8').substring(0, 200);
        codeContext += `\nFile: ${file}\n${fileContent}\n${fileContent.length > 200 ? '...' : ''}\n`;
      } catch (error) {
        // If there's an error reading the file, just mention it without content
        console.log(`Warning: Could not read content of file: ${file}`);
        codeContext += `\nFile: ${file}\n[Content could not be read]\n`;
      }
    } else if (fs.existsSync(fullFilePath) && fs.statSync(fullFilePath).isDirectory()) {
      // If it's a directory, just note that
      codeContext += `\nDirectory: ${file}\n[Directory structure not shown]\n`;
    }
  }
  
  // Truncate the code context if it's too large
  codeContext = truncateText(codeContext, 4000);

  // Replace placeholders in template
  let generatedCommitMessage = template.replace('{{CODE_DIFF}}', gitDiff).replace('{{CODE_CONTEXT}}', codeContext);

  console.log("Generating commit message...");
  
  try {
    // Get the LLM client factory and display current config
    const factory = LLMClientFactory.getInstance();
    console.log(`DEBUG: Before override - Current provider: "${factory.getConfig().provider}"`);
    
    // Override the default provider if one is specified
    if (provider) {
      // Reset the config to ensure we start with a clean state
      factory.resetConfig();
      
      // Explicitly override the provider in the factory configuration
      factory.updateConfig({ provider });
      console.log(`Provider override: Using ${provider} instead of default provider`);
    } else if (process.env.AI_SCRIPTS_PROVIDER_OVERRIDE === 'openai') {
      // Special case for the gcaio alias - force OpenAI
      console.log('DEBUG: Using gcaio alias - forcing OpenAI provider');
      factory.updateConfig({ provider: 'openai' });
    }
    
    // Display provider and model info
    displayProviderInfo(factory, provider, model);
    
    // Get the raw response from the LLM
    let rawCommitMessage = await queryLLM(generatedCommitMessage, {
      maxTokens: 2000,
      temperature: 0.5,
      // Explicitly set the provider to ensure it's used
      provider: provider || factory.getConfig().provider,
      model: model
    });

    // Process the message to fix formatting issues
    let processedCommitMessage = processCommitMessage(rawCommitMessage);

    console.log('\nGenerated Commit Message:\n');
    console.log(processedCommitMessage);
    console.log('\n');

    // Copy to clipboard if requested
    if (shouldCopy) {
      copyToClipboard(processedCommitMessage);
      console.log('✓ Commit message copied to clipboard');
      return;
    }
    
    const action = await askQuestion('What would you like to do? (u)se as is, (e)dit, (c)opy to clipboard, or (a)bort: ');
    
    if (action.toLowerCase() === 'e') {
      try {
        processedCommitMessage = await editInEditor(processedCommitMessage);
        console.log('\nEdited Commit Message:\n');
        console.log(processedCommitMessage);
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
      copyToClipboard(processedCommitMessage);
      console.log('✓ Commit message copied to clipboard. No commit was made.');
      return;
    } else if (action.toLowerCase() !== 'u') {
      console.log('Commit aborted.');
      return;
    }

    // Proceed with commit - ensure we're passing the message correctly to git
    // Using a temporary file approach to avoid shell escaping issues
    const tempCommitFile = path.join(os.tmpdir(), `git-commit-msg-${Date.now()}.txt`);
    fs.writeFileSync(tempCommitFile, processedCommitMessage, 'utf8');
    runGitCommand(`git commit -F "${tempCommitFile}"`);
    fs.unlinkSync(tempCommitFile); // Clean up
    
    console.log('Commit successful.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
