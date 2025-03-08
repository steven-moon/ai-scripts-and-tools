# Generate Code Summary

Automatically generates a summary of your codebase, including information about files, directories, and optionally full file contents. Respects .gitignore patterns to exclude unwanted files.

## Features

- Generates summaries of all files in the current directory and subdirectories
- Respects .gitignore patterns and supports custom ignore patterns
- Customizable via environment variables
- Option to include full text of each file (details mode)
- Copy output to clipboard or save to a file
- Interactive mode with user prompts

## Configuration

You can customize the behavior with environment variables in your `.env` file:

```bash
# Comma-separated list of file patterns to ignore
CODE_SUMMARY_IGNORE_PATTERNS=*.log,*.tmp,*.bak,temp_*
```

By default, the script ignores common patterns like:
- node_modules
- .git
- .DS_Store
- *.log, *.lock
- dist, build, coverage
- Minified files (*.min.js, *.min.css)
- Source maps (*.map)

## Command Line Options

```bash
code-summary [options] [output-file]
```

Available options:
- `-d, --details`: Include full text of each file in the output
- `-c, --clipboard`: Copy the output to clipboard instead of saving to a file
- `-i, --interactive`: Run in interactive mode with prompts

If no output file is specified, it will create a summary.md file in the current directory.

## Usage Examples

```bash
# Generate a basic summary in summary.md
code-summary

# Generate summary with file contents included
code-summary -d

# Generate summary and copy to clipboard
code-summary -c

# Run in interactive mode with prompts
code-summary -i

# Specify a custom output file
code-summary output.md

# Combine options
code-summary -d -c my-project-summary.md
```

## Interactive Mode

In interactive mode (-i flag), the script will prompt you for:
1. Where to send the output (file, clipboard, or both)
2. The output filename (if saving to a file)

This is useful when you want to make decisions at runtime rather than through command-line arguments. 