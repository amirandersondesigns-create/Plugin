#!/bin/bash
# Builds dist/Amir_Anderson_Animator_Toolkit.zip: the installable extension
# folder (no tests) plus the installers. Run tests first.
set -e
cd "$(dirname "$0")/.."
OUT="${1:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
STAGE="$(mktemp -d)/com.aanders.animatortoolkit"
mkdir -p "$STAGE"
cp -R CSXS client host install README.md LICENSE.txt .debug "$STAGE/"
rm -f "$OUT/Amir_Anderson_Animator_Toolkit.zip"
(cd "$(dirname "$STAGE")" && zip -qr -X "$OUT/Amir_Anderson_Animator_Toolkit.zip" com.aanders.animatortoolkit)
echo "$OUT/Amir_Anderson_Animator_Toolkit.zip"
