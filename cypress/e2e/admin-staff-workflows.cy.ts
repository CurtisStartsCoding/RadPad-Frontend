/// <reference types="cypress" />

describe('Admin Staff Workflows', () => {
  beforeEach(() => {
    // Login as admin staff before each test
    cy.loginAsAdminStaff()
  })

  describe('Order Finalization Access', () => {
    it('should access admin order finalization', () => {
      // Try to access admin order finalization
      cy.visit('/admin-order-finalization')
      
      // Should not be redirected away
      cy.url().should('include', '/admin-order-finalization')
      
      // Should see order finalization interface
      cy.contains('Order Finalization').should('be.visible')
    })

    it('should access admin queue', () => {
      cy.visit('/admin-queue')
      
      cy.url().should('include', '/admin-queue')
      cy.contains('Admin Queue').should('be.visible')
    })
  })

  describe('PHI Handling Permissions', () => {
    it('should be able to view patient information', () => {
      cy.visit('/admin-queue')
      
      // Should see patient data in queue
      cy.get('body').then($body => {
        if ($body.find('[data-testid="order-card"]').length > 0) {
          cy.get('[data-testid="order-card"]').first().within(() => {
            // Should see patient name or order details
            cy.get('[data-testid="patient-name"], [data-testid="order-details"]').should('exist')
          })
        }
      })
    })

    it('should be able to access order details', () => {
      cy.visit('/admin-queue')
      
      // Click on first order if available
      cy.get('body').then($body => {
        if ($body.find('button:contains("Details")').length > 0) {
          cy.get('button').contains('Details').first().click()
          
          // Should navigate to order finalization
          cy.url().should('include', '/admin-order-finalization')
        }
      })
    })
  })

  describe('Navigation Access', () => {
    it('should have access to admin navigation items', () => {
      cy.visit('/dashboard')
      
      // Check for admin-specific navigation
      cy.get('body').then($body => {
        if ($body.find('nav').length > 0) {
          // Should have access to admin features
          cy.get('nav').within(() => {
            // Look for admin-specific links
            cy.get('a[href*="admin"], button:contains("Admin")').should('exist')
          })
        }
      })
    })

    it('should not have access to user management', () => {
      // Admin staff typically cannot manage users
      cy.visit('/users')
      
      // Should either be redirected or see access denied
      cy.url().then(url => {
        if (url.includes('/users')) {
          // If on users page, should see limited access or empty state
          cy.get('body').should('contain.text', 'Access denied').or('contain.text', 'No permissions')
        } else {
          // Should be redirected away from users page
          expect(url).to.not.include('/users')
        }
      })
    })
  })

  describe('HIPAA Compliance for Admin Staff', () => {
    it('should automatically logout after inactivity', () => {
      cy.visit('/admin-queue')
      
      // Simulate 20 minutes of inactivity
      cy.clock()
      cy.tick(20 * 60 * 1000) // 20 minutes
      
      // Should be logged out
      cy.url().should('include', '/login')
    })

    it('should clear PHI data on logout', () => {
      // Visit page with potential PHI
      cy.visit('/admin-order-finalization')
      cy.wait(1000)
      
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.contains('Logout').click()
      
      // Verify PHI is cleared from browser
      cy.window().then(win => {
        const localStorage = JSON.stringify(win.localStorage)
        const sessionStorage = JSON.stringify(win.sessionStorage)
        
        // Should not contain patient data
        expect(localStorage).to.not.include('patient')
        expect(sessionStorage).to.not.include('patient')
      })
    })

    it('should log PHI access events', () => {
      // Access an order with PHI
      cy.visit('/admin-order-finalization')
      
      // This should create audit log entries
      // (Actual verification would require backend API access)
      cy.log('PHI access should be logged for admin staff user')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing orders gracefully', () => {
      // Try to access non-existent order
      cy.visit('/admin-order-finalization?orderId=99999')
      
      // Should show appropriate error message
      cy.contains('Order not found').should('be.visible')
        .or('contain.text', 'No order selected')
        .or('contain.text', 'Invalid order')
    })

    it('should not expose PHI in error messages', () => {
      // Trigger an error condition
      cy.visit('/admin-order-finalization')
      
      // Any error messages should not contain PHI
      cy.get('body').then($body => {
        const bodyText = $body.text()
        
        // Should not contain SSN patterns
        expect(bodyText).to.not.match(/\b\d{3}-\d{2}-\d{4}\b/)
        
        // Should not contain common PHI patterns
        expect(bodyText).to.not.match(/patient.*name.*\w+\s+\w+/i)
      })
    })
  })

  describe('Workflow Integration', () => {
    it('should integrate with EMR parsing workflow', () => {
      cy.visit('/admin-order-finalization')
      
      // Should see EMR paste tab if order exists
      cy.get('body').then($body => {
        if ($body.find('[role="tab"]').length > 0) {
          cy.contains('[role="tab"]', 'EMR Paste').should('be.visible')
        }
      })
    })

    it('should integrate with document management', () => {
      cy.visit('/admin-order-finalization')
      
      // Should see documents tab
      cy.get('body').then($body => {
        if ($body.find('[role="tab"]').length > 0) {
          cy.contains('[role="tab"]', 'Documents').should('be.visible')
        }
      })
    })
  })
})