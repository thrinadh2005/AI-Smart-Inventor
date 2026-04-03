@echo off
title AI Smart Inventory - Launcher

echo.
echo 🛒 AI Smart Inventory Assistant
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Installing Node.js...
    start https://nodejs.org/
    echo Please install Node.js and run this file again.
    pause
    exit
)

echo ✅ Node.js detected

REM Install dependencies if needed
if not exist "client\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd client
    call npm install
    cd ..
)

if not exist "server\node_modules" (
    echo 📦 Installing backend dependencies...
    cd server
    call npm install
    cd ..
)

echo.
echo 🚀 Starting AI Smart Inventory Assistant...
echo.
echo 🌐 Open in your browser: http://localhost:5173
echo 📱 Mobile access: Check your IP address
echo.
echo ⏹️  Close this window to stop the application
echo.

REM Start the application
call npm start
