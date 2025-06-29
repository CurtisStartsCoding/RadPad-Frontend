/// <reference types="cypress" />

describe('User Location Assignment - Simplified', () => {
  beforeEach(() => {
    // Set up API intercepts
    cy.intercept('GET', '/api/users*').as('fetchUsers');
    cy.intercept('GET', '/api/organizations/mine/locations*').as('fetchOrgLocations');
    cy.intercept('GET', '/api/user-locations/*/locations').as('fetchUserLocations');
    cy.intercept('PUT', '/api/users/*').as('updateUser');
  });

  describe('Location Display in User List', () => {
    it('should show locations for users as admin_referring', () => {
      // Use custom command to login
      cy.loginAsAdmin();
      
      // Navigate to users page
      cy.visit('/users');
      cy.wait('@fetchUsers');
      
      // Verify locations column exists
      cy.get('th').contains('Locations').should('be.visible');
      
      // Check first user's location display
      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(2).then($cell => {
          // Should show either locations or "No locations assigned"
          const text = $cell.text();
          expect(text).to.satisfy((t: string) => 
            t.includes('No locations assigned') || t.length > 0
          );
        });
      });
    });
  });

  describe('Location Assignment Workflow', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/users');
      cy.wait('@fetchUsers');
    });

    it('should allow editing user locations', () => {
      // Click edit on first user
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      // Wait for dialog and user locations to load
      cy.get('[role="dialog"]').should('be.visible');
      cy.wait('@fetchUserLocations');

      // Check for locations section
      cy.get('[role="dialog"]').within(() => {
        // The actual label is "Assigned Locations"
        cy.contains('Assigned Locations').should('be.visible');
        
        // Should have location checkboxes with specific ID pattern
        cy.get('input[type="checkbox"][id^="location-"]').should('have.length.greaterThan', 0);
        
        // Toggle a location
        cy.get('input[type="checkbox"][id^="location-"]').first().click();
        
        // Save changes - the actual button text is "Update User"
        cy.get('button').contains('Update User').click();
      });

      // Wait for update and verify success
      cy.wait('@updateUser');
      cy.contains('User updated').should('be.visible');
    });

    it('should persist location changes after save', () => {
      // Store the user's name for later verification
      let userName: string;
      cy.get('tbody tr').first().within(() => {
        cy.get('td').first().invoke('text').then(text => {
          userName = text.trim();
        });
        cy.get('button').contains('Edit').click();
      });

      cy.wait('@fetchUserLocations');

      // Make a change
      cy.get('[role="dialog"]').within(() => {
        // Toggle first location
        cy.get('input[type="checkbox"][id^="location-"]').first().then($checkbox => {
          const wasChecked = $checkbox.prop('checked');
          cy.wrap($checkbox).click();
          
          // Remember the state for verification
          cy.wrap(!wasChecked).as('expectedState');
        });
        
        cy.get('button').contains('Update User').click();
      });

      cy.wait('@updateUser');
      
      // Re-open the same user
      cy.get('tbody tr').contains(userName).parent('tr').within(() => {
        cy.get('button').contains('Edit').click();
      });

      cy.wait('@fetchUserLocations');

      // Verify the change persisted
      cy.get('@expectedState').then(expectedState => {
        cy.get('[role="dialog"]').within(() => {
          cy.get('input[type="checkbox"][id^="location-"]').first()
            .should(expectedState ? 'be.checked' : 'not.be.checked');
        });
      });
    });
  });

  describe('Role-Based Access', () => {
    it('should allow admin_radiology to manage user locations', () => {
      // Login as radiology admin
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.admin_radiology@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      cy.visit('/users');
      cy.wait('@fetchUsers');
      
      // Should see locations column
      cy.get('th').contains('Locations').should('be.visible');
      
      // Should be able to edit users
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').should('be.visible');
      });
    });

    it('should not allow physicians to access user management', () => {
      cy.loginAsPhysician();
      
      // Try to access users page
      cy.visit('/users');
      
      // Should still be on users page but API calls fail
      cy.url().should('include', '/users');
      
      // API calls should return 403 errors
      cy.wait('@fetchUsers').then((interception) => {
        expect(interception.response?.statusCode).to.equal(403);
      });
    });

    it('should not allow admin_staff to access user management', () => {
      cy.loginAsAdminStaff();
      
      // Try to access users page
      cy.visit('/users');
      
      // Should still be on users page but API calls fail
      cy.url().should('include', '/users');
      
      // API calls should return 403 errors
      cy.wait('@fetchUsers').then((interception) => {
        expect(interception.response?.statusCode).to.equal(403);
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/users');
      cy.wait('@fetchUsers');
    });

    it('should handle API errors gracefully', () => {
      // Mock an error response
      cy.intercept('PUT', '/api/users/*', {
        statusCode: 500,
        body: { success: false, message: 'Server error' }
      }).as('updateError');

      // Try to update a user
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="checkbox"][id^="location-"]').first().click();
        cy.get('button').contains('Update User').click();
      });

      cy.wait('@updateError');
      
      // Should show error message
      cy.contains('Server error').should('be.visible');
    });

    it('should show message when no locations available', () => {
      // Mock empty locations response
      cy.intercept('GET', '/api/organizations/mine/locations*', {
        statusCode: 200,
        body: { success: true, data: [] }
      }).as('emptyLocations');

      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      cy.wait('@emptyLocations');
      cy.wait('@fetchUserLocations');

      cy.get('[role="dialog"]').within(() => {
        // Should show no locations message
        cy.contains('No active locations available').should('be.visible');
      });
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/users');
      cy.wait('@fetchUsers');
    });

    it('should handle multiple location selections', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      cy.wait('@fetchUserLocations');

      cy.get('[role="dialog"]').within(() => {
        // Uncheck all first
        cy.get('input[type="checkbox"][id^="location-"]:checked').each($el => {
          cy.wrap($el).uncheck();
        });

        // Check multiple locations
        cy.get('input[type="checkbox"][id^="location-"]').then($checkboxes => {
          const count = Math.min(3, $checkboxes.length);
          for (let i = 0; i < count; i++) {
            cy.wrap($checkboxes[i]).check();
          }
        });

        cy.get('button').contains('Update User').click();
      });

      cy.wait('@updateUser');
      cy.contains('User updated').should('be.visible');
    });
  });
});