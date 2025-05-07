#!/bin/bash
echo "===== Running Working API Tests (Part 3) ====="

# Set up the environment
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/../../.." && pwd)
TOKENS_DIR="$SCRIPT_DIR/tokens"

echo "Script directory (absolute path): $SCRIPT_DIR"
echo "Project root directory: $PROJECT_ROOT"

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

# Copy tokens to the local tokens directory if they exist in the main tokens directory
if [ -d "$PROJECT_ROOT/test-scripts/tokens" ]; then
  echo "Copying tokens from main tokens directory to local tokens directory..."
  mkdir -p "$TOKENS_DIR"
  cp "$PROJECT_ROOT/test-scripts/tokens/"*-token.txt "$TOKENS_DIR/" 2>/dev/null || echo "No token files to copy"
fi

# Set environment variables for tokens
echo
echo "Setting environment variables for tokens..."

# Try multiple possible paths for admin_referring token
for token_path in \
  "$PROJECT_ROOT/test-scripts/tokens/admin_referring-token.txt" \
  "$TOKENS_DIR/admin_referring-token.txt" \
  "$SCRIPT_DIR/tokens/admin_referring-token.txt"; do
  if [ -f "$token_path" ]; then
    export ADMIN_REFERRING_TOKEN=$(cat "$token_path")
    export ADMIN_TOKEN=$ADMIN_REFERRING_TOKEN
    echo "Admin Referring Token loaded successfully from $token_path"
    break
  fi
done

if [ -z "$ADMIN_REFERRING_TOKEN" ]; then
  echo "Error: Admin Referring Token file not found in any of the expected locations."
  exit 1
fi

# Try multiple possible paths for admin_radiology token
for token_path in \
  "$PROJECT_ROOT/test-scripts/tokens/admin_radiology-token.txt" \
  "$TOKENS_DIR/admin_radiology-token.txt" \
  "$SCRIPT_DIR/tokens/admin_radiology-token.txt"; do
  if [ -f "$token_path" ]; then
    export ADMIN_RADIOLOGY_TOKEN=$(cat "$token_path")
    echo "Admin Radiology Token loaded successfully from $token_path"
    break
  fi
done

if [ -z "$ADMIN_RADIOLOGY_TOKEN" ]; then
  echo "Error: Admin Radiology Token file not found in any of the expected locations."
  exit 1
fi

# Try multiple possible paths for physician token
for token_path in \
  "$PROJECT_ROOT/test-scripts/tokens/physician-token.txt" \
  "$TOKENS_DIR/physician-token.txt" \
  "$SCRIPT_DIR/tokens/physician-token.txt"; do
  if [ -f "$token_path" ]; then
    export PHYSICIAN_TOKEN=$(cat "$token_path")
    echo "Physician Token loaded successfully from $token_path"
    break
  fi
done

if [ -z "$PHYSICIAN_TOKEN" ]; then
  echo "Error: Physician Token file not found in any of the expected locations."
  exit 1
fi

# Try multiple possible paths for admin_staff token
for token_path in \
  "$PROJECT_ROOT/test-scripts/tokens/admin_staff-token.txt" \
  "$TOKENS_DIR/admin_staff-token.txt" \
  "$SCRIPT_DIR/tokens/admin_staff-token.txt"; do
  if [ -f "$token_path" ]; then
    export ADMIN_STAFF_TOKEN=$(cat "$token_path")
    echo "Admin Staff Token loaded successfully from $token_path"
    break
  fi
done

if [ -z "$ADMIN_STAFF_TOKEN" ]; then
  echo "Error: Admin Staff Token file not found in any of the expected locations."
  exit 1
fi

# Set API URL environment variable
export API_URL="https://api.radorderpad.com"

echo "Current directory: $(pwd)"
echo "Script directory: $SCRIPT_DIR"
echo "Listing test scripts in current directory:"
ls -la | grep "test-.*\.sh\|run-.*\.sh"

# Check if each test script exists before running it
run_test_if_exists() {
  local test_name="$1"
  local test_script="$SCRIPT_DIR/$test_name"
  echo "Checking for test script: $test_script"
  if [ -f "$test_script" ]; then
    echo "Running $test_name..."
    cd "$SCRIPT_DIR"
    bash "$test_script" || echo "$test_name failed, continuing..."
  else
    echo "Warning: $test_name not found, skipping..."
  fi
}

echo "Running tests from directory: $(pwd)"

# Run each test script if it exists
run_test_if_exists "test-get-org-mine.sh"
run_test_if_exists "test-order-validation.sh"
run_test_if_exists "run-superadmin-api-test.sh"
run_test_if_exists "run-trial-feature-test.sh"
run_test_if_exists "run-radiology-request-info-test.sh"

echo
echo "===== All Working Tests (Part 3) Complete ====="