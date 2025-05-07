#!/bin/bash
echo "===== Running Working API Tests (Part 2) ====="

# Set up the environment
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/../../.." && pwd)
TOKENS_DIR="$SCRIPT_DIR/tokens"

echo "Script directory (absolute path): $SCRIPT_DIR"

# Make sure tokens directory exists
mkdir -p "$TOKENS_DIR"

# Create a .env.test file for the tests if it doesn't exist
if [ ! -f "$SCRIPT_DIR/.env.test" ]; then
  echo "Creating .env.test file..."
  echo "API_URL=https://api.radorderpad.com" > "$SCRIPT_DIR/.env.test"
  echo "PROJECT_ROOT=$PROJECT_ROOT/" >> "$SCRIPT_DIR/.env.test"
fi

echo
echo "Generating fresh tokens for all roles..."
# Create a temporary CommonJS version of the token generation script
TEMP_SCRIPT="$SCRIPT_DIR/temp_generate_tokens.cjs"
echo "Creating temporary CommonJS script..."
cp "$PROJECT_ROOT/test-scripts/scripts/utilities/generate-all-role-tokens.js" "$TEMP_SCRIPT"

# Install required dependencies if not already installed
cd "$PROJECT_ROOT/test-scripts"
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Use absolute paths to ensure script works from any location
cd "$SCRIPT_DIR"
echo "Running token generation script from $(pwd)"
echo "Temp script path: $TEMP_SCRIPT"
if [ -f "$TEMP_SCRIPT" ]; then
  node "$TEMP_SCRIPT"
  rm "$TEMP_SCRIPT"
else
  echo "Error: Temporary script not found at $TEMP_SCRIPT"
  echo "Checking if original script exists..."
  if [ -f "$PROJECT_ROOT/test-scripts/scripts/utilities/generate-all-role-tokens.js" ]; then
    echo "Original script exists, running directly..."
    node "$PROJECT_ROOT/test-scripts/scripts/utilities/generate-all-role-tokens.js"
  else
    echo "Error: Original script not found either"
    exit 1
  fi
fi

# Make sure we're back in the vercel-tests directory
cd "$SCRIPT_DIR"

# Export environment variables for child scripts
export PROJECT_ROOT="$PROJECT_ROOT/"

# Copy tokens to the local tokens directory if they exist in the main tokens directory
if [ -d "$PROJECT_ROOT/test-scripts/tokens" ]; then
  echo "Copying tokens from main tokens directory to local tokens directory..."
  mkdir -p "$TOKENS_DIR"
  cp "$PROJECT_ROOT/test-scripts/tokens/"*-token.txt "$TOKENS_DIR/" 2>/dev/null || echo "No token files to copy"
fi

echo
echo "Current directory: $(pwd)"
echo "Script directory: $SCRIPT_DIR"
echo "Listing test scripts in current directory:"
ls -la | grep "test-.*\.sh"

# Check if each test script exists before running it
run_test_if_exists() {
  local test_name="$1"
  local test_script="$test_name"
  echo "Checking for test script: $test_script"
  if [ -f "$test_script" ]; then
    echo "Running $test_name..."
    bash "$test_script" || echo "$test_name failed, continuing..."
  else
    echo "Warning: $test_name not found, skipping..."
  fi
}

echo "Running tests from directory: $(pwd)"

# Run each test script if it exists
run_test_if_exists "test-connection-terminate.sh"
run_test_if_exists "test-update-user-me.sh"
run_test_if_exists "test-list-org-users.sh"
run_test_if_exists "test-update-org-user.sh"
run_test_if_exists "test-deactivate-org-user.sh"
run_test_if_exists "test-user-location-assignment.sh"
run_test_if_exists "test-connection-reject.sh"
run_test_if_exists "test-user-invite-prod.sh"
run_test_if_exists "test-update-org-mine.sh"
run_test_if_exists "test-search-organizations.sh"
run_test_if_exists "test-health.sh"
run_test_if_exists "test-login.sh"
run_test_if_exists "test-connection-list.sh"
run_test_if_exists "test-connection-requests-list.sh"
run_test_if_exists "test-connection-request.sh"
run_test_if_exists "test-connection-approve.sh"
run_test_if_exists "test-admin-order-queue.sh"
run_test_if_exists "test-admin-paste-summary.sh"
run_test_if_exists "test-location-management.sh"

echo "===== All Working Tests (Part 2) Complete ====="