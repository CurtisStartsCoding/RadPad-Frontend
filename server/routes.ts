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
  
  // Enhanced logging for radiology orders endpoint
  if (targetPath.includes('/api/radiology/orders')) {
    log(`🔍 RADIOLOGY ORDERS REQUEST: ${req.method} ${targetPath}`, 'proxy');
    log(`🔍 Query params: ${JSON.stringify(req.query)}`, 'proxy');
    log(`🔍 Headers: ${JSON.stringify(req.headers)}`, 'proxy');
  } else {
    log(`Proxying request to: ${targetUrl}`, 'proxy');
  }
  
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
    
    // Enhanced logging for radiology orders endpoint
    if (targetPath.includes('/api/radiology/orders')) {
      log(`🔍 RADIOLOGY ORDERS RESPONSE: ${response.status}`, 'proxy');
      
      if (contentType.includes('application/json')) {
        // Parse JSON responses
        const jsonData = JSON.parse(response.data.toString());
        log(`🔍 Response body: ${JSON.stringify(jsonData)}`, 'proxy');
        
        // Check if the response has orders
        if (jsonData && jsonData.orders) {
          log(`🔍 Orders count: ${jsonData.orders.length}`, 'proxy');
          
          // Log organization info from the first order if available
          if (jsonData.orders.length > 0) {
            const firstOrder = jsonData.orders[0];
            log(`🔍 First order: ${JSON.stringify({
              id: firstOrder.id,
              status: firstOrder.status,
              referring_organization_id: firstOrder.referring_organization_id,
              radiology_organization_id: firstOrder.radiology_organization_id
            })}`, 'proxy');
          }
        } else {
          log(`🔍 No orders found in response`, 'proxy');
        }
        
        res.json(jsonData);
      } else {
        // Send binary data as is
        log(`🔍 Non-JSON response: ${response.data.toString().substring(0, 200)}...`, 'proxy');
        res.send(response.data);
      }
    } else {
      if (contentType.includes('application/json')) {
        // Parse JSON responses
        const jsonData = JSON.parse(response.data.toString());
        res.json(jsonData);
      } else {
        // Send binary data as is
        res.send(response.data);
      }
      
      log(`Proxy response: ${response.status}`, 'proxy');
    }
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
