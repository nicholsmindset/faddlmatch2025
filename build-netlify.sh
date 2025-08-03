#!/bin/bash
set -e

echo "🚀 Starting FADDL Match Netlify Build Process"

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Clean everything
log "🧹 Cleaning old builds and dependencies"
rm -rf node_modules package-lock.json
rm -rf apps/web/node_modules apps/web/package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
rm -rf packages/*/dist

# Install root dependencies first
log "📦 Installing root dependencies"
npm install --legacy-peer-deps

# Verify workspace dependencies exist
log "🔍 Verifying workspace packages"
for pkg in packages/types packages/api-client packages/ai-integration; do
    if [ ! -d "$pkg" ]; then
        log "❌ Missing package: $pkg"
        exit 1
    fi
    log "✅ Found package: $pkg"
done

# Build packages in dependency order
log "🔨 Building workspace packages"

# Build types first (no dependencies)
log "Building @faddl/types"
cd packages/types
npm run type-check || { log "❌ Failed to build types"; exit 1; }
cd ../..

# Build api-client (depends on types)
log "Building @faddlmatch/api-client"
cd packages/api-client
# Check if we have dependencies to install
if [ -f "package.json" ] && grep -q '"dependencies"' package.json; then
    npm install --legacy-peer-deps || { log "❌ Failed to install api-client deps"; exit 1; }
fi
npm run build || { log "❌ Failed to build api-client"; exit 1; }
cd ../..

# Build ai-integration (depends on types)
log "Building @faddl-match/ai-integration"
cd packages/ai-integration
# Check if we have dependencies to install
if [ -f "package.json" ] && grep -q '"dependencies"' package.json; then
    npm install --legacy-peer-deps || { log "❌ Failed to install ai-integration deps"; exit 1; }
fi
npm run build || { log "❌ Failed to build ai-integration"; exit 1; }
cd ../..

# Build web app
log "🌐 Building web application"
cd apps/web

# Install web app dependencies (including the built workspace packages)
log "Installing web app dependencies"
npm install --legacy-peer-deps || { log "❌ Failed to install web deps"; exit 1; }

# Build the web app
log "Building Next.js application"
npm run build || { log "❌ Failed to build web app"; exit 1; }

log "✅ Build completed successfully!"

# Display package count for verification
total_packages=$(find node_modules -maxdepth 1 -type d | wc -l)
log "📊 Total packages installed: $total_packages"

# Verify critical dependencies
log "🔍 Verifying critical dependencies"
for dep in tailwindcss @clerk/nextjs @radix-ui/react-avatar; do
    if [ -d "node_modules/$dep" ]; then
        log "✅ Found: $dep"
    else
        log "⚠️  Missing: $dep"
    fi
done

log "🎉 Netlify build process completed!"