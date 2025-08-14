#!/bin/bash

# Build script for CHARLY production deployment

echo "🏗️  Building CHARLY for production..."

# Navigate to UI directory
cd charly_ui

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist node_modules .vite

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building production bundle..."
npm run build

# Verify build output
if [ -d "dist" ] && [ -f "dist/index.html" ] && [ -d "dist/assets" ]; then
    echo "✅ Build successful!"
    echo "📊 Build stats:"
    echo "   - HTML: $(ls -lh dist/index.html | awk '{print $5}')"
    echo "   - CSS: $(ls -lh dist/assets/*.css | head -1 | awk '{print $5}')"
    echo "   - JS: $(ls -lh dist/assets/index-*.js | head -1 | awk '{print $5}')"
else
    echo "❌ Build failed! Missing required files."
    exit 1
fi

# Return to root directory
cd ..

echo "🚀 Ready for deployment to GCP!"
echo ""
echo "Deploy with: gcloud app deploy"