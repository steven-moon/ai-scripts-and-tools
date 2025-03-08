#!/usr/bin/env ts-node

/**
 * Code Summary Generator
 * code-summary.ts
 * 
 * Generates a summary of all code files in a project
 * 
 * Usage:
 * 
 *   code-summary [options] [output-file]
 * 
 * Options:
 *   -d, --details    Include the full text of each file in the output
 *   -c, --clipboard  Copy the output to clipboard instead of saving to a file
 *   -i, --interactive Run in interactive mode with prompts
 * 
 * If no output file is specified, it will create a summary.md file in the current directory.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import ignore from 'ignore';
import { execSync } from 'child_process';
import { runCommand, askQuestion } from '../utils/shell';
import { copyToClipboard } from '../utils/clipboard';

// Load environment variables
dotenv.config();

// Default file patterns to ignore
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.DS_Store',
  '*.log',
  '*.lock',
  'dist',
  'build',
  'coverage',
  '*.min.js',
  '*.min.css',
  '*.map'
];

// Parse command line arguments
interface CommandOptions {
  detailedOutput: boolean;
  outputFile: string;
  copyToClipboard: boolean;
  interactive: boolean;
}

const parseArgs = (): CommandOptions => {
  const args = process.argv.slice(2);
  let detailedOutput = false;
  let outputFilePath = '';
  let copyToClipboard = false;
  // Make interactive mode true by default
  let interactive = true;
  
  // Flag to track if any mode-specific flags were provided
  let modeSpecificFlagsProvided = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-d' || arg === '--details') {
      detailedOutput = true;
      modeSpecificFlagsProvided = true;
    } else if (arg === '-c' || arg === '--clipboard') {
      copyToClipboard = true;
      modeSpecificFlagsProvided = true;
    } else if (arg === '-i' || arg === '--interactive') {
      interactive = true;
    } else if (!arg.startsWith('-') && !outputFilePath) {
      outputFilePath = arg;
      modeSpecificFlagsProvided = true;
    }
  }
  
  // Only disable interactive mode if specific flags were provided
  // and the interactive flag was not explicitly set
  if (modeSpecificFlagsProvided && !args.includes('-i') && !args.includes('--interactive')) {
    interactive = false;
  }
  
  return {
    detailedOutput,
    outputFile: outputFilePath,
    copyToClipboard,
    interactive
  };
};

// Get custom ignore patterns from environment variable
const getIgnorePatterns = (): string[] => {
  const customIgnores = process.env.CODE_SUMMARY_IGNORE_PATTERNS;
  
  if (customIgnores) {
    try {
      return [...DEFAULT_IGNORE_PATTERNS, ...customIgnores.split(',').map(pattern => pattern.trim())];
    } catch (error) {
      console.warn('Error parsing custom ignore patterns, using defaults');
      return DEFAULT_IGNORE_PATTERNS;
    }
  }
  
  return DEFAULT_IGNORE_PATTERNS;
};

// Load .gitignore patterns
const loadGitignore = (rootDir: string): string[] => {
  const gitignorePath = path.join(rootDir, '.gitignore');
  
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      return content
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());
    } catch (error) {
      console.warn('Error reading .gitignore file');
      return [];
    }
  }
  
  return [];
};

// Count code lines in a file
const countCodeLines = (filePath: string): number => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
};

// Get file extension
const getFileExtension = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  return ext ? ext.substring(1) : 'unknown';
};

// Read file content with safety measures
const readFileContent = (filePath: string): string => {
  try {
    // Only read text files that are reasonably sized (less than 1MB)
    const stats = fs.statSync(filePath);
    if (stats.size > 1024 * 1024) {
      return `File too large to display (${(stats.size / 1024 / 1024).toFixed(2)} MB)`;
    }
    
    // Try to determine if it's a binary file
    const extension = getFileExtension(filePath);
    const binaryExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'ico', 'pdf', 'zip', 'exe', 'dll', 'obj', 'bin'];
    if (binaryExtensions.includes(extension)) {
      return `Binary file (${extension})`;
    }
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    return `Error reading file: ${error instanceof Error ? error.message : String(error)}`;
  }
};

// Generate a short summary of a file
const generateFileSummary = (
  filePath: string, 
  rootDir: string, 
  includeDetails: boolean = false
): { summary: string; details: string | null } => {
  const relativePath = path.relative(rootDir, filePath);
  const lines = countCodeLines(filePath);
  const extension = getFileExtension(filePath);
  const size = fs.statSync(filePath).size;
  const sizeInKb = (size / 1024).toFixed(2);
  
  const summary = `- **${relativePath}** - ${extension} file with ${lines} lines (${sizeInKb} KB)`;
  
  let details = null;
  if (includeDetails) {
    const content = readFileContent(filePath);
    details = `\n\n### ${relativePath}\n\`\`\`${extension}\n${content}\n\`\`\``;
  }
  
  return { summary, details };
};

// Process a directory recursively and return a summary
const processDirectory = (
  dirPath: string, 
  rootDir: string, 
  ignoreRules: ReturnType<typeof ignore>,
  includeDetails: boolean = false,
  depth = 0
): { summaries: string[]; details: string[] } => {
  const summaries: string[] = [];
  const details: string[] = [];
  let items: string[];
  
  try {
    items = fs.readdirSync(dirPath);
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return { summaries, details };
  }
  
  // Add heading for current directory at appropriate level
  if (dirPath !== rootDir) {
    const relativePath = path.relative(rootDir, dirPath);
    const headingLevel = Math.min(depth + 2, 6); // h2 for top level, max h6
    const heading = '#'.repeat(headingLevel);
    summaries.push(`\n${heading} ${relativePath}/\n`);
  }
  
  // Process all files and directories
  const directories: string[] = [];
  const files: string[] = [];
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const relativePath = path.relative(rootDir, itemPath);
    
    // Skip if item is ignored
    if (ignoreRules.test(relativePath).ignored) {
      return;
    }
    
    try {
      const stats = fs.statSync(itemPath);
      if (stats.isDirectory()) {
        directories.push(itemPath);
      } else if (stats.isFile()) {
        files.push(itemPath);
      }
    } catch (error) {
      console.warn(`Error processing ${itemPath}:`, error);
    }
  });
  
  // Process files first
  if (files.length > 0) {
    files.sort();
    files.forEach(file => {
      const { summary, details: fileDetails } = generateFileSummary(file, rootDir, includeDetails);
      summaries.push(summary);
      if (fileDetails) {
        details.push(fileDetails);
      }
    });
  }
  
  // Then process directories
  if (directories.length > 0) {
    directories.sort();
    directories.forEach(dir => {
      const dirResult = processDirectory(dir, rootDir, ignoreRules, includeDetails, depth + 1);
      summaries.push(...dirResult.summaries);
      details.push(...dirResult.details);
    });
  }
  
  return { summaries, details };
};

/**
 * Get user's output preference through interactive prompts
 */
const getOutputPreference = async (defaultFile: string): Promise<{ toFile: boolean; toClipboard: boolean; outputFile: string; includeDetails: boolean }> => {
  console.log('\n--- Output Options ---');
  
  // Ask about output destination
  const outputChoice = await askQuestion('Where do you want to send the output?\n1. Save to a file\n2. Copy to clipboard\n3. Both\nChoice (1-3): ');
  
  const toFile = outputChoice === '1' || outputChoice === '3';
  const toClipboard = outputChoice === '2' || outputChoice === '3';
  
  // Ask about output filename if saving to file
  let outputFile = defaultFile;
  if (toFile) {
    const customFilename = await askQuestion(`Enter output filename (default: ${path.basename(defaultFile)}): `);
    if (customFilename.trim()) {
      outputFile = path.resolve(path.dirname(defaultFile), customFilename);
    }
  }
  
  // Ask about including details
  console.log('\n--- Content Options ---');
  const detailsChoice = await askQuestion('Would you like to include file contents in the summary?\n1. Basic summary only\n2. Include file contents (details mode)\nChoice (1-2): ');
  const includeDetails = detailsChoice === '2';
  
  if (includeDetails) {
    console.log('Details mode enabled - file contents will be included in the output');
  } else {
    console.log('Basic mode selected - only file summaries will be included');
  }
  
  return { toFile, toClipboard, outputFile, includeDetails };
};

// Main function to generate code summary
const generateCodeSummary = async (): Promise<void> => {
  const options = parseArgs();
  const currentDir = process.cwd();
  const defaultOutputFile = path.join(currentDir, 'summary.md');
  
  let outputToFile = !options.copyToClipboard;
  let outputToClipboard = options.copyToClipboard;
  let outputFile = options.outputFile || defaultOutputFile;
  let includeDetails = options.detailedOutput;
  
  // Handle interactive mode
  if (options.interactive) {
    const preference = await getOutputPreference(outputFile);
    outputToFile = preference.toFile;
    outputToClipboard = preference.toClipboard;
    outputFile = preference.outputFile;
    includeDetails = preference.includeDetails;
  }
  
  console.log(`\nGenerating code summary for: ${currentDir}`);
  if (outputToFile) {
    console.log(`Output will be saved to: ${outputFile}`);
  }
  if (outputToClipboard) {
    console.log('Output will be copied to clipboard');
  }
  if (includeDetails) {
    console.log('Including detailed file contents in the output');
  }
  
  // Create the ignore rules
  const ignoreRules = ignore();
  
  // Add patterns from .gitignore
  const gitignorePatterns = loadGitignore(currentDir);
  console.log(`Found ${gitignorePatterns.length} patterns in .gitignore`);
  ignoreRules.add(gitignorePatterns);
  
  // Add default and custom patterns
  const customPatterns = getIgnorePatterns();
  console.log(`Added ${customPatterns.length} custom ignore patterns`);
  ignoreRules.add(customPatterns);
  
  // Generate repository info
  let repoInfo = '';
  try {
    const gitStatus = runCommand('git rev-parse --is-inside-work-tree 2>/dev/null');
    if (gitStatus === 'true') {
      const repoName = runCommand('basename -s .git `git config --get remote.origin.url` 2>/dev/null || echo "Local Repository"');
      const branch = runCommand('git branch --show-current 2>/dev/null || echo "unknown"');
      const lastCommit = runCommand('git log -1 --pretty=format:"%h - %s (%cr)" 2>/dev/null || echo "No commits"');
      
      repoInfo = `
# Code Summary

## Repository Information
- **Repository**: ${repoName}
- **Branch**: ${branch}
- **Last Commit**: ${lastCommit}
- **Generated**: ${new Date().toLocaleString()}
- **Details Mode**: ${includeDetails ? 'Enabled' : 'Disabled'}

`;
    }
  } catch (error) {
    // Not in a git repository or git commands failed
    repoInfo = `
# Code Summary

## General Information
- **Directory**: ${path.basename(currentDir)}
- **Generated**: ${new Date().toLocaleString()}
- **Details Mode**: ${includeDetails ? 'Enabled' : 'Disabled'}

`;
  }
  
  // Generate the summary
  const { summaries, details } = processDirectory(currentDir, currentDir, ignoreRules, includeDetails);
  
  // Write the summary to a file
  let content = repoInfo + summaries.join('\n');
  
  // Add detailed content if requested
  if (includeDetails && details.length > 0) {
    content += '\n\n## File Contents\n\n';
    content += details.join('\n');
  }
  
  // Handle output based on user preferences
  try {
    if (outputToFile) {
      fs.writeFileSync(outputFile, content, 'utf8');
      console.log(`Code summary generated successfully at ${outputFile}`);
    }
    
    if (outputToClipboard) {
      const copied = copyToClipboard(content);
      if (copied) {
        console.log('Code summary copied to clipboard successfully');
      } else {
        console.warn('Failed to copy to clipboard. Please install clipboard utilities for your platform.');
      }
    }
    
    if (!outputToFile && !outputToClipboard) {
      console.log('No output method selected. Summary was generated but not saved.');
    }
  } catch (error) {
    console.error('Error handling output:', error);
    process.exit(1);
  }
};

// Run the script
generateCodeSummary().catch(error => {
  console.error('Error generating code summary:', error);
  process.exit(1);
}); 