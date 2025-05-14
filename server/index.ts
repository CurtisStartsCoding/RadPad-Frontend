import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";
import { corsMiddleware, errorHandlingMiddleware } from "./middleware";
import { registerAnalyticsRoutes } from "./analytics";

// Create Express application
const app = express();

// Configure basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply CORS middleware
app.use(corsMiddleware);

// Initialize the application
(async () => {
  try {
    // Create HTTP server
    const server = createServer(app);

    // Register analytics routes
    registerAnalyticsRoutes(app);

    // Global error handler
    app.use(errorHandlingMiddleware);

    // Set up Vite in development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server started and listening on port ${port} (direct API mode)`);
    });
  } catch (error) {
    log(`Failed to start server: ${error}`, 'error');
    process.exit(1);
  }
})();
