/**
 * AI Scripts and Tools
 * 
 * This is the main entry point for the AI scripts and tools collection.
 * Individual scripts and tools can be found in their respective directories.
 */

import { join } from 'path';
import fs from 'fs';

// Display available scripts
const scriptsDir = join(__dirname, 'scripts');
const availableScripts = fs.readdirSync(scriptsDir)
  .filter(file => file.endsWith('.ts'))
  .map(file => file.replace('.ts', ''));

console.log('Available AI Scripts and Tools:');
console.log(availableScripts.map(script => `- ${script}`).join('\n'));
console.log('\nRun a script using: npm run script -- <script-name> [arguments]'); 