// Guard the boundary between selected common procedures and native mechanics.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const common = ['issue-spec', 'pre-push', 'pr-lifecycle', 'ci-triage', 'docs-drift-guard'];
const errors = [];
function markdown(directory) {
  return fs.readdirSync(directory, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? markdown(file) : entry.name.endsWith('.md') ? [file] : [];
  });
}
for (const name of [...common, 'harness-operations']) {
  const file = path.join(root, 'skills', name, 'SKILL.md');
  const text = fs.readFileSync(file, 'utf8');
  for (const section of ['Scope', 'Prerequisites', 'Procedure', 'Completion']) {
    if (!text.includes(`\n## ${section}\n`)) errors.push(`${name}: missing ${section}`);
  }
}
for (const name of common) {
  for (const file of markdown(path.join(root, 'skills', name))) {
    const text = fs.readFileSync(file, 'utf8');
    if (/mcp__|CLAUDE\.md|\.claude\/|claude\/spec-|WebFetch|allowed-tools:/i.test(text)) {
      errors.push(`${path.relative(root,file)}: native mechanics belong in harness-operations references`);
    }
    if (/installed globally|global installation is required|log bodies are not reliably accessible/i.test(text)) {
      errors.push(`${path.relative(root,file)}: stale installation/capability assumption`);
    }
  }
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('Common skill/harness boundary check passed (5 common procedures, 1 capability adapter).');
}
