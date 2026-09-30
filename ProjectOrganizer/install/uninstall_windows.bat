@echo off
rem Removes Motion Project Organizer from your user CEP extensions folder.
rem (Leaves CEP debug mode on, since other extensions may need it.)
set "DEST=%APPDATA%\Adobe\CEP\extensions\MotionProjectOrganizer"
if exist "%DEST%" (rmdir /S /Q "%DEST%" & echo Removed %DEST%) else (echo Not installed.)
pause
