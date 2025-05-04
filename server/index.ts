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

// Add proxy middleware for API requests to the remote server
app.use('/api', createProxyMiddleware({
  target: 'https://api.radorderpad.com',
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/api': '/api' // Keep the /api prefix
  },
  logLevel: 'debug',
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
} as Options));

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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  // Temporarily using port 3000 for local development since 5000 is in use
  const port = 3000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
