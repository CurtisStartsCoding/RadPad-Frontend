describe('My Profile Page - Physician', () => {
  it('should display profile page after login', () => {
    // Visit the auth page directly
    cy.visit('/auth');
    
    // Login with physician credentials
    cy.get('input[type="email"]').type('test.physician@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Wait for redirect after login - could be new-order or orders page
    cy.url().should('not.include', '/auth');
    
    // Wait for page to load after login
    cy.get('h1, h2', { timeout: 15000 }).should('be.visible');
    
    // Navigate directly to profile page
    cy.visit('/profile');
    
    // Basic checks - with extended timeout for slow loading
    cy.get('h1', { timeout: 15000 }).should('contain', 'My Profile');
    
    // Check for basic elements
    cy.contains('Profile Information').should('be.visible');
    cy.contains('test.physician@example.com').should('be.visible');
    
    // Check for refresh and edit buttons
    cy.get('button').contains('Refresh').should('be.visible');
    cy.get('button').contains('Edit Profile').should('be.visible');
  });

  it('should allow editing profile and persist changes', () => {
    // Set up intercepts for profile API calls
    cy.intercept('GET', '/api/users/me*').as('fetchProfile');
    
    // Quick login
    cy.visit('/auth');
    cy.get('input[type="email"]').type('test.physician@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/auth');
    
    // Navigate directly to profile page
    cy.visit('/profile');
    cy.wait('@fetchProfile'); // Wait for initial profile load
    cy.get('h1', { timeout: 15000 }).should('contain', 'My Profile');
    
    // Click edit
    cy.get('button').contains('Edit Profile').click();
    
    // Check edit mode
    cy.get('button').contains('Cancel').should('be.visible');
    cy.get('button').contains('Save Changes').should('be.visible');
    
    // Store original values
    let originalPhone: string;
    cy.get('input#phone').invoke('val').then(val => {
      originalPhone = val as string;
    });
    
    // Make changes to fields
    cy.get('input#phone').clear().type('5559876543');
    cy.get('input#fax').clear().type('5559876544');
    cy.get('input#office-address').clear().type('456 Test Street');
    cy.get('input#office-city').clear().type('Test City');
    cy.get('input#office-state').clear().type('CA');
    cy.get('input#office-zip').clear().type('90210');
    
    // Save changes
    cy.get('button').contains('Save Changes').click();
    
    // Check for loading state
    cy.get('button').contains('Saving...').should('be.visible');
    
    // Wait for save to complete
    cy.get('button').contains('Edit Profile', { timeout: 10000 }).should('be.visible');
    
    // Check success toast
    cy.contains('Profile Updated').should('be.visible');
    
    // Wait a bit for the UI to update
    cy.wait(1000);
    
    // Debug: Check what's actually on the page
    cy.get('body').then($body => {
      console.log('Page content after save:', $body.text());
    });
    
    // Verify the changes are displayed in view mode
    // Phone number should be visible as formatted: (555) 987-6543
    cy.contains('(555) 987-6543').should('be.visible');
    
    // Check for fax - also formatted
    cy.contains('Fax: (555) 987-6544').should('be.visible');
    
    // Check for address
    cy.contains('456 Test Street').should('be.visible');
    cy.contains('Test City, CA 90210').should('be.visible');
    
    // Refresh the page to verify persistence
    cy.reload();
    
    // Wait for page to load
    cy.get('h1', { timeout: 15000 }).should('contain', 'My Profile');
    
    // Click refresh button to get fresh data from server
    cy.get('button').contains('Refresh').click();
    
    // Wait for the refresh to complete
    cy.get('button').contains('Refreshing...').should('be.visible');
    cy.get('button').contains('Refresh', { timeout: 10000 }).should('be.visible');
    
    // Check values are still there after refresh
    // Phone number should be visible as formatted
    cy.contains('(555) 987-6543').should('be.visible');
    
    // Address should be visible
    cy.contains('456 Test Street').should('be.visible');
    
    // Edit again to restore original values (cleanup)
    cy.get('button').contains('Edit Profile').click();
    cy.get('input#phone').clear().type(originalPhone || '5551234567');
    cy.get('input#fax').clear();
    cy.get('input#office-address').clear();
    cy.get('input#office-city').clear();
    cy.get('input#office-state').clear();
    cy.get('input#office-zip').clear();
    cy.get('button').contains('Save Changes').click();
    cy.get('button').contains('Edit Profile', { timeout: 10000 }).should('be.visible');
  });

  it('should refresh profile data', () => {
    // Quick login
    cy.visit('/auth');
    cy.get('input[type="email"]').type('test.physician@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/auth');
    
    // Navigate directly to profile page
    cy.visit('/profile');
    cy.get('h1', { timeout: 15000 }).should('contain', 'My Profile');
    
    // Click refresh
    cy.get('button').contains('Refresh').click();
    
    // Check loading state appears
    cy.get('button').contains('Refreshing...').should('be.visible');
    
    // Wait for it to complete (max 10 seconds)
    cy.get('button', { timeout: 10000 }).contains('Refresh').should('be.visible');
    
    // Toast should appear
    cy.contains('Profile Refreshed', { timeout: 5000 }).should('be.visible');
  });
});