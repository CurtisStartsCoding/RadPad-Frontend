import { Request, Response, NextFunction } from 'express';
import { log } from './vite';
import { isTrialUser } from './utils';

/**
 * Middleware for handling CORS
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Get allowed origins from environment variable or use default
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || process.env.DEFAULT_ALLOWED_ORIGIN || 'http://localhost:3000';
  const allowedOrigins = allowedOriginsStr.split(',').map(origin => origin.trim());
  const origin = req.headers.origin;
  
  // Check if the origin is in our allowed origins list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // For local development or unknown origins, use a wildcard
    // but credentials won't work with wildcard origins
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(204).end();
  }
  
  next();
}

/**
 * Middleware for logging requests and responses
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log response details when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Truncate long response logs
      if (capturedJsonResponse) {
        const responseStr = JSON.stringify(capturedJsonResponse);
        if (responseStr.length > 80) {
          logLine += ` :: ${responseStr.slice(0, 79) + "…"}`;
        } else {
          logLine += ` :: ${responseStr}`;
        }
      }

      log(logLine);
    }
  });

  next();
}

/**
 * Middleware for logging API requests
 */
export function apiLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith('/api')) {
    log(`Incoming API request: ${req.method} ${req.path}`);
    
    // Log request body for POST/PUT requests, but redact sensitive information
    if (req.method === 'POST' || req.method === 'PUT') {
      const safeBody = { ...req.body };
      if (safeBody.password) safeBody.password = '***REDACTED***';
      log(`Request body: ${JSON.stringify(safeBody)}`);
    }
  }
  next();
}

/**
 * Middleware to check authentication
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized',
      status: 401
    });
  }
  
  next();
}

/**
 * Middleware to handle navigation based on user role
 * This middleware checks if a user is a trial user and redirects appropriately
 * for 'New Order' button clicks
 */
export function navigationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to navigation requests
  if (req.path === '/api/navigation/new-order') {
    const trialUser = isTrialUser(req);
    
    if (trialUser) {
      // Trial users should be redirected to trial-validation
      return res.json({
        redirect: '/trial-validation'
      });
    } else {
      // Regular users should be redirected to new-order
      return res.json({
        redirect: '/new-order'
      });
    }
  }
  
  next();
}

/**
 * Error handling middleware
 */
export function errorHandlingMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  log(`Error: ${message}`, 'error');
  
  res.status(status).json({ 
    success: false,
    error: message,
    status
  });
}