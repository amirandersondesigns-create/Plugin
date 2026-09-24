#!/bin/bash
# Animator Toolkit - macOS installer (unsigned / debug mode)
# Enables CEP debug mode (lets After Effects load unsigned panels) and copies
# the extension into your user CEP extensions folder.
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.cnn.animatortoolkit"

echo "Animator Toolkit installer"
echo "--------------------------"
for v in 9 10 11 12 13; do
    defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1
done
echo "✓ Debug mode enabled (CSXS 9-13)"

mkdir -p "$DEST"
rsync -a --delete --exclude tests --exclude '.git*' --exclude 'package.json' "$SRC/" "$DEST/"
echo "✓ Installed to: $DEST"
echo
echo "Next: quit and reopen After Effects, then open"
echo "      Window > Extensions > Animator Toolkit"
echo
read -n 1 -s -r -p "Press any key to close."
