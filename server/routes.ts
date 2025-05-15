import { Express } from "express";
import { type Server } from "http";
import { log } from "./vite";

/**
 * This file previously contained API proxy routes that are no longer needed
 * since the client now communicates directly with the remote API.
 *
 * Keeping this file as a placeholder for future route definitions if needed.
 */

/**
 * Register application routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  log('No routes to register - client now communicates directly with the remote API', 'routes');
  
  // Return a dummy server object
  return {} as Server;
}
