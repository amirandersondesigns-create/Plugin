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

# Replace any previous copy completely (plain cp: no rsync dependency).
rm -rf "$DEST"
mkdir -p "$DEST"
for item in CSXS client host install README.md .debug; do
    [ -e "$SRC/$item" ] && cp -R "$SRC/$item" "$DEST/"
done
if [ ! -f "$DEST/CSXS/manifest.xml" ]; then
    echo "✗ Copy failed - run this script from inside the unzipped com.cnn.animatortoolkit folder."
    exit 1
fi
echo "✓ Installed to: $DEST"
if [ -d "/Library/Application Support/Adobe/CEP/extensions/com.cnn.animatortoolkit" ]; then
    echo
    echo "! A ZXP-installed copy also exists in /Library/Application Support/Adobe/CEP/extensions."
    echo "  Two copies with the same ID can stop the panel loading. Remove that one with"
    echo "  your ZXP installer (or delete the folder), then restart After Effects."
fi
echo
echo "Next: quit and reopen After Effects, then open"
echo "      Window > Extensions > Animator Toolkit"
echo
read -n 1 -s -r -p "Press any key to close."
