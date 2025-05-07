#!/bin/bash
echo "===== Testing Get Organization Mine Endpoint ====="

# Use the PROJECT_ROOT variable passed from the calling script
if [ -z "$PROJECT_ROOT" ]; then
    # If not called from another script, set the project root
    SCRIPT_DIR=$(dirname "$0")
    PROJECT_ROOT="$SCRIPT_DIR/../../"
fi

# Run the test script
node "${PROJECT_ROOT}debug-scripts/vercel-tests/test-get-org-mine.js"

echo
echo "===== Test Complete ====="