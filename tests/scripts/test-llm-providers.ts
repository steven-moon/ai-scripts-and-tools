/**
 * Test LLM Providers
 * 
 * This script tests all configured LLM providers by sending a test prompt
 * to each one and comparing the results.
 */

import { 
  LLMClientFactory,
  LLMCompletionResult,
  LLMProviderType
} from '../../src/utils/llm';
import { runCommand } from '../../src/utils/shell';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Default test prompt
const DEFAULT_TEST_PROMPT = 
`You are a helpful AI assistant. Please answer the following question concisely in one paragraph.

What is TypeScript and why is it useful?`;

interface TestOptions {
  providers?: LLMProviderType[];
  prompt?: string;
  verbose?: boolean;
  compareOnly?: boolean;
  maxTokens?: number;
}

interface TestResult {
  provider: LLMProviderType;
  model: string | undefined;
  responseTime: number;
  success: boolean;
  response?: string;
  error?: string;
  tokenCount?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Test a specific LLM provider
 * 
 * @param factory The LLM client factory
 * @param provider The provider to test
 * @param prompt The test prompt
 * @param options Test options
 * @returns Test result
 */
async function testProvider(
  factory: LLMClientFactory,
  provider: LLMProviderType,
  prompt: string,
  options: TestOptions = {}
): Promise<TestResult> {
  console.log(`Testing provider: ${provider}...`);
  
  const result: TestResult = {
    provider,
    model: undefined,
    responseTime: 0,
    success: false,
  };
  
  try {
    // Create client with provider override
    const config = factory.getConfig();
    const client = factory.createClient({ provider });
    
    // Get the model name that will be used
    let model = "";
    switch (provider) {
      case 'openai':
        model = options.compareOnly ? config.openaiDefaultModel || "" : config.openaiDefaultModel || "default";
        break;
      case 'anthropic':
        model = options.compareOnly ? config.anthropicDefaultModel || "" : config.anthropicDefaultModel || "default";
        break;
      case 'gemini':
        model = options.compareOnly ? config.geminiDefaultModel || "" : config.geminiDefaultModel || "default";
        break;
      case 'custom':
        model = options.compareOnly ? config.customDefaultModel || "" : config.customDefaultModel || "default";
        break;
      case 'local':
        model = options.compareOnly ? config.localModel || "" : config.localModel || "default";
        break;
    }
    result.model = model;
    
    if (!options.compareOnly) {
      console.log(`Using model: ${model}`);
    }
    
    // Start timer
    const startTime = Date.now();
    
    // Get completion
    const response = await client.getCompletion(prompt, {
      maxTokens: options.maxTokens || 200
    });
    
    // Calculate response time
    const endTime = Date.now();
    result.responseTime = endTime - startTime;
    
    // Store results
    result.success = true;
    result.response = response.text;
    result.tokenCount = response.usage;
    
    if (!options.compareOnly) {
      console.log(`✓ Test passed for ${provider} (${result.responseTime}ms)`);
      if (options.verbose) {
        console.log(`\nResponse:`);
        console.log(response.text);
        console.log();
        
        if (response.usage) {
          console.log(`Token usage: ${response.usage.totalTokens || 'Unknown'} (Prompt: ${response.usage.promptTokens || 'Unknown'}, Completion: ${response.usage.completionTokens || 'Unknown'})`);
        }
      }
    }
    
    return result;
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
    
    if (!options.compareOnly) {
      console.error(`✗ Test failed for ${provider}: ${result.error}`);
      // Add detailed error logging
      console.error('Detailed error:', error);
    }
    
    return result;
  }
}

/**
 * Check if a provider is configured
 * 
 * @param factory The LLM client factory
 * @param provider The provider to check
 * @returns True if the provider is configured
 */
function isProviderConfigured(factory: LLMClientFactory, provider: LLMProviderType): boolean {
  const config = factory.getConfig();
  
  switch (provider) {
    case 'openai':
      return !!config.openaiApiKey;
    case 'anthropic':
      return !!config.anthropicApiKey;
    case 'gemini':
      return !!config.geminiApiKey;
    case 'custom':
      return !!config.customApiKey && !!config.customEndpoint;
    case 'local':
      // Local provider is always considered configured since it doesn't require API keys
      return true;
    default:
      return false;
  }
}

/**
 * Format test results for display
 * 
 * @param results Test results
 * @returns Formatted results table
 */
function formatResultsTable(results: TestResult[]): string {
  // Define column widths
  const columns = {
    provider: 15,
    model: 25,
    time: 10,
    status: 10,
    tokens: 15
  };
  
  // Create header
  let table = [
    `┌${'─'.repeat(columns.provider)}┬${'─'.repeat(columns.model)}┬${'─'.repeat(columns.time)}┬${'─'.repeat(columns.status)}┬${'─'.repeat(columns.tokens)}┐`,
    `│ ${'Provider'.padEnd(columns.provider - 2)} │ ${'Model'.padEnd(columns.model - 2)} │ ${'Time (ms)'.padEnd(columns.time - 2)} │ ${'Status'.padEnd(columns.status - 2)} │ ${'Tokens'.padEnd(columns.tokens - 2)} │`,
    `├${'─'.repeat(columns.provider)}┼${'─'.repeat(columns.model)}┼${'─'.repeat(columns.time)}┼${'─'.repeat(columns.status)}┼${'─'.repeat(columns.tokens)}┤`
  ].join('\n');
  
  // Add rows
  for (const result of results) {
    const status = result.success ? 'Success' : 'Failed';
    const tokens = result.tokenCount?.totalTokens?.toString() || 'N/A';
    
    table += '\n' + [
      `│ ${result.provider.padEnd(columns.provider - 2)} │`,
      `${(result.model || 'default').padEnd(columns.model - 2)} │`,
      `${result.responseTime.toString().padEnd(columns.time - 2)} │`,
      `${status.padEnd(columns.status - 2)} │`,
      `${tokens.padEnd(columns.tokens - 2)} │`
    ].join(' ');
  }
  
  // Add footer
  table += `\n└${'─'.repeat(columns.provider)}┴${'─'.repeat(columns.model)}┴${'─'.repeat(columns.time)}┴${'─'.repeat(columns.status)}┴${'─'.repeat(columns.tokens)}┘`;
  
  return table;
}

/**
 * Format test responses for comparison
 * 
 * @param results Test results
 * @returns Formatted responses for comparison
 */
function formatComparisonResults(results: TestResult[]): string {
  let output = '\n=== Response Comparison ===\n\n';
  
  for (const result of results) {
    if (result.success && result.response) {
      output += `=== ${result.provider.toUpperCase()}${result.model ? ` (${result.model})` : ''} ===\n`;
      output += `${result.response}\n\n`;
    }
  }
  
  return output;
}

/**
 * Save test results to a file
 * 
 * @param results Test results
 * @param testPrompt The test prompt used
 */
function saveResultsToFile(results: TestResult[], testPrompt: string): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Create the results directory path relative to the project root
  const resultsDir = path.join(process.cwd(), 'tests', 'results');
  
  // Ensure the results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const filePath = path.join(resultsDir, `llm-test-results-${timestamp}.md`);
  
  let content = `# LLM Provider Test Results\n\n`;
  content += `Test run at: ${new Date().toLocaleString()}\n\n`;
  
  content += `## Test Prompt\n\n\`\`\`\n${testPrompt}\n\`\`\`\n\n`;
  
  content += `## Results Summary\n\n\`\`\`\n${formatResultsTable(results)}\n\`\`\`\n\n`;
  
  content += `## Response Comparison\n\n`;
  
  for (const result of results) {
    content += `### ${result.provider.toUpperCase()}${result.model ? ` (${result.model})` : ''}\n\n`;
    if (result.success && result.response) {
      content += `\`\`\`\n${result.response}\n\`\`\`\n\n`;
    } else {
      content += `**Error:** ${result.error || 'Unknown error'}\n\n`;
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`\nTest results saved to: ${filePath}`);
  console.log(`Results are now stored in the tests/results directory.`);
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: TestOptions = {
    providers: [],
    prompt: DEFAULT_TEST_PROMPT,
    verbose: false,
    compareOnly: false,
    maxTokens: 200
  };
  
  // Process arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--provider':
      case '-p':
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          options.providers = [...(options.providers || []), args[i + 1] as LLMProviderType];
          i++;
        }
        break;
      case '--prompt':
      case '-t':
        if (args[i + 1] && !args[i + 1].startsWith('-')) {
          options.prompt = args[i + 1];
          i++;
        }
        break;
      case '--prompt-file':
      case '-f':
        if (args[i + 1] && !args[i + 1].startsWith('-') && fs.existsSync(args[i + 1])) {
          options.prompt = fs.readFileSync(args[i + 1], 'utf8');
          i++;
        }
        break;
      case '--max-tokens':
      case '-m':
        if (args[i + 1] && !isNaN(Number(args[i + 1]))) {
          options.maxTokens = Number(args[i + 1]);
          i++;
        }
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--quiet':
      case '-q':
        options.compareOnly = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: ts-node tests/scripts/test-llm-providers.ts [options]

Options:
  --provider, -p     Test a specific provider (can be used multiple times)
  --prompt, -t       Custom test prompt
  --prompt-file, -f  Load test prompt from a file
  --max-tokens, -m   Maximum tokens for response
  --verbose, -v      Show detailed responses
  --quiet, -q        Show only comparison results
  --help, -h         Show this help
        `);
        process.exit(0);
    }
  }
  
  // Get the factory
  const factory = LLMClientFactory.getInstance();
  
  // List of providers to test
  let providersToTest: LLMProviderType[] = options.providers && options.providers.length > 0 
    ? options.providers 
    : ['local', 'openai', 'anthropic', 'gemini', 'custom'];
  
  // Filter out providers that aren't configured
  const configuredProviders = providersToTest.filter(provider => 
    isProviderConfigured(factory, provider)
  );
  
  if (configuredProviders.length === 0) {
    console.error('No providers are configured. Set up API keys in your .env file.');
    process.exit(1);
  }
  
  console.log(`Testing ${configuredProviders.length} configured providers with${options.prompt === DEFAULT_TEST_PROMPT ? ' default' : ''} prompt...`);
  
  if (!options.compareOnly) {
    console.log('\nTest prompt:');
    console.log('---');
    console.log(options.prompt);
    console.log('---\n');
  }
  
  // Run tests
  const results: TestResult[] = [];
  
  for (const provider of configuredProviders) {
    const result = await testProvider(factory, provider, options.prompt || DEFAULT_TEST_PROMPT, options);
    results.push(result);
  }
  
  // Print summary table
  console.log('\n=== Results Summary ===');
  console.log(formatResultsTable(results));
  
  // Print comparison of responses
  if (options.verbose || options.compareOnly) {
    console.log(formatComparisonResults(results));
  }
  
  // Save results to file
  saveResultsToFile(results, options.prompt || DEFAULT_TEST_PROMPT);
}

main().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 