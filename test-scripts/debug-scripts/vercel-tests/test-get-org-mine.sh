#!/bin/bash
echo "===== Testing Get Organization Mine Endpoint ====="

# Get the directory where this script is located
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Run the test script
node "$SCRIPT_DIR/test-get-org-mine.js"

echo
echo "===== Test Complete ====="