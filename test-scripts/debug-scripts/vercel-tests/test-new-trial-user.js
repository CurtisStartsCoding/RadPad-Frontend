/**
 * Test script for a new trial user
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

// Configuration
const API_URL = process.env.API_URL || 'https://api.radorderpad.com';

// Test data - using a unique email to ensure we create a new user
const testTrialUser = {
  email: `trial-user-${Date.now()}@example.com`,
  password: 'password123',
  firstName: 'New',
  lastName: 'TrialUser',
  specialty: 'Cardiology'
};

// Test the trial registration endpoint
async function testTrialRegistration() {
  console.log(chalk.blue('Testing trial registration endpoint...'));
  
  try {
    const response = await axios.post(
      `${API_URL}/api/auth/trial/register`,
      testTrialUser,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 201 && response.data.success) {
      console.log(chalk.green('Trial registration successful!'));
      console.log(`Status: ${response.status}`);
      console.log('Token:', response.data.token);
      return response.data.token;
    } else {
      console.log(chalk.yellow('Unexpected response:'));
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(chalk.red('Error registering trial user:'));
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
    return null;
  }
}

// Test the trial validation endpoint
async function testTrialValidation(token) {
  console.log(chalk.blue('Testing trial validation endpoint...'));
  
  try {
    const response = await axios.post(
      `${API_URL}/api/orders/validate/trial`,
      {
        dictationText: "Patient with chest pain, shortness of breath. History of hypertension. Please evaluate for possible coronary artery disease."
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.status === 200 && response.data.success) {
      console.log(chalk.green('Trial validation successful!'));
      console.log(`Status: ${response.status}`);
      console.log('Validation Result:', JSON.stringify(response.data.validationResult, null, 2));
      return true;
    } else {
      console.log(chalk.yellow('Unexpected response:'));
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('Error validating in trial mode:'));
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
    return false;
  }
}

// Run the tests
(async () => {
  try {
    console.log(chalk.blue('=== NEW TRIAL USER TEST ==='));
    console.log(`API URL: ${API_URL}`);
    console.log(`Test User Email: ${testTrialUser.email}`);
    
    // Step 1: Register a new trial user
    const token = await testTrialRegistration();
    if (!token) {
      console.log(chalk.red('Failed to get trial token. Aborting test.'));
      process.exit(1);
    }
    
    // Step 2: Test trial validation
    const validationSuccess = await testTrialValidation(token);
    if (!validationSuccess) {
      console.log(chalk.red('Trial validation test failed. Aborting test.'));
      process.exit(1);
    }
    
    console.log(chalk.green('All tests passed successfully!'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('Unexpected error:'), error);
    process.exit(1);
  }
})();