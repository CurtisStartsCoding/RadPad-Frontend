#!/bin/bash
echo "===== Testing Super Admin API Endpoints ====="

# Use the PROJECT_ROOT variable passed from the calling script
if [ -z "$PROJECT_ROOT" ]; then
    # If not called from another script, set the project root
    SCRIPT_DIR=$(dirname "$0")
    PROJECT_ROOT="$SCRIPT_DIR/../../"
fi

# Set JWT_SECRET if not already set
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET="radorderpad-secure-jwt-secret-f8a72c1e9b5d3e7f4a6b2c8d9e0f1a2b3c4d5e6f"
fi

# Run the test script
node "${PROJECT_ROOT}debug-scripts/vercel-tests/test-superadmin-api.js"

if [ $? -ne 0 ]; then
  echo "Test failed with error code $?"
  exit $?
fi

echo
echo "===== Super Admin API Tests Complete ====="