# AI Scripts and Tools

A collection of TypeScript-based scripts and tools for AI-related tasks, including code generation, prompt engineering, and model interaction utilities.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/steven-moon/ai-scripts-and-tools.git
cd ai-scripts-and-tools
npm install
```

## Available Scripts

### Generate Git Commit

Automatically generates commit messages based on staged changes using a local LLM.

Usage:
```bash
npm run script generate-git-commit -- <template-file>
```

The script requires a template file that contains prompts and placeholders for the LLM.

#### Commit Message Format

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

#### Interactive Features

The commit message generator offers several interactive options:
- **Use as is**: Directly use the generated commit message
- **Edit**: Open the generated message in your preferred editor ($EDITOR)
- **Copy to clipboard**: Copy the message to clipboard without committing
- **Abort**: Cancel the operation without committing

### Shell Integration

To use the scripts from any directory, add the following to your `.zshrc` file:

```bash
# AI Scripts and Tools
# Path to your ai-scripts-and-tools repository
export AI_SCRIPTS_PATH="$HOME/path/to/ai-scripts-and-tools"

# Function to generate AI-assisted git commit messages
git-commit-ai() {
  # Parse options
  local copy_flag=""
  local template_path=""
  
  # Process command line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -c|--copy)
        copy_flag="--copy"
        shift
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
  # Run the script directly with ts-node
  (cd "$AI_SCRIPTS_PATH" && npx ts-node "$AI_SCRIPTS_PATH/src/scripts/generate-git-commit.ts" "$template_path" $copy_flag)
}

# Alias for shorter command (optional)
alias gcai="git-commit-ai"

# Additional aliases for common use cases
alias gcaic="git-commit-ai --copy"
```

After adding to your `.zshrc` and reloading (or opening a new terminal), you can use:

```bash
# Basic usage - from any git repository with staged changes
gcai

# Automatically copy to clipboard
gcai -c
# or
gcaic

# Custom template
gcai -t /path/to/custom-template.txt
# or
gcai /path/to/custom-template.txt
```

## Development

### Setup

This project uses TypeScript. To set up the development environment:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run scripts directly:
   ```bash
   npm run script -- <script-name> [arguments]
   ```

### Project Structure

```
ai-scripts-and-tools/
├── src/                # Source code
│   ├── index.ts        # Entry point
│   ├── scripts/        # Individual scripts
│   │   └── generate-git-commit.ts
│   └── utils/          # Shared utilities
├── dist/               # Compiled JavaScript (generated)
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project metadata and dependencies
```

## Adding New Scripts

To add a new script:

1. Create a new TypeScript file in the `src/scripts/` directory
2. Import and use shared utilities as needed
3. Build the project with `npm run build`
4. Run your script with `npm run script -- <your-script-name> [arguments]`

## License

MIT
