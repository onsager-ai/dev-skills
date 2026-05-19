/**
 * Example publish.config.ts for clawden
 * 1 binary × 4 platforms = 4 platform packages + 2 main packages
 */
import type { PublishConfig } from '@codervisor/forge';

export default {
  scope: '@clawden',

  binaries: [
    { name: 'clawden-cli', scope: 'cli', cargoPackage: 'clawden-cli' },
  ],

  platforms: ['darwin-x64', 'darwin-arm64', 'linux-x64', 'windows-x64'],

  mainPackages: [
    { path: 'npm/clawden', name: 'clawden' },
    { path: 'sdk', name: '@clawden/sdk' },
  ],

  cargoWorkspace: 'Cargo.toml',
  repositoryUrl: 'https://github.com/codervisor/clawden',
} satisfies PublishConfig;
