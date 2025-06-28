/// <reference types="cypress" />

describe('User Management', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/users')
    cy.contains('h1', 'Users').should('be.visible')
  })

  describe('User List Display', () => {
    it('should display active users by default', () => {
      // Verify we're on the active users tab
      cy.get('[role="tab"][aria-selected="true"]').should('contain', 'Active Users')
      
      // Verify user cards are displayed
      cy.get('[data-testid="user-card"]').should('have.length.greaterThan', 0)
    })

    it('should display user information correctly', () => {
      cy.get('[data-testid="user-card"]').first().within(() => {
        // Check for required user information
        cy.get('[data-testid="user-name"]').should('exist')
        cy.get('[data-testid="user-email"]').should('exist')
        cy.get('[data-testid="user-role"]').should('exist')
        
        // Verify role badge is displayed
        cy.get('.bg-blue-100, .bg-green-100, .bg-purple-100, .bg-amber-100').should('exist')
      })
    })

    it('should show user counts in tabs', () => {
      // Get active users count from tab
      cy.get('[role="tab"]').contains('Active Users').invoke('text').then((text) => {
        const match = text.match(/\((\d+)\)/)
        if (match) {
          const count = parseInt(match[1])
          // Verify the count matches displayed cards
          cy.get('[data-testid="user-card"]').should('have.length', count)
        }
      })
    })
  })

  describe('User Search', () => {
    it('should filter users by search query', () => {
      // Get initial user count
      cy.get('[data-testid="user-card"]').its('length').then(initialCount => {
        // Search for a specific term
        cy.get('input[placeholder="Search users..."]').type('admin')
        cy.wait(500) // Debounce
        
        // Verify filtered results
        cy.get('[data-testid="user-card"]').should('have.length.lessThan', initialCount)
        
        // Each result should contain the search term
        cy.get('[data-testid="user-card"]').each($card => {
          cy.wrap($card).invoke('text').should('match', /admin/i)
        })
      })
    })

    it('should clear search when switching tabs', () => {
      // Add search query
      cy.get('input[placeholder="Search users..."]').type('test')
      cy.wait(500)
      
      // Switch to pending invitations tab
      cy.contains('button', 'Pending Invitations').click()
      
      // Search should be cleared
      cy.get('input[placeholder="Search users..."]').should('have.value', '')
    })
  })

  describe('User Invitation', () => {
    it('should open invite dialog when clicking invite button', () => {
      cy.contains('button', 'Invite User').click()
      
      // Verify dialog opens
      cy.get('[role="dialog"]').should('be.visible')
      cy.contains('h2', 'Invite New User').should('be.visible')
    })

    it('should validate email format', () => {
      cy.contains('button', 'Invite User').click()
      
      cy.get('[role="dialog"]').within(() => {
        // Try invalid email
        cy.get('input[type="email"]').type('invalid-email')
        cy.get('select').select('physician')
        cy.get('button').contains('Send Invitation').click()
        
        // Should show validation error
        cy.get('input[type="email"]:invalid').should('exist')
      })
    })

    it('should send invitation with valid data', () => {
      const testEmail = `test-${Date.now()}@example.com`
      
      cy.intercept('POST', '/api/user-invites/invite', {
        statusCode: 200,
        body: { success: true }
      }).as('sendInvite')
      
      cy.contains('button', 'Invite User').click()
      
      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="email"]').type(testEmail)
        cy.get('select').select('physician')
        cy.get('button').contains('Send Invitation').click()
      })
      
      // Wait for API call
      cy.wait('@sendInvite')
      
      // Dialog should close
      cy.get('[role="dialog"]').should('not.exist')
      
      // Success message should appear
      cy.contains('Invitation sent successfully').should('be.visible')
    })

    it('should show role options based on admin type', () => {
      cy.contains('button', 'Invite User').click()
      
      cy.get('[role="dialog"]').within(() => {
        cy.get('select').within(() => {
          // Should have physician option for referring admin
          cy.get('option[value="physician"]').should('exist')
          
          // Should not have radiologist option for referring admin
          cy.get('option[value="radiologist"]').should('not.exist')
        })
      })
    })
  })

  describe('User Editing', () => {
    it('should populate form with current user data', () => {
      // Get user data from card
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('[data-testid="user-name"]').invoke('text').as('userName')
        cy.get('[data-testid="user-email"]').invoke('text').as('userEmail')
        cy.get('button').contains('Edit').click()
      })
      
      // Verify form is populated
      cy.get('[role="dialog"]').within(() => {
        cy.get('@userName').then(userName => {
          const [firstName, lastName] = (userName as string).split(' ')
          cy.get('input[id="firstName"]').should('have.value', firstName)
          cy.get('input[id="lastName"]').should('have.value', lastName)
        })
      })
    })

    it('should validate phone number format', () => {
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })
      
      cy.get('[role="dialog"]').within(() => {
        // Clear and type phone number
        cy.get('input[id="phoneNumber"]').clear().type('1234567890')
        
        // Should be formatted automatically
        cy.get('input[id="phoneNumber"]').should('have.value', '(123) 456-7890')
      })
    })

    it('should validate NPI and show provider info', () => {
      cy.intercept('GET', '/api/utilities/npi-lookup*', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            basic: {
              firstName: 'John',
              lastName: 'Doe',
              credential: 'MD'
            },
            primaryTaxonomy: 'Internal Medicine'
          }
        }
      }).as('npiLookup')
      
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })
      
      cy.get('[role="dialog"]').within(() => {
        // Enter valid NPI
        cy.get('input[id="npi"]').clear().type('1234567890')
        
        // Wait for lookup
        cy.wait('@npiLookup')
        
        // Should show provider info
        cy.contains('John Doe, MD').should('be.visible')
        cy.contains('Internal Medicine').should('be.visible')
      })
    })

    it('should update user successfully', () => {
      cy.intercept('PUT', '/api/users/*', {
        statusCode: 200,
        body: { success: true }
      }).as('updateUser')
      
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })
      
      cy.get('[role="dialog"]').within(() => {
        // Make a change
        cy.get('input[id="specialty"]').clear().type('Cardiology')
        
        // Save
        cy.get('button').contains('Save Changes').click()
      })
      
      // Wait for API call
      cy.wait('@updateUser')
      
      // Dialog should close
      cy.get('[role="dialog"]').should('not.exist')
      
      // Success message
      cy.contains('User updated successfully').should('be.visible')
    })

    it('should toggle user active status', () => {
      cy.get('[data-testid="user-card"]').first().within(() => {
        cy.get('button').contains('Edit').click()
      })
      
      cy.get('[role="dialog"]').within(() => {
        // Find status toggle button
        cy.get('button').contains(/Active|Inactive/).then($button => {
          const currentStatus = $button.text()
          
          // Click to toggle
          cy.wrap($button).click()
          
          // Verify it changed
          cy.wrap($button).should('not.contain', currentStatus)
        })
      })
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls when needed', () => {
      // This assumes more than 20 users exist
      cy.get('body').then($body => {
        if ($body.find('[data-testid="pagination"]').length) {
          cy.get('[data-testid="pagination"]').within(() => {
            cy.get('button').contains('Previous').should('exist')
            cy.get('button').contains('Next').should('exist')
          })
        }
      })
    })

    it('should navigate between pages', () => {
      cy.get('body').then($body => {
        if ($body.find('[data-testid="pagination"]').length) {
          // Get first user on page 1
          cy.get('[data-testid="user-card"]').first().invoke('text').as('firstUserPage1')
          
          // Go to page 2
          cy.get('button').contains('Next').click()
          
          // Verify different user is shown
          cy.get('@firstUserPage1').then(firstUserPage1 => {
            cy.get('[data-testid="user-card"]').first().invoke('text').should('not.equal', firstUserPage1)
          })
          
          // Go back to page 1
          cy.get('button').contains('Previous').click()
          
          // Verify same user as before
          cy.get('@firstUserPage1').then(firstUserPage1 => {
            cy.get('[data-testid="user-card"]').first().invoke('text').should('equal', firstUserPage1)
          })
        }
      })
    })
  })

  describe('Debug Mode', () => {
    it('should toggle raw data display', () => {
      // Click show raw data
      cy.contains('button', 'Show Raw Data').click()
      
      // Should show JSON data
      cy.get('pre').should('be.visible')
      cy.get('pre').invoke('text').should('include', '"email"')
      
      // Click hide
      cy.contains('button', 'Hide Raw Data').click()
      
      // Should hide JSON data
      cy.get('pre').should('not.exist')
    })
  })

  describe('Pending Invitations', () => {
    it('should show pending invitations in separate tab', () => {
      // Switch to pending invitations
      cy.contains('button', 'Pending Invitations').click()
      
      // Verify tab is active
      cy.get('[role="tab"][aria-selected="true"]').should('contain', 'Pending Invitations')
      
      // Check invitation cards
      cy.get('body').then($body => {
        if ($body.find('[data-testid="user-card"]').length) {
          cy.get('[data-testid="user-card"]').first().within(() => {
            // Should show invited status
            cy.contains('Invited').should('be.visible')
            
            // Should not have edit button
            cy.get('button').contains('Edit').should('not.exist')
          })
        } else {
          // Should show empty state
          cy.contains('No pending invitations').should('be.visible')
        }
      })
    })
  })
})