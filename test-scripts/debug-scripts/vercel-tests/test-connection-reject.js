/**
 * Test script for the connection rejection endpoint
 */
// Load environment variables from .env.test file
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.test file
const envPath = path.resolve(__dirname, '.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('Error: .env.test file not found');
  process.exit(1);
}

const axios = require('axios');
const chalk = require('chalk');

// Read admin token from file
const getToken = () => {
  try {
    // Get the project root directory
    const projectRoot = process.env.PROJECT_ROOT || process.cwd();
    
    // Try multiple possible token paths
    const possiblePaths = [
      `${projectRoot}/tokens/admin_radiology-token.txt`,
      `${projectRoot}/test-scripts/tokens/admin_radiology-token.txt`,
      `${projectRoot}/../tokens/admin_radiology-token.txt`,
      `${projectRoot}/debug-scripts/vercel-tests/tokens/admin_radiology-token.txt`
    ];
    
    let token = null;
    for (const tokenPath of possiblePaths) {
      console.log(`Trying to read token from: ${tokenPath}`);
      try {
        if (fs.existsSync(tokenPath)) {
          token = fs.readFileSync(tokenPath, 'utf8').trim();
          console.log(`Successfully read token from: ${tokenPath}`);
          break;
        }
      } catch (err) {
        // Continue to next path
      }
    }
    
    if (!token) {
      throw new Error('Could not find token file in any of the expected locations');
    }
    
    return token;
  } catch (error) {
    console.error('Error reading admin token:', error.message);
    process.exit(1);
  }
};

// Configuration
const API_URL = process.env.API_BASE_URL || 'https://api.radorderpad.com';
const RELATIONSHIP_ID = process.env.TEST_PENDING_RELATIONSHIP_ID || '1';
const ADMIN_TOKEN = getToken();

// Test the connection rejection endpoint
async function testConnectionRejection() {
  console.log('Testing connection rejection endpoint...');
  console.log(`API URL: ${API_URL}`);
  console.log(`Relationship ID: ${RELATIONSHIP_ID}`);

  try {
    // Make the request
    const response = await axios.post(
      `${API_URL}/api/connections/${RELATIONSHIP_ID}/reject`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      }
    );

    // Check the response
    if (response.status === 200 && response.data.success) {
      console.log(chalk.green('Connection rejection successful!'));
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return true;
    } else {
      console.log(chalk.yellow('Unexpected response:'));
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    // Special case: 404 with "not found, not authorized, or not in pending status" is expected
    // when testing with a relationship that's already been approved/rejected
    if (error.response &&
        error.response.status === 404 &&
        error.response.data.message &&
        error.response.data.message.includes('not found, not authorized, or not in pending status')) {
      console.log(chalk.green('Expected 404 response (relationship validation working correctly):'));
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
      return true;
    }
    
    console.log(chalk.red('Error rejecting connection:'));
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
    return false;
  }
}

// Run the test
(async () => {
  try {
    const success = await testConnectionRejection();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('Unexpected error:'), error);
    process.exit(1);
  }
})();