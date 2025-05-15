import { log } from "./vite";

/**
 * This file previously contained in-memory storage functionality that is no longer needed
 * since the client now communicates directly with the remote API.
 *
 * Keeping this file as a placeholder for future storage-related functionality if needed.
 */

// Log that this module is no longer used
log('Storage module is no longer used - client now communicates directly with the remote API', 'storage');

// Export a dummy storage object to prevent import errors
export const storage = {};
