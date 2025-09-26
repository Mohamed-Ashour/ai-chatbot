#!/bin/bash

# AI Chatbot Client Startup Script

echo "🚀 Starting AI Chatbot Client..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s http://localhost:3500/test > /dev/null; then
    echo "✅ Server is running on http://localhost:3500"
else
    echo "⚠️  Server not detected on http://localhost:3500"
    echo "💡 Make sure to start the server first with: cd ../server && ./start_server.sh"
    echo ""
    echo "🔄 Continuing anyway... (you can start the server later)"
fi

echo ""
echo "🌐 Starting Next.js development server..."
echo "📱 Client will be available at http://localhost:3000"
echo "🛑 Press Ctrl+C to stop"
echo ""

npm run dev