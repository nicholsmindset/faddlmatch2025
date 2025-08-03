#!/bin/bash

# FADDL Match - Netlify Dependency Debugging Script
# Comprehensive dependency resolution diagnostics

echo "🔍 FADDL Match Dependency Resolution Diagnostics"
echo "================================================"

# Environment Info
echo "📊 Environment Information:"
echo "Node: $(node --version)"
echo "NPM: $(npm --version)" 
echo "PWD: $(pwd)"
echo "USER: $(whoami)"
echo ""

# Workspace Structure
echo "🏗️  Workspace Structure:"
find . -name "package.json" -not -path "./node_modules/*" | sort
echo ""

# Root Dependencies
echo "📦 Root Dependencies (first 20):"
if [ -f "package.json" ]; then
    npm list --depth=0 2>/dev/null | head -20
else
    echo "❌ No root package.json found"
fi
echo ""

# Workspace Package Status
echo "🔗 Workspace Package Status:"
for pkg in packages/types packages/api-client packages/ai-integration; do
    if [ -d "$pkg" ]; then
        echo "✅ $pkg exists"
        if [ -f "$pkg/package.json" ]; then
            name=$(grep '"name"' "$pkg/package.json" | head -1 | cut -d'"' -f4)
            echo "   Name: $name"
        fi
        if [ -d "$pkg/dist" ]; then
            echo "   📦 Built: $(ls -la $pkg/dist/ | wc -l) files in dist/"
        else
            echo "   ❌ Not built: no dist/ directory"
        fi
    else
        echo "❌ $pkg missing"
    fi
done
echo ""

# Web App Dependencies
echo "🌐 Web App Dependencies:"
if [ -d "apps/web" ]; then
    cd apps/web
    echo "Web app package count:"
    if [ -d "node_modules" ]; then
        find node_modules -maxdepth 1 -type d | wc -l
    else
        echo "❌ No node_modules in apps/web"
    fi
    
    echo ""
    echo "Critical dependencies check:"
    critical_deps=("tailwindcss" "@clerk/nextjs" "@radix-ui/react-avatar" "@faddl/types" "@faddlmatch/api-client" "@faddl-match/ai-integration")
    for dep in "${critical_deps[@]}"; do
        if [ -d "node_modules/$dep" ] || [ -L "node_modules/$dep" ]; then
            if [ -L "node_modules/$dep" ]; then
                target=$(readlink "node_modules/$dep")
                echo "✅ $dep (symlink → $target)"
            else
                echo "✅ $dep (installed)"
            fi
        else
            echo "❌ $dep (missing)"
        fi
    done
    cd ..
else
    echo "❌ apps/web directory not found"
fi
echo ""

# Package-lock Analysis
echo "🔒 Package-lock Analysis:"
if [ -f "package-lock.json" ]; then
    echo "✅ Root package-lock.json exists ($(wc -l < package-lock.json) lines)"
else
    echo "❌ No root package-lock.json"
fi

if [ -f "apps/web/package-lock.json" ]; then
    echo "✅ Web package-lock.json exists ($(wc -l < apps/web/package-lock.json) lines)"
else
    echo "❌ No web package-lock.json"
fi
echo ""

# Workspace Resolution Test
echo "🧪 Workspace Resolution Test:"
if [ -d "node_modules/@faddl" ]; then
    echo "✅ @faddl scope resolved"
    ls -la node_modules/@faddl/
else
    echo "❌ @faddl scope not resolved"
fi

if [ -d "node_modules/@faddlmatch" ]; then
    echo "✅ @faddlmatch scope resolved"  
    ls -la node_modules/@faddlmatch/
else
    echo "❌ @faddlmatch scope not resolved"
fi

if [ -d "node_modules/@faddl-match" ]; then
    echo "✅ @faddl-match scope resolved"
    ls -la node_modules/@faddl-match/
else
    echo "❌ @faddl-match scope not resolved"
fi
echo ""

# Build Artifacts
echo "🏗️  Build Artifacts:"
echo "Packages built:"
for pkg in packages/*/dist; do
    if [ -d "$pkg" ]; then
        echo "✅ $(dirname $pkg) → $(ls -la $pkg | wc -l) files"
    fi
done

if [ -d "apps/web/.next" ]; then
    echo "✅ Web app built → .next directory exists"
else
    echo "❌ Web app not built → no .next directory"
fi
echo ""

echo "🔍 Diagnostics completed"