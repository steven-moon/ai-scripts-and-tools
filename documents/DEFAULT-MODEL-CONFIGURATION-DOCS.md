# Default Model Configuration

Each LLM provider can have a default model configured in the `.env` file:

## Provider-Specific Default Models

- `OPENAI_DEFAULT_MODEL`: Default model for OpenAI (e.g., gpt-3.5-turbo-instruct)
- `ANTHROPIC_DEFAULT_MODEL`: Default model for Anthropic (e.g., claude-3-sonnet-20240229)
- `GEMINI_DEFAULT_MODEL`: Default model for Google Gemini (e.g., gemini-pro)
- `LOCAL_LLM_MODEL`: Default model for local LLMs (e.g., llama-3.2-3b-instruct)
- `CUSTOM_DEFAULT_MODEL`: Default model for your custom provider

The scripts will use these models if no specific model is provided via command line.

## Custom Provider Integration

The custom provider feature allows you to connect to any OpenAI API-compatible service. Configure it in your `.env` file:

```bash
CUSTOM_PROVIDER_NAME=My Custom LLM    # A friendly name for your provider
CUSTOM_API_KEY=your_api_key_here      # Your API key
CUSTOM_ENDPOINT=https://your-custom-endpoint.com/v1/completions  # Endpoint URL
CUSTOM_DEFAULT_MODEL=your-model-name  # Default model to use
```

You can use this with services like:
- Self-hosted LLM servers with OpenAI API compatibility
- Other commercial LLM services that follow the OpenAI format
- Azure OpenAI Service with custom endpoints 