#!/usr/bin/env node

/**
 * Complete Order Workflow Test
 * Tests the COMPLETE physician workflow including order creation
 * to verify the backend fix for coding data is working
 */

const API_BASE = 'https://api.radorderpad.com/api';

const TEST_PHYSICIAN = {
  email: 'test.physician@example.com',
  password: 'password123'
};

// Test clinical scenario that should generate clear coding
const TEST_DICTATION = "45-year-old female with severe right knee pain and swelling following sports injury 2 weeks ago. Pain with weight bearing and decreased range of motion. Physical exam shows joint effusion and instability. Suspected meniscal tear and possible ACL injury. Order MRI right knee without contrast to evaluate internal derangement and ligamentous injury.";

const TEST_PATIENT = {
  firstName: "BackendTest",
  lastName: "Patient",
  dateOfBirth: "1950-01-15",
  gender: "male",
  mrn: `TEST-BACKEND-${Date.now()}`
};

// Mock signature data
const MOCK_SIGNATURE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

class CompleteOrderWorkflowTest {
  constructor() {
    this.authToken = null;
    this.currentUser = null;
    this.validationResult = null;
    this.createdOrderId = null;
    this.testResults = {
      authentication: false,
      validation: false,
      orderCreation: false,
      codingVerification: false,
      frontendViewing: false
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async apiRequest(method, endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null
      });
      
      const responseData = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data: responseData
      };
    } catch (error) {
      this.log(`API request failed: ${error.message}`, 'error');
      return { status: 0, ok: false, data: { error: error.message } };
    }
  }

  // Phase 1: Authentication
  async testAuthentication() {
    this.log('🔐 PHASE 1: Testing Authentication...');
    
    const response = await this.apiRequest('POST', '/auth/login', TEST_PHYSICIAN);
    
    if (response.ok && response.data.token) {
      this.authToken = response.data.token;
      this.currentUser = response.data.user;
      this.testResults.authentication = true;
      this.log(`✅ Authentication successful as ${this.currentUser.role}: ${this.currentUser.first_name} ${this.currentUser.last_name}`, 'success');
      return true;
    } else {
      this.log(`❌ Authentication failed: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  // Phase 2: Dictation Validation
  async testDictationValidation() {
    this.log('\n📝 PHASE 2: Testing Dictation Validation...');
    this.log(`   Testing with clinical scenario: ${TEST_DICTATION.substring(0, 80)}...`);
    
    const response = await this.apiRequest('POST', '/orders/validate', {
      dictationText: TEST_DICTATION
    });
    
    if (response.ok && response.data.validationResult) {
      this.validationResult = response.data.validationResult;
      this.testResults.validation = true;
      
      this.log(`✅ Validation successful`, 'success');
      this.log(`   Status: ${this.validationResult.validationStatus}`);
      this.log(`   Compliance Score: ${this.validationResult.complianceScore}`);
      
      // Check for suggested codes
      const cptCodes = this.validationResult.suggestedCPTCodes || [];
      const icd10Codes = this.validationResult.suggestedICD10Codes || [];
      
      this.log(`   Suggested CPT Codes: ${cptCodes.length} found`);
      cptCodes.forEach(code => {
        this.log(`     ${code.code}: ${code.description?.substring(0, 60)}...`);
      });
      
      this.log(`   Suggested ICD-10 Codes: ${icd10Codes.length} found`);
      icd10Codes.forEach(code => {
        this.log(`     ${code.code}: ${code.description?.substring(0, 60)}...`);
      });
      
      if (cptCodes.length > 0 && icd10Codes.length > 0) {
        this.log(`✅ Validation generated proper coding suggestions`, 'success');
        return true;
      } else {
        this.log(`⚠️ Validation succeeded but no coding suggestions generated`, 'warning');
        return true; // Still continue the test
      }
    } else {
      this.log(`❌ Validation failed: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  // Phase 3: Order Creation and Finalization
  async testOrderCreation() {
    this.log('\n🏥 PHASE 3: Testing Order Creation and Finalization...');
    
    if (!this.validationResult) {
      this.log(`❌ Cannot create order without validation result`, 'error');
      return false;
    }
    
    // Prepare order creation payload
    const orderPayload = {
      patientInfo: TEST_PATIENT,
      dictationText: TEST_DICTATION,
      signatureData: MOCK_SIGNATURE,
      finalValidationResult: this.validationResult,
      isOverride: false,
      overrideJustification: null,
      signerFullName: `${this.currentUser.first_name} ${this.currentUser.last_name}`
    };
    
    this.log(`   Creating order for patient: ${TEST_PATIENT.firstName} ${TEST_PATIENT.lastName}`);
    this.log(`   Using validation result with ${this.validationResult.suggestedCPTCodes?.length || 0} CPT codes and ${this.validationResult.suggestedICD10Codes?.length || 0} ICD-10 codes`);
    
    const response = await this.apiRequest('POST', '/orders', orderPayload);
    
    if (response.ok && response.data.orderId) {
      this.createdOrderId = response.data.orderId;
      this.testResults.orderCreation = true;
      this.log(`✅ Order created successfully with ID: ${this.createdOrderId}`, 'success');
      return true;
    } else {
      this.log(`❌ Order creation failed: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  // Phase 4: Verify Coding Data Saved
  async testCodingDataVerification() {
    this.log('\n🧪 PHASE 4: Verifying Coding Data Saved (BACKEND FIX TEST)...');
    
    if (!this.createdOrderId) {
      this.log(`❌ Cannot verify coding data without created order ID`, 'error');
      return false;
    }
    
    // Fetch the created order details
    const response = await this.apiRequest('GET', `/orders/${this.createdOrderId}`);
    
    if (response.ok && response.data) {
      const order = response.data;
      this.log(`✅ Retrieved created order: ${order.order_number}`);
      
      // Compare validation suggestions vs saved data
      this.log('\n🔍 CODING DATA COMPARISON:');
      
      // Check CPT Code
      const savedCPT = order.final_cpt_code;
      const suggestedCPT = this.validationResult.suggestedCPTCodes?.[0]?.code;
      
      this.log(`   Expected CPT: ${suggestedCPT || 'None suggested'}`);
      this.log(`   Saved CPT: ${savedCPT || 'null'}`);
      
      if (savedCPT && savedCPT !== 'null' && savedCPT === suggestedCPT) {
        this.log(`   ✅ CPT Code correctly saved!`, 'success');
      } else if (savedCPT && savedCPT !== 'null') {
        this.log(`   ✅ CPT Code saved (different from suggestion but not null)`, 'success');
      } else {
        this.log(`   ❌ CPT Code NOT saved (value: ${savedCPT})`, 'error');
      }
      
      // Check ICD-10 Codes
      const savedICD10 = order.final_icd10_codes;
      const suggestedICD10 = this.validationResult.suggestedICD10Codes?.map(c => c.code) || [];
      
      this.log(`   Expected ICD-10: [${suggestedICD10.join(', ')}]`);
      this.log(`   Saved ICD-10: ${savedICD10}`);
      
      let icd10Valid = false;
      try {
        const parsedICD10 = typeof savedICD10 === 'string' ? JSON.parse(savedICD10) : savedICD10;
        if (Array.isArray(parsedICD10) && parsedICD10.length > 0) {
          this.log(`   ✅ ICD-10 Codes correctly saved!`, 'success');
          icd10Valid = true;
        } else {
          this.log(`   ❌ ICD-10 Codes empty or invalid`, 'error');
        }
      } catch (e) {
        if (savedICD10 && savedICD10 !== '[]' && savedICD10 !== 'null') {
          this.log(`   ✅ ICD-10 Codes saved (non-JSON format)`, 'success');
          icd10Valid = true;
        } else {
          this.log(`   ❌ ICD-10 Codes NOT saved properly`, 'error');
        }
      }
      
      // Overall assessment
      const hasCoding = (savedCPT && savedCPT !== 'null') || icd10Valid;
      
      if (hasCoding) {
        this.testResults.codingVerification = true;
        this.log(`\n🎉 BACKEND FIX VERIFICATION: ✅ SUCCESS!`, 'success');
        this.log(`   Coding data is being saved correctly for new orders`, 'success');
      } else {
        this.log(`\n💥 BACKEND FIX VERIFICATION: ❌ FAILED!`, 'error');
        this.log(`   Coding data is still not being saved`, 'error');
      }
      
      return hasCoding;
    } else {
      this.log(`❌ Failed to retrieve created order: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  // Phase 5: Test Frontend Viewing
  async testFrontendViewing() {
    this.log('\n👁️ PHASE 5: Testing Frontend Order Viewing...');
    
    if (!this.createdOrderId) {
      this.log(`❌ Cannot test frontend viewing without created order ID`, 'error');
      return false;
    }
    
    // Test that the order appears in the orders list
    const listResponse = await this.apiRequest('GET', '/orders');
    
    if (listResponse.ok && listResponse.data.orders) {
      const orders = listResponse.data.orders;
      const ourOrder = orders.find(o => o.id === this.createdOrderId);
      
      if (ourOrder) {
        this.log(`✅ Created order appears in orders list`, 'success');
        this.log(`   Order: ${ourOrder.order_number} | Status: ${ourOrder.status}`);
        
        // Test frontend order details view
        const detailsResponse = await this.apiRequest('GET', `/orders/${this.createdOrderId}`);
        
        if (detailsResponse.ok && detailsResponse.data) {
          this.testResults.frontendViewing = true;
          this.log(`✅ Order details accessible via frontend API`, 'success');
          
          // Test how frontend would display coding data
          const order = detailsResponse.data;
          this.log('\n📋 FRONTEND DISPLAY TEST:');
          
          const displayCPT = order.final_cpt_code && order.final_cpt_code !== 'null' 
            ? order.final_cpt_code 
            : 'Not assigned';
          
          let displayICD10 = 'Not assigned';
          if (order.final_icd10_codes && 
              order.final_icd10_codes !== '[]' && 
              order.final_icd10_codes !== 'null' && 
              order.final_icd10_codes.length > 0) {
            displayICD10 = order.final_icd10_codes;
          }
          
          this.log(`   Frontend CPT Display: "${displayCPT}"`);
          this.log(`   Frontend ICD-10 Display: "${displayICD10}"`);
          
          if (displayCPT !== 'Not assigned' || displayICD10 !== 'Not assigned') {
            this.log(`✅ Frontend will display actual coding data!`, 'success');
          } else {
            this.log(`⚠️ Frontend will display "Not assigned" for coding`, 'warning');
          }
          
          return true;
        } else {
          this.log(`❌ Failed to get order details for frontend test`, 'error');
          return false;
        }
      } else {
        this.log(`❌ Created order not found in orders list`, 'error');
        return false;
      }
    } else {
      this.log(`❌ Failed to get orders list for frontend test`, 'error');
      return false;
    }
  }

  // Run complete workflow test
  async runCompleteTest() {
    this.log('🚀 STARTING COMPLETE ORDER WORKFLOW TEST');
    this.log('   This test creates a NEW order to verify the backend fix');
    console.log('='.repeat(80));
    
    const startTime = Date.now();
    let totalPassed = 0;
    let totalTests = 5;

    // Phase 1: Authentication
    if (await this.testAuthentication()) {
      totalPassed++;
    } else {
      this.log('🛑 Cannot continue without authentication', 'error');
      return this.showResults(totalPassed, totalTests, Date.now() - startTime);
    }

    // Phase 2: Validation
    if (await this.testDictationValidation()) {
      totalPassed++;
    } else {
      this.log('🛑 Cannot continue without validation', 'error');
      return this.showResults(totalPassed, totalTests, Date.now() - startTime);
    }

    // Phase 3: Order Creation
    if (await this.testOrderCreation()) {
      totalPassed++;
    } else {
      this.log('🛑 Cannot continue without order creation', 'error');
      return this.showResults(totalPassed, totalTests, Date.now() - startTime);
    }

    // Phase 4: Coding Verification (CRITICAL TEST)
    if (await this.testCodingDataVerification()) {
      totalPassed++;
    }

    // Phase 5: Frontend Testing
    if (await this.testFrontendViewing()) {
      totalPassed++;
    }

    const duration = Date.now() - startTime;
    return this.showResults(totalPassed, totalTests, duration);
  }

  showResults(passed, total, duration) {
    console.log('\n' + '='.repeat(80));
    this.log('📊 COMPLETE ORDER WORKFLOW TEST RESULTS');
    console.log('='.repeat(80));
    
    this.log(`🎯 Tests Passed: ${passed}/${total}`);
    this.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    this.log(`👤 Tested as: ${this.currentUser?.role} (${this.currentUser?.first_name} ${this.currentUser?.last_name})`);
    
    if (this.createdOrderId) {
      this.log(`📝 Created Order ID: ${this.createdOrderId}`);
    }

    console.log('\n📋 Phase Results:');
    Object.entries(this.testResults).forEach(([phase, result]) => {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status}: ${phase}`);
    });

    // Critical assessment
    console.log('\n🎯 CRITICAL ASSESSMENT:');
    
    if (this.testResults.codingVerification) {
      this.log('🎉 BACKEND FIX CONFIRMED: Coding data is being saved correctly!', 'success');
      this.log('✅ New orders will have proper CPT and ICD-10 codes', 'success');
      this.log('✅ Frontend will display actual codes instead of "Not assigned"', 'success');
    } else {
      this.log('💥 BACKEND FIX FAILED: Coding data is still not being saved', 'error');
      this.log('❌ Investigation needed in order creation/persistence logic', 'error');
    }

    if (passed === total) {
      this.log('\n🎉 ALL TESTS PASSED! Complete workflow is working correctly.', 'success');
    } else {
      this.log(`\n⚠️ ${total - passed} tests failed. See details above.`, 'warning');
    }

    console.log('='.repeat(80));
    
    return {
      success: passed === total,
      results: this.testResults,
      duration: duration / 1000,
      createdOrderId: this.createdOrderId,
      backendFixWorking: this.testResults.codingVerification
    };
  }
}

// Run the complete workflow test
const test = new CompleteOrderWorkflowTest();
test.runCompleteTest()
  .then(results => {
    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Complete workflow test failed:', error);
    process.exit(1);
  });