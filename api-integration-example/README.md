# RadOrderPad API Integration Package

This package contains essential files and configurations for integrating with the RadOrderPad API (https://api.radorderpad.com) in a React/TypeScript application.

## Contents

1. **Configuration Files**
   - `config.ts` - API configuration and URL handling
   - `vite.config.sample.ts` - Sample Vite configuration with API proxy setup

2. **Authentication**
   - `auth.ts` - Authentication utilities for login, logout, and session management
   - `useAuth.tsx` - React hook for authentication state management
   - `types.ts` - TypeScript interfaces for API data structures

3. **API Communication**
   - `queryClient.ts` - Enhanced API request functions with token handling and error management

4. **Usage Examples**
   - `login.sample.tsx` - Example login component
   - `app.sample.tsx` - Example app setup with authentication and routing

## Setup Instructions

1. Copy these files to your project, maintaining the directory structure
2. Update the API endpoint in your Vite configuration
3. Adjust the port number (from 5001 to 3000) in your start script
4. Implement the authentication flow using the provided hooks and utilities

## Authentication Flow

1. User logs in with email/password
2. API returns a JWT token
3. Token is stored in localStorage
4. Token is included in subsequent API requests
5. Session state is managed through the useAuth hook

## API Request Pattern

All API requests should:
1. Include the authentication token in the Authorization header
2. Handle error responses appropriately
3. Use the queryClient for data fetching and caching

## Test Credentials

For testing the API integration:
- Email: test.physician@example.com
- Password: password123

## Notes

- The API uses JWT authentication
- Tokens are stored in localStorage
- API endpoints are prefixed with `/api`
- The Vite dev server proxies API requests to the remote server