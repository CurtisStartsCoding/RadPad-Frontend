#!/bin/bash
echo "===== Testing Order Validation Endpoint ====="
cd "$(dirname "$0")"
node test-order-validation.js
if [ $? -ne 0 ]; then
  echo "Test failed with error code $?"
  exit $?
fi
echo "Test completed successfully"