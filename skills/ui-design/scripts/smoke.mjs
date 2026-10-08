#!/usr/bin/env node
// Exercise the actual named entry from each harness, independently of a model.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const [harness, name] = process.argv.slice(2);
if (!['codex', 'claude'].includes(harness) || !['stitch', 'pencil'].includes(name)) {
  console.error('Usage: node smoke.mjs codex|claude stitch|pencil'); process.exit(1);
}
const home = os.homedir();
let config;
if (harness === 'codex') {
  const result = spawnSync('codex', ['mcp', 'get', name, '--json'], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error('Codex MCP configuration unavailable.');
  const entry = JSON.parse(result.stdout);
  if (entry.enabled === false) throw new Error('Codex MCP entry is disabled.');
  config = entry.transport;
} else {
  const entry = JSON.parse(fs.readFileSync(path.join(home, '.claude.json'), 'utf8')).mcpServers?.[name];
  if (!entry) throw new Error('Claude user MCP configuration unavailable.');
  config = entry;
}
const env = Object.fromEntries(Object.entries(process.env).filter(([,v]) => typeof v === 'string'));
const transport = config.command ? new StdioClientTransport({ command: config.command,
  args: config.args || [], env: { ...env, ...config.env }, stderr: 'pipe' }) :
  new StreamableHTTPClientTransport(new URL(config.url), { requestInit: { headers: config.http_headers || config.headers } });
const client = new Client({ name: `${harness}-ui-design-smoke`, version: '1.0.0' });
let phase = 'initialize';
let names = [];
const timeout = setTimeout(() => { console.log(JSON.stringify({harness, server:name, status:'blocked', phase, tools:names, reason:'transport/tool timeout'})); process.exit(2); }, 20000);
try {
  await client.connect(transport);
  phase = 'tools/list';
  const catalog = await client.listTools();
  const tool = name === 'stitch' ? 'list_projects' : 'get_app_state';
  names = catalog.tools.map(t => t.name);
  if (!names.includes(tool)) throw new Error('Required smoke tool unavailable.');
  phase = 'tools/call';
  const result = await client.callTool({name: tool, arguments: {}});
  // Do not print private projects, document contents or SDK error objects.
  console.log(JSON.stringify({harness, server:name, status: result.isError ? 'blocked' : 'passed',
    tool, tools: names, contentBlocks: result.content?.length || 0}));
  process.exitCode = result.isError ? 2 : 0;
} catch {
  console.log(JSON.stringify({harness, server:name, status:'blocked', phase, tools:names,
    reason:name === 'stitch' ? 'Check Stitch authentication and proxy/TLS connectivity.' : 'Check the same-host pen.dev app and intended open document.'}));
  process.exitCode = 2;
} finally {
  clearTimeout(timeout);
  await client.close();
}
