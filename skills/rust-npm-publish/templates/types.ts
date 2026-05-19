/**
 * Type definitions for publish configuration.
 * Used by rust-npm-publish skill templates.
 */

export interface BinaryConfig {
  /** Binary filename (e.g., 'my-cli') */
  name: string;
  /** npm scope suffix (e.g., 'cli' → @scope/cli-darwin-arm64) */
  scope: string;
  /** Cargo package name for building */
  cargoPackage: string;
}

export interface MainPackage {
  /** Path relative to repo root (e.g., 'packages/cli') */
  path: string;
  /** npm package name (e.g., '@scope/cli') */
  name: string;
}

export interface PublishConfig {
  /** npm scope (e.g., '@myorg') */
  scope: string;
  /** Rust binaries to distribute */
  binaries: BinaryConfig[];
  /** Target platforms */
  platforms: string[];
  /** Main packages to publish after platform packages */
  mainPackages: MainPackage[];
  /** Path to Cargo.toml (for version syncing) */
  cargoWorkspace: string;
  /** Repository URL (for package.json metadata) */
  repositoryUrl: string;
}
