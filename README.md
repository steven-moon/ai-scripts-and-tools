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

### Shell Integration

To use the scripts from any directory, add the following to your `.zshrc` file:

```bash
# AI Scripts and Tools
# Path to your ai-scripts-and-tools repository
export AI_SCRIPTS_PATH="$HOME/path/to/ai-scripts-and-tools"

# Function to generate AI-assisted git commit messages
git-commit-ai() {
  # Default template path or use provided argument
  local template_path="${1:-$AI_SCRIPTS_PATH/templates/commit-template.txt}"
  
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
  
  # Run the script from the AI tools repository
  (cd "$AI_SCRIPTS_PATH" && npm run script generate-git-commit -- "$template_path")
}

# Alias for shorter command (optional)
alias gcai="git-commit-ai"
```

After adding to your `.zshrc` and reloading (or opening a new terminal), you can use:

```bash
# From any git repository with staged changes
gcai

# Or with a custom template
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
