#!/bin/bash
echo "===== Running Working API Tests (Part 1) ====="

# Set up the environment
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(cd "$SCRIPT_DIR/../../.." && pwd)
TOKENS_DIR="$SCRIPT_DIR/tokens"

# Make sure tokens directory exists
mkdir -p "$TOKENS_DIR"

# Create a .env.test file for the tests
echo "Creating .env.test file..."
echo "API_URL=https://api.radorderpad.com" > "$SCRIPT_DIR/.env.test"
echo "PROJECT_ROOT=$PROJECT_ROOT/" >> "$SCRIPT_DIR/.env.test"

echo
echo "Generating fresh tokens for all roles..."
# Create a temporary CommonJS version of the token generation script
TEMP_SCRIPT="$SCRIPT_DIR/temp_generate_tokens.cjs"
echo "Creating temporary CommonJS script..."
cp "$PROJECT_ROOT/test-scripts/scripts/utilities/generate-all-role-tokens.js" "$TEMP_SCRIPT"

# Use absolute paths to ensure script works from any location
cd "$SCRIPT_DIR"
node "$TEMP_SCRIPT"
rm "$TEMP_SCRIPT"

# Export environment variables for child scripts
export PROJECT_ROOT="$PROJECT_ROOT/"

echo
echo "Running Connection Requests Tests..."
bash "$SCRIPT_DIR/test-connection-requests.sh" || echo "Connection Requests Tests failed, continuing..."

echo
echo "Running Admin Order Queue Tests..."
bash "$SCRIPT_DIR/test-admin-order-queue.sh" || echo "Admin Order Queue Tests failed, continuing..."

echo
echo "Running Admin Paste Summary Tests..."
bash "$SCRIPT_DIR/test-admin-paste-summary.sh" || echo "Admin Paste Summary Tests failed, continuing..."

echo
echo "Running Accept Invitation Tests..."
bash "$SCRIPT_DIR/test-accept-invitation-prod.sh" || echo "Accept Invitation Tests failed, continuing..."

echo
echo "Running User Invite Tests..."
bash "$SCRIPT_DIR/test-user-invite-prod.sh" || echo "User Invite Tests failed, continuing..."

echo
echo "Running Uploads Presigned URL Tests..."
bash "$SCRIPT_DIR/test-uploads-presigned-url.sh" || echo "Uploads Presigned URL Tests failed, continuing..."

echo
echo "Running Uploads Confirm Tests..."
bash "$SCRIPT_DIR/test-uploads-confirm.sh" || echo "Uploads Confirm Tests failed, continuing..."

echo
echo "Running Get Download URL Tests..."
bash "$SCRIPT_DIR/test-get-download-url.sh" || echo "Get Download URL Tests failed, continuing..."

echo
echo "Running Get Credit Balance Tests..."
bash "$SCRIPT_DIR/test-get-credit-balance.sh" || echo "Get Credit Balance Tests failed, continuing..."

echo
echo "Running Get Credit Usage Tests..."
bash "$SCRIPT_DIR/test-get-credit-usage.sh" || echo "Get Credit Usage Tests failed, continuing..."

echo
echo "Running Register Tests..."
bash "$SCRIPT_DIR/test-register.sh" || echo "Register Tests failed, continuing..."

echo
echo "Running Get Organization Mine Tests..."
bash "$SCRIPT_DIR/test-get-org-mine.sh" || echo "Get Organization Mine Tests failed, continuing..."

echo
echo "Running Get User Me Tests..."
bash "$SCRIPT_DIR/test-get-user-me.sh" || echo "Get User Me Tests failed, continuing..."

echo
echo "===== All Working Tests (Part 1) Complete ====="