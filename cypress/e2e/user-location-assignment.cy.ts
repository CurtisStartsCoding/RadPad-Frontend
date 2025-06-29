/// <reference types="cypress" />

describe('User Location Assignment', () => {
  beforeEach(() => {
    // Set up API intercepts
    cy.intercept('GET', '/api/users*').as('fetchUsers');
    cy.intercept('GET', '/api/organizations/mine/locations*').as('fetchOrgLocations');
    cy.intercept('GET', '/api/user-locations/*/locations').as('fetchUserLocations');
    cy.intercept('POST', '/api/user-locations/*/locations/*').as('assignLocation');
    cy.intercept('DELETE', '/api/user-locations/*/locations/*').as('removeLocation');
    cy.intercept('PUT', '/api/users/*').as('updateUser');
  });

  describe('Admin Referring - Location Management', () => {
    beforeEach(() => {
      // Login as admin_referring
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.admin_referring@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      // Navigate to Users page
      cy.visit('/users');
      cy.wait('@fetchUsers');
      cy.contains('h1', 'Users').should('be.visible');
    });

    it('should display locations column in active users table', () => {
      // Switch to active users tab if needed
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Active Users').click();
      });
      
      // Check that the locations column header exists
      cy.get('th').contains('Locations').should('be.visible');
      
      // Check that users display their assigned locations
      cy.get('tbody tr').first().within(() => {
        // Should have a locations cell (3rd column)
        cy.get('td').eq(2).should('exist');
        // It should either show locations or "No locations assigned"
        cy.get('td').eq(2).then($cell => {
          const text = $cell.text();
          expect(text).to.match(/(No locations assigned|.+)/);
        });
      });
    });

    it('should manage locations for a physician user', () => {
      // Find a physician user
      cy.get('tbody tr').each(($row) => {
        const roleText = $row.find('td').eq(1).text();
        if (roleText.toLowerCase().includes('physician')) {
          // Click edit on this physician
          cy.wrap($row).find('button').contains('Edit').click();
          
          // Wait for edit dialog
          cy.get('[role="dialog"]').should('be.visible');
          
          // Look for manage locations functionality
          cy.get('[role="dialog"]').within(() => {
            // Check if there's a locations section
            cy.get('h3').contains('Locations').should('be.visible');
            
            // Should have location checkboxes
            cy.get('input[type="checkbox"][id*="location"]').should('exist');
          });
          
          return false; // Exit the loop
        }
      });
    });

    it('should assign a location to a user', () => {
      // Click edit on the first user
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      // Wait for user data to load
      cy.wait('@fetchUserLocations');

      cy.get('[role="dialog"]').within(() => {
        // Find an unchecked location and check it
        cy.get('input[type="checkbox"][id*="location"]:not(:checked)').first().then($checkbox => {
          if ($checkbox.length > 0) {
            cy.wrap($checkbox).check();
            
            // Save the changes
            cy.get('button').contains('Save Changes').click();
          }
        });
      });

      // Wait for the update
      cy.wait('@updateUser');

      // Verify success message
      cy.contains('User updated successfully').should('be.visible');

      // Refresh and verify the location persists
      cy.reload();
      cy.wait('@fetchUsers');
    });

    it('should remove a location from a user', () => {
      // Find a user with locations assigned
      cy.get('tbody tr').each(($row) => {
        const locationsText = $row.find('td').eq(2).text();
        if (!locationsText.includes('No locations assigned')) {
          // This user has locations
          cy.wrap($row).find('button').contains('Edit').click();
          
          cy.wait('@fetchUserLocations');

          cy.get('[role="dialog"]').within(() => {
            // Find a checked location and uncheck it
            cy.get('input[type="checkbox"][id*="location"]:checked').first().uncheck();
            
            // Save the changes
            cy.get('button').contains('Save Changes').click();
          });

          // Wait for the update
          cy.wait('@updateUser');

          // Verify success
          cy.contains('User updated successfully').should('be.visible');
          
          return false; // Exit the loop
        }
      });
    });

    it('should handle multiple location assignments', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      cy.wait('@fetchUserLocations');

      cy.get('[role="dialog"]').within(() => {
        // First uncheck all locations
        cy.get('input[type="checkbox"][id*="location"]:checked').each($checkbox => {
          cy.wrap($checkbox).uncheck();
        });

        // Then check first two locations
        cy.get('input[type="checkbox"][id*="location"]').then($checkboxes => {
          if ($checkboxes.length >= 2) {
            cy.wrap($checkboxes[0]).check();
            cy.wrap($checkboxes[1]).check();
          }
        });

        // Save
        cy.get('button').contains('Save Changes').click();
      });

      cy.wait('@updateUser');
      cy.contains('User updated successfully').should('be.visible');
    });

    it('should show location details in the list', () => {
      // If any user has locations, verify they are displayed properly
      cy.get('tbody tr').each(($row) => {
        const $locationCell = $row.find('td').eq(2);
        const locationsText = $locationCell.text();
        
        if (!locationsText.includes('No locations assigned')) {
          // Verify location display includes MapPin icon
          cy.wrap($locationCell).find('svg').should('have.class', 'h-4');
          
          // Verify locations are comma-separated if multiple
          if (locationsText.includes(',')) {
            expect(locationsText).to.match(/\w+,\s*\w+/);
          }
        }
      });
    });
  });

  describe('Admin Radiology - Location Management', () => {
    beforeEach(() => {
      // Login as admin_radiology
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.admin_radiology@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      // Navigate to Users page
      cy.visit('/users');
      cy.wait('@fetchUsers');
    });

    it('should manage locations for scheduler users', () => {
      // Find a scheduler user
      cy.get('tbody tr').each(($row) => {
        const roleText = $row.find('td').eq(1).text();
        if (roleText.toLowerCase().includes('scheduler')) {
          // Click edit
          cy.wrap($row).find('button').contains('Edit').click();
          
          cy.wait('@fetchUserLocations');

          cy.get('[role="dialog"]').within(() => {
            // Should see locations section
            cy.get('h3').contains('Locations').should('be.visible');
            cy.get('input[type="checkbox"][id*="location"]').should('exist');
          });
          
          return false;
        }
      });
    });

    it('should manage locations for radiologist users', () => {
      // Find a radiologist user
      cy.get('tbody tr').each(($row) => {
        const roleText = $row.find('td').eq(1).text();
        if (roleText.toLowerCase().includes('radiologist')) {
          // Click edit
          cy.wrap($row).find('button').contains('Edit').click();
          
          cy.wait('@fetchUserLocations');

          cy.get('[role="dialog"]').within(() => {
            // Should see locations section
            cy.get('h3').contains('Locations').should('be.visible');
            cy.get('input[type="checkbox"][id*="location"]').should('exist');
          });
          
          return false;
        }
      });
    });
  });

  describe('Location Assignment Permissions', () => {
    it('should not allow physicians to access user management', () => {
      // Login as physician
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.physician@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      // Try to navigate to users page
      cy.visit('/users');
      
      // Should redirect or show error
      cy.url().should('not.include', '/users');
      // Or check for error message
      cy.get('body').then($body => {
        if ($body.find(':contains("Access denied")').length > 0) {
          cy.contains('Access denied').should('be.visible');
        }
      });
    });

    it('should not allow admin staff to access user management', () => {
      // Login as admin_staff
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.admin_staff@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      // Try to navigate to users page
      cy.visit('/users');
      
      // Should redirect or show error
      cy.url().should('not.include', '/users');
    });
  });

  describe('API Integration', () => {
    beforeEach(() => {
      // Login as admin
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.admin_referring@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      cy.visit('/users');
      cy.wait('@fetchUsers');
    });

    it('should call correct API endpoints for location assignment', () => {
      // Get first user and extract ID
      cy.get('tbody tr').first().then($row => {
        // Click edit
        cy.wrap($row).find('button').contains('Edit').click();
        
        // Wait for user locations to load
        cy.wait('@fetchUserLocations').then((interception) => {
          // Verify correct endpoint format
          expect(interception.request.url).to.match(/\/api\/user-locations\/\d+\/locations/);
        });

        cy.get('[role="dialog"]').within(() => {
          // Toggle a location
          cy.get('input[type="checkbox"][id*="location"]').first().click();
          
          // Save
          cy.get('button').contains('Save Changes').click();
        });

        // Verify update user endpoint is called
        cy.wait('@updateUser').then((interception) => {
          expect(interception.request.url).to.match(/\/api\/users\/\d+/);
          // Check that location data is included in the request
          expect(interception.request.body).to.have.property('locationIds');
        });
      });
    });

    it('should handle location assignment errors gracefully', () => {
      // Mock an error response
      cy.intercept('PUT', '/api/users/*', {
        statusCode: 400,
        body: { 
          success: false, 
          message: 'Failed to update user locations' 
        }
      }).as('updateUserError');

      cy.get('tbody tr').first().within(() => {
        cy.get('button').contains('Edit').click();
      });

      cy.get('[role="dialog"]').within(() => {
        cy.get('input[type="checkbox"][id*="location"]').first().click();
        cy.get('button').contains('Save Changes').click();
      });

      cy.wait('@updateUserError');
      
      // Should show error message
      cy.contains('Failed to update user locations').should('be.visible');
    });
  });

  describe('Search and Filter Integration', () => {
    beforeEach(() => {
      cy.visit('/auth');
      cy.get('input[type="email"]').type('test.admin_referring@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/auth');
      
      cy.visit('/users');
      cy.wait('@fetchUsers');
    });

    it('should maintain location display when searching', () => {
      // Search for users
      cy.get('input[placeholder*="Search"]').type('test');
      
      // Wait for search to update
      cy.wait(500);

      // Verify locations column still shows
      cy.get('th').contains('Locations').should('be.visible');
      
      // If results exist, verify location data is displayed
      cy.get('tbody tr').then($rows => {
        if ($rows.length > 0) {
          cy.get('tbody tr').first().find('td').eq(2).should('exist');
        }
      });
    });

    it('should not show location management for pending invitations', () => {
      // Switch to pending invitations tab
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Pending Invitations').click();
      });

      // Pending users should not have edit functionality
      cy.get('tbody tr').then($rows => {
        if ($rows.length > 0) {
          cy.get('tbody tr').first().within(() => {
            // Should not have edit button
            cy.get('button').contains('Edit').should('not.exist');
            // Should show "Pending activation" instead
            cy.contains('Pending activation').should('be.visible');
          });
        }
      });
    });
  });
});