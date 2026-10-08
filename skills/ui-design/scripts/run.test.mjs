import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadCredentials } from './run.mjs';

test('credential lookup preserves injected bindings and never reads other keys', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-design-credentials-'));
  try {
    const file = path.join(dir, 'credentials.json');
    fs.writeFileSync(file, JSON.stringify({STITCH_API_KEY:'local-fixture', PEN_CLI_KEY:'pen-fixture', OTHER_KEY:'unused'}), {mode:0o600});
    const env = {STITCH_API_KEY:'injected-fixture'};
    loadCredentials(file, env);
    assert.deepEqual(env, {STITCH_API_KEY:'injected-fixture', PEN_CLI_KEY:'pen-fixture'});
    assert.deepEqual(loadCredentials(path.join(dir, 'missing'), {}), {});
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});

test('unsafe credential stores fail closed without exposing their contents', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-design-credentials-'));
  try {
    const file = path.join(dir, 'credentials.json');
    fs.writeFileSync(file, '{"STITCH_API_KEY":"secret-fixture"}', {mode:0o644});
    fs.chmodSync(file, 0o644);
    if (process.platform !== 'win32') assert.throws(() => loadCredentials(file, {}), /mode 0600/);
    fs.chmodSync(file, 0o600);
    const alias = path.join(dir, 'link');
    fs.symlinkSync(file, alias);
    assert.throws(() => loadCredentials(alias, {}), /owned regular file/);
  } finally { fs.rmSync(dir, {recursive:true, force:true}); }
});
