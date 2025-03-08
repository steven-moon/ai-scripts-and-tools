/**
 * Test Provider Script
 * 
 * This script tests the LLM client factory provider configuration.
 */

import { LLMClientFactory, LLMProviderType } from '../../src/utils/llm';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  console.log('Received arguments:', args);
  
  let provider: LLMProviderType | undefined;
  
  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' || args[i] === '-p') {
      provider = args[i + 1] as LLMProviderType;
      i++;
    }
  }
  
  console.log("Testing LLM Provider Configuration");
  
  // Get the LLM client factory
  const factory = LLMClientFactory.getInstance();
  
  // Show current configuration
  console.log('Initial configuration:');
  console.log(`Provider: ${factory.getConfig().provider}`);
  
  // Override provider if specified
  if (provider) {
    console.log(`\nOverriding provider to: ${provider}`);
    factory.updateConfig({ provider });
    
    // Show updated configuration
    console.log('Updated configuration:');
    console.log(`Provider: ${factory.getConfig().provider}`);
  }
  
  // Create client
  console.log('\nCreating LLM client...');
  const client = factory.createClient();
  console.log(`Client provider: ${client.getName()}`);
}

main().catch(console.error); 