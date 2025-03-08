import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Utility for handling temporary files
 */
export class TempFileManager {
  /**
   * Create a temporary file with content
   * @param content - Content to write to the file
   * @param prefix - Prefix for the temporary file name
   * @param suffix - Suffix/extension for the temporary file name
   * @returns The path to the temporary file
   */
  static createTempFile(
    content: string | Buffer | object,
    prefix: string = 'temp',
    suffix: string = '.json'
  ): string {
    const tempDir = os.tmpdir();
    const fileName = `${prefix}-${Date.now()}${suffix}`;
    const filePath = path.join(tempDir, fileName);
    
    // If content is an object, stringify it
    const fileContent = typeof content === 'object' && !(content instanceof Buffer)
      ? JSON.stringify(content, null, 2)
      : content;
    
    fs.writeFileSync(filePath, fileContent, 'utf8');
    return filePath;
  }

  /**
   * Read content from a temporary file
   * @param filePath - Path to the temporary file
   * @returns The content of the file
   */
  static readTempFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Delete a temporary file
   * @param filePath - Path to the temporary file
   * @returns Whether the operation was successful
   */
  static deleteTempFile(filePath: string): boolean {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete temporary file: ${filePath}`, error);
      return false;
    }
  }

  /**
   * Create a temporary file, execute an operation, and then delete the file
   * @param content - Content to write to the file
   * @param operation - Function that uses the temporary file
   * @param prefix - Prefix for the temporary file name
   * @param suffix - Suffix/extension for the temporary file name
   * @returns The result of the operation
   */
  static withTempFile<T>(
    content: string | Buffer | object,
    operation: (filePath: string) => T,
    prefix: string = 'temp',
    suffix: string = '.json'
  ): T {
    const filePath = this.createTempFile(content, prefix, suffix);
    try {
      return operation(filePath);
    } finally {
      this.deleteTempFile(filePath);
    }
  }
} 