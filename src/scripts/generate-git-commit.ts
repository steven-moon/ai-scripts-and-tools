import fs from 'fs';
import { runCommand, askQuestion } from '../utils/shell';
import { queryLocalLLM } from '../utils/llm';
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
 * Generate commit messages based on staged changes using a local LLM
 */
async function main() {
  const args = process.argv.slice(2);
  const templateFile = args[0];

  if (!templateFile) {
    console.error("Usage: ts-node generate-git-commit.ts <template-file>");
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
  
  // Query the LLM
  try {
    let generatedCommitMessage = await queryLocalLLM(template, {
      maxTokens: 2000,
      temperature: 0.5
    });

    console.log('\nGenerated Commit Message:\n');
    console.log(generatedCommitMessage);
    console.log('\n');

    // Copy to clipboard if requested
    if (args.includes('--copy') || args.includes('-c')) {
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

    // Proceed with commit
    runCommand(`git commit -m ${JSON.stringify(generatedCommitMessage)}`);
    console.log('Commit successful.');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
