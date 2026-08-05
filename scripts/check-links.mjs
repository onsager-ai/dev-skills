import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const skillsDirectory = path.join(repositoryRoot, 'skills');
const failures = [];

async function findMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(entryPath);
    }
  }

  return files;
}

const markdownFiles = await findMarkdownFiles(skillsDirectory);
const markdownLink = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;
let checkedLinks = 0;

for (const absoluteFilePath of markdownFiles) {
  const contents = await readFile(absoluteFilePath, 'utf8');
  const filePath = path.relative(repositoryRoot, absoluteFilePath);

  for (const match of contents.matchAll(markdownLink)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) {
      target = target.slice(1, -1);
    } else {
      target = target.split(/\s+/, 1)[0];
    }

    if (/^(?:https?:|mailto:)/i.test(target) || target.startsWith('#')) continue;

    const pathWithoutAnchor = target.split('#', 1)[0];
    if (!pathWithoutAnchor || path.isAbsolute(pathWithoutAnchor)) continue;

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(pathWithoutAnchor).replaceAll('\\ ', ' ');
    } catch {
      failures.push(`${filePath}: invalid encoded link target "${target}"`);
      continue;
    }

    checkedLinks += 1;
    const resolvedPath = path.resolve(path.dirname(absoluteFilePath), decodedPath);
    const repositoryRelativePath = path.relative(repositoryRoot, resolvedPath);
    const escapesRepository =
      repositoryRelativePath === '..' ||
      repositoryRelativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(repositoryRelativePath);

    if (escapesRepository) {
      failures.push(`${filePath}: relative link escapes repository root "${target}"`);
      continue;
    }

    try {
      const targetStats = await stat(resolvedPath);
      if (targetStats.isDirectory()) {
        failures.push(`${filePath}: relative link targets a directory "${target}"`);
      } else if (!targetStats.isFile()) {
        failures.push(`${filePath}: relative link target is not a regular file "${target}"`);
      }
    } catch {
      failures.push(`${filePath}: broken relative link "${target}"`);
    }
  }
}

if (failures.length) {
  console.error(`Link check failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Link check passed (${checkedLinks} relative links in ${markdownFiles.length} files).`);
}
