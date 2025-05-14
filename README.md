# RadOrderPad Frontend

This is the frontend application for RadOrderPad, a medical imaging order management system.

## Recent Changes

### Direct API Communication

The application has been updated to communicate directly with the remote API instead of using a middleware layer. This simplifies the codebase and makes it more maintainable.

Key changes:
- Removed the middleware layer that was proxying requests to the remote API
- Updated client configuration to point directly to the remote API
- Implemented client-side handling for trial user navigation
- Simplified server implementation to focus on serving the frontend application

### Benefits

- Simplified architecture
- Reduced points of failure
- More maintainable codebase
- Consistent behavior for both regular and trial users

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

This will start the development server at http://localhost:3000.

### Building for Production

```bash
npm run build
```

### Starting the Production Server

```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Port for the server to listen on
PORT=3000

# Comma-separated list of allowed origins for CORS
ALLOWED_ORIGINS=https://radpad-dd83h.ondigitalocean.app,http://localhost:3000

# Default allowed origin if ALLOWED_ORIGINS is not set
DEFAULT_ALLOWED_ORIGIN=http://localhost:3000

# API URL for client-side requests (used by Vite)
VITE_API_URL=https://api.radorderpad.com
```

## Authentication

The application supports two types of authentication:
- Regular user authentication via `/auth` page
- Trial user authentication via `/trial-auth` page

Authentication state for regular users and trial users are distinct and saved with different keys.