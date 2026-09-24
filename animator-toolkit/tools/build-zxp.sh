#!/bin/bash
# Builds a self-signed dist/AnimatorToolkit-<version>.zxp with Adobe's
# ZXPSignCmd. On macOS/Windows use the native ZXPSignCmd (put it on PATH or
# set ZXPSIGN). On Linux it runs the Windows build under Wine.
#
#   ZXP_PASSWORD=... bash tools/build-zxp.sh
#
# The certificate (dist/cert.p12) is created on first run and reused, so
# later builds install as updates. Keep it out of git.
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./package.json').version")
PASS="${ZXP_PASSWORD:-animator-toolkit}"
mkdir -p dist
DIST="$(cd dist && pwd)"

if [ -n "$ZXPSIGN" ]; then
    SIGN=("$ZXPSIGN")
elif command -v ZXPSignCmd >/dev/null; then
    SIGN=(ZXPSignCmd)
else
    command -v wine >/dev/null || { echo "Need ZXPSignCmd on PATH, or Wine to run the Windows build." >&2; exit 1; }
    EXE="$DIST/ZXPSignCmd.exe"
    [ -f "$EXE" ] || curl -fsSL -o "$EXE" https://raw.githubusercontent.com/Adobe-CEP/CEP-Resources/master/ZXPSignCMD/4.1.103/win64/ZXPSignCmd.exe
    export WINEDEBUG=-all
    SIGN=(wine "$EXE")
fi

# Stage only what the extension needs. No dotfiles: .debug is a dev-only
# DevTools switch, and ZXPSignCmd under Wine signs dotfiles it then fails
# to pack, which produces a ZXP that won't verify. Paths passed to the
# signer are relative (inside dist/): under Wine an absolute "/home/..."
# path reads as a Windows command-line switch.
cd "$DIST"
rm -rf stage && mkdir -p stage/com.cnn.animatortoolkit
(cd .. && cp -R CSXS client host README.md "$DIST/stage/com.cnn.animatortoolkit/")

[ -f cert.p12 ] || "${SIGN[@]}" -selfSignedCert US NY "Animator Toolkit" "Animator Toolkit" "$PASS" cert.p12 -validityDays 3650

OUT="AnimatorToolkit-$VERSION.zxp"
rm -f "$OUT"
"${SIGN[@]}" -sign stage/com.cnn.animatortoolkit "$OUT" cert.p12 "$PASS"
"${SIGN[@]}" -verify "$OUT"
rm -rf stage
echo "$DIST/$OUT"
