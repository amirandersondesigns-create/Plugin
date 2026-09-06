#!/bin/bash
# Builds a clean, signed MotionSpellChecker.zxp from the latest pushed
# source — downloads fresh from GitHub, stages ONLY the files the running
# CEP extension actually needs (CSXS/, client/, host/), and signs that
# clean staging folder. The built-in dictionary is compiled directly into
# host/dictionary-data.jsx, so there's no separate Dictionary/ folder to
# ship or go missing. Deliberately excludes: .debug (opens a DevTools
# debug port — a dev-only artifact), MotionSpellChecker.jsx (the separate
# standalone alternative), README.md / INSTALL.md / PROJECT_KNOWLEDGE.md /
# the PDF guide (developer docs, not runtime files), and .git.
#
# Usage:
#   ./package-zxp.sh <cert-password> [output-name]
#
# Requires (same as always):
#   - ~/cert.p12                       (self-signed cert, made once)
#   - ~/Downloads/ZXPSignCmd-64bit      (from Adobe-CEP/CEP-Resources)

set -e

PASSWORD="$1"
OUTPUT_NAME="${2:-Amir Anderson Motion Spell Checker.zxp}"

REPO="amirandersondesigns-create/Plugin"
BRANCH="claude/cep-motion-spell-checker-dpjdmi"
CERT="$HOME/cert.p12"
ZXPSIGN="$HOME/Downloads/ZXPSignCmd-64bit"
WORKDIR="$HOME/Desktop/MotionSpellChecker-build"
OUTPUT="$HOME/Desktop/$OUTPUT_NAME"

if [ -z "$PASSWORD" ]; then
  echo "Usage: ./package-zxp.sh <cert-password> [output-filename.zxp]"
  exit 1
fi
if [ ! -f "$CERT" ]; then
  echo "ERROR: certificate not found at $CERT"
  exit 1
fi
if [ ! -f "$ZXPSIGN" ]; then
  echo "ERROR: ZXPSignCmd not found at $ZXPSIGN"
  echo "Download it from https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD"
  exit 1
fi

echo "==> Downloading latest source from GitHub ($BRANCH)..."
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
curl -fsSL -o "$WORKDIR/source.zip" "https://github.com/$REPO/archive/refs/heads/$BRANCH.zip"
unzip -q -o "$WORKDIR/source.zip" -d "$WORKDIR/extracted"
SRC_DIR=$(find "$WORKDIR/extracted" -maxdepth 1 -mindepth 1 -type d | head -1)

echo "==> Staging only the files the extension actually needs..."
STAGE="$WORKDIR/stage"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -R "$SRC_DIR/CSXS" "$STAGE/"
cp -R "$SRC_DIR/client" "$STAGE/"
cp -R "$SRC_DIR/host" "$STAGE/"

echo "==> Signing..."
rm -f "$OUTPUT"
"$ZXPSIGN" -sign "$STAGE" "$OUTPUT" "$CERT" "$PASSWORD"

echo "==> Done: $OUTPUT"
echo "==> Contents of the package:"
unzip -l "$OUTPUT" | grep -v "META-INF\|mimetype"
