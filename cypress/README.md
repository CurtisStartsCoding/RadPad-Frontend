# Cypress E2E Tests

This directory contains end-to-end tests for the RadPad Frontend application using Cypress.

## Setup

1. Install Cypress (if not already installed):
```bash
npm install --save-dev cypress
```

2. Install TypeScript types for Cypress:
```bash
npm install --save-dev @types/cypress
```

## Running Tests

### Interactive Mode (Cypress GUI)
```bash
npx cypress open
```

### Headless Mode (CLI)
```bash
npx cypress run
```

### Run Specific Test
```bash
npx cypress run --spec "cypress/e2e/user-location-assignment.cy.ts"
```

## Test Structure

### Test Files

- `authentication.cy.ts` - Login, logout, and session management tests
- `user-management.cy.ts` - User CRUD operations, search, and invitation tests  
- `user-location-assignment.cy.ts` - Location assignment feature tests

### Support Files

- `commands.ts` - Custom Cypress commands for common operations
- `e2e.ts` - Global configuration and test setup

## Custom Commands

### `cy.loginAsAdmin()`
Logs in as an admin user. Update the credentials in `commands.ts` to match your test environment.

### `cy.createTestUser(userData)`
Creates a test user with specified data.

### `cy.cleanupTestData()`
Cleans up test data after tests complete.

## Configuration

The main configuration is in `cypress.config.ts`:

- `baseUrl`: Set to your local development server (default: http://localhost:3000)
- `viewportWidth/Height`: Browser viewport size for tests
- `defaultCommandTimeout`: How long commands wait before timing out

## Best Practices

1. **Use data-testid attributes**: Add `data-testid` attributes to elements for reliable selection
2. **Avoid hard-coded waits**: Use Cypress's built-in retry-ability instead of `cy.wait(1000)`
3. **Clean up test data**: Always clean up created test data in `after()` hooks
4. **Mock external dependencies**: Use `cy.intercept()` to mock API responses for predictable tests
5. **Test user flows**: Focus on complete user workflows rather than isolated components

## Environment Variables

Create a `cypress.env.json` file for environment-specific variables:

```json
{
  "adminEmail": "admin@example.com",
  "adminPassword": "your-password",
  "apiUrl": "http://localhost:3000/api"
}
```

Then access in tests: `Cypress.env('adminEmail')`

## Debugging

1. Use `cy.debug()` to pause execution
2. Use `cy.log()` to output debug information
3. Chrome DevTools are available in interactive mode
4. Screenshots are automatically taken on failure

## CI/CD Integration

To run in CI environments:

```bash
# Install dependencies
npm ci

# Run tests with specific browser
npx cypress run --browser chrome

# Generate reports
npx cypress run --reporter json --reporter-options output=results.json
```

## Common Issues

### Permission Errors
If you get permission errors when installing Cypress, try:
- Running from Windows PowerShell instead of WSL
- Using `npm install --force`

### Tests Failing Locally
- Ensure the dev server is running: `npm run dev`
- Check that test data exists in your database
- Verify API endpoints are working correctly

### Flaky Tests
- Add explicit waits for API calls: `cy.wait('@apiCall')`
- Use `.should()` assertions that retry automatically
- Ensure proper test isolation with beforeEach/afterEach hooks