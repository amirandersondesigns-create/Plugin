#!/bin/bash
# Builds dist/Amir_Anderson_Animator_Toolkit.zip: the installable extension
# folder (no tests) plus the installers. Run tests first.
set -e
cd "$(dirname "$0")/.."
OUT="${1:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
STAGE="$(mktemp -d)/Amir_Anderson_Animator_Toolkit"
mkdir -p "$STAGE"
cp -R CSXS client host install LICENSE.txt .debug "$STAGE/"
cp README.md "$STAGE/INSTALL.md"
rm -f "$OUT/Amir_Anderson_Animator_Toolkit.zip"
(cd "$(dirname "$STAGE")" && zip -qr -X "$OUT/Amir_Anderson_Animator_Toolkit.zip" Amir_Anderson_Animator_Toolkit)
echo "$OUT/Amir_Anderson_Animator_Toolkit.zip"
