import { Request, Response } from 'express';
import { log } from './vite';

/**
 * Utility functions for handling API requests and responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * Parse JWT token and extract payload
 */
export function parseJwtToken(token: string): any {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    return JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  } catch (e) {
    console.error("Error parsing token:", e);
    return null;
  }
}

/**
 * Check if a user is a trial user based on their JWT token
 */
export function isTrialUser(req: Request): boolean {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = parseJwtToken(token);
    
    if (payload) {
      return payload.isTrial === true || 
             payload.role === 'trial_physician' || 
             payload.role === 'trial_user';
    }
  }
  
  return false;
}

/**
 * Get API URL based on environment
 */
export function getApiUrl(req: Request, isProduction: boolean, apiBaseUrl: string): string {
  if (isProduction) {
    return apiBaseUrl;
  } else {
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.protocol || 'http';
    return `${protocol}://${host}`;
  }
}

/**
 * Forward a request to the API and handle the response
 */
export async function forwardRequestToApi(
  req: Request,
  res: Response,
  endpoint: string,
  apiBaseUrl: string,
  method: string = 'GET',
  logPrefix: string = 'API'
): Promise<void> {
  try {
    log(`${logPrefix}: Forwarding ${method} request to ${endpoint}`, 'api');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    log(`${logPrefix}: Authorization header: ${authHeader ? 'Present' : 'Not present'}`, 'api');
    
    // Check if we're in production
    const isProd = isProduction(req);
    log(`${logPrefix}: Environment: ${isProd ? 'Production' : 'Development'}`, 'api');
    
    // Prepare request options
    const url = `${apiBaseUrl}${endpoint}`;
    log(`${logPrefix}: Full URL: ${url}`, 'api');
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && req.body) {
      options.body = JSON.stringify(req.body);
      // Log request body but redact sensitive information
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = '***REDACTED***';
      log(`${logPrefix}: Request body: ${JSON.stringify(safeBody)}`, 'api');
    }
    
    // Make the request
    const response = await fetch(url, options);
    
    // Process the response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    log(`${logPrefix}: Response Status: ${response.status} ${response.statusText}`, 'api');
    
    // Copy headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Log response data (truncated for large responses)
    if (typeof data === 'string') {
      const truncatedData = data.length > 200 ? data.substring(0, 200) + '...' : data;
      log(`${logPrefix}: Response data (string): ${truncatedData}`, 'api');
    } else if (data) {
      const dataStr = JSON.stringify(data);
      const truncatedData = dataStr.length > 200 ? dataStr.substring(0, 200) + '...' : dataStr;
      log(`${logPrefix}: Response data (json): ${truncatedData}`, 'api');
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    log(`${logPrefix}: Response sent to client with status ${response.status}`, 'api');
  } catch (error) {
    log(`${logPrefix}: Error forwarding request to ${apiBaseUrl}${endpoint}: ${error}`, 'error');
    
    // Log more details about the error
    if (error instanceof Error) {
      log(`${logPrefix}: Error name: ${error.name}`, 'error');
      log(`${logPrefix}: Error message: ${error.message}`, 'error');
      log(`${logPrefix}: Error stack: ${error.stack}`, 'error');
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      status: 500
    });
  }
}

/**
 * Check if the environment is production
 */
export function isProduction(req: Request): boolean {
  return req.headers.host !== undefined && req.headers.host.includes('ondigitalocean.app');
}

/**
 * Create standard error response
 */
export function errorResponse(res: Response, status: number, message: string): void {
  res.status(status).json({
    success: false,
    error: message,
    status
  });
}