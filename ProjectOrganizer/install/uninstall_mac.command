#!/bin/bash
# Removes Motion Project Organizer from your user CEP extensions folder.
# (Leaves CEP debug mode on, since other extensions may need it.)
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/MotionProjectOrganizer"
if [ -d "$DEST" ]; then rm -rf "$DEST" && echo "Removed $DEST"; else echo "Not installed."; fi
