/**
 * restore-packages.ts — Restore workspace:* dependencies after publishing.
 *
 * Usage:
 *   pnpm tsx scripts/restore-packages.ts
 *
 * CUSTOMIZE: Update the backup glob patterns.
 */

import { copyFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';

const ROOT = resolve(import.meta.dirname, '..');

const backupGlobs = ['packages/*/package.json.backup'];

function main() {
  console.log('🔄 Restoring package.json files from backups...');
  let restored = 0;

  for (const pattern of backupGlobs) {
    for (const backupPath of globSync(`${ROOT}/${pattern}`)) {
      const originalPath = backupPath.replace('.backup', '');
      copyFileSync(backupPath, originalPath);
      unlinkSync(backupPath);
      console.log(`  ✅ Restored: ${originalPath}`);
      restored++;
    }
  }

  console.log(restored > 0 ? `\n📊 Restored ${restored} file(s)` : '  ⏭️  No backup files found');
}

main();
