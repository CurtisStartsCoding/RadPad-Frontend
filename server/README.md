# RadOrderPad Middle Layer

This directory contains the middle layer server implementation for RadOrderPad. The middle layer serves as a proxy between the client application and the remote API.

## Architecture

```
Client App <---> Middle Layer <---> Remote API (api.radorderpad.com)
```

## Purpose

The middle layer serves several important purposes:

1. **CORS Handling**: Solves Cross-Origin Resource Sharing (CORS) issues by proxying requests from the client to the remote API.
2. **Environment Flexibility**: Allows the application to work seamlessly in different environments (localhost, production) without client-side changes.
3. **Authentication Forwarding**: Properly forwards authentication tokens and maintains session state.
4. **Trial User Support**: Maintains support for both regular and trial user authentication flows.

## Key Components

- **routes.ts**: Implements the API proxy middleware that forwards requests to the remote API.
- **index.ts**: Sets up the Express server and registers the routes.
- **middleware.ts**: Contains CORS and error handling middleware.
- **utils.ts**: Contains utility functions for API responses.

## How It Works

1. The client makes API requests to relative paths (e.g., `/api/auth/login`).
2. The middle layer receives these requests and forwards them to the remote API.
3. The middle layer forwards the response back to the client.

## Environment Variables

The middle layer uses the following environment variables:

- `API_URL`: The URL of the remote API (default: `https://api.radorderpad.com`).
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS.
- `DEFAULT_ALLOWED_ORIGIN`: Default allowed origin if `ALLOWED_ORIGINS` is not set.
- `PORT`: The port to run the server on (default: 3000).

## Development

To run the middle layer in development mode:

```bash
npm run dev
```

## Production

In production, the middle layer is automatically started when the application is deployed. The environment variables should be set in the production environment.