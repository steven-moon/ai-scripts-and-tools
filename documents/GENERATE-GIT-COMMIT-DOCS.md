# Generate Git Commit

Automatically generates commit messages based on staged changes using AI through multiple LLM providers:

- **Local LLMs** (Ollama, LM Studio) - default
- **OpenAI** (GPT models)
- **Anthropic** (Claude models)
- **Google** (Gemini models)
- **Custom Provider** (Any OpenAI-compatible API)

## Configuration

Create a `.env` file in the project root with your API keys and preferences (copy from `.env.example`):

```bash
# LLM Provider Settings
# Valid providers: local, openai, anthropic, gemini, custom
LLM_PROVIDER=local

# General Settings
LLM_MODEL=
LLM_TEMPERATURE=0.5
LLM_MAX_TOKENS=500

# OpenAI Settings
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ENDPOINT=https://api.openai.com/v1/completions
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo-instruct
# OPENAI Model examples: gpt-3.5-turbo-instruct, gpt-4-turbo-preview

# Anthropic Settings
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_ENDPOINT=https://api.anthropic.com/v1/messages
ANTHROPIC_DEFAULT_MODEL=claude-3-sonnet-20240229
# ANTHROPIC Model examples: claude-3-sonnet-20240229, claude-3-opus-20240229

# Google Gemini Settings
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1
GEMINI_DEFAULT_MODEL=gemini-pro
# GEMINI Model examples: gemini-pro, gemini-1.5-pro, gemini-1.5-flash

# Local LLM Settings (Ollama, LM Studio, etc.)
LOCAL_LLM_ENDPOINT=http://127.0.0.1:1234/v1/completions
LOCAL_LLM_MODEL=llama-3.2-3b-instruct

# Custom Provider Settings (OpenAI API Compatible)
CUSTOM_PROVIDER_NAME=My Custom LLM
CUSTOM_API_KEY=your_custom_api_key_here
CUSTOM_ENDPOINT=https://your-custom-endpoint.com/v1/completions
CUSTOM_DEFAULT_MODEL=your-custom-model-name
```

Each provider can have its own default model, which will be used when no specific model is requested.

## Google Gemini API

To use the Google Gemini API:

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add your API key to the `.env` file under `GEMINI_API_KEY`
3. Use the default endpoint: `https://generativelanguage.googleapis.com/v1`
4. Choose a model such as `gemini-pro` or `gemini-1.5-pro`

## Command Line Options

When running the script directly:

```bash
ts-node src/scripts/generate-git-commit.ts <template-file> [options]
```

Available options:
- `--provider` or `-p`: Select the LLM provider (`local`, `openai`, `anthropic`, `gemini`, or `custom`)
- `--model` or `-m`: Specify the model to use
- `--copy` or `-c`: Copy the generated message to clipboard

## Commit Message Format

The AI is instructed to generate well-structured commit messages following this format:

```
[Concise summary in imperative mood]

[Detailed description with context and motivation]

- [Bullet points for multiple changes]
- [Each bullet is concise and clear]

[Additional paragraphs for more context]

[Issue references if applicable]
```

Example of a well-formatted commit message:

```
Add TypeScript project configuration and utils

Set up foundational structure for AI scripts and tools repository:
- Initialize package.json with TypeScript dependencies and scripts
- Create tsconfig.json with proper module settings
- Add MIT license and comprehensive README
- Implement shell utilities for command execution and user input

Create the Git commit generator tool with:
- Support for local LLM integration via API
- Interactive editor and clipboard integration
- Template-based prompt system for consistent output

Improve developer experience with automated commit message formatting
and detailed documentation for all available features.

Closes #1
```

## Interactive Features

The commit message generator offers several interactive options:
- **Use as is**: Directly use the generated commit message
- **Edit**: Open the generated message in your preferred editor ($EDITOR)
- **Copy to clipboard**: Copy the message to clipboard without committing
- **Abort**: Cancel the operation without committing

## Shell Integration

To use the scripts from any directory, add the following to your `.zshrc` file:

```bash
# AI Scripts and Tools
# Add this to your .zshrc file to enable git-commit-ai command from any directory

# Path to your ai-scripts-and-tools repository
export AI_SCRIPTS_PATH="$HOME/path/to/ai-scripts-and-tools"

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
  # Use full paths and proper quotes to avoid command not found errors
  export CURRENT_DIR="$(pwd)"
  export ORIGINAL_CWD="$(pwd)"

  # Debug the current working directory
  echo "Current working directory before running script: $CURRENT_DIR"
  (cd "$AI_SCRIPTS_PATH" &&  ts-node "$AI_SCRIPTS_PATH/src/scripts/generate-git-commit.ts" "$template_path" $provider_flag $model_flag $copy_flag)
}

# Alias for shorter command (optional)
alias gcai="git-commit-ai"

# Additional aliases for common use cases
alias gcaic="git-commit-ai --copy"
alias gcaio="git-commit-ai --provider openai"
alias gcaia="git-commit-ai --provider anthropic"
alias gcaig="git-commit-ai --provider gemini"
alias gcaicustom="git-commit-ai --provider custom"
```

Modify the `AI_SCRIPTS_PATH` variable to match your repository location.

## Usage Examples

After adding to your `.zshrc` and reloading (or opening a new terminal), you can use:

```bash
# Using the default provider from .env
gcai

# Using specific providers
gcaio          # OpenAI (GPT models)
gcaia          # Anthropic (Claude models)
gcaig          # Google Gemini
gcaicustom     # Custom OpenAI-compatible provider

# Specifying a model
gcai -p openai -m gpt-4-turbo

# Copy to clipboard
gcaic

# Use a custom template
gcai -t /path/to/custom-template.txt

# Combine options
gcaio -m gpt-4-turbo -c
``` 