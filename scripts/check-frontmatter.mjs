import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const skillsDirectory = path.resolve('skills');
const failures = [];

const skillDirectories = (await readdir(skillsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const directoryName of skillDirectories) {
  const filePath = path.join('skills', directoryName, 'SKILL.md');
  let contents;

  try {
    contents = await readFile(path.resolve(filePath), 'utf8');
  } catch (error) {
    failures.push(`${filePath}: could not read file (${error.message})`);
    continue;
  }

  const lines = contents.replaceAll('\r\n', '\n').split('\n');
  if (lines[0] !== '---') {
    failures.push(`${filePath}: frontmatter must start with ---`);
    continue;
  }

  const closingFence = lines.indexOf('---', 1);
  if (closingFence === -1) {
    failures.push(`${filePath}: frontmatter is missing its closing ---`);
    continue;
  }

  const fields = new Map();
  let activeIndentedField;

  for (const [offset, line] of lines.slice(1, closingFence).entries()) {
    const lineNumber = offset + 2;

    if (/^\s/.test(line)) {
      if (activeIndentedField && line.trim()) {
        activeIndentedField.hasContent = true;
      } else if (line.trim() && !activeIndentedField) {
        failures.push(`${filePath}:${lineNumber}: unexpected indented content`);
      }
      continue;
    }

    if (!line.trim()) continue;
    activeIndentedField = undefined;

    const match = /^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/.exec(line);
    if (!match) {
      failures.push(`${filePath}:${lineNumber}: malformed frontmatter entry`);
      continue;
    }

    const [, key, rawValue = ''] = match;
    if (fields.has(key)) {
      failures.push(`${filePath}:${lineNumber}: duplicate ${key} field`);
      continue;
    }

    const field = { rawValue, lineNumber, hasContent: false };
    fields.set(key, field);
    if (!rawValue || /^[>|][+-]?$/.test(rawValue)) activeIndentedField = field;
  }

  for (const requiredField of ['name', 'description']) {
    const field = fields.get(requiredField);
    if (!field) {
      failures.push(`${filePath}: missing ${requiredField} field`);
      continue;
    }

    const isBlockScalar = /^[>|][+-]?$/.test(field.rawValue);
    const scalarValue = field.rawValue.replace(/^(['"])(.*)\1$/, '$2').trim();
    if ((isBlockScalar && !field.hasContent) || (!isBlockScalar && !scalarValue)) {
      failures.push(`${filePath}:${field.lineNumber}: ${requiredField} must not be empty`);
    }
  }

  const nameField = fields.get('name');
  if (nameField) {
    const name = nameField.rawValue.replace(/^(['"])(.*)\1$/, '$2').trim();
    if (name && name !== directoryName) {
      failures.push(
        `${filePath}:${nameField.lineNumber}: name "${name}" does not match directory "${directoryName}"`,
      );
    }
  }
}

if (failures.length) {
  console.error(`Frontmatter check failed with ${failures.length} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Frontmatter check passed (${skillDirectories.length} files).`);
}
