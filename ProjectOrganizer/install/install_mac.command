#!/bin/bash
# Amir Anderson Project Organizer — install as an unsigned CEP extension (macOS).
# Double-click this file in Finder, or run it from Terminal.
#   • turns on CEP debug mode (needed for unsigned extensions) for CEP 9–12
#   • copies the extension into your user CEP extensions folder
#   • keeps your edited config/organizer-config.json if you reinstall
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$HOME/Library/Application Support/Adobe/CEP/extensions"
DEST="$EXT/com.aanders.motionprojectorganizer"   # folder named after the bundle id, like the Toolkit
rm -rf "$EXT/MotionProjectOrganizer"            # older installs used this folder name

echo "Enabling CEP debug mode…"
for v in 9 10 11 12; do defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1; done
killall cfprefsd 2>/dev/null || true   # make macOS pick up the new setting now

echo "Copying extension to: $DEST"
KEEP=""
if [ -f "$DEST/config/organizer-config.json" ]; then
    KEEP="$(mktemp)"
    cp "$DEST/config/organizer-config.json" "$KEEP"
fi
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/." "$DEST/"
rm -rf "$DEST/install"
find "$DEST" -name .DS_Store -delete
if [ -n "$KEEP" ]; then
    cp "$KEEP" "$DEST/config/organizer-config.json"
    rm -f "$KEEP"
    echo "Kept your existing folder rules (config/organizer-config.json)."
fi

echo
echo "Done. Restart After Effects, then open Window → Extensions → Amir Anderson Project Organizer."
