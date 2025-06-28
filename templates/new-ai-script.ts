#!/usr/bin/env ts-node

/**
 * AI Script Template
 * 
 * This is a template for creating new AI-powered scripts.
 * Copy this file and modify it for your specific use case.
 */

import { LLMClientFactory } from '../src/utils/llm/llm-client-factory';
import { LLMClientOptions } from '../src/utils/llm/base-llm-client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ScriptOptions {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // Add your custom options here
  inputFile?: string;
  outputFile?: string;
}

class MyAIScript {
  private options: ScriptOptions;

  constructor(options: ScriptOptions = {}) {
    this.options = {
      provider: process.env.LLM_PROVIDER || 'local',
      model: process.env.LLM_MODEL,
      temperature: 0.5,
      maxTokens: 500,
      ...options,
    };
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    try {
      console.log('🤖 Starting AI script...');
      
      // 1. Validate configuration
      await this.validateConfig();
      
      // 2. Load input data
      const inputData = await this.loadInput();
      
      // 3. Process with AI
      const result = await this.processWithAI(inputData);
      
      // 4. Save output
      await this.saveOutput(result);
      
      console.log('✅ AI script completed successfully!');
      
    } catch (error) {
      console.error('❌ Error running AI script:', error);
      process.exit(1);
    }
  }

  /**
   * Validate configuration and LLM setup
   */
  private async validateConfig(): Promise<void> {
    console.log('🔍 Validating configuration...');
    
    // Create LLM client to test configuration
    const factory = LLMClientFactory.getInstance();
    const llmClient = factory.createClient({
      provider: this.options.provider as any,
      model: this.options.model,
    });

    if (!llmClient.isConfigured()) {
      throw new Error(`LLM provider '${this.options.provider}' is not properly configured. Check your .env file.`);
    }

    console.log(`✅ Using ${this.options.provider} provider`);
  }

  /**
   * Load input data (modify for your use case)
   */
  private async loadInput(): Promise<string> {
    console.log('📂 Loading input data...');
    
    // Example: Load from file if specified
    if (this.options.inputFile) {
      const fs = await import('fs/promises');
      return await fs.readFile(this.options.inputFile, 'utf8');
    }
    
    // Example: Get from command line arguments
    const args = process.argv.slice(2);
    if (args.length > 0) {
      return args.join(' ');
    }
    
    // Example: Get from user input
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question('Enter your input: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Process data with AI
   */
  private async processWithAI(inputData: string): Promise<string> {
    console.log('🧠 Processing with AI...');
    
    const factory = LLMClientFactory.getInstance();
    const llmClient = factory.createClient({
      provider: this.options.provider as any,
      model: this.options.model,
      temperature: this.options.temperature,
      maxTokens: this.options.maxTokens,
    });

    // Create your prompt here
    const prompt = this.createPrompt(inputData);
    
    // Get AI completion
    const result = await llmClient.getCompletion(prompt);
    
    return result.text;
  }

  /**
   * Create the prompt for your AI task (modify this!)
   */
  private createPrompt(inputData: string): string {
    // Customize this prompt for your specific use case
    return `
You are an AI assistant helping with a specific task.

Input data:
${inputData}

Please process this data and provide a helpful response.
`;
  }

  /**
   * Save the output (modify for your use case)
   */
  private async saveOutput(result: string): Promise<void> {
    console.log('💾 Saving output...');
    
    // Example: Save to file if specified
    if (this.options.outputFile) {
      const fs = await import('fs/promises');
      await fs.writeFile(this.options.outputFile, result, 'utf8');
      console.log(`✅ Output saved to: ${this.options.outputFile}`);
      return;
    }
    
    // Default: Print to console
    console.log('\n📄 Output:');
    console.log('─'.repeat(50));
    console.log(result);
    console.log('─'.repeat(50));
  }
}

/**
 * Command line interface
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: ScriptOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--provider':
      case '-p':
        options.provider = args[++i];
        break;
      case '--model':
      case '-m':
        options.model = args[++i];
        break;
      case '--temperature':
      case '-t':
        options.temperature = parseFloat(args[++i]);
        break;
      case '--max-tokens':
        options.maxTokens = parseInt(args[++i]);
        break;
      case '--input':
      case '-i':
        options.inputFile = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputFile = args[++i];
        break;
      case '--help':
      case '-h':
        showHelp();
        return;
    }
  }

  // Run the script
  const script = new MyAIScript(options);
  await script.run();
}

function showHelp(): void {
  console.log(`
AI Script Template - Usage

Options:
  -p, --provider <provider>    LLM provider (local, openai, anthropic, gemini, custom)
  -m, --model <model>          Specific model to use
  -t, --temperature <number>   Temperature for AI responses (0.0-1.0)
  --max-tokens <number>        Maximum tokens for response
  -i, --input <file>           Input file path
  -o, --output <file>          Output file path
  -h, --help                   Show this help message

Examples:
  ts-node templates/new-ai-script.ts "Hello, world!"
  ts-node templates/new-ai-script.ts -p openai -m gpt-4 -i input.txt -o output.txt
  ts-node templates/new-ai-script.ts --provider anthropic --temperature 0.7
`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { MyAIScript }; 