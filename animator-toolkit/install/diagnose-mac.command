#!/bin/bash
# Animator Toolkit - macOS diagnostics
# Writes ~/Desktop/AnimatorToolkit-diagnostics.txt: where the panel is
# installed, its permissions, CEP debug-mode flags, installed After Effects
# versions, and what After Effects' CEP log says about the extension.
# It also turns on detailed CEP logging (LogLevel 6) so the log has reasons;
# if the log section is empty, reopen After Effects once and run this again.
OUT="$HOME/Desktop/AnimatorToolkit-diagnostics.txt"
ID="com.aanders.animatortoolkit"
{
echo "Animator Toolkit diagnostics - $(date)"
echo "macOS $(sw_vers -productVersion) ($(uname -m))"
echo
echo "== Installed copies =="
for d in "/Library/Application Support/Adobe/CEP/extensions" "$HOME/Library/Application Support/Adobe/CEP/extensions"; do
    if [ -d "$d/$ID" ]; then
        echo "FOUND: $d/$ID"
        ls -la "$d/$ID"
        ls -la "$d/$ID/CSXS" 2>&1
        head -2 "$d/$ID/CSXS/manifest.xml" 2>&1 | tail -1
        [ -f "$d/$ID/META-INF/signatures.xml" ] && echo "(signed copy)" || echo "(unsigned copy)"
    else
        echo "not in: $d"
        ls "$d" 2>/dev/null | grep -i -E "anim|toolkit" | sed 's/^/  similar: /'
    fi
done
echo
echo "== CEP debug mode (1 = unsigned/self-signed panels allowed) =="
for v in 9 10 11 12 13; do
    echo "CSXS.$v PlayerDebugMode=$(defaults read com.adobe.CSXS.$v PlayerDebugMode 2>/dev/null || echo unset)"
    defaults write com.adobe.CSXS.$v LogLevel 6
done
echo
echo "== After Effects installs =="
ls -d /Applications/Adobe\ After\ Effects* 2>/dev/null
echo
echo "== CEP logs mentioning the toolkit or errors =="
for f in $(ls -t "$HOME"/Library/Logs/CSXS/CEP*AEFT*.log 2>/dev/null | head -3); do
    echo "--- $f"
    grep -i -E "animatortoolkit|signature|manifest|error|invalid" "$f" | tail -40
done
echo
echo "== Animator Toolkit panel engine logs (JavaScript errors, bridge calls) =="
for f in $(ls -t "$HOME"/Library/Logs/CSXS/CEPHtmlEngine*animatortoolkit*.log 2>/dev/null | head -2); do
    echo "--- $f"
    tail -60 "$f"
done
} > "$OUT" 2>&1
echo "Report saved to: $OUT"
open "$OUT"
