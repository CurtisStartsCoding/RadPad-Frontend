#!/bin/bash
echo "Testing connection rejection endpoint..."
# Get the directory where this script is located
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
# Run the test script from its directory
node "$SCRIPT_DIR/test-connection-reject.js"
exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "Connection rejection test failed with error code $exit_code"
  exit $exit_code
fi
echo "Connection rejection test completed successfully"