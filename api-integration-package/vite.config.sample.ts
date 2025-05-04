import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// This is a sample Vite configuration file that demonstrates how to set up
// a proxy to the RadOrderPad API server.

export default defineConfig({
  // Define environment variables to be exposed to the client
  define: {
    'import.meta.env.VITE_API_SERVER_URL': JSON.stringify('https://api.radorderpad.com'),
  },
  plugins: [
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Add server configuration with proxy
  server: {
    port: 3000, // Changed from 5001 to 3000 as requested
    proxy: {
      // Proxy all /api requests to the actual API server
      '/api': {
        target: 'https://api.radorderpad.com',
        changeOrigin: true,
        secure: true,
        headers: {
          Connection: 'keep-alive'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log the headers being sent to the target
            console.log('Sending Request to the Target:', req.method, req.url);
            
            // Ensure the Authorization header is preserved
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization);
              console.log('Setting Authorization header:', req.headers.authorization);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
});