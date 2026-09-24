@echo off
REM Animator Toolkit - Windows diagnostics
REM Writes AnimatorToolkit-diagnostics.txt to your Desktop: install location,
REM CEP debug-mode flags and what After Effects' CEP log says. Also turns on
REM detailed CEP logging; if the log section is empty, reopen After Effects
REM once and run this again.
setlocal
set "OUT=%USERPROFILE%\Desktop\AnimatorToolkit-diagnostics.txt"
set "ID=com.cnn.animatortoolkit"
(
echo Animator Toolkit diagnostics - %DATE% %TIME%
ver
echo.
echo == Installed copies ==
for %%d in ("%APPDATA%\Adobe\CEP\extensions" "%CommonProgramFiles%\Adobe\CEP\extensions" "%CommonProgramFiles(x86)%\Adobe\CEP\extensions") do (
    if exist "%%~d\%ID%\CSXS\manifest.xml" (echo FOUND: %%~d\%ID%& dir /b "%%~d\%ID%") else (echo not in: %%~d)
)
echo.
echo == CEP debug mode ==
for %%v in (9 10 11 12 13) do (
    reg query "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode 2>nul | find "PlayerDebugMode" || echo CSXS.%%v PlayerDebugMode unset
    reg add "HKCU\Software\Adobe\CSXS.%%v" /v LogLevel /t REG_SZ /d 6 /f >nul
)
echo.
echo == After Effects installs ==
dir /b "%ProgramFiles%\Adobe" 2>nul | find /i "After Effects"
echo.
echo == CEP logs ==
for %%f in ("%TEMP%\CEP*AEFT*.log") do (
    echo --- %%f
    findstr /i "animatortoolkit signature manifest error invalid" "%%f"
)
) > "%OUT%" 2>&1
echo Report saved to: %OUT%
start "" notepad "%OUT%"
