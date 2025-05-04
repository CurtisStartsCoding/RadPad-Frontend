/**
 * Client-side configuration
 * This file provides access to environment variables and configuration settings
 */

// API server URL - Use environment variable if available, otherwise use the production URL
export const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || '';

// Other configuration settings can be added here
export const APP_CONFIG = {
  apiServerUrl: API_SERVER_URL || 'https://api.radorderpad.com',
  // Add other configuration settings as needed
};

// Export a function to get the full API URL
export function getApiUrl(path: string): string {
  // If path already starts with /api, use it directly
  if (path.startsWith('/api')) {
    return path;
  }
  
  // Otherwise, prepend /api to the path
  return `/api${path}`;
}