# Quick Start Guide

Get up and running with AI Scripts and Tools in 5 minutes!

## 🚀 Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your LLM provider:**
   ```bash
   cp env.example .env
   # Edit .env and add your API keys
   ```

3. **Test your setup:**
   ```bash
   npm run test-llm
   ```

## 🎯 Quick Commands

### Generate Git Commit Messages
```bash
# Using default provider
npm run commit

# Using specific provider
npm run commit -- --provider openai --copy
```

### Generate Code Summaries
```bash
# Basic summary
npm run summary

# Detailed summary with file contents
npm run summary -- --details --clipboard
```

## 🔧 Shell Integration (Optional)

### Option 1: Automatic Setup (Recommended)
```bash
# Run the setup script
./setup-shell.sh

# Reload your shell
source ~/.zshrc  # or ~/.bashrc
```

### Option 2: Manual Setup
Add these to your `~/.zshrc` for global access:

```bash
export AI_SCRIPTS_PATH="/Users/stevenmoon/GitRepo/ai-scripts-and-tools"

# Quick aliases
alias gcai="cd $AI_SCRIPTS_PATH && npm run commit"
alias cs="cd $AI_SCRIPTS_PATH && npm run summary"
alias test-ai="cd $AI_SCRIPTS_PATH && npm run test-llm"
```

Then reload: `source ~/.zshrc`

## 📝 Adding New AI Scripts

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

3. **Use the LLM client:**
   ```typescript
   import { LLMClientFactory } from '../utils/llm/llm-client-factory';
   
   const factory = LLMClientFactory.getInstance();
   const llm = factory.createClient();
   const result = await llm.getCompletion("Your prompt here");
   ```

## 🎯 Supported LLM Providers

- **Local LLMs** (Ollama, LM Studio) - Default
- **OpenAI** (GPT models)
- **Anthropic** (Claude models)  
- **Google Gemini**
- **Custom providers** (OpenAI API compatible)

## 🆘 Need Help?

- **Documentation**: Check `_docs/` directory
- **Examples**: See `examples/` directory
- **Tests**: Run `npm run test-llm` to verify setup

---

*Ready to build AI-powered tools! 🚀* 