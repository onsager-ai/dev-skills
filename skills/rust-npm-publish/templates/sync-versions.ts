/**
 * sync-versions.ts — Propagate root package.json version to all workspace packages and Cargo.toml.
 *
 * Usage:
 *   pnpm tsx scripts/sync-versions.ts
 *   pnpm tsx scripts/sync-versions.ts --version 0.2.16-dev.12345678
 *
 * CUSTOMIZE: Update the workspace globs and Cargo.toml path.
 * See also: monorepo-version-sync skill for detailed reference.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { globSync } from 'glob';
import config from '../publish.config';

const ROOT = resolve(import.meta.dirname, '..');
const rootPkgPath = join(ROOT, 'package.json');
const cargoPath = join(ROOT, config.cargoWorkspace);

// CUSTOMIZE: Glob patterns for workspace packages
const workspaceGlobs = ['packages/*/package.json'];

function main() {
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));

  const versionOverride = process.argv.find((a: string) => a.startsWith('--version='))?.split('=')[1]
    ?? (process.argv.includes('--version') ? process.argv[process.argv.indexOf('--version') + 1] : undefined);

  const version = versionOverride ?? rootPkg.version;
  console.log(`📦 Syncing version: ${version}`);

  let updated = 0;

  // Sync workspace packages
  for (const pattern of workspaceGlobs) {
    for (const pkgPath of globSync(join(ROOT, pattern))) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (pkg.version !== version) {
        pkg.version = version;
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`  ✅ ${pkg.name}: → ${version}`);
        updated++;
      }
    }
  }

  // Sync Cargo.toml
  if (existsSync(cargoPath)) {
    const cargo = readFileSync(cargoPath, 'utf8');
    const cargoVersion = version.replace(/-.*$/, '');
    const updatedCargo = cargo.replace(/^version\s*=\s*"[^"]*"/m, `version = "${cargoVersion}"`);
    if (cargo !== updatedCargo) {
      writeFileSync(cargoPath, updatedCargo);
      console.log(`  ✅ Cargo.toml: → ${cargoVersion}`);
      updated++;
    }
  }

  console.log(`\n📊 Updated: ${updated} file(s)`);
}

main();
