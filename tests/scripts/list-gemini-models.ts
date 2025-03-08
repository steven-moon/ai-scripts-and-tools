/**
 * List Gemini Models
 * 
 * This script lists available Gemini models for the given API key.
 */

import { runCommand } from '../../src/utils/shell';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY is not set in your .env file.');
  process.exit(1);
}

// Endpoint for listing models
const endpoint = 'https://generativelanguage.googleapis.com/v1/models';

// List available models
async function listModels() {
  console.log('Listing available Gemini models...');
  
  try {
    const response = runCommand(`curl -s "${endpoint}?key=${apiKey}"`);
    
    try {
      const parsedResponse = JSON.parse(response);
      
      if (parsedResponse.error) {
        console.error('Gemini API error:', parsedResponse.error.message);
        return;
      }
      
      if (parsedResponse.models && parsedResponse.models.length > 0) {
        console.log('\nAvailable Gemini models:');
        console.log('------------------------');
        
        parsedResponse.models.forEach((model: any) => {
          console.log(`- Name: ${model.name}`);
          console.log(`  Display name: ${model.displayName}`);
          console.log(`  Description: ${model.description || 'No description'}`);
          console.log(`  Supported generation methods: ${(model.supportedGenerationMethods || []).join(', ')}`);
          console.log('');
        });
        
        console.log('\nRecommended model configurations:');
        console.log('--------------------------------');
        console.log('For your .env file:');
        console.log('```');
        console.log('GEMINI_API_KEY=your_api_key_here');
        console.log('GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1');
        
        // Find a model that supports generateContent
        const generateContentModels = parsedResponse.models.filter((model: any) => 
          model.supportedGenerationMethods && 
          model.supportedGenerationMethods.includes('generateContent')
        );
        
        if (generateContentModels.length > 0) {
          // Get just the model name without the prefix
          const modelName = generateContentModels[0].name.split('/').pop();
          console.log(`GEMINI_DEFAULT_MODEL=${modelName}`);
        } else {
          console.log('GEMINI_DEFAULT_MODEL=gemini-1.5-pro');
        }
        
        console.log('```');
      } else {
        console.log('No models found or invalid response format.');
      }
    } catch (error) {
      console.error('Error parsing API response:', error);
      console.log('Raw response:', response);
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
  }
}

listModels();