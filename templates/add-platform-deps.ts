/**
 * add-platform-deps.ts — Add platform packages as optionalDependencies in main packages.
 *
 * Reads from publish.config.ts to wire up optionalDependencies.
 *
 * Usage:
 *   pnpm tsx scripts/add-platform-deps.ts
 *
 * CUSTOMIZE: Update the config import path.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import config from '../publish.config';

const ROOT = resolve(import.meta.dirname, '..');
const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const version = rootPkg.version;

function main() {
  console.log(`📦 Adding platform optionalDependencies (version: ${version})`);

  for (const mainPkg of config.mainPackages) {
    const pkgPath = join(ROOT, mainPkg.path, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    if (!pkg.optionalDependencies) {
      pkg.optionalDependencies = {};
    }

    // Find which binary this main package provides
    // CUSTOMIZE: Adjust the binary→package mapping logic if needed
    for (const binary of config.binaries) {
      for (const platform of config.platforms) {
        const depName = `${config.scope}/${binary.scope}-${platform}`;
        pkg.optionalDependencies[depName] = version;
      }
    }

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✅ ${mainPkg.name}: added ${config.platforms.length * config.binaries.length} optionalDependencies`);
  }
}

main();
