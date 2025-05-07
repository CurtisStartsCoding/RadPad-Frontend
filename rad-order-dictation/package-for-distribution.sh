#!/bin/bash

# Script to package the integration package for distribution

# Create a temporary directory for packaging
mkdir -p dist

# Copy all files to the dist directory
echo "Copying files to dist directory..."
cp -r api-integration-package/* dist/

# Rename sample files
echo "Renaming sample files..."
mv dist/package.sample.json dist/package.json
mv dist/vite.config.sample.ts dist/vite.config.ts
mv dist/start-client.sample.sh dist/start-client.sh
chmod +x dist/start-client.sh

# Create a zip file
echo "Creating zip file..."
cd dist
zip -r ../rad-order-dictation.zip .
cd ..

# Clean up
echo "Cleaning up..."
rm -rf dist

echo "Package created: rad-order-dictation.zip"
echo "You can now distribute this package to other projects."