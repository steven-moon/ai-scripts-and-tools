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

This repository includes the following AI-powered scripts:

### Generate Git Commit

Automatically generates commit messages based on staged changes using AI through multiple LLM providers (Local LLMs, OpenAI, Anthropic, Google Gemini, Custom Provider).

[See detailed documentation](documents/GENERATE-GIT-COMMIT-DOCS.md)

### Generate Code Summary

Automatically generates a summary of your codebase, including information about files, directories, and optionally full file contents.

[See detailed documentation](documents/GENERATE-CODE-SUMMARY-DOCS.md)

## Configuration

Each script can be configured through environment variables in your `.env` file (copy from `.env.example`).

### Default Model Configuration

Each LLM provider can have a default model configured in the `.env` file.

[See detailed configuration documentation](documents/DEFAULT-MODEL-CONFIGURATION-DOCS.md)

## Tests

To test all LLM providers, use the test script:

```bash
ts-node tests/scripts/test-llm-providers.ts
```

For more details on testing options, see the [tests README](tests/README.md).

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
│       └── llm/        # LLM provider implementations
├── templates/          # Prompt templates
├── documents/          # Detailed documentation
├── tests/              # Tests for LLM providers
├── dist/               # Compiled JavaScript (generated)
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project metadata and dependencies
```

### Adding New Scripts

To add a new script:

1. Create a new TypeScript file in the `src/scripts/` directory
2. Import and use shared utilities as needed
3. Build the project with `npm run build`
4. Run your script with `npm run script -- <your-script-name> [arguments]`
5. Create detailed documentation in the `documents` folder

## License

MIT
