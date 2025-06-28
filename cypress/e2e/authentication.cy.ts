/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    // Clear any existing session
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearAllCookies()
  })

  describe('Login Flow', () => {
    it('should display login form', () => {
      cy.visit('/login')
      
      // Verify login form elements
      cy.get('h1').contains('Sign In').should('be.visible')
      cy.get('input[type="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
      cy.get('button[type="submit"]').contains('Sign In').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/login')
      
      // Try to submit empty form
      cy.get('button[type="submit"]').click()
      
      // Should show validation errors
      cy.get('input[type="email"]:invalid').should('exist')
      cy.get('input[type="password"]:invalid').should('exist')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/login')
      
      // Enter invalid credentials
      cy.get('input[type="email"]').type('invalid@example.com')
      cy.get('input[type="password"]').type('wrongpassword')
      cy.get('button[type="submit"]').click()
      
      // Should show error message
      cy.contains('Invalid email or password').should('be.visible')
    })

    it('should login successfully with valid credentials', () => {
      cy.visit('/login')
      
      // Enter valid credentials (adjust these to match your test data)
      cy.get('input[type="email"]').type('admin@example.com')
      cy.get('input[type="password"]').type('admin123')
      cy.get('button[type="submit"]').click()
      
      // Should redirect to dashboard
      cy.url().should('not.include', '/login')
      
      // Should store user data
      cy.window().its('localStorage').invoke('getItem', 'rad_order_pad_user_data').should('exist')
      cy.window().its('localStorage').invoke('getItem', 'rad_order_pad_auth_token').should('exist')
    })

    it('should show loading state during login', () => {
      cy.intercept('POST', '/api/auth/login', (req) => {
        req.reply((res) => {
          res.delay(1000) // Add delay to see loading state
          res.send({
            token: 'test-token',
            user: { id: 1, email: 'admin@example.com', role: 'admin_referring' }
          })
        })
      }).as('login')
      
      cy.visit('/login')
      
      cy.get('input[type="email"]').type('admin@example.com')
      cy.get('input[type="password"]').type('admin123')
      cy.get('button[type="submit"]').click()
      
      // Should show loading state
      cy.get('button[type="submit"]').should('be.disabled')
      cy.get('button[type="submit"]').should('contain', 'Signing in...')
      
      cy.wait('@login')
    })
  })

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route', () => {
      // Try to access users page without login
      cy.visit('/users')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('should redirect back to intended page after login', () => {
      // Try to access users page
      cy.visit('/users')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Login
      cy.get('input[type="email"]').type('admin@example.com')
      cy.get('input[type="password"]').type('admin123')
      cy.get('button[type="submit"]').click()
      
      // Should redirect back to users page
      cy.url().should('include', '/users')
    })
  })

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.loginAsAdmin()
    })

    it('should logout successfully', () => {
      // Find and click logout button (adjust selector as needed)
      cy.get('[data-testid="user-menu"]').click()
      cy.contains('button', 'Logout').click()
      
      // Should redirect to login
      cy.url().should('include', '/login')
      
      // Should clear stored data
      cy.window().its('localStorage').invoke('getItem', 'rad_order_pad_user_data').should('not.exist')
      cy.window().its('localStorage').invoke('getItem', 'rad_order_pad_auth_token').should('not.exist')
    })

    it('should not access protected routes after logout', () => {
      // Logout
      cy.get('[data-testid="user-menu"]').click()
      cy.contains('button', 'Logout').click()
      
      // Try to access protected route
      cy.visit('/users')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })
  })

  describe('Session Management', () => {
    it('should persist login across page refreshes', () => {
      cy.loginAsAdmin()
      
      // Refresh page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('not.include', '/login')
      cy.window().its('localStorage').invoke('getItem', 'rad_order_pad_user_data').should('exist')
    })

    it('should handle expired tokens gracefully', () => {
      cy.loginAsAdmin()
      
      // Simulate expired token by intercepting API call
      cy.intercept('GET', '/api/users', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('expiredToken')
      
      cy.visit('/users')
      cy.wait('@expiredToken')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.contains('Your session has expired').should('be.visible')
    })
  })

  describe('Role-Based Access', () => {
    it('should show different menu items based on role', () => {
      // Login as admin
      cy.loginAsAdmin()
      
      // Should see admin menu items
      cy.contains('a', 'Users').should('be.visible')
      cy.contains('a', 'Locations').should('be.visible')
      cy.contains('a', 'Billing & Credits').should('be.visible')
    })

    it('should restrict access based on role', () => {
      // This would require logging in as different role
      // For example, physician shouldn't access users page
      
      // cy.loginAsPhysician()
      // cy.visit('/users')
      // cy.url().should('not.include', '/users')
      // cy.contains('Access denied').should('be.visible')
    })
  })

  describe('Password Reset', () => {
    it('should show forgot password link', () => {
      cy.visit('/login')
      cy.contains('a', 'Forgot password?').should('be.visible')
    })

    it('should navigate to password reset', () => {
      cy.visit('/login')
      cy.contains('a', 'Forgot password?').click()
      
      // Should navigate to reset page
      cy.url().should('include', '/forgot-password')
      cy.contains('Reset Password').should('be.visible')
    })
  })

  describe('Registration', () => {
    it('should show registration link', () => {
      cy.visit('/login')
      cy.contains('Create an account').should('be.visible')
    })

    it('should navigate to registration', () => {
      cy.visit('/login')
      cy.contains('a', 'Sign up').click()
      
      // Should navigate to registration
      cy.url().should('include', '/register')
    })
  })
})