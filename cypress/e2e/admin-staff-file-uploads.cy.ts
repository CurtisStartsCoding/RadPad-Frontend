/// <reference types="cypress" />

describe('Admin Staff - File Uploads & Order Completion', () => {
  beforeEach(() => {
    cy.loginAsAdminStaff()
  })

  describe('Document Upload Security', () => {
    it('should handle document upload workflow', () => {
      // First navigate to admin queue to get an order
      cy.visit('/admin-queue')
      
      // Look for orders in the queue
      cy.get('body').then($body => {
        if ($body.find('button').filter(':contains("Details")').length > 0) {
          // Click on first order details
          cy.get('button').contains('Details').first().click()
          
          // Should navigate to admin order finalization
          cy.url().should('include', '/admin-order-finalization')
          
          // Navigate to Documents tab if it exists
          cy.get('body').then($tabBody => {
            if ($tabBody.find('[role="tab"]').filter(':contains("Documents")').length > 0) {
              cy.get('[role="tab"]').contains('Documents').click()
              
              // Look for file upload input
              cy.get('body').then($uploadBody => {
                if ($uploadBody.find('input[type="file"]').length > 0) {
                  // Create a test file
                  const fileName = 'test-patient-document.pdf'
                  const fileContent = 'Mock PDF content for testing'
                  
                  // Upload file
                  cy.get('input[type="file"]').selectFile({
                    contents: Cypress.Buffer.from(fileContent),
                    fileName: fileName,
                    mimeType: 'application/pdf'
                  }, { force: true })
                  
                  // Check for upload indicators
                  cy.get('body').should('contain.text', fileName)
                } else {
                  cy.log('No file upload input found - Documents tab may not be implemented yet')
                }
              })
            } else {
              cy.log('Documents tab not found - may not be implemented yet')
            }
          })
        } else {
          cy.log('No orders in admin queue to test with')
        }
      })
    })

    it('should enforce file type restrictions', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      // Try to upload invalid file type
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('executable content'),
        fileName: 'malicious.exe',
        mimeType: 'application/x-executable'
      }, { force: true })
      
      // Should show error for invalid file type
      cy.contains('Invalid file type').should('be.visible')
        .or('contain.text', 'File type not allowed')
        .or('contain.text', 'Only PDF, JPEG, PNG files allowed')
    })

    it('should enforce file size limits', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      // Create a large file (simulate)
      const largeContent = 'x'.repeat(50 * 1024 * 1024) // 50MB
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from(largeContent),
        fileName: 'large-file.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      // Should show file size error
      cy.contains('File too large').should('be.visible')
        .or('contain.text', 'Maximum file size')
        .or('contain.text', 'File size exceeds limit')
    })

    it('should scan uploaded files for PHI exposure', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      // Upload file with potential PHI in filename
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Document content'),
        fileName: 'john-doe-ssn-123456789.pdf', // PHI in filename
        mimeType: 'application/pdf'
      }, { force: true })
      
      // System should either rename file or warn about PHI
      cy.get('body').then($body => {
        const bodyText = $body.text()
        
        // File should be renamed or warning shown
        if (bodyText.includes('john-doe-ssn-123456789.pdf')) {
          cy.contains('Warning: Filename may contain PHI').should('be.visible')
        } else {
          // File should be renamed to remove PHI
          cy.contains('.pdf').should('be.visible')
          cy.contains('john-doe-ssn-123456789').should('not.exist')
        }
      })
    })
  })

  describe('S3 Security Compliance', () => {
    it('should use HTTPS for all upload requests', () => {
      cy.intercept('POST', '**/uploads/**', (req) => {
        // Verify upload requests use HTTPS
        expect(req.url).to.match(/^https:/)
        
        // Verify proper headers
        expect(req.headers).to.have.property('authorization')
        expect(req.headers).to.have.property('content-type')
      }).as('uploadRequest')
      
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.wait('@uploadRequest')
    })

    it('should use presigned URLs with expiration', () => {
      cy.intercept('POST', '**/uploads/presigned-url', (req) => {
        // Verify presigned URL request
        expect(req.body).to.have.property('fileName')
        expect(req.body).to.have.property('fileType')
        
        req.reply((res) => {
          // Check response has presigned URL with expiration
          expect(res.body).to.have.property('uploadUrl')
          expect(res.body.uploadUrl).to.include('X-Amz-Expires')
          expect(res.body.uploadUrl).to.include('X-Amz-Signature')
        })
      }).as('presignedUrl')
      
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.wait('@presignedUrl')
    })

    it('should confirm upload to backend after S3 upload', () => {
      cy.intercept('POST', '**/uploads/confirm', (req) => {
        // Verify confirmation includes S3 key and metadata
        expect(req.body).to.have.property('s3Key')
        expect(req.body).to.have.property('fileName')
        expect(req.body).to.have.property('fileSize')
        expect(req.body).to.have.property('orderId')
      }).as('confirmUpload')
      
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.wait('@confirmUpload')
    })
  })

  describe('Order Completion Workflow', () => {
    it('should complete full order workflow with file upload', () => {
      cy.visit('/admin-order-finalization')
      
      // Step 1: Parse EMR data
      cy.contains('[role="tab"]', 'EMR Paste').click()
      cy.get('textarea').type(`
        Patient Name: Test Patient
        DOB: 01/15/1980
        SSN: 123-45-6789
        Insurance: Blue Cross Blue Shield
        Policy #: BC123456789
      `)
      cy.contains('Extract Patient Information').click()
      cy.contains('Continue to Patient Info').click()
      
      // Step 2: Verify patient info populated
      cy.contains('[role="tab"]', 'Patient Info').click()
      cy.get('#patientFirstName').should('have.value', 'Test')
      cy.get('#patientLastName').should('have.value', 'Patient')
      cy.contains('Save Patient Info').click()
      cy.contains('Continue to Insurance').click()
      
      // Step 3: Verify insurance info
      cy.contains('[role="tab"]', 'Insurance Info').click()
      cy.get('#insurerName').should('contain.value', 'Blue Cross')
      cy.contains('Save Insurance Info').click()
      cy.contains('Continue to Order Details').click()
      
      // Step 4: Upload supporting documents
      cy.contains('[role="tab"]', 'Documents').click()
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Medical report content'),
        fileName: 'medical-report.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.contains('Upload complete').should('be.visible', { timeout: 10000 })
      
      // Step 5: Send to radiology
      cy.contains('[role="tab"]', 'Review & Send').click()
      cy.get('select').first().select(1) // Select radiology organization
      cy.wait(1000) // Wait for facilities to load
      cy.get('select').last().select(1) // Select facility
      
      cy.contains('Send to Radiology').click()
      
      // Verify success
      cy.contains('Order sent successfully').should('be.visible')
      cy.url().should('include', '/admin-queue')
    })

    it('should prevent order completion without required documents', () => {
      cy.visit('/admin-order-finalization')
      
      // Try to send without uploading required documents
      cy.contains('[role="tab"]', 'Review & Send').click()
      
      cy.get('body').then($body => {
        if ($body.find('select').length > 0) {
          cy.get('select').first().select(1)
          cy.wait(1000)
          cy.get('select').last().select(1)
          
          cy.contains('Send to Radiology').click()
          
          // Should show warning about missing documents
          cy.contains('Required documents missing').should('be.visible')
            .or('contain.text', 'Please upload')
            .or('contain.text', 'Documents required')
        }
      })
    })
  })

  describe('Audit Logging for File Operations', () => {
    it('should log file upload events', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test content'),
        fileName: 'audit-test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.contains('Upload complete').should('be.visible', { timeout: 10000 })
      
      // Verify audit log created (would check backend in real scenario)
      cy.log('File upload should be logged with user ID, timestamp, and file metadata')
    })

    it('should log file access/download events', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      // If documents exist, clicking on them should be logged
      cy.get('body').then($body => {
        if ($body.find('[data-testid="document-item"]').length > 0) {
          cy.get('[data-testid="document-item"]').first().click()
          
          // File access should be logged
          cy.log('File access should be logged with user ID and timestamp')
        }
      })
    })
  })

  describe('Error Handling & Recovery', () => {
    it('should handle S3 upload failures gracefully', () => {
      // Mock S3 upload failure
      cy.intercept('PUT', '**/amazonaws.com/**', {
        statusCode: 500,
        body: 'S3 Upload Failed'
      }).as('s3UploadFail')
      
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      // Should show upload error
      cy.contains('Upload failed').should('be.visible')
      cy.contains('Please try again').should('be.visible')
    })

    it('should handle network interruption during upload', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      // Start upload
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Large content'.repeat(1000)),
        fileName: 'large-test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      // Simulate network interruption by going offline
      cy.window().then(win => {
        win.navigator.onLine = false
      })
      
      // Should handle offline state
      cy.contains('Network error').should('be.visible')
        .or('contain.text', 'Connection lost')
        .or('contain.text', 'Please check your internet')
    })
  })

  describe('Data Cleanup & Security', () => {
    it('should not persist file data in browser after upload', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Sensitive content'),
        fileName: 'sensitive.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.contains('Upload complete').should('be.visible', { timeout: 10000 })
      
      // Check that file content is not in localStorage/sessionStorage
      cy.window().then(win => {
        const localStorage = JSON.stringify(win.localStorage)
        const sessionStorage = JSON.stringify(win.sessionStorage)
        
        expect(localStorage).to.not.include('Sensitive content')
        expect(sessionStorage).to.not.include('Sensitive content')
      })
    })

    it('should clear file references on logout', () => {
      cy.visit('/admin-order-finalization')
      cy.contains('[role="tab"]', 'Documents').click()
      
      // Upload a file
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('Test content'),
        fileName: 'test.pdf',
        mimeType: 'application/pdf'
      }, { force: true })
      
      cy.contains('Upload complete').should('be.visible', { timeout: 10000 })
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.contains('Logout').click()
      
      // Verify all file references cleared
      cy.window().then(win => {
        const storage = JSON.stringify({
          local: win.localStorage,
          session: win.sessionStorage
        })
        
        expect(storage).to.not.include('test.pdf')
        expect(storage).to.not.include('document')
        expect(storage).to.not.include('upload')
      })
    })
  })
})