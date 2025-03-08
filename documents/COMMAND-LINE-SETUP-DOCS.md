# Command Line Setup

This document provides instructions on how to add the AI Scripts and Tools commands to your shell, making them available from any directory.

## Adding Commands to Your Shell

To use the scripts from any directory, add the following to your `~/.zshrc` file (for Zsh) or `~/.bashrc` file (for Bash):

```bash
# AI Scripts and Tools

# Path to your ai-scripts-and-tools repository
export AI_SCRIPTS_PATH="$HOME/path/to/ai-scripts-and-tools"

#---------------------------------
# Git Commit Message Generator
#---------------------------------

# Function to generate AI-assisted git commit messages
git-commit-ai() {
  # Parse options
  local copy_flag=""
  local template_path=""
  local provider_flag=""
  local model_flag=""
  
  # Process command line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -c|--copy)
        copy_flag="--copy"
        shift
        ;;
      -p|--provider)
        if [[ -n "$2" && "$2" != -* ]]; then
          provider_flag="--provider $2"
          shift 2
        else
          echo "Error: Provider value required for -p/--provider option"
          return 1
        fi
        ;;
      -m|--model)
        if [[ -n "$2" && "$2" != -* ]]; then
          model_flag="--model $2"
          shift 2
        else
          echo "Error: Model name required for -m/--model option"
          return 1
        fi
        ;;
      -t|--template)
        if [[ -n "$2" && "$2" != -* ]]; then
          template_path="$2"
          shift 2
        else
          echo "Error: Template path required for -t/--template option"
          return 1
        fi
        ;;
      *)
        # If no template explicitly provided but an argument exists, assume it's a template
        if [[ -z "$template_path" && "$1" != -* ]]; then
          template_path="$1"
        fi
        shift
        ;;
    esac
  done
  
  # Use default template if none specified
  if [[ -z "$template_path" ]]; then
    template_path="$AI_SCRIPTS_PATH/templates/commit-template.txt"
  fi
  
  # Check if we're in a git repository
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: Not in a git repository"
    return 1
  fi
  
  # Check if there are staged changes
  if [ -z "$(git diff --cached)" ]; then
    echo "Error: No staged changes found. Please stage your changes with 'git add' first."
    return 1
  fi
  
  echo "Generating commit message using LLM..."
  # Run the script directly with ts-node instead of using npm script
  export CURRENT_DIR="$(pwd)"
  export ORIGINAL_CWD="$(pwd)"

  # Debug the current working directory
  echo "Current working directory before running script: $CURRENT_DIR"
  (cd "$AI_SCRIPTS_PATH" && ts-node "$AI_SCRIPTS_PATH/src/scripts/generate-git-commit.ts" "$template_path" $provider_flag $model_flag $copy_flag)
}

# Aliases for git commit message generator
alias gcai="git-commit-ai"
alias gcaic="git-commit-ai --copy"  # Copy to clipboard
alias gcaio="git-commit-ai --provider openai"  # Use OpenAI
alias gcaia="git-commit-ai --provider anthropic"  # Use Anthropic
alias gcaig="git-commit-ai --provider gemini"  # Use Google Gemini
alias gcaicustom="git-commit-ai --provider custom"  # Use custom provider

#---------------------------------
# Code Summary Generator
#---------------------------------

# Function to generate code summaries
code-summary() {
  local details_flag=""
  local clipboard_flag=""
  local interactive_flag=""
  local output_file=""
  
  # Process command line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -d|--details)
        details_flag="--details"
        shift
        ;;
      -c|--clipboard)
        clipboard_flag="--clipboard"
        shift
        ;;
      -i|--interactive)
        interactive_flag="--interactive"
        shift
        ;;
      *)
        # If no output file explicitly provided but an argument exists
        if [[ -z "$output_file" ]]; then
          output_file="$1"
        fi
        shift
        ;;
    esac
  done
  
  echo "Generating code summary..."
  export CURRENT_DIR="$(pwd)"
  export ORIGINAL_CWD="$(pwd)"
  
  # Run the script with ts-node
  (cd "$AI_SCRIPTS_PATH" && ts-node "$AI_SCRIPTS_PATH/src/scripts/generate-code-summary.ts" $details_flag $clipboard_flag $interactive_flag $output_file)
}

# Aliases for code summary generator
alias cs="code-summary"
alias csd="code-summary --details"  # With full file contents
alias csc="code-summary --clipboard"  # Copy to clipboard
alias csi="code-summary --interactive"  # Interactive mode
```

## Important Steps After Adding to Your Shell

1. **Modify the `AI_SCRIPTS_PATH` variable** to match your repository location. For example, if you cloned the repository to `~/projects/ai-scripts-and-tools`, your path would be:
   ```bash
   export AI_SCRIPTS_PATH="$HOME/projects/ai-scripts-and-tools"
   ```

2. **Apply the changes** to your current shell session:
   ```bash
   source ~/.zshrc  # For Zsh
   # OR
   source ~/.bashrc  # For Bash
   ```

3. **Verify the installation** by checking if the commands are available:
   ```bash
   which git-commit-ai
   which code-summary
   ```

## Usage Examples

After setting up the shell integration, you can use the commands from any directory:

### Git Commit Generator

```bash
# Generate commit message using default provider
gcai

# Generate and copy to clipboard
gcaic

# Use specific provider
gcaio  # OpenAI
gcaia  # Anthropic
gcaig  # Google Gemini

# Use specific template
gcai path/to/custom-template.txt
```

### Code Summary Generator

```bash
# Generate basic summary in summary.md
cs

# Generate detailed summary with file contents
csd

# Generate summary and copy to clipboard
csc

# Run in interactive mode
csi

# Specify output file
cs my-project-summary.md
```

## Troubleshooting

If you encounter issues with the commands:

1. **Make sure the `AI_SCRIPTS_PATH` is correctly set** to your repository location
2. **Verify that the TypeScript environment** is properly set up with `ts-node` installed
3. **Check that you've installed all dependencies** with `npm install` in the repository
4. **Ensure environment variables** are correctly set in your `.env` file 