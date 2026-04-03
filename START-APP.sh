#!/bin/bash

echo "🛒 AI Smart Inventory Assistant"
echo "================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first:"
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected"

# Install dependencies if needed
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd client
    npm install
    cd ..
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server
    npm install
    cd ..
fi

echo
echo "🚀 Starting AI Smart Inventory Assistant..."
echo
echo "🌐 Open in your browser: http://localhost:5173"
echo "📱 Mobile access: Check your IP address"
echo
echo "⏹️  Press Ctrl+C to stop the application"
echo

# Start the application
npm start
