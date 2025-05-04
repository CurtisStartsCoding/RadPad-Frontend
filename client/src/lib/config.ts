/**
 * Client-side configuration
 * This file provides access to environment variables and configuration settings
 */

// API server URL - Use environment variable if available, otherwise use the production URL
export const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || '';

// Remote API URL - This is the actual remote API endpoint
export const REMOTE_API_URL = 'https://api.radorderpad.com';

// Other configuration settings can be added here
export const APP_CONFIG = {
  apiServerUrl: API_SERVER_URL || REMOTE_API_URL,
  // Add other configuration settings as needed
  useMockEndpoints: false, // Set to false to ensure we're using the real API
};

// Export a function to get the full API URL
export function getApiUrl(path: string): string {
  // For local development, we use the local server as a proxy
  // If path already starts with /api, use it directly
  if (path.startsWith('/api')) {
    return path;
  }
  
  // Otherwise, prepend /api to the path
  return `/api${path}`;
}

/**
 * Utility function to log API configuration
 * This helps verify that the app is using the remote API
 */
export function logApiConfiguration(): void {
  console.group('🌐 API Configuration');
  console.log(`🔗 Remote API URL: ${REMOTE_API_URL}`);
  console.log(`🔄 Using Mock Endpoints: ${APP_CONFIG.useMockEndpoints ? 'Yes' : 'No'}`);
  console.log(`🔌 API requests are being forwarded to the real API at ${REMOTE_API_URL}`);
  console.groupEnd();
}