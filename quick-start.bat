@echo off
title AI Smart Inventory Assistant - Quick Start

echo.
echo 🛒 AI Smart Inventory Assistant - Quick Start
echo ==================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js ^(v14 or higher^) first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
node --version

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed. Please install Git first.
    echo Visit: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git detected
git --version

REM Clone or update the repository
if exist "AI-Smart-Inventor" (
    echo 📁 Repository exists, updating...
    cd AI-Smart-Inventor
    git pull origin main
) else (
    echo 📁 Cloning repository...
    git clone https://github.com/thrinadh2005/AI-Smart-Inventor.git
    cd AI-Smart-Inventor
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies. Please check the error above.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Get local IP address for mobile access
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found
)

:found
set LOCAL_IP=%LOCAL_IP: =%

REM Launch the application
echo.
echo 🚀 Starting AI Smart Inventory Assistant...
echo.
echo 🌐 Access Points:
echo    Desktop: http://localhost:5173
echo    Mobile:  http://%LOCAL_IP%:5173
echo    API:     http://localhost:5000
echo.
echo 📱 To access from your phone, use: http://%LOCAL_IP%:5173
echo.
echo 🎤 Voice Commands Supported:
echo    • 'Add sale' - Open sales modal
echo    • 'Check stock of [product]' - Check inventory
echo    • 'Find [product]' - Search products
echo.
echo 🌍 Languages: English, Telugu, Hindi
echo.
echo ⏹️  Press Ctrl+C to stop the application
echo.
echo 🎯 Starting now...
echo.

REM Start the application
call npm start
