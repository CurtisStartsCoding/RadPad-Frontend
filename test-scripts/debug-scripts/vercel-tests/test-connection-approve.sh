#!/bin/bash
echo "Testing connection approval endpoint..."
# Get the directory where this script is located
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# Run the test script from its directory
node "$SCRIPT_DIR/test-connection-approve.js"
exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "Connection approval test failed with error code $exit_code"
  exit $exit_code
fi
echo "Connection approval test completed successfully"