# LLM Test Prompts

This directory contains sample prompts for testing different LLM providers.

## Available Prompts

- `test-prompt.txt`: A general technical question about TypeScript vs JavaScript

## Using Test Prompts

You can use these prompts with the LLM provider test script:

```bash
# Test with a specific prompt file
ts-node tests/scripts/test-llm-providers.ts --prompt-file tests/prompts/test-prompt.txt

# Test a specific provider with a prompt file
ts-node tests/scripts/test-llm-providers.ts --provider openai --prompt-file tests/prompts/test-prompt.txt
```

## Creating New Test Prompts

Create new text files in this directory with prompts designed to test specific capabilities of LLMs.

Good test prompts should:
1. Be clear and specific in their instructions
2. Test a particular capability (summarization, question answering, code generation, etc.)
3. Allow for easy comparison between different models
4. Include word/token limits where appropriate 