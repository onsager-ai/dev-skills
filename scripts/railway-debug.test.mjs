import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('Railway debug accepts existing identity and withholds variable values', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'railway-debug-'));
  try {
    fs.writeFileSync(path.join(directory, 'railway'), '#!/bin/sh\nif [ "$1" = variable ]; then\n  printf \'%s\\n\' \'{"DATABASE_URL":"secret-sentinel-database","API_TOKEN":"secret-sentinel-token"}\'\nelse\n  echo safe-status\nfi\n', { mode: 0o755 });
    const script = fileURLToPath(new URL('../skills/railway/scripts/debug.sh', import.meta.url));
    const result = spawnSync('sh', [script, 'test-service'], {
      encoding: 'utf8', env: { PATH: `${directory}:${process.env.PATH}` },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /API_TOKEN\nDATABASE_URL/);
    assert.doesNotMatch(result.stdout + result.stderr, /secret-sentinel/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
