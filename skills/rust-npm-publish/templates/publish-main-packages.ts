/**
 * publish-main-packages.ts — Publish main wrapper packages after platform packages.
 *
 * Usage:
 *   pnpm tsx scripts/publish-main-packages.ts --tag dev
 *   pnpm tsx scripts/publish-main-packages.ts --dry-run --allow-local
 *
 * CUSTOMIZE: Update the config import path.
 */

import { join, resolve } from 'path';
import { execSync } from 'child_process';
import config from '../publish.config';

const ROOT = resolve(import.meta.dirname, '..');

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

  console.log(`📦 Publishing main packages${dryRun ? ' (DRY RUN)' : ''}...`);

  let published = 0;
  let failed = 0;

  for (const mainPkg of config.mainPackages) {
    const pkgDir = join(ROOT, mainPkg.path);

    try {
      const tagArg = tag ? `--tag ${tag}` : '';
      const dryRunArg = dryRun ? '--dry-run' : '';
      const cmd = `npm publish ${tagArg} ${dryRunArg} --access public`.trim();

      console.log(`  📦 ${mainPkg.name}: ${cmd}`);
      execSync(cmd, { cwd: pkgDir, stdio: 'pipe' });
      console.log(`  ✅ ${mainPkg.name}: published`);
      published++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ ${mainPkg.name}: ${message}`);
      failed++;
    }
  }

  console.log(`\n📊 Published: ${published}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
