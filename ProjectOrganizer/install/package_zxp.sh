#!/bin/bash
# Build a signed Amir_Anderson_Project_Organizer.zxp for distribution (no debug mode needed
# on users' machines). Needs Adobe's ZXPSignCmd on your PATH:
#   https://github.com/Adobe-CEP/CEP-Resources/tree/master/ZXPSignCMD
# Usage:  install/package_zxp.sh [cert.p12] [password]
# With no cert given, a self-signed one is created next to this script.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$HERE/.." && pwd)"
CERT="${1:-$HERE/cert.p12}"
PASS="${2:-changeme}"
OUT="$HERE/Amir_Anderson_Project_Organizer.zxp"
STAGE="$(mktemp -d)/Amir_Anderson_Project_Organizer"

command -v ZXPSignCmd >/dev/null || { echo "ZXPSignCmd not found on PATH."; exit 1; }
if [ ! -f "$CERT" ]; then
    echo "Creating self-signed certificate: $CERT"
    ZXPSignCmd -selfSignedCert US CA "Amir Anderson" "Amir Anderson Project Organizer" "$PASS" "$CERT"
fi

# Stage a clean copy: no installers, no Finder junk.
mkdir -p "$STAGE"
cp -R "$SRC/." "$STAGE/"
rm -rf "$STAGE/install"
find "$STAGE" -name .DS_Store -delete
rm -f "$OUT"
ZXPSignCmd -sign "$STAGE" "$OUT" "$CERT" "$PASS" -tsa http://timestamp.digicert.com
# Normal file permissions inside the package (needed if signed on Windows/Wine).
command -v python3 >/dev/null && python3 "$HERE/fix_zxp_permissions.py" "$OUT"
ZXPSignCmd -verify "$OUT"
echo "Built $OUT — install it with ExManCmd or Anastasiy's Extension Manager."
