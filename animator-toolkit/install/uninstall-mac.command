#!/bin/bash
rm -rf "$HOME/Library/Application Support/Adobe/CEP/extensions/com.aanders.animatortoolkit"
rm -rf "$HOME/Library/Application Support/Adobe/CEP/extensions/com.cnn.animatortoolkit"
echo "✓ Amir Anderson Animator Toolkit removed. Your favorites and settings are kept in"
echo "  ~/Library/Application Support/AnimatorToolkit (delete it to reset)."
read -n 1 -s -r -p "Press any key to close."
