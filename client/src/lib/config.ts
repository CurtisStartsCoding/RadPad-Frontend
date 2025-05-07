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
  // If we're in development mode and using a local proxy, we can use relative paths
  if (API_SERVER_URL) {
    // If path already starts with /api, use it directly
    if (path.startsWith('/api')) {
      return path;
    }
    
    // Otherwise, prepend /api to the path
    return `/api${path}`;
  }
  
  // In production, we need to use the full remote URL
  // If path already starts with /api, append it to the remote URL
  if (path.startsWith('/api')) {
    return `${REMOTE_API_URL}${path}`;
  }
  
  // Otherwise, prepend /api to the path and append to remote URL
  return `${REMOTE_API_URL}/api${path}`;
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