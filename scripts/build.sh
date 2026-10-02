#!/bin/sh
set -e

# Build with Nitro (TanStack Start)
npx vite build

# Copy Nitro output to dist/ for hosting
rm -rf dist
mkdir -p dist
cp -r .output/public/* dist/
cp -r .output/server dist/server

echo "Build complete — dist/ ready for deploy"
