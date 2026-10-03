#!/bin/bash
# Removes Amir Anderson Project Organizer from your user CEP extensions folder.
# (Leaves CEP debug mode on, since other extensions may need it.)
EXT="$HOME/Library/Application Support/Adobe/CEP/extensions"
FOUND=0
for d in "$EXT/com.aanders.motionprojectorganizer" "$EXT/MotionProjectOrganizer"; do
    if [ -d "$d" ]; then rm -rf "$d" && echo "Removed $d"; FOUND=1; fi
done
[ $FOUND = 1 ] || echo "Not installed."
