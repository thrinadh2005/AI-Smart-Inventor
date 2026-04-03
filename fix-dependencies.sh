#!/bin/bash

echo "🔧 Fix Dependencies - AI Smart Inventory Assistant"
echo "=================================================="
echo

cd AI-Smart-Inventor

echo "📦 Installing root dependencies..."
npm install

echo
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

echo
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

echo
echo "✅ All dependencies installed successfully!"
echo
echo "🚀 Starting the application..."
echo

npm start
