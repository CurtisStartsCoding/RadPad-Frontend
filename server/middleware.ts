import { Request, Response, NextFunction } from 'express';
import { log } from './vite';

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