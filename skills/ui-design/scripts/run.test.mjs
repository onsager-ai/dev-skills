import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadCredentials, run } from './run.mjs';

test('credential lookup preserves injected bindings and never reads other keys', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-design-credentials-'));
  try {
    const file = path.join(dir, 'credentials.json');
    fs.writeFileSync(file, JSON.stringify({STITCH_API_KEY:'local-fixture', PEN_CLI_KEY:'pen-fixture', OTHER_KEY:'unused'}), {mode:0o600});
    const env = {PEN_CLI_KEY:'injected-fixture'};
    loadCredentials(file, env);
    assert.deepEqual(env, {PEN_CLI_KEY:'injected-fixture'});
    assert.deepEqual(loadCredentials(file, {}), {PEN_CLI_KEY:'pen-fixture'});
    assert.deepEqual(loadCredentials(path.join(dir, 'missing'), {}), {});
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});

test('unsafe credential stores fail closed without exposing their contents', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-design-credentials-'));
  try {
    const file = path.join(dir, 'credentials.json');
    fs.writeFileSync(file, '{"PEN_CLI_KEY":"secret-fixture"}', {mode:0o644});
    fs.chmodSync(file, 0o644);
    if (process.platform !== 'win32') assert.throws(() => loadCredentials(file, {}), /mode 0600/);
    fs.chmodSync(file, 0o600);
    const alias = path.join(dir, 'link');
    fs.symlinkSync(file, alias);
    assert.throws(() => loadCredentials(alias, {}), /owned regular file/);
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});

test('retired and unknown launch modes fail before credential access or environment changes', async () => {
  const originalRead = fs.existsSync;
  const originalPath = process.env.PATH;
  const originalOptions = process.env.NODE_OPTIONS;
  fs.existsSync = () => { throw new Error('credential or executable access before mode validation'); };
  try {
    for (const requested of ['stitch', 'unknown', undefined]) {
      await assert.rejects(run(requested), /Usage: ui-design pencil \| pen/);
    }
    assert.equal(process.env.PATH, originalPath);
    assert.equal(process.env.NODE_OPTIONS, originalOptions);
  } finally { fs.existsSync = originalRead; }
});

test('smoke refuses the retired provider before loading SDKs or probing harness config', () => {
  const result = spawnSync(process.execPath,
    [fileURLToPath(new URL('./smoke.mjs', import.meta.url)), 'codex', 'stitch'],
    { encoding: 'utf8', env: { PATH: '' } });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Usage: node smoke.mjs codex\|claude pencil/);
  assert.doesNotMatch(result.stderr, /ERR_MODULE_NOT_FOUND|credential|token/i);
});
