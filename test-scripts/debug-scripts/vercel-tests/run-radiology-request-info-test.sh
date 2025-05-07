#!/bin/bash
echo "===== Testing Radiology Request Info Endpoints ====="

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

# Create results directory if it doesn't exist
mkdir -p "${PROJECT_ROOT}test-results/vercel-tests"

# Run the test script
node "${PROJECT_ROOT}debug-scripts/vercel-tests/test-radiology-request-info.js"

if [ $? -ne 0 ]; then
  echo "Test failed with error code $?"
  exit $?
fi

echo
echo "===== Radiology Request Info Tests Complete ====="