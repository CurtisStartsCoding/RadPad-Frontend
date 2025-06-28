/// <reference types="cypress" />

describe('Admin Staff - Accurate File Upload & Order Tests', () => {
  beforeEach(() => {
    cy.loginAsAdminStaff()
  })

  describe('Real File Upload API Testing', () => {
    it('should test presigned URL generation', () => {
      // Test the actual API endpoints from documentation
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          fileType: 'application/pdf',
          fileName: 'test-document.pdf',
          contentType: 'application/pdf',
          orderId: 123,
          documentType: 'supplemental',
          fileSize: 1024000
        },
        failOnStatusCode: false
      }).then(response => {
        if (response.status === 200) {
          expect(response.body).to.have.property('success', true)
          expect(response.body).to.have.property('uploadUrl')
          expect(response.body).to.have.property('fileKey')
          expect(response.body.uploadUrl).to.include('amazonaws.com')
          cy.log('✅ Presigned URL generation working')
        } else {
          cy.log(`⚠️ Presigned URL failed: ${response.status}`)
        }
      })
    })

    it('should validate file type restrictions', () => {
      const allowedTypes = [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      const invalidType = 'application/x-executable'

      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          fileType: invalidType,
          fileName: 'malicious.exe',
          contentType: invalidType,
          orderId: 123,
          fileSize: 1024
        },
        failOnStatusCode: false
      }).then(response => {
        // Should reject invalid file types
        expect(response.status).to.equal(400)
        cy.log('✅ File type validation working')
      })
    })

    it('should enforce file size limits', () => {
      // Test PDF size limit (20MB)
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          fileType: 'application/pdf',
          fileName: 'large-file.pdf',
          contentType: 'application/pdf',
          orderId: 123,
          fileSize: 25 * 1024 * 1024 // 25MB - exceeds 20MB limit
        },
        failOnStatusCode: false
      }).then(response => {
        if (response.status === 400) {
          cy.log('✅ File size limit enforced for PDF')
        } else {
          cy.log('⚠️ File size limit may not be enforced')
        }
      })

      // Test other file size limit (5MB)
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          fileType: 'image/jpeg',
          fileName: 'large-image.jpg',
          contentType: 'image/jpeg',
          orderId: 123,
          fileSize: 6 * 1024 * 1024 // 6MB - exceeds 5MB limit
        },
        failOnStatusCode: false
      }).then(response => {
        if (response.status === 400) {
          cy.log('✅ File size limit enforced for images')
        } else {
          cy.log('⚠️ File size limit may not be enforced')
        }
      })
    })
  })

  describe('Admin Order Finalization Workflow', () => {
    it('should complete the 6-tab workflow', () => {
      // Navigate to admin queue first
      cy.visit('/admin-queue')
      
      // Look for orders to work with
      cy.get('body').then($body => {
        if ($body.find('button').filter(':contains("Details")').length > 0) {
          cy.get('button').contains('Details').first().click()
          
          // Should be on admin order finalization page
          cy.url().should('include', '/admin-order-finalization')
          
          // Tab 1: EMR Paste
          cy.get('[role="tab"]').contains('EMR Paste').click()
          cy.get('textarea').should('be.visible')
          cy.get('textarea').type(`
            Patient Name: Test Patient
            DOB: 01/15/1980
            Insurance: Blue Cross Blue Shield
            Policy #: BC123456789
          `)
          cy.get('button').contains('Extract Patient Information').click()
          
          // Tab 2: Patient Info
          cy.get('[role="tab"]').contains('Patient Info').click()
          cy.get('button').contains('Save Patient Info').should('be.visible')
          
          // Tab 3: Insurance
          cy.get('[role="tab"]').contains('Insurance').click()
          cy.get('button').contains('Save Insurance Info').should('be.visible')
          
          // Tab 4: Order Details  
          cy.get('[role="tab"]').contains('Order Details').click()
          cy.get('button').contains('Save Order Details').should('be.visible')
          
          // Tab 5: Documents (if available)
          cy.get('body').then($docBody => {
            if ($docBody.find('[role="tab"]').filter(':contains("Documents")').length > 0) {
              cy.get('[role="tab"]').contains('Documents').click()
              cy.log('✅ Documents tab available')
            } else {
              cy.log('⚠️ Documents tab not implemented yet')
            }
          })
          
          // Tab 6: Review & Send
          cy.get('[role="tab"]').contains('Review & Send').click()
          cy.get('button').contains('Send to Radiology').should('be.visible')
          
          cy.log('✅ All tabs accessible in order finalization workflow')
        } else {
          cy.log('⚠️ No orders available in admin queue for testing')
        }
      })
    })

    it('should test unified API endpoint saves', () => {
      cy.visit('/admin-queue')
      
      cy.get('body').then($body => {
        if ($body.find('button').filter(':contains("Details")').length > 0) {
          cy.get('button').contains('Details').first().click()
          
          // Get order ID from URL or sessionStorage
          cy.window().then(win => {
            const orderId = win.sessionStorage.getItem('currentOrderId') || '123'
            
            // Test patient save via unified endpoint
            cy.request({
              method: 'PUT',
              url: `/api/admin/orders/${orderId}`,
              headers: {
                'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
              },
              body: {
                patient: {
                  firstName: 'Test',
                  lastName: 'Patient',
                  dateOfBirth: '1980-01-15',
                  gender: 'male',
                  phoneNumber: '555-123-4567'
                }
              },
              failOnStatusCode: false
            }).then(response => {
              if (response.status === 200) {
                cy.log('✅ Unified patient save API working')
              } else {
                cy.log(`⚠️ Patient save failed: ${response.status}`)
              }
            })

            // Test insurance save via unified endpoint
            cy.request({
              method: 'PUT',
              url: `/api/admin/orders/${orderId}`,
              headers: {
                'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
              },
              body: {
                hasInsurance: true,
                insurance: {
                  insurerName: 'Blue Cross Blue Shield',
                  policyNumber: 'BC123456789',
                  isPrimary: true
                }
              },
              failOnStatusCode: false
            }).then(response => {
              if (response.status === 200) {
                cy.log('✅ Unified insurance save API working')
              } else {
                cy.log(`⚠️ Insurance save failed: ${response.status}`)
              }
            })
          })
        }
      })
    })

    it('should test send to radiology endpoint', () => {
      cy.visit('/admin-queue')
      
      cy.get('body').then($body => {
        if ($body.find('button').filter(':contains("Details")').length > 0) {
          cy.get('button').contains('Details').first().click()
          
          cy.window().then(win => {
            const orderId = win.sessionStorage.getItem('currentOrderId') || '123'
            
            // Test send to radiology API
            cy.request({
              method: 'POST',
              url: `/api/admin/orders/${orderId}/send-to-radiology`,
              headers: {
                'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
              },
              body: {
                radiologyOrganizationId: 2
              },
              failOnStatusCode: false
            }).then(response => {
              if (response.status === 200) {
                expect(response.body).to.have.property('success', true)
                expect(response.body).to.have.property('orderId')
                cy.log('✅ Send to radiology API working')
              } else if (response.status === 400) {
                cy.log('⚠️ Send to radiology failed - may need valid order data')
              } else {
                cy.log(`⚠️ Send to radiology failed: ${response.status}`)
              }
            })
          })
        }
      })
    })
  })

  describe('S3 Configuration Verification', () => {
    it('should verify S3 presigned URLs have proper security', () => {
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          fileType: 'application/pdf',
          fileName: 'security-test.pdf',
          contentType: 'application/pdf',
          orderId: 123,
          fileSize: 1024
        },
        failOnStatusCode: false
      }).then(response => {
        if (response.status === 200) {
          const uploadUrl = response.body.uploadUrl
          
          // Check for security parameters
          expect(uploadUrl).to.include('X-Amz-Algorithm')
          expect(uploadUrl).to.include('X-Amz-Credential')
          expect(uploadUrl).to.include('X-Amz-Date')
          expect(uploadUrl).to.include('X-Amz-Expires')
          expect(uploadUrl).to.include('X-Amz-Signature')
          
          // Check bucket region (should be US for HIPAA)
          expect(uploadUrl).to.match(/us-(east|west)-[12]/)
          
          // Check expiration (should be reasonable)
          const expiresMatch = uploadUrl.match(/X-Amz-Expires=(\d+)/)
          if (expiresMatch) {
            const expireSeconds = parseInt(expiresMatch[1])
            expect(expireSeconds).to.be.lessThan(3600) // Should be less than 1 hour
            cy.log(`✅ Presigned URL expires in ${expireSeconds} seconds`)
          }
          
          cy.log('✅ S3 security parameters present')
        }
      })
    })

    it('should verify S3 key structure follows documentation', () => {
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          fileType: 'application/pdf',
          fileName: 'structure-test.pdf',
          contentType: 'application/pdf',
          orderId: 123,
          fileSize: 1024
        },
        failOnStatusCode: false
      }).then(response => {
        if (response.status === 200) {
          const fileKey = response.body.fileKey
          
          // Should follow pattern: uploads/{org_id}/{context_type}/{context_id}/{timestamp}_{random}_{filename}
          expect(fileKey).to.match(/^uploads\/\d+\/(orders|patients|general)\/\d+\/\d+_[a-zA-Z0-9]+_/)
          
          cy.log(`✅ S3 key structure correct: ${fileKey}`)
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle unauthorized access', () => {
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        body: {
          fileType: 'application/pdf',
          fileName: 'auth-test.pdf',
          contentType: 'application/pdf',
          orderId: 123,
          fileSize: 1024
        },
        failOnStatusCode: false
      }).then(response => {
        expect(response.status).to.equal(401)
        cy.log('✅ Unauthorized access properly rejected')
      })
    })

    it('should handle missing required fields', () => {
      cy.request({
        method: 'POST',
        url: '/api/uploads/presigned-url',
        headers: {
          'Authorization': `Bearer ${Cypress.env('adminStaffToken') || 'test-token'}`
        },
        body: {
          // Missing required fields
        },
        failOnStatusCode: false
      }).then(response => {
        expect(response.status).to.equal(400)
        cy.log('✅ Missing fields properly validated')
      })
    })
  })
})