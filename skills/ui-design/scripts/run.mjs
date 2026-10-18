#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const allowed = ['PEN_CLI_KEY'];
const credentialPath = path.join(os.homedir(), '.config', 'ui-design', 'credentials.json');
const mode = process.argv[2];

export function loadCredentials(file = credentialPath, env = process.env) {
  if (!fs.existsSync(file)) return env;
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || (process.platform !== 'win32' &&
      ((stat.mode & 0o077) || stat.uid !== process.getuid()))) {
    throw new Error('UI design credential store must be an owned regular file with mode 0600.');
  }
  const values = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const key of allowed) {
    if (values[key] !== undefined && typeof values[key] !== 'string') {
      throw new Error('UI design credential entries must be strings.');
    }
    if (!env[key] && values[key]) env[key] = values[key];
  }
  return env;
}

function child(command, args) {
  const proc = spawn(command, args, { stdio: 'inherit', env: process.env });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => proc.kill(signal));
  proc.on('error', () => { console.error('UI design executable unavailable; rerun the user setup.'); process.exitCode = 1; });
  proc.on('exit', (code, signal) => { process.exitCode = signal ? 1 : (code ?? 1); });
}

export async function run(requestedMode = mode) {
  if (!['pen', 'pencil'].includes(requestedMode)) {
    throw new Error('Usage: ui-design pencil | pen <CLI arguments>');
  }
  loadCredentials();
  const localBin = path.join(os.homedir(), '.local', 'bin');
  process.env.PATH = `${localBin}${path.delimiter}${process.env.PATH || ''}`;
  if (requestedMode === 'pen') {
    const proxyModule = fileURLToPath(new URL('./proxy.mjs', import.meta.url));
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --import=${JSON.stringify(proxyModule)}`.trim();
    child(path.join(localBin, 'pen'), process.argv.slice(3));
  } else if (requestedMode === 'pencil') {
    const platform = { darwin: 'darwin', linux: 'linux', win32: 'windows' }[process.platform];
    if (!platform || !['x64', 'arm64'].includes(process.arch)) throw new Error('Unsupported pen.dev MCP platform.');
    const root = path.join(os.homedir(), '.local', 'lib', 'node_modules', '@pen.dev', 'cli');
    const binary = path.join(root, 'dist', 'out', `mcp-server-${platform}-${process.arch}${process.platform === 'win32' ? '.exe' : ''}`);
    if (!fs.existsSync(binary)) throw new Error('pen.dev MCP binary missing; rerun the user setup.');
    child(binary, ['-app', process.env.PEN_MCP_APP || 'desktop']);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(() => {
    // Backend errors can embed auth headers; never log raw error objects.
    console.error('UI design startup failed. Use pencil or pen; check installation and private credential-store permissions.');
    process.exitCode = 1;
  });
}
