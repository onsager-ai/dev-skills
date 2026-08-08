/**
 * Publish configuration for {{PROJECT_NAME}}
 *
 * CUSTOMIZE: Update scope, binaries, mainPackages, and repositoryUrl
 * to match your project.
 */
import type { PublishConfig } from '@codervisor/forge';

export default {
  // CUSTOMIZE: Your npm scope
  scope: '{{NPM_SCOPE}}',

  // CUSTOMIZE: Rust binaries to distribute via npm
  binaries: [
    { name: '{{BINARY_NAME}}', scope: 'cli', cargoPackage: '{{CARGO_PACKAGE}}' },
  ],

  // Target platforms (default: all 4)
  platforms: ['darwin-x64', 'darwin-arm64', 'linux-x64', 'windows-x64'],

  // CUSTOMIZE: Main npm packages to publish after platform packages
  mainPackages: [
    { path: 'packages/cli', name: '{{NPM_SCOPE}}/cli' },
  ],

  // CUSTOMIZE: Path to Cargo.toml (root or nested)
  cargoWorkspace: 'Cargo.toml',

  // CUSTOMIZE: Your repository URL
  repositoryUrl: '{{REPOSITORY_URL}}',
} satisfies PublishConfig;
