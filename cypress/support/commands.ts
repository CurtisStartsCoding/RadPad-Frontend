/// <reference types="cypress" />

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login')
  
  // Replace with actual admin credentials
  cy.get('input[type="email"]').type('admin@example.com')
  cy.get('input[type="password"]').type('admin123')
  cy.get('button[type="submit"]').click()
  
  // Wait for redirect after login
  cy.url().should('not.include', '/login')
  
  // Verify we're logged in by checking for user data in localStorage
  cy.window().its('localStorage').invoke('getItem', 'rad_order_pad_user_data').should('exist')
})

// Custom command to create a test user
Cypress.Commands.add('createTestUser', (userData) => {
  const user = {
    email: userData.email || `test-${Date.now()}@example.com`,
    role: userData.role || 'physician',
    ...userData
  }
  
  // This would typically call your API to create a user
  // For now, we'll use the UI flow
  return cy.wrap(user)
})

// Custom command to cleanup test data
Cypress.Commands.add('cleanupTestData', () => {
  // Add cleanup logic here
  cy.log('Cleaning up test data...')
})

// Type declarations for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
      createTestUser(userData?: Partial<{
        email: string
        role: string
        firstName: string
        lastName: string
      }>): Chainable<any>
      cleanupTestData(): Chainable<void>
    }
  }
}

export {}