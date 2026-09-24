#!/bin/bash
# Builds dist/animator-toolkit-<version>.zip: the installable extension
# folder (no tests) plus the installers. Run tests first.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./package.json').version")
OUT="${1:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
STAGE="$(mktemp -d)/com.cnn.animatortoolkit"
mkdir -p "$STAGE"
cp -R CSXS client host install README.md .debug "$STAGE/"
rm -f "$OUT/animator-toolkit-$VERSION.zip"
(cd "$(dirname "$STAGE")" && zip -qr -X "$OUT/animator-toolkit-$VERSION.zip" com.cnn.animatortoolkit)
echo "$OUT/animator-toolkit-$VERSION.zip"
