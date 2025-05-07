#!/bin/bash
echo "===== Testing Trial Feature Endpoints ====="

# Use the PROJECT_ROOT variable passed from the calling script
if [ -z "$PROJECT_ROOT" ]; then
    # If not called from another script, set the project root
    SCRIPT_DIR=$(dirname "$0")
    PROJECT_ROOT="$SCRIPT_DIR/../../"
fi

# Set API_URL if not already set
if [ -z "$API_URL" ]; then
    export API_URL="https://api.radorderpad.com"
fi

# Run the test script
node "${PROJECT_ROOT}debug-scripts/vercel-tests/test-trial-feature.js"

if [ $? -ne 0 ]; then
  echo "Test failed with error code $?"
  exit $?
fi

echo
echo "===== Trial Feature Tests Complete ====="