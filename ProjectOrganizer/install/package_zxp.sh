#!/bin/bash
# Build a signed MotionProjectOrganizer.zxp for distribution (no debug mode needed
# on users' machines). Needs Adobe's ZXPSignCmd on your PATH:
#   https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD
# Usage:  install/package_zxp.sh [cert.p12] [password]
# With no cert given, a self-signed one is created next to this script.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$HERE/.." && pwd)"
CERT="${1:-$HERE/cert.p12}"
PASS="${2:-changeme}"
OUT="$HERE/MotionProjectOrganizer.zxp"
STAGE="$(mktemp -d)/MotionProjectOrganizer"

command -v ZXPSignCmd >/dev/null || { echo "ZXPSignCmd not found on PATH."; exit 1; }
if [ ! -f "$CERT" ]; then
    echo "Creating self-signed certificate: $CERT"
    ZXPSignCmd -selfSignedCert US CA "Amir Anderson" "MotionProjectOrganizer" "$PASS" "$CERT"
fi

# Stage a clean copy: no installers, no debug file, no Finder junk.
mkdir -p "$STAGE"
cp -R "$SRC/." "$STAGE/"
rm -rf "$STAGE/install" "$STAGE/.debug"
find "$STAGE" -name .DS_Store -delete
rm -f "$OUT"
ZXPSignCmd -sign "$STAGE" "$OUT" "$CERT" "$PASS" -tsa http://timestamp.digicert.com
echo "Built $OUT — install it with ExManCmd or Anastasiy's Extension Manager."
