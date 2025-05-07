#!/bin/bash
echo "===== Running Working API Tests (Part 3) ====="

# Store the absolute path to the project root directory
SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT="$SCRIPT_DIR/../../"
echo "Project root directory: $PROJECT_ROOT"

# Generate tokens using absolute path
echo
echo "Generating fresh tokens for all roles..."
node "${PROJECT_ROOT}scripts/utilities/generate-all-role-tokens.js"

# Set environment variables for tokens
echo
echo "Setting environment variables for tokens..."
if [ -f "${PROJECT_ROOT}tokens/admin_referring-token.txt" ]; then
    export ADMIN_REFERRING_TOKEN=$(cat "${PROJECT_ROOT}tokens/admin_referring-token.txt")
    export ADMIN_TOKEN=$ADMIN_REFERRING_TOKEN
    echo "Admin Referring Token loaded successfully."
else
    echo "Error: Admin Referring Token file not found."
    exit 1
fi

if [ -f "${PROJECT_ROOT}tokens/admin_radiology-token.txt" ]; then
    export ADMIN_RADIOLOGY_TOKEN=$(cat "${PROJECT_ROOT}tokens/admin_radiology-token.txt")
    echo "Admin Radiology Token loaded successfully."
else
    echo "Error: Admin Radiology Token file not found."
    exit 1
fi

if [ -f "${PROJECT_ROOT}tokens/physician-token.txt" ]; then
    export PHYSICIAN_TOKEN=$(cat "${PROJECT_ROOT}tokens/physician-token.txt")
    echo "Physician Token loaded successfully."
else
    echo "Error: Physician Token file not found."
    exit 1
fi

if [ -f "${PROJECT_ROOT}tokens/admin_staff-token.txt" ]; then
    export ADMIN_STAFF_TOKEN=$(cat "${PROJECT_ROOT}tokens/admin_staff-token.txt")
    echo "Admin Staff Token loaded successfully."
else
    echo "Error: Admin Staff Token file not found."
    exit 1
fi

# Set API URL environment variable
export API_URL="https://api.radorderpad.com"

echo
echo "Running Get Organization Mine Tests..."
bash "${PROJECT_ROOT}debug-scripts/vercel-tests/test-get-org-mine.sh"

echo
echo "Running Order Validation Tests..."
bash "${PROJECT_ROOT}debug-scripts/vercel-tests/test-order-validation.sh"

echo
echo "Running Super Admin API Tests..."
bash "${PROJECT_ROOT}debug-scripts/vercel-tests/run-superadmin-api-test.sh"

echo
echo "Running Trial Feature Tests..."
bash "${PROJECT_ROOT}debug-scripts/vercel-tests/run-trial-feature-test.sh"

echo
echo "Running Radiology Request Info Tests..."
bash "${PROJECT_ROOT}debug-scripts/vercel-tests/run-radiology-request-info-test.sh"

echo
echo "===== All Working Tests (Part 3) Complete ====="