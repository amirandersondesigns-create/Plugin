#!/bin/bash
# Amir Anderson Project Organizer — diagnostics (macOS).
# Double-click. First run turns on CEP logging; then restart After Effects,
# open Window → Extensions once, and double-click this again. It writes
# MPO_Diagnostics.txt to your Desktop — send that file.
OUT="$HOME/Desktop/MPO_Diagnostics.txt"
{
echo "=== Amir Anderson Project Organizer diagnostics — $(date)"
sw_vers 2>/dev/null
echo
echo "=== After Effects installs"
ls -d /Applications/Adobe\ After\ Effects*/ 2>/dev/null || echo "(none found in /Applications)"
echo
echo "=== CEP settings (PlayerDebugMode / LogLevel)"
for v in 9 10 11 12; do
    echo "CSXS.$v  debug=$(defaults read com.adobe.CSXS.$v PlayerDebugMode 2>/dev/null || echo -)  log=$(defaults read com.adobe.CSXS.$v LogLevel 2>/dev/null || echo -)"
done
echo
echo "=== Installed copies"
for d in "/Library/Application Support/Adobe/CEP/extensions" "$HOME/Library/Application Support/Adobe/CEP/extensions"; do
    for m in "$d"/*/CSXS/manifest.xml; do
        [ -f "$m" ] || continue
        if grep -q "motionprojectorganizer" "$m"; then
            echo "$m"
            grep -o 'ExtensionManifest Version="[^"]*"\|ExtensionBundleVersion="[^"]*"\|xmlns="[^"]*"' "$m" | tr '\n' ' '; echo
            ls -la "$(dirname "$(dirname "$m")")" | head -12
        fi
    done
done
echo
echo "=== CEP log lines mentioning the organizer, manifests or signatures"
grep -h -i "motionprojectorganizer\|manifest\|signature\|Unsupported" "$HOME"/Library/Logs/CSXS/*.log 2>/dev/null | tail -60 || echo "(no CEP logs yet)"
} > "$OUT" 2>&1

# Turn on detailed CEP logging for next time (harmless; slows panel loading slightly).
for v in 9 10 11 12; do defaults write "com.adobe.CSXS.$v" LogLevel 6; done
echo "Wrote $OUT"
echo "CEP logging is now on. Restart After Effects, open Window → Extensions, then run this again."
