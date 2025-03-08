import fs from 'fs';
import { runCommand, askQuestion } from '../utils/shell';
import { queryLocalLLM } from '../utils/llm';

/**
 * Generate commit messages based on staged changes using a local LLM
 */
async function main() {
  const args = process.argv.slice(2);
  const templateFile = args[0];

  if (!templateFile) {
    console.error("Usage: npm run script generate-git-commit -- <template-file>");
    process.exit(1);
  }

  if (!fs.existsSync(templateFile)) {
    console.error(`Error: Template file '${templateFile}' not found.`);
    process.exit(1);
  }

  // Read template file
  let template = fs.readFileSync(templateFile, 'utf8');

  // Get git diff
  const gitDiff = runCommand('git diff --cached');
  if (!gitDiff) {
    console.error('No staged changes found. Please stage your changes first.');
    process.exit(1);
  }

  // Get affected files and their code context
  const changedFiles = runCommand('git diff --cached --name-only')
    .split('\n')
    .filter(Boolean);

  let codeContext = '';
  for (const file of changedFiles) {
    if (fs.existsSync(file)) {
      codeContext += `\nFile: ${file}\n` + fs.readFileSync(file, 'utf8').substring(0, 500);
    }
  }

  // Replace placeholders in template
  template = template.replace('{{CODE_DIFF}}', gitDiff).replace('{{CODE_CONTEXT}}', codeContext);

  // Query the LLM
  try {
    const generatedCommitMessage = await queryLocalLLM(template, {
      maxTokens: 100
    });

    console.log('\nGenerated Commit Message:\n');
    console.log(generatedCommitMessage);
    console.log('\n');

    const userApproval = await askQuestion('Do you want to use this commit message? (y/N): ');
    if (userApproval.toLowerCase() === 'y') {
      runCommand(`git commit -m ${JSON.stringify(generatedCommitMessage)}`);
      console.log('Commit successful.');
    } else {
      console.log('Commit aborted.');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
