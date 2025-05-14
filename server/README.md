# RadOrderPad Server

This directory contains the server-side code for the RadOrderPad application. The server acts as a proxy to the real API hosted at `https://api.radorderpad.com` and handles authentication, CORS, and other middleware concerns.

## Architecture

The server is built with Express.js and TypeScript, following a modular architecture:

- **index.ts**: Main entry point that sets up the Express application and middleware
- **routes.ts**: Defines all API routes and their handlers
- **middleware.ts**: Contains middleware functions for CORS, logging, authentication, etc.
- **utils.ts**: Utility functions for common operations
- **storage.ts**: In-memory storage implementation for user data
- **vite.ts**: Configuration for Vite development server and static file serving

## Key Features

1. **API Proxy**: Forwards requests to the real API with proper headers and authentication
2. **Authentication**: Handles user authentication and session management
3. **Trial User Support**: Special handling for trial users with appropriate endpoints
4. **CORS**: Configurable CORS support for development and production
5. **Logging**: Comprehensive request/response logging
6. **Navigation**: Role-based navigation handling (e.g., "New Order" button)

## Environment Variables

- `API_URL`: URL of the real API (default: https://api.radorderpad.com)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
- `DEFAULT_ALLOWED_ORIGIN`: Default allowed origin if ALLOWED_ORIGINS is not set
- `PORT`: Port to run the server on (default: 3000)

## Authentication Flow

1. Users can log in through `/api/auth/login` (regular users) or `/api/auth/trial/login` (trial users)
2. The server forwards the request to the real API and returns the response
3. The client stores the JWT token and includes it in subsequent requests
4. The server validates the token and forwards requests to the appropriate endpoints

## Trial vs Regular Users

- Trial users are identified by their JWT token (`isTrial` flag or `role` field)
- Trial users are redirected to `/trial-validation` when clicking the "New Order" button
- Regular users are redirected to `/new-order` when clicking the "New Order" button
- Trial users use trial-specific API endpoints where appropriate

## Development

To run the server in development mode:

```bash
npm run dev
```

This will start the server with Vite for hot module reloading.

## Production

To build and run the server in production mode:

```bash
npm run build
npm start
```

In production, the server serves static files from the `public` directory.