/**
 * Client-side configuration
 * This file provides access to environment variables and configuration settings
 */

// API server URL - Use environment variable if available, otherwise use relative paths
export const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || '';

// Remote API URL - This is the actual remote API endpoint (only used for logging)
export const REMOTE_API_URL = 'https://api.radorderpad.com';

// Other configuration settings can be added here
export const APP_CONFIG = {
  // Always use relative paths in production to go through our proxy server
  apiServerUrl: '',
  // Add other configuration settings as needed
  useMockEndpoints: false, // Set to false to ensure we're using the real API
};

// Export a function to get the full API URL
export function getApiUrl(path: string): string {
  // Always use relative paths to ensure requests go through our proxy server
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
  console.log(`🔗 Using Relative Paths: Always (to go through proxy server)`);
  console.log(`🔄 Using Mock Endpoints: ${APP_CONFIG.useMockEndpoints ? 'Yes' : 'No'}`);
  console.log(`🔌 API requests are being proxied to ${REMOTE_API_URL}`);
  console.groupEnd();
}