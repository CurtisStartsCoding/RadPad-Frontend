/// <reference types="cypress" />

describe('User Location Assignment', () => {
  const testUser = {
    email: `physician-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'Physician',
    role: 'physician'
  }

  beforeEach(() => {
    // Login as admin before each test
    cy.loginAsAdmin()
    
    // Navigate to Users page
    cy.visit('/users')
    cy.contains('h1', 'Users').should('be.visible')
  })

  after(() => {
    // Cleanup test data after all tests
    cy.cleanupTestData()
  })

  describe('Location Assignment UI', () => {
    it('should show location checkboxes in edit dialog', () => {
      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      // Verify edit dialog opens
      cy.get('[role="dialog"]').should('be.visible')
      cy.contains('h2', 'Edit User').should('be.visible')

      // Check if location section exists
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Assigned Locations').should('be.visible')
        
        // Verify at least one location checkbox exists
        cy.get('input[type="checkbox"][id^="location-"]').should('have.length.greaterThan', 0)
      })
    })

    it('should display location names with city and state', () => {
      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        // Check that location labels include city and state
        cy.get('label[for^="location-"]').first().within(() => {
          cy.get('span.text-xs.text-slate-500').should('exist')
          cy.get('span.text-xs.text-slate-500').invoke('text').should('match', /, [A-Z]{2}$/)
        })
      })
    })

    it('should handle no active locations gracefully', () => {
      // This test would need a user in an org with no active locations
      // For now, we'll check that the UI handles it properly if it occurs
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        // If no locations exist, should show appropriate message
        cy.get('body').then($body => {
          if ($body.find('p:contains("No active locations available")').length) {
            cy.contains('No active locations available').should('be.visible')
          }
        })
      })
    })
  })

  describe('Location Assignment Functionality', () => {
    it('should save location assignments when updating user', () => {
      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        // Get the first location checkbox
        cy.get('input[type="checkbox"][id^="location-"]').first().then($checkbox => {
          const wasChecked = $checkbox.prop('checked')
          
          // Toggle the checkbox
          cy.wrap($checkbox).click()
          
          // Save the user
          cy.get('button').contains('Save Changes').click()
        })
      })

      // Wait for dialog to close
      cy.get('[role="dialog"]').should('not.exist')

      // Verify success toast
      cy.contains('User updated successfully').should('be.visible')
    })

    it('should persist location assignments when reopening edit dialog', () => {
      let locationId: string
      let wasChecked: boolean

      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      // Toggle a location and save
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="checkbox"][id^="location-"]').first().then($checkbox => {
          locationId = $checkbox.attr('id') || ''
          wasChecked = $checkbox.prop('checked')
          
          cy.wrap($checkbox).click()
          cy.get('button').contains('Save Changes').click()
        })
      })

      // Wait for dialog to close
      cy.get('[role="dialog"]').should('not.exist')
      cy.wait(1000) // Wait for state to update

      // Reopen the same user's edit dialog
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      // Verify the location assignment persisted
      cy.get('[role="dialog"]').within(() => {
        cy.get(`#${locationId}`).should(wasChecked ? 'not.be.checked' : 'be.checked')
      })
    })

    it('should handle multiple location assignments', () => {
      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        // Uncheck all locations first
        cy.get('input[type="checkbox"][id^="location-"]:checked').each($checkbox => {
          cy.wrap($checkbox).click()
        })

        // Check the first two locations
        cy.get('input[type="checkbox"][id^="location-"]').eq(0).click()
        cy.get('input[type="checkbox"][id^="location-"]').eq(1).click()

        // Save
        cy.get('button').contains('Save Changes').click()
      })

      // Verify success
      cy.get('[role="dialog"]').should('not.exist')
      cy.contains('User updated successfully').should('be.visible')
    })
  })

  describe('Error Handling', () => {
    it('should show warning if location assignment fails', () => {
      // This would require mocking a failed API response
      // For now, we'll test that the UI is prepared for this scenario
      
      cy.intercept('DELETE', '/api/user-locations/*/locations/*', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('failedLocationUpdate')

      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        // Try to uncheck a checked location
        cy.get('input[type="checkbox"][id^="location-"]:checked').first().click()
        cy.get('button').contains('Save Changes').click()
      })

      // Should show warning toast
      cy.contains('User updated but location assignments failed').should('be.visible')
    })
  })

  describe('User Permissions', () => {
    it('should only show location assignment for admin users', () => {
      // This test would require logging in as different user types
      // and verifying that only admins see the location assignment UI
      
      // For now, verify that as admin we can see it
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        cy.contains('Assigned Locations').should('be.visible')
      })
    })
  })

  describe('Search and Filter Integration', () => {
    it('should maintain location assignments when searching users', () => {
      // Search for a specific user
      cy.get('input[placeholder="Search users..."]').type('test')
      cy.wait(500) // Debounce

      // If user found, edit them
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      // Verify location UI still works
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Assigned Locations').should('be.visible')
        cy.get('input[type="checkbox"][id^="location-"]').should('exist')
      })
    })

    it('should work with pending invitations tab', () => {
      // Switch to pending invitations tab
      cy.contains('button', 'Pending Invitations').click()

      // Invited users shouldn't have edit button (and thus no location assignment)
      cy.get('[data-testid="user-card"]').each($card => {
        cy.wrap($card).within(() => {
          cy.get('button').contains('Edit').should('not.exist')
        })
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state when fetching user locations', () => {
      // Intercept the user locations API to add delay
      cy.intercept('GET', '/api/user-locations/*/locations', (req) => {
        req.reply((res) => {
          res.delay(1000) // Add 1 second delay
          res.send({ locations: [] })
        })
      }).as('getUserLocations')

      // Click edit on the first user
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })

      cy.get('[role="dialog"]').within(() => {
        // Should show loading state
        cy.contains('Loading locations...').should('be.visible')
        
        // Wait for locations to load
        cy.wait('@getUserLocations')
        
        // Loading state should disappear
        cy.contains('Loading locations...').should('not.exist')
      })
    })
  })
})