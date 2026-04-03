#!/bin/bash

# AI Smart Inventory Assistant - Quick Start Script
# This script will automatically set up and launch the application

echo "🛒 AI Smart Inventory Assistant - Quick Start"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v14 or higher) first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install v14 or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    echo "Visit: https://git-scm.com/"
    exit 1
fi

echo "✅ Git detected"

# Clone or update the repository
if [ -d "AI-Smart-Inventor" ]; then
    echo "📁 Repository exists, updating..."
    cd AI-Smart-Inventor
    git pull origin main
else
    echo "📁 Cloning repository..."
    git clone https://github.com/thrinadh2005/AI-Smart-Inventor.git
    cd AI-Smart-Inventor
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install client dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Install server dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Please check the error above."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Get local IP address for mobile access
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ip route get 1.1.1.1 | awk '{print $7}' 2>/dev/null || hostname -I | awk '{print $1}')

# Launch the application
echo "🚀 Starting AI Smart Inventory Assistant..."
echo ""
echo "🌐 Access Points:"
echo "   Desktop: http://localhost:5173"
echo "   Mobile:  http://$LOCAL_IP:5173"
echo "   API:     http://localhost:5000"
echo ""
echo "📱 To access from your phone, use: http://$LOCAL_IP:5173"
echo ""
echo "🎤 Voice Commands Supported:"
echo "   • 'Add sale' - Open sales modal"
echo "   • 'Check stock of [product]' - Check inventory"
echo "   • 'Find [product]' - Search products"
echo ""
echo "🌍 Languages: English, Telugu, Hindi"
echo ""
echo "⏹️  Press Ctrl+C to stop the application"
echo ""
echo "🎯 Starting now..."

# Start the application
npm start
