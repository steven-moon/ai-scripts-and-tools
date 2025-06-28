# AI Scripts and Tools

A collection of TypeScript-based scripts and tools for AI-related tasks, including git commit message generation, code summaries, and LLM provider integrations.

## 🚀 Quick Start

**Get started in 5 minutes!** See [QUICK-START.md](QUICK-START.md) for detailed setup instructions.

```bash
# 1. Install dependencies
npm install

# 2. Configure your LLM provider
cp env.example .env
# Edit .env and add your API keys

# 3. Test your setup
npm run test-llm
```

## 🎯 Core Features

- 🤖 **AI-Powered Git Commits**: Generate intelligent commit messages using multiple LLM providers
- 📊 **Code Summaries**: Create comprehensive codebase summaries with file analysis
- 🔌 **Multi-Provider Support**: OpenAI, Anthropic, Google Gemini, Local LLMs, and custom providers
- 🚀 **Agent-Driven Development**: Automated build, test, and validation workflows
- 📝 **TypeScript-First**: Built with TypeScript for type safety and developer experience

## 📋 Available Scripts

### Generate Git Commit Message

```bash
# Using default provider
npm run commit

# Using specific provider
npm run commit -- --provider openai --model gpt-4-turbo

# Copy to clipboard
npm run commit -- --copy
```

### Generate Code Summary

```bash
# Basic summary
npm run summary

# Detailed summary with file contents
npm run summary -- --details

# Copy to clipboard
npm run summary -- --clipboard
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript 5.x

### Available Commands

```bash
# Development
npm run dev          # Run in development mode
npm run build        # Build TypeScript to JavaScript
npm run lint         # Check TypeScript code quality
npm run clean        # Clean build artifacts

# Scripts
npm run commit       # Generate git commit message
npm run summary      # Generate code summary
npm run test-llm     # Test LLM providers

# Testing
npm test             # Run test suite
```

### Adding New AI Scripts

1. **Use the template:**
   ```bash
   cp templates/new-ai-script.ts src/scripts/my-ai-tool.ts
   ```

2. **Add to package.json:**
   ```json
   "scripts": {
     "my-tool": "ts-node src/scripts/my-ai-tool.ts"
   }
   ```

3. **Customize the script** for your specific use case

See [templates/new-ai-script.ts](templates/new-ai-script.ts) for a complete example.

## 📚 Documentation

- **[Quick Start Guide](QUICK-START.md)** - Get up and running in 5 minutes
- **[Git Commit Generation](_docs/GENERATE-GIT-COMMIT-DOCS.md)** - Detailed guide for commit message generation
- **[Code Summary Generation](_docs/GENERATE-CODE-SUMMARY-DOCS.md)** - Guide for codebase summaries
- **[Configuration Guide](_docs/DEFAULT-MODEL-CONFIGURATION-DOCS.md)** - LLM provider configuration
- **[Command Line Setup](_docs/COMMAND-LINE-SETUP-DOCS.md)** - Shell integration instructions
- **[Agent Development Workflow](_docs/Agent_Development_Workflow.md)** - Advanced development workflow

## 🏗️ Project Structure

```
ai-scripts-and-tools/
├── src/                    # Source code
│   ├── scripts/           # Main scripts
│   │   ├── generate-git-commit.ts
│   │   └── generate-code-summary.ts
│   └── utils/             # Shared utilities
│       ├── llm/           # LLM provider implementations
│       ├── httpClient.ts  # HTTP client utilities
│       ├── clipboard.ts   # Clipboard operations
│       └── shell.ts       # Shell utilities
├── templates/             # Prompt templates and script templates
├── _docs/                 # Documentation
├── tests/                 # Test files
├── examples/              # Example outputs
├── env.example            # Environment configuration template
├── QUICK-START.md         # Quick start guide
└── templates/new-ai-script.ts  # Template for new AI scripts
```

## 🎯 Supported LLM Providers

- **Local LLMs** (Ollama, LM Studio) - Default
- **OpenAI** (GPT models)
- **Anthropic** (Claude models)
- **Google Gemini**
- **Custom providers** (OpenAI API compatible)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

*Built with TypeScript, Node.js, and AI-powered development tools.*
