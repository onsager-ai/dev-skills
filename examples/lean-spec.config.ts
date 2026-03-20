/**
 * Example publish.config.ts for lean-spec
 * 3 binaries × 4 platforms = 12 platform packages + 4 main packages
 */
import type { PublishConfig } from '@codervisor/forge';

export default {
  scope: '@leanspec',

  binaries: [
    { name: 'lean-spec', scope: 'cli', cargoPackage: 'leanspec-cli' },
    { name: 'leanspec-mcp', scope: 'mcp', cargoPackage: 'leanspec-mcp' },
    { name: 'leanspec-http', scope: 'http', cargoPackage: 'leanspec-http' },
  ],

  platforms: ['darwin-x64', 'darwin-arm64', 'linux-x64', 'windows-x64'],

  mainPackages: [
    { path: 'packages/cli', name: 'lean-spec' },
    { path: 'packages/mcp', name: '@leanspec/mcp' },
    { path: 'packages/http-server', name: '@leanspec/http-server' },
    { path: 'packages/ui', name: '@leanspec/ui' },
  ],

  cargoWorkspace: 'rust/Cargo.toml',
  repositoryUrl: 'https://github.com/codervisor/lean-spec',
} satisfies PublishConfig;
