@echo off
title Fix Dependencies - AI Smart Inventory

echo.
echo 🔧 Fix Dependencies - AI Smart Inventory Assistant
echo ==================================================
echo.

cd AI-Smart-Inventor

echo 📦 Installing root dependencies...
call npm install

echo.
echo 📦 Installing frontend dependencies...
cd client
call npm install
cd ..

echo.
echo 📦 Installing backend dependencies...
cd server
call npm install
cd ..

echo.
echo ✅ All dependencies installed successfully!
echo.
echo 🚀 Starting the application...
echo.

call npm start
