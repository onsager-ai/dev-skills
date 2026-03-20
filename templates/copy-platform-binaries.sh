#!/usr/bin/env bash
#
# copy-platform-binaries.sh — Copy compiled Rust binaries to platform package directories.
#
# Expects CI artifacts to be downloaded into artifacts/ directory.
#
# Usage:
#   bash scripts/copy-platform-binaries.sh
#
# CUSTOMIZE: Update the artifact directory structure and binary names
# to match your CI workflow and publish.config.ts.

set -euo pipefail

# CUSTOMIZE: Artifact base directory (where actions/download-artifact puts files)
ARTIFACTS_DIR="artifacts"

# CUSTOMIZE: Platform packages directory
PLATFORM_DIR="platform-packages"

# CUSTOMIZE: Binary configurations
# Format: "binary-name:cargo-package:scope"
BINARIES=(
  "my-cli:my-cli:cli"
)

# CUSTOMIZE: Platform configurations
# Format: "platform-key:rust-target:extension"
PLATFORMS=(
  "darwin-x64:x86_64-apple-darwin:"
  "darwin-arm64:aarch64-apple-darwin:"
  "linux-x64:x86_64-unknown-linux-gnu:"
  "windows-x64:x86_64-pc-windows-msvc:.exe"
)

echo "📦 Copying binaries to platform packages..."

for binary_config in "${BINARIES[@]}"; do
  IFS=':' read -r binary_name cargo_pkg scope <<< "$binary_config"

  for platform_config in "${PLATFORMS[@]}"; do
    IFS=':' read -r platform target ext <<< "$platform_config"

    src="${ARTIFACTS_DIR}/binary-${platform}/${binary_name}${ext}"
    dest="${PLATFORM_DIR}/${scope}-${platform}/${binary_name}${ext}"

    if [ -f "$src" ]; then
      cp "$src" "$dest"
      chmod +x "$dest" 2>/dev/null || true
      echo "  ✅ ${scope}-${platform}: ${binary_name}${ext}"
    else
      echo "  ❌ Missing: ${src}"
      exit 1
    fi
  done
done

echo ""
echo "✅ All binaries copied successfully"
