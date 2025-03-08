import { execSync } from 'child_process';

/**
 * Copy text to clipboard
 * @param text - Text to copy to clipboard
 * @returns boolean - Whether the operation was successful
 */
export function copyToClipboard(text: string): boolean {
  try {
    // Detect platform and use appropriate clipboard command
    if (process.platform === 'darwin') {
      // macOS
      execSync('pbcopy', { input: text });
      return true;
    } else if (process.platform === 'win32') {
      // Windows
      execSync('clip', { input: text });
      return true;
    } else if (process.platform === 'linux') {
      // Linux - try xclip first, then xsel
      try {
        execSync('xclip -selection clipboard', { input: text });
        return true;
      } catch (error) {
        try {
          execSync('xsel --clipboard --input', { input: text });
          return true;
        } catch (error) {
          console.error('Failed to copy to clipboard: xclip and xsel not available');
          return false;
        }
      }
    } else {
      console.error(`Clipboard not supported on platform: ${process.platform}`);
      return false;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
} 