# Summarize Folder Script

> **Purpose**: Generate a comprehensive summary of all text files in a directory  
> **Status**: ✅ **IMPLEMENTED**  
> **Priority**: 🟡 **MEDIUM - UTILITY TOOL**

---

## Overview

The `summarize-folder.ts` script reads all text files in a specified directory and outputs their contents in a structured format. This is useful for creating comprehensive summaries of codebases, documentation, or any text-based project structure.

### **Key Features:**
- ✅ **Gitignore Support**: Respects `.gitignore` patterns to exclude unwanted files
- ✅ **Text File Filtering**: Only processes common text file extensions
- ✅ **Structured Output**: Clear file separation with headers
- ✅ **Error Handling**: Graceful handling of file read errors
- ✅ **Flexible Usage**: Works with any directory path

---

## Usage

### **Command Line Usage**

```bash
# Using npm script (recommended)
npm run summarize -- <directory-path>

# Using ts-node directly
npx ts-node src/scripts/summarize-folder.ts <directory-path>

# Using the executable script
./src/scripts/summarize-folder.ts <directory-path>
```

### **Examples**

```bash
# Summarize templates directory
npm run summarize -- templates

# Summarize source code
npm run summarize -- src

# Summarize documentation
npm run summarize -- _docs

# Summarize entire project (excluding node_modules, dist, etc.)
npm run summarize -- .
```

---

## Supported File Types

The script processes these text file extensions:

- **Code Files**: `.ts`, `.js`, `.tsx`, `.jsx`
- **Configuration**: `.json`
- **Documentation**: `.md`, `.txt`
- **Web Files**: `.html`, `.css`, `.scss`

### **Gitignore Integration**

The script automatically:
1. Looks for a `.gitignore` file in the target directory
2. Applies gitignore patterns to filter files
3. Excludes files that would be ignored by git

This ensures that build artifacts, dependencies, and other unwanted files are not included in the summary.

---

## Output Format

The script outputs files in this format:

```
--- FILE: path/to/file.ts ---
[file contents here]

--- FILE: path/to/another/file.md ---
[file contents here]
```

### **Features:**
- **Clear File Headers**: Each file is clearly marked with its path
- **Full Content**: Complete file contents are included
- **Error Handling**: Files that can't be read are skipped with warnings
- **Structured Layout**: Easy to parse and process further

---

## Error Handling

The script handles various error scenarios gracefully:

### **Missing Directory**
```bash
npm run summarize -- non-existent-directory
# Output: (empty - no files found)
```

### **Missing Arguments**
```bash
npm run summarize
# Output: Usage: ts-node summarize-folder.ts <path>
```

### **File Read Errors**
```bash
# Files that can't be read are skipped with warnings
# Example: Permission denied, file locked, etc.
```

---

## Use Cases

### **Code Review Preparation**
Generate a complete summary of a codebase for review:

```bash
npm run summarize -- src > code-review-summary.txt
```

### **Documentation Generation**
Create comprehensive documentation summaries:

```bash
npm run summarize -- _docs > documentation-summary.txt
```

### **Project Analysis**
Analyze project structure and content:

```bash
npm run summarize -- . > project-summary.txt
```

### **AI Processing**
Pipe output to AI tools for analysis:

```bash
npm run summarize -- src | some-ai-tool
```

---

## Technical Details

### **Dependencies**

The script requires these npm packages:
- `fs-extra`: Enhanced file system operations
- `fast-glob`: Fast file globbing
- `ignore`: Gitignore pattern matching

### **Installation**

Dependencies are automatically installed when you run:

```bash
npm install
```

### **Performance**

- **Fast Globbing**: Uses `fast-glob` for efficient file discovery
- **Async Processing**: Non-blocking file reading
- **Memory Efficient**: Processes files one at a time

---

## Integration with Existing Workflow

### **Agent Workflow Integration**

The script integrates with the agent-driven development workflow:

- **Automatic Testing**: Script is tested during build cycles
- **Lint Compliance**: Follows TypeScript coding standards
- **Error Recovery**: Agent can handle script errors automatically

### **Package.json Integration**

The script is available as an npm command:

```json
{
  "scripts": {
    "summarize": "ts-node src/scripts/summarize-folder.ts"
  }
}
```

---

## Troubleshooting

### **Common Issues**

#### **No Output**
- Check if the directory exists
- Verify the directory contains text files
- Check if files are excluded by `.gitignore`

#### **Permission Errors**
- Ensure read permissions on target directory
- Check file permissions for individual files

#### **Memory Issues**
- For very large directories, consider processing subdirectories separately
- Monitor system memory usage

### **Debug Mode**

To debug issues, you can run with verbose output:

```bash
# Check what files are being processed
npx ts-node src/scripts/summarize-folder.ts src 2>&1 | head -50
```

---

## Future Enhancements

### **Planned Features**

1. **Output Format Options**: JSON, YAML, or custom formats
2. **File Size Limits**: Configurable file size limits
3. **Content Filtering**: Filter by file content patterns
4. **Recursive Depth Control**: Limit directory recursion depth
5. **Parallel Processing**: Process multiple files simultaneously

### **Advanced Options**

1. **Exclude Patterns**: Custom exclude patterns beyond gitignore
2. **Include Patterns**: Custom include patterns
3. **Output to File**: Direct file output option
4. **Compression**: Compressed output for large summaries

---

## Conclusion

The `summarize-folder.ts` script provides a powerful and flexible way to generate comprehensive summaries of text-based projects. With gitignore support, error handling, and structured output, it's ideal for code review, documentation generation, and project analysis tasks.

**Key Benefits:**
- 🚀 **Fast and Efficient**: Quick processing of large directories
- 🎯 **Smart Filtering**: Respects gitignore and file type filters
- 🔧 **Robust Error Handling**: Graceful handling of various error conditions
- 📊 **Structured Output**: Clear, parseable output format
- 🔗 **Easy Integration**: Simple npm command integration

---

*Last updated: 2025-06-27* 