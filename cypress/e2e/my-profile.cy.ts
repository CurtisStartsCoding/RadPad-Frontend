describe('My Profile Page', () => {
  beforeEach(() => {
    // Login as a physician before each test
    cy.login('physician@example.com', 'password123');
    cy.visit('/my-profile');
  });

  describe('Profile Display', () => {
    it('should display user profile information correctly', () => {
      // Check page title
      cy.contains('h1', 'My Profile').should('be.visible');
      cy.contains('View and edit your profile information').should('be.visible');

      // Check profile card exists
      cy.get('[data-testid="profile-card"]').should('be.visible');

      // Check basic user information is displayed
      cy.contains('Profile Information').should('be.visible');
      
      // Check for email display
      cy.get('[data-testid="user-email"]').should('contain', '@');
      
      // Check for role badge
      cy.get('[data-testid="user-role-badge"]').should('be.visible');
      
      // Check for organization name
      cy.get('[data-testid="user-organization"]').should('be.visible');
    });

    it('should display physician-specific fields', () => {
      // Check for NPI field
      cy.contains('NPI Number').should('be.visible');
      
      // Check for specialty field
      cy.contains('Specialty').should('be.visible');
      
      // Check for office contact information section
      cy.contains('h3', 'Office Contact Information').should('be.visible');
    });

    it('should display refresh button', () => {
      cy.get('button').contains('Refresh').should('be.visible');
    });

    it('should display edit button', () => {
      cy.get('button').contains('Edit Profile').should('be.visible');
    });
  });

  describe('Profile Refresh', () => {
    it('should refresh profile data when refresh button is clicked', () => {
      // Click refresh button
      cy.get('button').contains('Refresh').click();

      // Check for loading state
      cy.get('button').contains('Refreshing...').should('be.visible');
      
      // Wait for refresh to complete
      cy.wait('@getUserProfile');
      
      // Check success toast
      cy.contains('Profile Refreshed').should('be.visible');
      cy.contains('Your profile has been updated with the latest data').should('be.visible');
    });

    it('should auto-refresh if office fields are missing', () => {
      // Clear localStorage to simulate missing fields
      cy.window().then((win) => {
        const userData = JSON.parse(win.localStorage.getItem('rad_order_pad_user_data') || '{}');
        delete userData.fax_number;
        delete userData.address_line1;
        win.localStorage.setItem('rad_order_pad_user_data', JSON.stringify(userData));
      });

      // Reload the page
      cy.reload();

      // Should automatically trigger a refresh
      cy.wait('@getUserProfile');
    });
  });

  describe('Profile Editing', () => {
    beforeEach(() => {
      // Click edit button to enter edit mode
      cy.get('button').contains('Edit Profile').click();
    });

    it('should enter edit mode when edit button is clicked', () => {
      // Check for cancel and save buttons
      cy.get('button').contains('Cancel').should('be.visible');
      cy.get('button').contains('Save Changes').should('be.visible');

      // Check that input fields are visible and editable
      cy.get('input[id="first-name"]').should('be.visible').and('not.be.disabled');
      cy.get('input[id="last-name"]').should('be.visible').and('not.be.disabled');
      cy.get('input[id="phone"]').should('be.visible').and('not.be.disabled');
      cy.get('input[id="fax"]').should('be.visible').and('not.be.disabled');
      
      // Check email field is disabled
      cy.get('input[id="email"]').should('be.visible').and('be.disabled');
    });

    it('should show office contact fields in edit mode', () => {
      // Check for office address fields
      cy.get('input[id="office-address"]').should('be.visible');
      cy.get('input[id="office-address-2"]').should('be.visible');
      cy.get('input[id="office-city"]').should('be.visible');
      cy.get('input[id="office-state"]').should('be.visible');
      cy.get('input[id="office-zip"]').should('be.visible');
    });

    it('should cancel editing when cancel button is clicked', () => {
      // Make a change
      cy.get('input[id="first-name"]').clear().type('Test');
      
      // Click cancel
      cy.get('button').contains('Cancel').click();
      
      // Should exit edit mode
      cy.get('button').contains('Edit Profile').should('be.visible');
      cy.get('input[id="first-name"]').should('not.exist');
    });

    it('should save profile changes successfully', () => {
      // Update fields
      cy.get('input[id="phone"]').clear().type('5551234567');
      cy.get('input[id="fax"]').clear().type('5551234568');
      cy.get('input[id="office-address"]').clear().type('123 Medical Plaza');
      cy.get('input[id="office-city"]').clear().type('Springfield');
      cy.get('input[id="office-state"]').clear().type('IL');
      cy.get('input[id="office-zip"]').clear().type('62701');

      // Save changes
      cy.get('button').contains('Save Changes').click();

      // Check for loading state
      cy.get('button').contains('Saving...').should('be.visible');

      // Wait for save to complete
      cy.wait('@updateUserProfile');

      // Check success toast
      cy.contains('Profile Updated').should('be.visible');
      cy.contains('Your profile has been updated successfully').should('be.visible');

      // Should exit edit mode
      cy.get('button').contains('Edit Profile').should('be.visible');

      // Verify the saved values are displayed
      cy.contains('(555) 123-4567').should('be.visible');
      cy.contains('Fax: (555) 123-4568').should('be.visible');
      cy.contains('123 Medical Plaza').should('be.visible');
      cy.contains('Springfield, IL 62701').should('be.visible');
    });

    it('should format phone numbers correctly', () => {
      // Type unformatted phone number
      cy.get('input[id="phone"]').clear().type('5551234567');
      
      // Should be formatted as user types
      cy.get('input[id="phone"]').should('have.value', '(555) 123-4567');
      
      // Same for fax
      cy.get('input[id="fax"]').clear().type('5559876543');
      cy.get('input[id="fax"]').should('have.value', '(555) 987-6543');
    });

    it('should enforce state code to uppercase', () => {
      cy.get('input[id="office-state"]').clear().type('il');
      cy.get('input[id="office-state"]').should('have.value', 'IL');
    });

    it('should show validation error for invalid data', () => {
      // Clear required field
      cy.get('input[id="first-name"]').clear();
      
      // Try to save
      cy.get('button').contains('Save Changes').click();
      
      // Should show error toast
      cy.contains('Update Failed').should('be.visible');
    });
  });

  describe('Notification Preferences', () => {
    it('should display notification preferences card', () => {
      cy.contains('Notification Preferences').should('be.visible');
      cy.contains('Manage how you receive notifications').should('be.visible');
    });

    it('should have email and in-app tabs', () => {
      cy.get('[role="tablist"]').within(() => {
        cy.contains('Email').should('be.visible');
        cy.contains('In-App').should('be.visible');
      });
    });

    it('should switch between notification tabs', () => {
      // Click In-App tab
      cy.contains('[role="tab"]', 'In-App').click();
      
      // Should show in-app settings
      cy.contains('Show in-app notifications for order updates').should('be.visible');
      cy.contains('Sound Notifications').should('be.visible');
      
      // Click Email tab
      cy.contains('[role="tab"]', 'Email').click();
      
      // Should show email settings
      cy.contains('Receive email notifications for order updates').should('be.visible');
    });
  });

  describe('Account Information', () => {
    it('should display account information section', () => {
      cy.contains('h3', 'Account Information').should('be.visible');
      cy.contains('Member Since').should('be.visible');
      cy.contains('Last Login').should('be.visible');
      cy.contains('Last Updated').should('be.visible');
    });
  });

  describe('API Integration', () => {
    beforeEach(() => {
      // Intercept API calls
      cy.intercept('GET', '/api/users/me', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 123,
            email: 'physician@example.com',
            first_name: 'John',
            last_name: 'Doe',
            role: 'physician',
            organization_id: 456,
            organization_name: 'Springfield Medical Center',
            npi: '1234567890',
            specialty: 'Internal Medicine',
            phone_number: '5551234567',
            fax_number: '5551234568',
            address_line1: '123 Medical Plaza',
            address_line2: 'Suite 100',
            city: 'Springfield',
            state: 'IL',
            zip_code: '62701',
            is_active: true,
            email_verified: true,
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-06-20T14:45:00Z'
          }
        }
      }).as('getUserProfile');

      cy.intercept('PUT', '/api/users/me', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 123,
            email: 'physician@example.com',
            first_name: 'John',
            last_name: 'Doe',
            role: 'physician',
            organization_id: 456,
            organization_name: 'Springfield Medical Center',
            phone_number: '5551234567',
            fax_number: '5551234568',
            address_line1: '123 Medical Plaza',
            address_line2: 'Suite 100',
            city: 'Springfield',
            state: 'IL',
            zip_code: '62701'
          }
        }
      }).as('updateUserProfile');
    });

    it('should handle API errors gracefully', () => {
      // Override intercept with error response
      cy.intercept('GET', '/api/users/me', {
        statusCode: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      }).as('getUserProfileError');

      // Click refresh
      cy.get('button').contains('Refresh').click();

      // Wait for error
      cy.wait('@getUserProfileError');

      // Should show error toast
      cy.contains('Refresh Failed').should('be.visible');
      cy.contains('Could not refresh profile data').should('be.visible');
    });
  });

  describe('Role-Based Display', () => {
    it('should not show NPI for non-medical roles', () => {
      // Mock admin user data
      cy.window().then((win) => {
        const userData = {
          id: '123',
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin_referring',
          organization_id: '456',
          organization_name: 'Springfield Medical Center'
        };
        win.localStorage.setItem('rad_order_pad_user_data', JSON.stringify(userData));
        win.localStorage.setItem('rad_order_pad_user_role', 'admin_referring');
      });

      // Reload page
      cy.reload();

      // Should not show NPI or specialty fields
      cy.contains('NPI Number').should('not.exist');
      cy.contains('Specialty').should('not.exist');
      cy.contains('Office Contact Information').should('not.exist');
    });
  });
});

// Helper command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});