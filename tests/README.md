# LLM Tests

This directory contains tests for the AI Scripts and Tools. These tests help validate the functionality of the LLM integrations and scripts.

## Directory Structure

```
tests/
├── prompts/           # Test prompts for LLM evaluation
│   └── test-prompt.txt  # Sample test prompt
└── scripts/           # Test scripts
    └── test-llm-providers.ts  # Script to test and compare LLM providers
```

## Running Tests

### Test LLM Providers

You can test all configured LLM providers with a single command:

```bash
ts-node tests/scripts/test-llm-providers.ts
```

#### Options

- `--provider, -p`: Test a specific provider (can be used multiple times)
- `--prompt, -t`: Custom test prompt
- `--prompt-file, -f`: Load test prompt from a file
- `--max-tokens, -m`: Maximum tokens for response
- `--verbose, -v`: Show detailed responses
- `--quiet, -q`: Show only comparison results

#### Examples

```bash
# Test all configured providers
ts-node tests/scripts/test-llm-providers.ts

# Test a specific provider
ts-node tests/scripts/test-llm-providers.ts -p openai

# Test multiple providers
ts-node tests/scripts/test-llm-providers.ts -p openai -p anthropic

# Use a custom prompt file
ts-node tests/scripts/test-llm-providers.ts -f tests/prompts/test-prompt.txt

# Show verbose output
ts-node tests/scripts/test-llm-providers.ts -v

# Only display comparison (minimal output)
ts-node tests/scripts/test-llm-providers.ts -q
```

## Test Results

Test results are saved to Markdown files in the project root directory with timestamps, e.g., `llm-test-results-2023-08-15T12-34-56-789Z.md`. These files contain:

1. The test prompt used
2. A summary table of results
3. The complete responses from each provider
4. Errors encountered (if any)

This makes it easy to compare different LLM providers and track performance over time. 