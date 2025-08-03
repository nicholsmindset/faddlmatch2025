#!/bin/bash
set -e

# FADDL Match - Bulletproof Netlify Build Script
# Comprehensive monorepo dependency resolution with fallback mechanisms

echo "🚀 Starting FADDL Match Robust Netlify Build Process"

# Enhanced logging with timestamp and build phase
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [BUILD] - $1"
}

error_exit() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] - $1" >&2
    exit 1
}

verify_file() {
    if [ ! -f "$1" ]; then
        error_exit "Critical file missing: $1"
    fi
    log "✅ Verified: $1"
}

verify_directory() {
    if [ ! -d "$1" ]; then
        error_exit "Critical directory missing: $1"
    fi
    log "✅ Verified: $1"
}

# Phase 1: Environment Validation
log "🔍 Phase 1: Environment Validation"
log "Node version: $(node --version)"
log "NPM version: $(npm --version)"
log "Working directory: $(pwd)"

# Verify monorepo structure
log "Verifying monorepo structure"
verify_directory "packages/types"
verify_directory "packages/api-client" 
verify_directory "packages/ai-integration"
verify_directory "apps/web"

# Phase 2: Deep Clean
log "🧹 Phase 2: Deep Clean for Fresh Build"
rm -rf node_modules package-lock.json
rm -rf apps/web/node_modules apps/web/package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
rm -rf packages/*/dist
log "✅ Clean completed"

# Phase 3: Root Workspace Installation
log "📦 Phase 3: Root Workspace Installation"
npm install --legacy-peer-deps --include-workspace-root || error_exit "Root installation failed"
log "✅ Root dependencies installed"

# Verify workspace linking
log "🔗 Verifying workspace linking"
if [ -L "node_modules/@faddl/types" ]; then
    log "✅ Workspace linking active"
else
    log "⚠️  Workspace linking not detected, attempting manual linking"
    # Fallback: manual workspace setup
    mkdir -p node_modules/@faddl
    ln -sf ../../../packages/types node_modules/@faddl/types
    mkdir -p node_modules/@faddlmatch
    ln -sf ../../../packages/api-client node_modules/@faddlmatch/api-client
    mkdir -p node_modules/@faddl-match
    ln -sf ../../../packages/ai-integration node_modules/@faddl-match/ai-integration
fi

# Phase 4: Package Dependencies Installation
log "📦 Phase 4: Package Dependencies Installation"

# Install api-client dependencies
log "Installing api-client dependencies"
cd packages/api-client
if [ -f "package.json" ] && grep -q '"dependencies"' package.json; then
    npm install --legacy-peer-deps || error_exit "API client deps installation failed"
    log "✅ API client dependencies installed"
fi
cd ../..

# Install ai-integration dependencies  
log "Installing ai-integration dependencies"
cd packages/ai-integration
if [ -f "package.json" ] && grep -q '"dependencies"' package.json; then
    npm install --legacy-peer-deps || error_exit "AI integration deps installation failed"
    log "✅ AI integration dependencies installed"
fi
cd ../..

# Phase 5: Workspace Package Builds
log "🔨 Phase 5: Workspace Package Builds"

# Build types (no dependencies)
log "Building @faddl/types"
cd packages/types
npm run type-check || error_exit "Types build failed"
cd ../..

# Build api-client (depends on types)
log "Building @faddlmatch/api-client"
cd packages/api-client
npm run build || error_exit "API client build failed"
verify_file "dist/index.js"
verify_file "dist/index.d.ts"
cd ../..

# Build ai-integration (depends on types)
log "Building @faddl-match/ai-integration"
cd packages/ai-integration
npm run build || error_exit "AI integration build failed"
verify_file "dist/index.js"
verify_file "dist/index.d.ts"
cd ../..

# Phase 6: Web App Installation & Build
log "🌐 Phase 6: Web App Installation & Build"
cd apps/web

# Install web dependencies with proper workspace resolution
log "Installing web app dependencies"
npm install --legacy-peer-deps --include-workspace-root || error_exit "Web deps installation failed"

# Verify critical dependencies
log "🔍 Verifying critical dependencies"
critical_deps=("tailwindcss" "@clerk/nextjs" "@radix-ui/react-avatar" "@faddl/types" "@faddlmatch/api-client")
missing_deps=()

for dep in "${critical_deps[@]}"; do
    if [ -d "node_modules/$dep" ] || [ -L "node_modules/$dep" ]; then
        log "✅ Found: $dep"
    else
        log "❌ Missing: $dep"
        missing_deps+=("$dep")
    fi
done

# Fallback: Install missing critical dependencies
if [ ${#missing_deps[@]} -gt 0 ]; then
    log "⚠️  Installing missing critical dependencies: ${missing_deps[*]}"
    npm install "${missing_deps[@]}" --legacy-peer-deps || log "⚠️  Some dependencies may still be missing"
fi

# Final dependency count
total_packages=$(find node_modules -maxdepth 1 -type d | wc -l)
log "📊 Total web app packages: $total_packages"

if [ "$total_packages" -lt 500 ]; then
    log "⚠️  Package count seems low ($total_packages), but proceeding with build"
fi

# Build the web application
log "Building Next.js application"
npm run build || error_exit "Web app build failed"

# Phase 7: Build Verification
log "🔍 Phase 7: Build Verification"
verify_directory ".next"
verify_file ".next/BUILD_ID"

log "✅ Build verification completed"
cd ../..

# Phase 8: Success Summary
log "🎉 Phase 8: Build Success Summary"
log "✅ All workspace packages built successfully"
log "✅ Web application built successfully"
log "✅ Monorepo dependency resolution completed"

# Display build artifacts
log "📦 Build artifacts:"
ls -la packages/*/dist/ 2>/dev/null || true
ls -la apps/web/.next/ | head -5

log "🚀 Netlify build process completed successfully!"