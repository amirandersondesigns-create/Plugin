@echo off
REM Animator Toolkit - Windows installer (unsigned / debug mode)
REM Enables CEP debug mode (lets After Effects load unsigned panels) and
REM copies the extension into your user CEP extensions folder.
setlocal
set "SRC=%~dp0.."
set "DEST=%APPDATA%\Adobe\CEP\extensions\com.cnn.animatortoolkit"

echo Animator Toolkit installer
echo --------------------------
for %%v in (9 10 11 12 13) do reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
echo Debug mode enabled (CSXS 9-13)

if exist "%DEST%" rmdir /s /q "%DEST%"
robocopy "%SRC%" "%DEST%" /E /XD tests .git /XF package.json >nul
if %ERRORLEVEL% GEQ 8 (
    echo Copy failed.
    pause
    exit /b 1
)
echo Installed to: %DEST%
echo.
echo Next: quit and reopen After Effects, then open
echo       Window ^> Extensions ^> Animator Toolkit
echo.
pause
