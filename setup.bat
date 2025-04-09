@echo off
echo 🚀 Running CodeReview Setup Script

:: Run setup script
node setup.js

:: Check if script was successful
if %ERRORLEVEL% EQU 0 (
  echo ✅ Setup completed successfully
  exit /b 0
) else (
  echo ❌ Setup failed
  exit /b 1
) 