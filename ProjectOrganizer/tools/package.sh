#!/bin/bash
# Builds dist/Amir_Anderson_Project_Organizer.zip: the installable extension
# folder plus the installers, INSTALL.md and LICENSE.txt.
set -e
cd "$(dirname "$0")/.."
OUT="${1:-dist}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
STAGE="$(mktemp -d)/Amir_Anderson_Project_Organizer"
mkdir -p "$STAGE"
cp -R CSXS client host config install LICENSE.txt "$STAGE/"
cp README.md "$STAGE/INSTALL.md"
find "$STAGE" -name .DS_Store -delete
rm -f "$OUT/Amir_Anderson_Project_Organizer.zip"
(cd "$(dirname "$STAGE")" && zip -qr -X "$OUT/Amir_Anderson_Project_Organizer.zip" Amir_Anderson_Project_Organizer)
echo "$OUT/Amir_Anderson_Project_Organizer.zip"
