#!/usr/bin/env node
// Dependency-free, checkout-local agent configuration generation and validation.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const START = '<!-- agent-config:begin -->';
const END = '<!-- agent-config:end -->';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };
const safe = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
const digestManifest = manifest => hash(JSON.stringify(manifest));

function readRegular(root, relative) {
  const parts = relative.split('/');
  if (parts.some(p => !p || p === '.' || p === '..')) fail(`Unsafe path: ${relative}`);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) fail(`Missing managed path: ${relative}`);
    if (fs.lstatSync(current).isSymbolicLink()) fail(`Symlink in managed path: ${relative}`);
  }
  if (!fs.statSync(current).isFile()) fail(`Not a regular file: ${relative}`);
  return fs.readFileSync(current);
}

function blockFrom(text) {
  if (text.split(START).length !== 2 || text.split(END).length !== 2) fail('Expected one managed AGENTS block');
  const begin = text.indexOf(START), end = text.indexOf(END) + END.length;
  if (end < begin) fail('Malformed managed AGENTS block');
  return text.slice(begin, end);
}

function walk(root, relative) {
  const directory = path.join(root, relative);
  if (!fs.existsSync(directory)) return [];
  if (fs.lstatSync(directory).isSymbolicLink()) fail(`Symlink skill directory: ${relative}`);
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    const file = `${relative}/${entry.name}`;
    if (entry.isSymbolicLink()) fail(`Symlink skill asset: ${file}`);
    if (entry.isDirectory()) result.push(...walk(root, file));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}

function validateManifest(manifest) {
  if (manifest.schema !== 1 || manifest.source?.repository !== 'onsager-ai/dev-skills') fail('Unsupported manifest/source');
  if (!/^[0-9a-f]{40}$/.test(manifest.source.revision)) fail('Source revision must be an immutable full commit SHA');
  for (const key of ['skills', 'rules', 'local_skills']) {
    if (!Array.isArray(manifest[key]) || manifest[key].some(name => !safe(name))) fail(`Invalid ${key}`);
    if (new Set(manifest[key]).size !== manifest[key].length) fail(`Duplicate ${key}`);
  }
  if (manifest.skills.some(name => manifest.local_skills.includes(name))) fail('Shared/local skill name collision');
}

function expected(root, manifest, source) {
  const revision = manifest.source.revision;
  const git = (...args) => execFileSync('git', ['-C', source, ...args]);
  if (git('rev-parse', `${revision}^{commit}`).toString().trim() !== revision) fail('Source commit unavailable');
  const entries = git('ls-tree', '-rz', revision).toString().split('\0').filter(Boolean).map(line => {
    const [meta, name] = line.split('\t');
    return { name, mode: meta.split(' ')[0] };
  });
  const files = new Map();
  const get = name => {
    const entry = entries.find(e => e.name === name);
    if (!entry || !['100644','100755'].includes(entry.mode)) fail(`Missing or nonregular upstream asset: ${name}`);
    return git('show', `${revision}:${name}`);
  };
  const shared = new Set(manifest.skills);
  const queue = [...shared];
  // Preserve whole skill directories and close relative cross-skill references.
  while (queue.length) {
    const name = queue.shift(), prefix = `skills/${name}/`;
    const assets = entries.filter(e => e.name.startsWith(prefix));
    if (!assets.some(e => e.name === `${prefix}SKILL.md`)) fail(`Unknown shared skill: ${name}`);
    const front = get(`${prefix}SKILL.md`).toString().match(/^---\n([\s\S]*?)\n---\n/);
    if (!front || !front[1].includes(`name: ${name}\n`) || !/^description:\s*\S/m.test(front[1])) fail(`Invalid upstream skill metadata: ${name}`);
    for (const asset of assets) {
      const bytes = get(asset.name);
      for (const target of [`.agents/${asset.name}`, `.claude/${asset.name}`]) files.set(target, { bytes, owner: 'shared', mode: asset.mode });
      if (!asset.name.endsWith('.md')) continue;
      for (const match of bytes.toString().matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].split('#')[0];
        if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(asset.name), target));
        if (!resolved.startsWith('skills/')) fail(`Shared reference escapes skill tree: ${asset.name}: ${target}`);
        get(resolved);
        const dependency = resolved.split('/')[1];
        if (!safe(dependency)) fail(`Invalid dependency: ${dependency}`);
        if (!shared.has(dependency)) { shared.add(dependency); queue.push(dependency); }
      }
    }
  }
  if ([...shared].some(name => manifest.local_skills.includes(name))) fail('Dependency/local skill name collision');
  for (const name of manifest.local_skills) {
    const prefix = `.agents/skills/${name}/`;
    const assets = walk(root, prefix.slice(0,-1));
    if (!assets.includes(`${prefix}SKILL.md`)) fail(`Missing local skill: ${name}`);
    for (const asset of assets) files.set(asset.replace('.agents/', '.claude/'), { bytes: readRegular(root, asset), owner: 'local-projection', mode: fs.statSync(path.join(root,asset)).mode & 0o111 ? '100755' : '100644' });
  }
  files.set('.agents/sync.mjs', { bytes: get('agent-config/sync.mjs'), owner: 'tooling' });
  files.set('.agents/LICENSE.dev-skills', { bytes: get('LICENSE'), owner: 'shared-license' });
  files.set('.github/workflows/agent-config.yml', { bytes: get('agent-config/workflow.yml'), owner: 'tooling' });
  const rules = manifest.rules.map(name => `- **${name}:** ${get(`agent-config/rules/${name}.md`).toString().trim()}`);
  const block = [START, '## Shared agent conventions (generated)', '', ...rules, END].join('\n');
  return { files, block, resolved_skills: [...shared].sort() };
}

export function run(args = process.argv.slice(2)) {
  const option = flag => { const i = args.indexOf(flag); return i < 0 ? undefined : args[i+1]; };
  if (args.includes('--help')) { console.log('node .agents/sync.mjs [--check] [--source <dev-skills checkout>] [--revision <full SHA>] [--repo <path>]'); return; }
  const root = path.resolve(option('--repo') || '.');
  const manifestPath = path.join(root, '.agents/manifest.json');
  const lockPath = path.join(root, '.agents/lock.json');
  const manifest = JSON.parse(readRegular(root, '.agents/manifest.json'));
  const previous = fs.existsSync(lockPath) ? JSON.parse(readRegular(root, '.agents/lock.json')) : undefined;
  const checking = args.includes('--check');
  if (option('--revision')) {
    if (checking) fail('--revision is only valid during generation');
    manifest.source.revision = option('--revision');
  }
  validateManifest(manifest);
  const source = option('--source');
  const desired = source ? expected(root, manifest, path.resolve(source)) : undefined;
  if (!checking && !desired) fail('Generation requires --source; offline checks do not');
  if (checking) {
    if (!previous || previous.schema !== 1 || previous.manifest_sha256 !== digestManifest(manifest)) fail('Manifest/lock drift');
    const actualBlock = blockFrom(readRegular(root, 'AGENTS.md').toString());
    if (readRegular(root, 'CLAUDE.md').toString().split('\n')[0] !== '@AGENTS.md') fail('Missing native Claude import');
    if (hash(actualBlock) !== previous.block_sha256) fail('Managed AGENTS block drift');
    for (const [file, record] of Object.entries(previous.files)) {
      if (hash(readRegular(root, file)) !== record.sha256) fail(`Managed file drift: ${file}`);
      if (process.platform !== 'win32' && Boolean(fs.statSync(path.join(root,file)).mode & 0o111) !== (record.mode === '100755')) fail(`Managed executable mode drift: ${file}`);
    }
    const skills = [...previous.resolved_skills, ...manifest.local_skills].sort();
    for (const base of ['.agents/skills', '.claude/skills']) {
      const catalog = fs.readdirSync(path.join(root, base)).sort();
      if (JSON.stringify(catalog) !== JSON.stringify(skills)) fail(`Unmanaged skill/collision: ${base}`);
      for (const name of skills) {
        const canonical = walk(root, `.agents/skills/${name}`);
        const projected = walk(root, `.claude/skills/${name}`);
        const front = readRegular(root, `.agents/skills/${name}/SKILL.md`).toString().match(/^---\n([\s\S]*?)\n---\n/);
        if (!front || !new RegExp(`^name:\\s*${name}\\s*$`, 'm').test(front[1]) || !/^description:\s*\S/m.test(front[1])) fail(`Invalid skill metadata: ${name}`);
        if (JSON.stringify(canonical.map(f => f.replace('.agents/','.claude/'))) !== JSON.stringify(projected)) fail(`Projection asset drift: ${name}`);
        for (const file of canonical) {
          if (!readRegular(root, file).equals(readRegular(root, file.replace('.agents/','.claude/')))) fail(`Projection drift: ${file}`);
          if (previous.resolved_skills.includes(name) && !previous.files[file]) fail(`Unmanaged shared asset: ${file}`);
        }
      }
    }
    if (desired) {
      if (actualBlock !== desired.block || JSON.stringify(previous.resolved_skills) !== JSON.stringify(desired.resolved_skills)) fail('Upstream rule/dependency drift');
      if (JSON.stringify(Object.keys(previous.files).sort()) !== JSON.stringify([...desired.files.keys()].sort())) fail('Upstream asset inventory drift');
      for (const [file, record] of desired.files) {
        if (!readRegular(root, file).equals(record.bytes)) fail(`Upstream provenance drift: ${file}`);
        if ((previous.files[file].mode || '100644') !== (record.mode || '100644')) fail(`Upstream executable mode drift: ${file}`);
      }
    }
    console.log(`Agent configuration passed (${previous.resolved_skills.length} shared, ${manifest.local_skills.length} local skills; ${source ? 'upstream verified' : 'offline'}).`);
    return;
  }
  // Refuse generation over unreviewed managed edits; callers can restore them or
  // deliberately remove the lock to re-bootstrap. Never silently discard edits.
  if (previous) {
    for (const [file, record] of Object.entries(previous.files)) {
      if (hash(readRegular(root, file)) !== record.sha256) fail(`Restore edited generated file before sync: ${file}`);
    }
    if (hash(blockFrom(readRegular(root, 'AGENTS.md').toString())) !== previous.block_sha256) fail('Restore edited managed block before sync');
  }
  const text = readRegular(root, 'AGENTS.md').toString();
  const updated = text.includes(START) ? text.replace(blockFrom(text), desired.block) : `${text.trimEnd()}\n\n${desired.block}\n`;
  for (const file of previous ? Object.keys(previous.files) : []) {
    if (!desired.files.has(file)) fs.unlinkSync(path.join(root, file));
  }
  // Remove empty former skill directories after selections/dependencies change.
  function prune(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) if (entry.isDirectory()) prune(path.join(directory, entry.name));
    if (!fs.readdirSync(directory).length) fs.rmdirSync(directory);
  }
  for (const base of ['.agents/skills', '.claude/skills']) prune(path.join(root, base));
  for (const [file, record] of desired.files) {
    const destination = path.join(root, file);
    const relativeParent = path.posix.dirname(file);
    let current = root;
    for (const part of relativeParent.split('/')) {
      current = path.join(current, part);
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) fail(`Symlink output parent: ${file}`);
    }
    if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) fail(`Symlink output: ${file}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, record.bytes);
    fs.chmodSync(destination, record.mode === '100755' ? 0o755 : 0o644);
  }
  fs.writeFileSync(path.join(root, 'AGENTS.md'), updated);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest,null,2)}\n`);
  fs.writeFileSync(lockPath, `${JSON.stringify({schema:1, manifest_sha256:digestManifest(manifest), block_sha256:hash(desired.block), resolved_skills:desired.resolved_skills, files:Object.fromEntries([...desired.files].sort(([a],[b]) => a.localeCompare(b)).map(([file,record]) => [file,{sha256:hash(record.bytes),owner:record.owner,mode:record.mode || '100644'}]))},null,2)}\n`);
  console.log('Agent configuration generated. Commit the manifest, lock and generated files.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  try { run(); } catch (error) { console.error(`agent-config: ${error.message}`); process.exitCode = 1; }
}
