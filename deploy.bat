@echo off
:: ─────────────────────────────────────────────
::  Tableside — one-click deploy to Netlify
::  Usage: double-click deploy.bat
:: ─────────────────────────────────────────────

:: Move to the folder this script lives in
cd /d "%~dp0"

echo.
echo  Tableside Deploy
echo  ────────────────────────────────

:: Check git is installed
where git >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: Git is not installed. Download it at https://git-scm.com
  pause
  exit /b 1
)

:: Check there's a git repo here
if not exist ".git" (
  echo  ERROR: No git repo found. Run the first-time setup first:
  echo    git init ^&^& git remote add origin YOUR_GITHUB_URL
  pause
  exit /b 1
)

:: Ask for a custom commit message
echo.
set /p MSG="Commit message (press Enter for default): "
if "%MSG%"=="" (
  for /f "tokens=*" %%i in ('powershell -command "Get-Date -Format \"MMM dd yyyy hh:mm tt\""') do set TIMESTAMP=%%i
  set MSG=Update from Claude — %TIMESTAMP%
)

echo.
echo  Staging all changes...
git add .

echo  Committing: "%MSG%"
git commit -m "%MSG%"

echo  Pushing to GitHub...
git push

echo.
echo  ────────────────────────────────
echo  Done! Netlify is deploying your update.
echo  Check your Netlify dashboard for the live URL.
echo.
pause
