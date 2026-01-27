#!/bin/bash

echo "=== Angular Manifest Debug Script ==="
echo ""

# Check if we're in the right directory
echo "1. Current directory:"
pwd
echo ""

# Check for documentation.json
echo "2. Checking for Compodoc documentation.json:"
if [ -f "documentation.json" ]; then
    echo "   ✅ Found documentation.json in root"
    echo "   Size: $(wc -c < documentation.json) bytes"
else
    echo "   ❌ documentation.json NOT FOUND in root"
fi

if [ -f ".compodoc/documentation.json" ]; then
    echo "   ✅ Found .compodoc/documentation.json"
else
    echo "   ❌ .compodoc/documentation.json NOT FOUND"
fi
echo ""

# Check .storybook/main.ts for feature flag
echo "3. Checking for experimentalComponentsManifest feature flag:"
if [ -f ".storybook/main.ts" ]; then
    if grep -q "experimentalComponentsManifest" .storybook/main.ts; then
        echo "   ✅ Found experimentalComponentsManifest in .storybook/main.ts"
        grep -A1 "experimentalComponentsManifest" .storybook/main.ts
    else
        echo "   ❌ experimentalComponentsManifest NOT FOUND in .storybook/main.ts"
        echo "   Add this to your .storybook/main.ts:"
        echo ""
        echo "   features: {"
        echo "     experimentalComponentsManifest: true,"
        echo "   },"
    fi
elif [ -f ".storybook/main.js" ]; then
    if grep -q "experimentalComponentsManifest" .storybook/main.js; then
        echo "   ✅ Found experimentalComponentsManifest in .storybook/main.js"
    else
        echo "   ❌ experimentalComponentsManifest NOT FOUND in .storybook/main.js"
    fi
else
    echo "   ❌ No .storybook/main.ts or main.js found"
fi
echo ""

# Check if @storybook/angular is installed
echo "4. Checking @storybook/angular installation:"
if [ -d "node_modules/@storybook/angular" ]; then
    echo "   ✅ @storybook/angular is installed"
    # Check if it has the manifest code
    if [ -f "node_modules/@storybook/angular/dist/preset.js" ]; then
        if grep -q "experimental_manifests" node_modules/@storybook/angular/dist/preset.js; then
            echo "   ✅ preset.js contains experimental_manifests export"
        else
            echo "   ❌ preset.js does NOT contain experimental_manifests"
            echo "   The linked Storybook may not have the Angular manifest changes"
        fi
        if grep -q "compodocData" node_modules/@storybook/angular/dist/preset.js; then
            echo "   ✅ preset.js contains compodocData"
        else
            echo "   ❌ preset.js does NOT contain compodocData"
        fi
    else
        echo "   ❌ dist/preset.js not found - package may not be built"
    fi
else
    echo "   ❌ @storybook/angular NOT installed"
fi
echo ""

# Check stories for component reference
echo "5. Checking story files for component:"
for f in src/**/*.stories.ts src/*.stories.ts; do
    if [ -f "$f" ]; then
        echo "   Found: $f"
        if grep -q "component:" "$f"; then
            echo "     ✅ Has 'component:' property"
        else
            echo "     ⚠️  Missing 'component:' property in meta"
        fi
    fi
done 2>/dev/null
echo ""

echo "=== Debug complete ==="
echo ""
echo "To generate Compodoc documentation, run:"
echo "   npx compodoc -p tsconfig.json"
echo ""
echo "To start Storybook with verbose logging:"
echo "   STORYBOOK_LOG_LEVEL=verbose npm run storybook"
