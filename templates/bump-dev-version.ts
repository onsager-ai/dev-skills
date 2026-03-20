/**
 * bump-dev-version.ts — Compute and apply a dev (pre-release) version.
 *
 * Reads the base version from root package.json, bumps patch,
 * and appends -dev.{GITHUB_RUN_ID}.
 *
 * Usage:
 *   pnpm tsx scripts/bump-dev-version.ts
 *   GITHUB_RUN_ID=12345678 pnpm tsx scripts/bump-dev-version.ts
 *
 * CUSTOMIZE: Adjust the version formula or environment variable as needed.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const rootPkgPath = join(ROOT, 'package.json');

function main() {
  const runId = process.env.GITHUB_RUN_ID;
  if (!runId) {
    console.error('❌ GITHUB_RUN_ID environment variable is required');
    console.error('   Set it manually for local testing: GITHUB_RUN_ID=12345 pnpm tsx scripts/bump-dev-version.ts');
    process.exit(1);
  }

  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
  const baseVersion = rootPkg.version;
  const [major, minor, patch] = baseVersion.split('.').map(Number);
  const devVersion = `${major}.${minor}.${patch + 1}-dev.${runId}`;

  rootPkg.version = devVersion;
  writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');

  console.log(`📦 Dev version: ${baseVersion} → ${devVersion}`);
  console.log('   Run sync-versions.ts to propagate to all packages');
}

main();
