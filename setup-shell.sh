#!/bin/bash

# AI Scripts and Tools - Shell Setup Script
# This script adds convenient aliases to your shell configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 AI Scripts and Tools - Shell Setup${NC}"
echo "=================================="

# Detect shell and config file
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="Zsh"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
    SHELL_NAME="Bash"
else
    echo -e "${RED}❌ Unsupported shell: $SHELL${NC}"
    echo "Please manually add the configuration to your shell config file."
    exit 1
fi

echo -e "${GREEN}✅ Detected $SHELL_NAME shell${NC}"

# Get the repository path
REPO_PATH=$(pwd)
echo -e "${BLUE}📁 Repository path: $REPO_PATH${NC}"

# Check if .env file exists
if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Please run 'cp env.example .env' and configure your API keys first."
fi

# Create the shell configuration
CONFIG_BLOCK="# AI Scripts and Tools
export AI_SCRIPTS_PATH=\"$REPO_PATH\"

# Quick aliases
alias gcai=\"cd \$AI_SCRIPTS_PATH && npm run commit\"
alias cs=\"cd \$AI_SCRIPTS_PATH && npm run summary\"
alias test-ai=\"cd \$AI_SCRIPTS_PATH && npm run test-llm\"

# Function for git commit with AI
git-commit-ai() {
  cd \"\$AI_SCRIPTS_PATH\"
  npm run commit \"\$@\"
}

# Function for code summary
code-summary() {
  cd \"\$AI_SCRIPTS_PATH\"
  npm run summary \"\$@\"
}
"

# Check if configuration already exists
if grep -q "AI_SCRIPTS_PATH" "$SHELL_CONFIG" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Configuration already exists in $SHELL_CONFIG${NC}"
    echo "The following configuration will be updated:"
    echo ""
    echo -e "${BLUE}$CONFIG_BLOCK${NC}"
    
    read -p "Do you want to update the existing configuration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Setup cancelled.${NC}"
        exit 0
    fi
    
    # Remove existing configuration
    sed -i.bak '/# AI Scripts and Tools/,/^}/d' "$SHELL_CONFIG"
    echo -e "${GREEN}✅ Removed existing configuration${NC}"
fi

# Add new configuration
echo "$CONFIG_BLOCK" >> "$SHELL_CONFIG"

echo -e "${GREEN}✅ Configuration added to $SHELL_CONFIG${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "1. Reload your shell configuration:"
echo "   source $SHELL_CONFIG"
echo ""
echo "2. Or open a new terminal window"
echo ""
echo "3. Test the setup:"
echo "   test-ai"
echo ""
echo -e "${GREEN}🎉 Setup complete! You can now use:${NC}"
echo "   • gcai          - Generate git commit message"
echo "   • cs            - Generate code summary"
echo "   • test-ai       - Test LLM providers"
echo "   • git-commit-ai - Generate commit with options"
echo "   • code-summary  - Generate summary with options"
echo ""
echo -e "${BLUE}📚 For more information, see QUICK-START.md${NC}" 