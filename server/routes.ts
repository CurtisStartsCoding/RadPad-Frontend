import { Express, Request, Response, NextFunction, Router } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";
import { storage } from "./storage";
import { log } from "./vite";
import { 
  forwardRequestToApi, 
  isTrialUser, 
  parseJwtToken, 
  isProduction,
  errorResponse
} from "./utils";

// Get API URL from environment variable or use default
const apiUrl = process.env.API_URL || 'https://api.radorderpad.com';

/**
 * Register all application routes
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router for specific endpoints
  const apiRouter = Router();
  
  // Authentication endpoints
  registerAuthRoutes(app);
  
  // Order endpoints
  registerOrderRoutes(app);
  
  // Analytics endpoints
  registerAnalyticsRoutes(app);
  
  // Admin endpoints
  registerAdminRoutes(app);
  
  // Navigation endpoints
  registerNavigationRoutes(app);
  
  // Set up API proxy for all other API requests
  setupApiProxy(apiRouter);
  
  // Mount the API router for all other API routes
  app.use('/api', apiRouter);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

/**
 * Register authentication-related routes
 */
function registerAuthRoutes(app: Express) {
  // Regular login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const endpoint = '/api/auth/login';
    await forwardRequestToApi(req, res, endpoint, apiUrl, 'POST', 'AUTH LOGIN');
  });
  
  // Session endpoint
  app.get('/api/auth/session', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    log('SESSION CHECK: Authorization header: ' + (authHeader ? 'Present' : 'Not present'), 'auth');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = parseJwtToken(token);
      
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        log('Token is valid and not expired', 'auth');
        
        // Return an authenticated session with user info from token
        const sessionResponse = {
          authenticated: true,
          user: {
            id: payload.userId,
            email: payload.email,
            name: payload.name || payload.email || 'User',
            role: payload.role,
            organizationId: payload.orgId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        };
        
        return res.status(200).json(sessionResponse);
      }
    }
    
    // If no valid token, return not authenticated
    log('No valid token found, returning unauthenticated', 'auth');
    res.status(200).json({ authenticated: false });
  });
  
  // Trial login endpoint
  app.post('/api/auth/trial/login', async (req: Request, res: Response) => {
    const endpoint = '/api/auth/trial/login';
    await forwardRequestToApi(req, res, endpoint, apiUrl, 'POST', 'TRIAL LOGIN');
  });
  
  // Trial registration endpoint
  app.post('/api/auth/trial/register', async (req: Request, res: Response) => {
    const endpoint = '/api/auth/trial/register';
    await forwardRequestToApi(req, res, endpoint, apiUrl, 'POST', 'TRIAL REGISTRATION');
  });
}

/**
 * Register order-related routes
 */
function registerOrderRoutes(app: Express) {
  // Order validation endpoint
  app.post('/api/orders/validate', async (req: Request, res: Response) => {
    const endpoint = '/api/orders/validate';
    await forwardRequestToApi(req, res, endpoint, apiUrl, 'POST', 'ORDER VALIDATION');
  });
  
  // Trial order validation endpoint
  app.post('/api/orders/validate/trial', async (req: Request, res: Response) => {
    const endpoint = '/api/orders/validate/trial';
    await forwardRequestToApi(req, res, endpoint, apiUrl, 'POST', 'TRIAL ORDER VALIDATION');
  });
  
  // Get orders endpoint
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      log('ORDERS REQUEST: Forwarding orders request to real API', 'orders');
      
      // Get auth token from request
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return errorResponse(res, 401, 'Unauthorized');
      }
      
      // Check if this is a trial user
      const trialUser = isTrialUser(req);
      
      // Determine the appropriate endpoint based on user type
      let endpoint = '/api/orders';
      if (trialUser) {
        log('Trial user detected, using trial-specific endpoint', 'orders');
        endpoint = '/api/orders/trial';
      }
      
      // Add query parameters if present
      const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      endpoint = `${endpoint}${queryString}`;
      
      // Forward the request to the real API
      await forwardRequestToApi(req, res, endpoint, apiUrl, 'GET', 'ORDERS');
    } catch (error) {
      log(`Error handling orders request: ${error}`, 'error');
      errorResponse(res, 500, 'Internal server error during orders request');
    }
  });
  
  // Update order endpoint
  app.put('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      const endpoint = `/api/orders/${orderId}`;
      await forwardRequestToApi(req, res, endpoint, apiUrl, 'PUT', 'ORDER UPDATE');
    } catch (error) {
      log(`Error updating order: ${error}`, 'error');
      errorResponse(res, 500, 'Internal server error during order update');
    }
  });
}

/**
 * Register analytics-related routes
 */
function registerAnalyticsRoutes(app: Express) {
  // Analytics dashboard endpoint
  app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
    try {
      log('ANALYTICS DASHBOARD REQUEST: Forwarding to real API', 'analytics');
      
      // Get auth token from request
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return errorResponse(res, 401, 'Unauthorized');
      }
      
      // Check if this is a trial user
      const trialUser = isTrialUser(req);
      
      // Determine the appropriate endpoint based on user type
      let endpoint = '/api/analytics/dashboard';
      if (trialUser) {
        log('Trial user detected, using trial-specific endpoint', 'analytics');
        endpoint = '/api/analytics/dashboard/trial';
      }
      
      // Forward to the real API
      await forwardRequestToApi(req, res, endpoint, apiUrl, 'GET', 'ANALYTICS');
    } catch (error) {
      log(`Error handling analytics request: ${error}`, 'error');
      errorResponse(res, 500, 'Internal server error during analytics dashboard generation');
    }
  });
}

/**
 * Register admin-related routes
 */
function registerAdminRoutes(app: Express) {
  // Admin orders queue endpoint
  app.get('/api/admin/orders/queue', async (req: Request, res: Response) => {
    try {
      log('ADMIN ORDERS QUEUE REQUEST: Forwarding to real API', 'admin');
      
      // Get auth token from request
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return errorResponse(res, 401, 'Unauthorized');
      }
      
      // Check if this is a trial user
      const trialUser = isTrialUser(req);
      
      // Determine the appropriate endpoint based on user type
      let endpoint = '/api/admin/orders/queue';
      if (trialUser) {
        log('Trial user detected, using trial-specific endpoint', 'admin');
        endpoint = '/api/admin/orders/queue/trial';
      }
      
      // Forward to the real API
      await forwardRequestToApi(req, res, endpoint, apiUrl, 'GET', 'ADMIN QUEUE');
    } catch (error) {
      log(`Error handling admin queue request: ${error}`, 'error');
      errorResponse(res, 500, 'Internal server error during admin orders queue request');
    }
  });
}

/**
 * Register navigation-related routes
 */
function registerNavigationRoutes(app: Express) {
  // Navigation endpoint for "New Order" button
  app.get('/api/navigation/new-order', (req: Request, res: Response) => {
    try {
      log('NAVIGATION REQUEST: New Order button clicked', 'navigation');
      
      // Check if this is a trial user
      const trialUser = isTrialUser(req);
      
      if (trialUser) {
        log('Trial user detected, redirecting to trial-validation', 'navigation');
        return res.json({
          success: true,
          data: {
            redirect: '/trial-validation'
          }
        });
      } else {
        log('Regular user detected, redirecting to new-order', 'navigation');
        return res.json({
          success: true,
          data: {
            redirect: '/new-order'
          }
        });
      }
    } catch (error) {
      log(`Error handling navigation request: ${error}`, 'error');
      errorResponse(res, 500, 'Internal server error during navigation');
    }
  });
}

/**
 * Set up API proxy for all other API requests
 */
function setupApiProxy(apiRouter: Router) {
  apiRouter.use((req: Request, res: Response, next: NextFunction) => {
    // Proxy all API requests to the real API
    const proxy = createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
      secure: true,
      timeout: 30000, // 30 seconds timeout
      proxyTimeout: 30000, // 30 seconds proxy timeout
      pathRewrite: {
        '^/api': '/api' // Keep the /api prefix
      },
      onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
        // Log the headers being sent to the target
        log(`Proxying ${req.method} ${req.url} to ${apiUrl}`, 'proxy');
        
        // Ensure the Authorization header is preserved
        if (req.headers.authorization) {
          proxyReq.setHeader('Authorization', req.headers.authorization);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, res: Response) => {
        log(`Received ${proxyRes.statusCode} for ${req.method} ${req.url}`, 'proxy');
        
        // Copy authentication token from response header if present
        const authHeaders = ['authorization', 'x-auth-token', 'set-cookie'];
        authHeaders.forEach(header => {
          if (proxyRes.headers[header]) {
            res.setHeader(header, proxyRes.headers[header]);
          }
        });
      },
      onError: (err: Error, _req: Request, _res: Response) => {
        log(`Proxy error: ${err}`, 'error');
      }
    } as Options);
    
    return proxy(req, res, next);
  });
}
