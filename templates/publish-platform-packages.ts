/**
 * publish-platform-packages.ts — Publish all platform-specific npm packages.
 *
 * Usage:
 *   pnpm tsx scripts/publish-platform-packages.ts --tag dev
 *   pnpm tsx scripts/publish-platform-packages.ts --dry-run --allow-local
 *
 * CUSTOMIZE: Update the config import path and platform directory.
 */

import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import config from '../publish.config';

const ROOT = resolve(import.meta.dirname, '..');

// CUSTOMIZE: Platform packages directory
const PLATFORM_DIR = join(ROOT, 'platform-packages');

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const allowLocal = args.includes('--allow-local');
  const tagIdx = args.indexOf('--tag');
  const tag = tagIdx >= 0 ? args[tagIdx + 1] : undefined;

  // Safety: require CI environment unless --allow-local
  if (!process.env.CI && !process.env.GITHUB_ACTIONS && !allowLocal) {
    console.error('❌ This script must be run in a CI environment. Use --allow-local for testing.');
    process.exit(1);
  }

  console.log(`📦 Publishing platform packages${dryRun ? ' (DRY RUN)' : ''}...`);

  const publishPromises: string[] = [];

  for (const binary of config.binaries) {
    for (const platform of config.platforms) {
      const pkgDir = join(PLATFORM_DIR, `${binary.scope}-${platform}`);

      if (!existsSync(join(pkgDir, 'package.json'))) {
        console.error(`  ❌ Missing package.json: ${pkgDir}`);
        process.exit(1);
      }

      publishPromises.push(pkgDir);
    }
  }

  // Publish all platform packages
  let published = 0;
  let failed = 0;

  for (const pkgDir of publishPromises) {
    const pkgName = pkgDir.split('/').pop();
    try {
      const tagArg = tag ? `--tag ${tag}` : '';
      const dryRunArg = dryRun ? '--dry-run' : '';
      const cmd = `npm publish ${tagArg} ${dryRunArg} --access public`.trim();

      console.log(`  📦 ${pkgName}: ${cmd}`);
      execSync(cmd, { cwd: pkgDir, stdio: 'pipe' });
      console.log(`  ✅ ${pkgName}: published`);
      published++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ${pkgName}: ${message}`);
      failed++;
    }
  }

  console.log(`\n📊 Published: ${published}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
