/**
 * Configuration utilities for the dictation functionality
 */

// API server URL - Use relative URLs in development, absolute in production
// This should be configured by the consuming application
export const API_SERVER_URL = process.env.VITE_API_SERVER_URL || '';

// For TypeScript projects using Vite, add the following to your vite-env.d.ts file:
/*
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_SERVER_URL: string;
  // more env variables...
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
*/

// Other configuration settings can be added here
export const APP_CONFIG = {
  apiServerUrl: API_SERVER_URL,
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

// Configuration for the dictation functionality
export const DICTATION_CONFIG = {
  // Minimum length of dictation text required for processing
  minDictationLength: 20,
  
  // Default compliance score for validation
  defaultComplianceScore: 0.8,
  
  // Number of attempts before allowing override
  overrideAttemptsThreshold: 3,
  
  // Minimum length of override justification
  minOverrideJustificationLength: 20,
  
  // Default patient information
  defaultPatient: {
    id: 0,
    name: "Unknown Patient",
    dob: "Unknown",
    mrn: `${Math.floor(1000000000000 + Math.random() * 9000000000000).toString()}`,
    radiologyGroupId: null,
    referringPracticeId: null,
    externalPatientId: null,
    demographics: undefined,
    encryptedData: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    gender: "unknown"
  }
};