#!/usr/bin/env ts-node

import fs from 'fs-extra';
import path from 'path';
import fg from 'fast-glob';
import ignore from 'ignore';

const isTextFile = (filePath: string) => {
  const textExtensions = ['.ts', '.js', '.json', '.md', '.txt', '.html', '.css', '.scss', '.tsx', '.jsx'];
  return textExtensions.includes(path.extname(filePath).toLowerCase());
};

const loadGitignore = async (basePath: string) => {
  const ig = ignore();
  const gitignorePath = path.join(basePath, '.gitignore');
  if (await fs.pathExists(gitignorePath)) {
    const content = await fs.readFile(gitignorePath, 'utf8');
    ig.add(content);
  }
  return ig;
};

const summarizeFolder = async (basePath: string) => {
  const ig = await loadGitignore(basePath);

  const entries = await fg(['**/*'], {
    cwd: basePath,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: true,
  });

  const filteredFiles = entries.filter((file: string) => !ig.ignores(file) && isTextFile(file));

  let summary = '';

  for (const relPath of filteredFiles) {
    const absPath = path.join(basePath, relPath);
    try {
      const content = await fs.readFile(absPath, 'utf8');
      summary += `\n\n--- FILE: ${relPath} ---\n${content}`;
    } catch (err) {
      console.warn(`Skipping ${relPath}: ${err}`);
    }
  }

  return summary;
};

const main = async () => {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: ts-node summarize-folder.ts <path>');
    process.exit(1);
  }

  const absPath = path.resolve(dir);
  const summary = await summarizeFolder(absPath);
  console.log(summary);
};

main(); 