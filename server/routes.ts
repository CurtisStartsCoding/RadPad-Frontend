import { Express, Request, Response } from "express";
import { type Server } from "http";
import { log } from "./vite";
import axios from "axios";
import { errorResponse } from "./utils";

/**
 * API proxy middleware to forward requests to the remote API
 * This solves CORS issues when deployed to production
 */
async function apiProxyMiddleware(req: Request, res: Response) {
  const apiUrl = process.env.API_URL || 'https://api.radorderpad.com';
  
  // Fix the URL path - the client is sending /api/auth/login but the remote API expects /api/auth/login
  // We need to ensure the /api prefix is preserved
  let targetPath = req.url;
  
  // Make sure we're using the correct path format for the remote API
  if (!targetPath.startsWith('/api/') && !targetPath.startsWith('/api')) {
    targetPath = `/api${targetPath}`;
  }
  
  const targetUrl = `${apiUrl}${targetPath}`;
  
  log(`Proxying request to: ${targetUrl}`, 'proxy');
  
  try {
    // Forward the request headers (including Authorization)
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      // Skip host header to avoid conflicts
      if (key.toLowerCase() !== 'host' && typeof value === 'string') {
        headers[key] = value;
      }
    }
    
    // Forward the request to the remote API
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: req.body,
      responseType: 'arraybuffer', // Handle binary responses
      validateStatus: () => true, // Don't throw on non-2xx responses
    });
    
    // Forward the response headers
    for (const [key, value] of Object.entries(response.headers)) {
      // Skip content-length as it might be modified
      if (key.toLowerCase() !== 'content-length' && value !== undefined) {
        // Handle array of strings
        if (Array.isArray(value)) {
          res.setHeader(key, value);
        } else {
          // Convert to string if necessary
          res.setHeader(key, String(value));
        }
      }
    }
    
    // Forward the response status and body
    res.status(response.status);
    
    // Handle different content types
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      // Parse JSON responses
      const jsonData = JSON.parse(response.data.toString());
      res.json(jsonData);
    } else {
      // Send binary data as is
      res.send(response.data);
    }
    
    log(`Proxy response: ${response.status}`, 'proxy');
  } catch (error) {
    log(`Proxy error: ${error}`, 'error');
    errorResponse(res, 500, `Proxy error: ${error}`);
  }
}

/**
 * Register application routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  log('Registering API proxy routes', 'routes');
  
  // Proxy all /api/* requests to the remote API
  app.use('/api', apiProxyMiddleware);
  
  // Return a dummy server object
  return {} as Server;
}
