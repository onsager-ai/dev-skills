import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const skillsDirectory = path.resolve('skills');
// Every SKILL.md is loaded whole on invocation and every description sits in the
// always-loaded catalog, so both are budgeted. Move detail into references/.
const MAX_SKILL_BYTES = 10 * 1024;
const MAX_DESCRIPTION_CHARS = 400;
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

  const descriptionField = fields.get('description');
  if (descriptionField) {
    if (/^[>|]/.test(descriptionField.rawValue)) {
      failures.push(`${filePath}:${descriptionField.lineNumber}: description must be a single-line scalar`);
    } else {
      const length = descriptionField.rawValue.replace(/^(['"])(.*)\1$/, '$2').trim().length;
      if (length > MAX_DESCRIPTION_CHARS) {
        failures.push(
          `${filePath}:${descriptionField.lineNumber}: description is ${length} chars (max ${MAX_DESCRIPTION_CHARS})`,
        );
      }
    }
  }

  const bytes = Buffer.byteLength(contents);
  if (bytes > MAX_SKILL_BYTES) {
    failures.push(`${filePath}: ${bytes} bytes (max ${MAX_SKILL_BYTES}); move detail into references/`);
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
