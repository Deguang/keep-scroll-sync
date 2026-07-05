#!/usr/bin/env bash
#
# Package the extension into releases/keep-scroll-sync-v<version>.zip
# for uploading to the Chrome Web Store.
#
# Usage: ./release.sh
#
set -euo pipefail

cd "$(dirname "$0")"

# Read the version straight from the manifest so it always matches.
VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")

OUT_DIR="releases"
ZIP="$OUT_DIR/keep-scroll-sync-v${VERSION}.zip"

# Only the files the extension actually needs at runtime.
FILES=(manifest.json index.html js images _locales)

mkdir -p "$OUT_DIR"
rm -f "$ZIP"

# -r recurse, -X strip extra macOS attributes; exclude junk files.
zip -r -X "$ZIP" "${FILES[@]}" -x "*.DS_Store" >/dev/null

echo "Created $ZIP"
unzip -l "$ZIP" | tail -n 1
