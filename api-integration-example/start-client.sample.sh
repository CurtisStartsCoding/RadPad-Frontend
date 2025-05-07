#!/bin/bash
# Start the client in development mode with proxy to the remote API
export NODE_ENV=development
export PORT=3000
echo "Starting client in DEVELOPMENT mode on port $PORT..."
echo "API requests will be proxied to https://api.radorderpad.com"

# Use Vite directly to start the client
npx vite --port $PORT