import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test the API connection
console.log("Testing API connection to https://api.radorderpad.com");
fetch('https://api.radorderpad.com/api/auth/session', {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})
.then(response => {
  console.log(`API test response status: ${response.status}`);
  return response.text();
})
.then(text => {
  console.log(`API test response body: ${text}`);
})
.catch(error => {
  console.error(`API test error: ${error}`);
});

// Add a middleware to log all incoming requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    log(`Incoming API request: ${req.method} ${req.path}`);
    if (req.method === 'POST') {
      log(`Request body: ${JSON.stringify(req.body)}`);
    }
  }
  next();
});

// Add direct endpoints that forward to the real API
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login endpoint called, forwarding to real API');
    
    const { email, password } = req.body;
    
    // Forward the request to the real API
    const response = await fetch('https://api.radorderpad.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    // Get the response data
    const data = await response.json();
    
    // Consume and display the auth response in the console
    console.log('\n=== AUTH RESPONSE DETAILS ===');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    if (data.token) {
      // Parse the JWT token to display its contents
      const tokenParts = data.token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('\nToken Payload:');
          console.log(JSON.stringify(payload, null, 2));
          
          // Display token expiration
          if (payload.exp) {
            const expirationDate = new Date(payload.exp * 1000);
            console.log(`\nToken Expires: ${expirationDate.toLocaleString()}`);
            const timeUntilExpiry = Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60);
            console.log(`Time until expiry: ${timeUntilExpiry} minutes`);
          }
        } catch (e) {
          console.error('Error parsing token payload:', e);
        }
      }
    }
    
    if (data.user) {
      console.log('\nUser Details:');
      console.log(JSON.stringify(data.user, null, 2));
    }
    
    console.log('=== END AUTH RESPONSE ===\n');
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    res.status(response.status).json(data);
    
    // Log that the response has been sent
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding login request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add session endpoint for compatibility with client code
app.get('/api/auth/session', (req, res) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  console.log('\n=== SESSION CHECK ===');
  console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // Extract the token
      const token = authHeader.split(' ')[1];
      console.log('Token extracted from header:', token.substring(0, 20) + '...');
      
      // Try to decode the token to get user information
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('Token payload successfully decoded:', payload);
        
        // Verify token expiration
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          console.log('Token is valid and not expired');
          console.log(`Token expires at: ${new Date(payload.exp * 1000).toLocaleString()}`);
          
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
          
          console.log('Returning authenticated session:', sessionResponse);
          console.log('=== END SESSION CHECK ===\n');
          
          // Add CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          
          res.status(200).json(sessionResponse);
          
          // Log that the response has been sent
          console.log(`Response sent to client with status 200 (authenticated)`);
          return;
        } else {
          console.log('Token is expired');
        }
      } else {
        console.log('Invalid token format (not 3 parts)');
      }
    } catch (e) {
      console.error("Error decoding token:", e);
    }
  }
  
  // If no valid token, return not authenticated
  console.log('No valid token found, returning unauthenticated');
  console.log('=== END SESSION CHECK ===\n');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  res.status(200).json({ authenticated: false });
  
  // Log that the response has been sent
  console.log(`Response sent to client with status 200 (unauthenticated)`);
});

// Add CORS preflight handler
app.options('/api/*', (req, res) => {
  console.log('Handling CORS preflight request for:', req.path);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Respond with 204 No Content
  res.status(204).end();
  console.log('CORS preflight response sent');
});

// Create a custom router for API requests
const apiRouter = express.Router();

// Add proxy middleware for API requests to the remote server
apiRouter.use((req, res, next) => {
  // Proxy all API requests to the real API
  const proxy = createProxyMiddleware({
    target: 'https://api.radorderpad.com',
    changeOrigin: true,
    secure: true,
    timeout: 30000, // 30 seconds timeout
    proxyTimeout: 30000, // 30 seconds proxy timeout
    pathRewrite: {
      '^/api': '/api' // Keep the /api prefix
    },
    onProxyReq: (proxyReq: any, req: Request, _res: Response) => {
      // Log the headers being sent to the target
      log(`Proxying ${req.method} ${req.url} to https://api.radorderpad.com`);
      log(`Request headers: ${JSON.stringify(req.headers)}`);
      
      // Log request body if it exists
      if (req.body) {
        log(`Request body: ${JSON.stringify(req.body)}`);
      }
      
      // Ensure the Authorization header is preserved
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
        log(`Setting Authorization header: ${req.headers.authorization}`);
      }
    },
    onProxyRes: (proxyRes: any, req: Request, res: Response) => {
      log(`Received ${proxyRes.statusCode} for ${req.method} ${req.url}`);
      
      // Log response headers
      log(`Response headers: ${JSON.stringify(proxyRes.headers)}`);
      
      // Handle CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Copy authentication token from response header if present
      if (proxyRes.headers['x-auth-token']) {
        res.setHeader('x-auth-token', proxyRes.headers['x-auth-token']);
        log(`Forwarding x-auth-token header to client`);
      }
      
      // Check for and forward any authorization or token headers
      const authHeaders = ['authorization', 'x-auth-token', 'set-cookie'];
      authHeaders.forEach(header => {
        if (proxyRes.headers[header]) {
          res.setHeader(header, proxyRes.headers[header]);
          log(`Forwarding ${header} header to client`);
        }
      });
      
      // Attempt to log response body for debugging
      let responseBody = '';
      proxyRes.on('data', (chunk: Buffer) => {
        responseBody += chunk.toString('utf8');
      });
      
      proxyRes.on('end', () => {
        try {
          log(`Response body: ${responseBody}`);
        } catch (e) {
          log(`Error parsing response body: ${e}`);
        }
      });
    },
    onError: (err: Error, _req: Request, _res: Response) => {
      log(`Proxy error: ${err}`);
      log(`Error stack: ${err.stack}`);
    }
  } as Options);
  
  return proxy(req, res, next);
});

// Mount the API router
app.use('/api', apiRouter);

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT environment variable if available, otherwise default to 3000
  // This allows DigitalOcean to set the port via environment variable
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
