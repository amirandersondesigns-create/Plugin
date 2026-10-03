@echo off
rem Amir Anderson Project Organizer - install as an unsigned CEP extension (Windows).
rem Double-click this file.
rem   - turns on CEP debug mode (needed for unsigned extensions) for CEP 9-12
rem   - copies the extension into your user CEP extensions folder
rem   - keeps your edited config\organizer-config.json if you reinstall
setlocal
set "SRC=%~dp0.."
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.aanders.motionprojectorganizer"
if exist "%APPDATA%\Adobe\CEP\extensions\MotionProjectOrganizer" rmdir /S /Q "%APPDATA%\Adobe\CEP\extensions\MotionProjectOrganizer"

echo Enabling CEP debug mode...
for %%v in (9 10 11 12) do reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul

echo Copying extension to: %DEST%
robocopy "%SRC%" "%DEST%" /MIR /XD install tools docs dist /XF .DS_Store organizer-config.json /NFL /NDL /NJH /NJS /NP >nul
if %ERRORLEVEL% GEQ 8 (
    echo Copy failed. Close After Effects and try again.
    pause
    exit /b 1
)
if not exist "%DEST%\config\organizer-config.json" (
    copy /Y "%SRC%\config\organizer-config.json" "%DEST%\config\" >nul
) else (
    echo Kept your existing folder rules ^(config\organizer-config.json^).
)

echo.
echo Done. Restart After Effects, then open Window ^> Extensions ^> Amir Anderson Project Organizer.
pause
