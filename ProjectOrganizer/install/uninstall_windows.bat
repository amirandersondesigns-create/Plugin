@echo off
rem Removes Amir Anderson Project Organizer from your user CEP extensions folder.
rem (Leaves CEP debug mode on, since other extensions may need it.)
set "EXT=%APPDATA%\Adobe\CEP\extensions"
if exist "%EXT%\MotionProjectOrganizer" (rmdir /S /Q "%EXT%\MotionProjectOrganizer" & echo Removed old install)
if exist "%EXT%\com.aanders.motionprojectorganizer" (rmdir /S /Q "%EXT%\com.aanders.motionprojectorganizer" & echo Removed %EXT%\com.aanders.motionprojectorganizer) else (echo Not installed.)
pause
