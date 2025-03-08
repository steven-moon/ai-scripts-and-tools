import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Utility for handling temporary files with async operations
 */
export class TempFileManager {
  /**
   * Create a temporary file with content asynchronously
   * @param content - Content to write to the file
   * @param prefix - Prefix for the temporary file name
   * @param suffix - Suffix/extension for the temporary file name
   * @returns Promise with the path to the temporary file
   */
  static async createTempFile(
    content: string | Buffer | object,
    prefix: string = 'temp',
    suffix: string = '.json'
  ): Promise<string> {
    const tempDir = os.tmpdir();
    const fileName = `${prefix}-${Date.now()}${suffix}`;
    const filePath = path.join(tempDir, fileName);
    
    // If content is an object, stringify it
    const fileContent = typeof content === 'object' && !(content instanceof Buffer)
      ? JSON.stringify(content, null, 2)
      : content;
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    return filePath;
  }

  /**
   * Read content from a temporary file asynchronously
   * @param filePath - Path to the temporary file
   * @returns Promise with the content of the file
   */
  static async readTempFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
  }

  /**
   * Delete a temporary file asynchronously
   * @param filePath - Path to the temporary file
   * @returns Promise that resolves to whether the operation was successful
   */
  static async deleteTempFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete temporary file: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Create a temporary file, execute an async operation, and then delete the file
   * @param content - Content to write to the file
   * @param operation - Async function that uses the temporary file
   * @param prefix - Prefix for the temporary file name
   * @param suffix - Suffix/extension for the temporary file name
   * @returns Promise with the result of the operation
   */
  static async withTempFile<T>(
    content: string | Buffer | object,
    operation: (filePath: string) => Promise<T> | T,
    prefix: string = 'temp',
    suffix: string = '.json'
  ): Promise<T> {
    const filePath = await this.createTempFile(content, prefix, suffix);
    try {
      return await operation(filePath);
    } finally {
      await this.deleteTempFile(filePath);
    }
  }
} 