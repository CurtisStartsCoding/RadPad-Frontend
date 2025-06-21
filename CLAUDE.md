# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RadOrderPad Frontend is a medical imaging order management system. It's a full-stack TypeScript application with a React frontend and Express proxy server that interfaces with a remote API at https://api.radorderpad.com.

## Development Commands

```bash
# Install dependencies
npm install

# Development (starts server with hot reload on port 3000)
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm start

# Push database schema changes (requires DATABASE_URL)
npm run db:push
```

## Architecture

The application follows a three-tier architecture:

1. **Frontend (React)** - Located in `client/`
   - Uses Vite for development and building
   - Styled with Tailwind CSS and shadcn/ui components
   - State management with React Query (TanStack Query)
   - Routing with Wouter
   - Forms handled by React Hook Form with Zod validation

2. **Proxy Server (Express)** - Located in `server/`
   - Serves the frontend in production
   - Proxies all `/api/*` requests to https://api.radorderpad.com
   - Handles CORS and forwards authentication headers
   - Uses Vite middleware in development for HMR

3. **Remote API** - External service at https://api.radorderpad.com
   - All business logic and data persistence
   - Accessed through the proxy server to avoid CORS issues

## Key Directories

- `client/src/pages/` - Page components corresponding to routes
- `client/src/components/` - Reusable UI components
- `client/src/lib/` - Utilities, configuration, and type definitions
- `server/` - Express proxy server code
- `shared/` - Code shared between client and server (database schema)
- `AWS API Docs/` - Extensive API documentation

## Environment Setup

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=https://radpad-dd83h.ondigitalocean.app,http://localhost:3000
API_URL=https://api.radorderpad.com
VITE_API_URL=https://api.radorderpad.com
```

## Important Path Aliases

Both TypeScript and Vite are configured with these aliases:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## API Request Flow

1. Frontend makes request to `/api/*`
2. Express server proxies to `https://api.radorderpad.com/*`
3. Server forwards all headers (including Authorization)
4. Response is returned to frontend

All API configuration is in `client/src/lib/config.ts`.

## Key Features to Understand

1. **Authentication**: Uses JWT tokens stored in localStorage, sent as Authorization headers
2. **Role-Based Access**: Different UI/features for physicians, admin staff, radiologists, etc.
3. **Order Workflow**: Creation → Validation → Admin Finalization → Radiology
4. **Trial Mode**: Special sandbox environment for testing without real data
5. **Organization Structure**: Users belong to organizations with locations
6. **Connections**: Organizations must establish connections before exchanging orders

## Testing

Test scripts are located in `test-scripts/` directory. These test various API endpoints and can be run against different environments.

## Development Tips

1. The server automatically proxies API requests - no need to configure CORS
2. Use React Query for all API calls - see existing patterns in `client/src/pages/`
3. All form validation should use Zod schemas
4. UI components from shadcn/ui are in `client/src/components/ui/`
5. Check `AWS API Docs/` for detailed API endpoint documentation
6. Comprehensive frontend documentation is in the backend repo at `final-documentation/frontend/`

## Date Formatting

**Always use the centralized date utilities instead of `toLocaleDateString()`:**

```typescript
import { formatDate, formatDateShort, formatDateLong } from '@/lib/utils';

formatDate("2024-02-15")      // → "02/15/2024" (MM/DD/YYYY)
formatDateShort("2024-02-15") // → "Feb 15, 2024" 
formatDateLong("2024-02-15")  // → "February 15, 2024"
```

**Do NOT use:**
- `new Date().toLocaleDateString()` 
- Individual formatDate functions in components

**Benefits:**
- Consistent US date format across the app
- Single source of truth for date formatting
- Easy to change format application-wide

## CRITICAL: API Documentation

**ALWAYS read the API documentation BEFORE implementing any feature:**

1. **Backend Documentation Location**: `/mnt/c/Dropbox/Apps/ROP Roo Backend Finalization/final-documentation/`
   - `api/` - Endpoint documentation with request/response formats
   - `frontend/` - Frontend-specific implementation guides
   - `backend/` - Backend implementation details

2. **Common API Response Formats**:
   - Success with data: `{success: true, data: [...]}`
   - Success with nested object: `{success: true, data: {items: [...]}}`
   - Direct array response: `[...]`
   - Error response: `{success: false, message: "Error details"}`

3. **Before Making Assumptions**:
   - Check the console logs for actual API responses
   - Read the specific endpoint documentation
   - Look at the response headers and body structure
   - Don't assume field names (e.g., `locations` vs `data`)

4. **Key Documentation Files to Check**:
   - `api/organization-management.md` - Organization endpoints
   - `api/location-management.md` - Location endpoints  
   - `api/connection-management.md` - Connection endpoints
   - `api/admin-staff.md` - Admin staff permissions
   - `api/endpoint-access-matrix.md` - Role-based access

## Commit Message Format

All commits MUST follow this format:
```
type: description
```

Examples:
- `feat: implement send to radiology API`
- `fix: resolve login redirect issue`
- `docs: update API integration guide`
- `refactor: simplify validation logic`
- `test: add credit usage tests`
- `chore: update dependencies`
- `style: format code with prettier`

Common types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks
- `style`: Code style changes

## CRITICAL: Pre-Commit Requirements

**NEVER commit code without completing ALL of these steps:**

1. **Test the changes**: Run the development server and manually verify the feature works
   ```bash
   npm run dev
   ```

2. **Run ESLint**: Fix all linting errors
   ```bash
   npm run lint
   # or to auto-fix:
   npm run lint -- --fix
   ```

3. **Run TypeScript check**: Ensure no type errors
   ```bash
   npm run check
   ```

4. **Build the project**: Verify production build succeeds
   ```bash
   npm run build
   ```

5. **Review all changes**: Check git diff carefully
   ```bash
   git diff
   ```

Only after ALL checks pass should you stage and commit changes. If any step fails, fix the issues before proceeding.

## Documentation-First Development

**NEVER start coding without reading the documentation:**

1. When implementing a new feature, FIRST check if it's documented
2. Read API endpoint documentation to understand request/response formats
3. Check example responses in the documentation
4. Verify the actual API response in browser console matches documentation
5. Only then start implementing the feature

This prevents wasting time on incorrect assumptions about API behavior.