import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";

// Get API URL from environment variable or use default
const apiUrl = process.env.API_URL || 'https://api.radorderpad.com';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware to handle all CORS requests
app.use((req, res, next) => {
  // Get allowed origins from environment variable or use default
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || process.env.DEFAULT_ALLOWED_ORIGIN || 'http://localhost:3000';
  const allowedOrigins = allowedOriginsStr.split(',').map(origin => origin.trim());
  const origin = req.headers.origin;
  
  // Check if the origin is in our allowed origins list
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // For local development or unknown origins, you can use a wildcard
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
});

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
console.log(`Testing API connection to ${apiUrl}`);
fetch(`${apiUrl}/api/auth/session`, {
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
    const response = await fetch(`${apiUrl}/api/auth/login`, {
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
    
    // CORS headers are now handled by the middleware
    
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
          
          // CORS headers are now handled by the middleware
          
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
  
  // CORS headers are now handled by the middleware
  
  res.status(200).json({ authenticated: false });
  
  // Log that the response has been sent
  console.log(`Response sent to client with status 200 (unauthenticated)`);
});

// Add specific endpoint for trial login with enhanced logging
app.post('/api/auth/trial/login', async (req, res) => {
  try {
    console.log('\n=== TRIAL LOGIN REQUEST ===');
    console.log('Forwarding trial login request to real API');
    
    const { email, password } = req.body;
    console.log('Request body:', JSON.stringify({ email, password: '***REDACTED***' }, null, 2));
    
    // Forward the request to the real API
    const response = await fetch(`${apiUrl}/api/auth/trial/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ email, password })
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END TRIAL LOGIN ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding trial login request:', error);
    res.status(500).json({ message: 'Internal server error during trial login' });
  }
});

// Add specific endpoint for trial registration with enhanced logging
app.post('/api/auth/trial/register', async (req, res) => {
  try {
    console.log('\n=== TRIAL REGISTRATION REQUEST ===');
    console.log('Forwarding trial registration request to real API');
    
    const { email, password, firstName, lastName, specialty } = req.body;
    console.log('Request body:', JSON.stringify({
      email,
      password: '***REDACTED***',
      firstName,
      lastName,
      specialty
    }, null, 2));
    
    // Forward the request to the real API
    const response = await fetch(`${apiUrl}/api/auth/trial/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ email, password, firstName, lastName, specialty })
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END TRIAL REGISTRATION ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding trial registration request:', error);
    res.status(500).json({ message: 'Internal server error during trial registration' });
  }
});

// Add specific endpoint for order validation with enhanced logging
app.post('/api/orders/validate', async (req, res) => {
  try {
    console.log('\n=== ORDER VALIDATION REQUEST ===');
    console.log('Forwarding validation request to real API');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // Log request body
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Forward the request to the real API
    const response = await fetch(`${apiUrl}/api/orders/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      body: JSON.stringify(req.body)
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END ORDER VALIDATION ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding validation request:', error);
    res.status(500).json({ message: 'Internal server error during validation' });
  }
});

// Add specific endpoint for trial validation with enhanced logging
app.post('/api/orders/validate/trial', async (req, res) => {
  try {
    console.log('\n=== TRIAL ORDER VALIDATION REQUEST ===');
    console.log('Forwarding trial validation request to real API');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // Log request body
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Forward the request to the real API
    const response = await fetch(`${apiUrl}/api/orders/validate/trial`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      body: JSON.stringify(req.body)
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END TRIAL ORDER VALIDATION ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding trial validation request:', error);
    res.status(500).json({ message: 'Internal server error during trial validation' });
  }
});

// CORS preflight is now handled by the middleware

// Create a custom router for API requests
const apiRouter = express.Router();

// Add proxy middleware for API requests to the remote server
apiRouter.use((req, res, next) => {
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
      log(`Proxying ${req.method} ${req.url} to ${apiUrl}`);
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
      
      // CORS headers are now handled by the middleware
      
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

// Add specific endpoint for analytics dashboard that generates data from orders
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    console.log('\n=== ANALYTICS DASHBOARD REQUEST ===');
    console.log('Generating analytics dashboard data from orders');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // First, fetch orders from the real API to generate analytics from
    const ordersResponse = await fetch(`${apiUrl}/api/orders`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Authorization': authHeader
      }
    });
    
    if (!ordersResponse.ok) {
      console.log(`Error fetching orders: ${ordersResponse.status} ${ordersResponse.statusText}`);
      return res.status(ordersResponse.status).json({ message: 'Error fetching orders data' });
    }
    
    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];
    
    // Generate analytics data based on orders
    const analyticsData = generateAnalyticsFromOrders(orders);
    
    console.log('\nGenerated analytics data successfully');
    console.log('=== END ANALYTICS DASHBOARD REQUEST ===\n');
    
    // Return the generated analytics data
    res.status(200).json(analyticsData);
    
    console.log(`Response sent to client with status 200`);
  } catch (error) {
    console.error('Error generating analytics dashboard data:', error);
    res.status(500).json({ message: 'Internal server error during analytics dashboard generation' });
  }
});

// Helper function to generate analytics data from orders
interface Order {
  id: number;
  order_number: string;
  patient_id: number;
  status: string;
  modality?: string;
  created_at: string;
  updated_at: string;
  final_validation_status?: string;
  [key: string]: any; // Allow for other properties
}

interface ActivityData {
  orders: number;
  validations: number;
}

function generateAnalyticsFromOrders(orders: Order[]): any {
  // Count orders by month for activity data
  const activityByMonth: Record<string, ActivityData> = {};
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
    activityByMonth[monthKey] = { orders: 0, validations: 0 };
  }
  
  // Count modalities
  const modalityCount: Record<string, number> = {};
  
  // Calculate stats
  let completedStudies = 0;
  let pendingOrders = 0;
  let totalCompletionTime = 0;
  let completedOrdersCount = 0;
  let validationSuccessCount = 0;
  let validationAttemptCount = 0;
  
  // Process orders
  orders.forEach(order => {
    // Activity data by month
    const createdAt = new Date(order.created_at);
    const monthKey = `${monthNames[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
    
    if (activityByMonth[monthKey]) {
      activityByMonth[monthKey].orders += 1;
      
      // Assume each order with a final validation status had a validation attempt
      if (order.final_validation_status) {
        activityByMonth[monthKey].validations += 1;
        validationAttemptCount += 1;
        
        if (order.final_validation_status === 'compliant') {
          validationSuccessCount += 1;
        }
      }
    }
    
    // Modality distribution
    const modality = order.modality || 'Unknown';
    modalityCount[modality] = (modalityCount[modality] || 0) + 1;
    
    // Stats
    if (order.status === 'completed') {
      completedStudies += 1;
      
      // Calculate completion time if we have both dates
      if (order.created_at && order.updated_at) {
        const created = new Date(order.created_at).getTime();
        const updated = new Date(order.updated_at).getTime();
        const completionTime = (updated - created) / (1000 * 60 * 60 * 24); // in days
        totalCompletionTime += completionTime;
        completedOrdersCount += 1;
      }
    } else if (order.status === 'pending_admin' || order.status === 'pending_radiology' || order.status === 'pending_validation') {
      pendingOrders += 1;
    }
  });
  
  // Convert activity data to array
  const activity_data = Object.keys(activityByMonth).map(month => ({
    name: month,
    orders: activityByMonth[month].orders,
    validations: activityByMonth[month].validations
  }));
  
  // Convert modality data to array
  const modality_distribution = Object.keys(modalityCount).map(name => ({
    name,
    value: modalityCount[name]
  }));
  
  // Sort modality distribution by count (descending)
  modality_distribution.sort((a, b) => b.value - a.value);
  
  // Take only top 5 modalities
  const top5Modalities = modality_distribution.slice(0, 5);
  
  // Calculate average completion time
  const avgCompletionTime = completedOrdersCount > 0 ? totalCompletionTime / completedOrdersCount : 0;
  
  // Calculate validation success rate
  const validationSuccessRate = validationAttemptCount > 0 ? (validationSuccessCount / validationAttemptCount) * 100 : 0;
  
  // Count orders in current quarter
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
  const ordersThisQuarter = orders.filter(order => new Date(order.created_at) >= quarterStart).length;
  
  // Count unique patients
  const uniquePatientIds = new Set();
  orders.forEach(order => {
    if (order.patient_id) {
      uniquePatientIds.add(order.patient_id);
    }
  });
  const activePatients = uniquePatientIds.size;
  
  return {
    activity_data,
    modality_distribution: top5Modalities,
    stats: {
      total_orders: orders.length,
      completed_studies: completedStudies,
      active_patients: activePatients,
      pending_orders: pendingOrders,
      avg_completion_time: parseFloat(avgCompletionTime.toFixed(1)),
      validation_success_rate: parseFloat(validationSuccessRate.toFixed(1)),
      orders_this_quarter: ordersThisQuarter
    }
  };
}

// Add specific endpoint for orders with enhanced logging
app.get('/api/orders', async (req, res) => {
  try {
    console.log('\n=== ORDERS REQUEST ===');
    console.log('Forwarding orders request to real API');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // Check if this is a trial user by examining the token
    let isTrialUser = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          isTrialUser = payload.isTrial === true || payload.role === 'trial_physician' || payload.role === 'trial-user';
          if (isTrialUser) {
            console.log('Trial user detected, will provide mock data');
          }
        }
      } catch (e) {
        console.error("Error examining token:", e);
      }
    }
    
    // For trial users, provide mock data
    if (isTrialUser) {
      // Generate mock orders data
      const mockOrders = [
        {
          id: 1001,
          order_number: "TRIAL-001",
          status: "completed",
          modality: "MRI",
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          patient_first_name: "John",
          patient_last_name: "Doe",
          patient_dob: "1980-05-15",
          patient_mrn: "MRN12345",
          patient_gender: "Male",
          radiology_organization_name: "Trial Radiology Group",
          clinical_indication: "Lower back pain radiating to left leg",
          original_dictation: "Patient presents with lower back pain radiating to left leg for 3 weeks. No trauma. Request MRI lumbar spine."
        },
        {
          id: 1002,
          order_number: "TRIAL-002",
          status: "pending_radiology",
          modality: "CT",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          patient_first_name: "Jane",
          patient_last_name: "Smith",
          patient_dob: "1975-10-20",
          patient_mrn: "MRN67890",
          patient_gender: "Female",
          radiology_organization_name: "Trial Radiology Group",
          clinical_indication: "Persistent headaches, rule out intracranial pathology",
          original_dictation: "Patient with persistent headaches for 2 months, not responding to medication. Request CT head without contrast."
        },
        {
          id: 1003,
          order_number: "TRIAL-003",
          status: "scheduled",
          modality: "X-Ray",
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          patient_first_name: "Robert",
          patient_last_name: "Johnson",
          patient_dob: "1990-03-10",
          patient_mrn: "MRN24680",
          patient_gender: "Male",
          radiology_organization_name: "Trial Radiology Group",
          clinical_indication: "Possible fracture after fall",
          original_dictation: "Patient fell while playing basketball yesterday. Pain and swelling in right ankle. Request X-ray right ankle."
        },
        {
          id: 1004,
          order_number: "TRIAL-004",
          status: "pending_admin",
          modality: "Ultrasound",
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          patient_first_name: "Emily",
          patient_last_name: "Williams",
          patient_dob: "1985-12-15",
          patient_mrn: "MRN13579",
          patient_gender: "Female",
          radiology_organization_name: "Trial Radiology Group",
          clinical_indication: "Right upper quadrant pain, rule out gallstones",
          original_dictation: "Patient with right upper quadrant pain after meals for 2 weeks. Request abdominal ultrasound."
        },
        {
          id: 1005,
          order_number: "TRIAL-005",
          status: "completed",
          modality: "MRI",
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
          patient_first_name: "Michael",
          patient_last_name: "Brown",
          patient_dob: "1970-07-25",
          patient_mrn: "MRN97531",
          patient_gender: "Male",
          radiology_organization_name: "Trial Radiology Group",
          clinical_indication: "Knee pain and swelling after sports injury",
          original_dictation: "Patient injured right knee playing soccer 3 weeks ago. Persistent pain and swelling. Request MRI right knee."
        }
      ];
      
      // Create a response similar to what the real API would return
      const mockResponse = {
        orders: mockOrders,
        pagination: {
          total: mockOrders.length,
          page: 1,
          limit: 10,
          pages: 1
        }
      };
      
      console.log('Returning mock orders data for trial user');
      console.log('=== END ORDERS REQUEST ===\n');
      
      return res.status(200).json(mockResponse);
    }
    
    // For regular users, forward the request to the real API
    const response = await fetch(`${apiUrl}/api/orders${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END ORDERS REQUEST ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding orders request:', error);
    res.status(500).json({ message: 'Internal server error during orders request' });
  }
});

// Add specific endpoint for analytics dashboard with enhanced logging
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    console.log('\n=== ANALYTICS DASHBOARD REQUEST ===');
    console.log('Forwarding analytics dashboard request to real API');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // Check if this is a trial user by examining the token
    let isTrialUser = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          isTrialUser = payload.isTrial === true || payload.role === 'trial_physician' || payload.role === 'trial-user';
          if (isTrialUser) {
            console.log('Trial user detected, will provide mock data');
          }
        }
      } catch (e) {
        console.error("Error examining token:", e);
      }
    }
    
    // For trial users, provide mock analytics data
    if (isTrialUser) {
      // Generate mock analytics data
      const mockAnalytics = {
        activity_data: [
          { name: "Dec 2024", orders: 12, validations: 10 },
          { name: "Jan 2025", orders: 15, validations: 13 },
          { name: "Feb 2025", orders: 18, validations: 16 },
          { name: "Mar 2025", orders: 22, validations: 20 },
          { name: "Apr 2025", orders: 25, validations: 23 },
          { name: "May 2025", orders: 5, validations: 5 }
        ],
        modality_distribution: [
          { name: "MRI", value: 35 },
          { name: "CT", value: 25 },
          { name: "X-Ray", value: 20 },
          { name: "Ultrasound", value: 15 },
          { name: "Other", value: 5 }
        ],
        stats: {
          total_orders: 97,
          completed_studies: 85,
          active_patients: 42,
          pending_orders: 12,
          avg_completion_time: 2.3,
          validation_success_rate: 92.5,
          orders_this_quarter: 52
        }
      };
      
      console.log('Returning mock analytics data for trial user');
      console.log('=== END ANALYTICS DASHBOARD REQUEST ===\n');
      
      return res.status(200).json(mockAnalytics);
    }
    
    // For regular users, forward the request to the real API
    const response = await fetch(`${apiUrl}/api/analytics/dashboard`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END ANALYTICS DASHBOARD REQUEST ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding analytics dashboard request:', error);
    res.status(500).json({ message: 'Internal server error during analytics dashboard request' });
  }
});

// Add specific endpoint for order updates with enhanced logging
app.put('/api/orders/:id', async (req, res) => {
  try {
    console.log('\n=== ORDER UPDATE REQUEST ===');
    console.log(`Forwarding order update request to real API for order ID: ${req.params.id}`);
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // Log request body
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Forward the request to the real API
    const response = await fetch(`${apiUrl}/api/orders/${req.params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      body: JSON.stringify(req.body)
    });
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Log response details
    console.log('\nResponse Status:', response.status, response.statusText);
    console.log('Response Headers:');
    response.headers.forEach((value, name) => {
      console.log(`  ${name}: ${value}`);
    });
    
    console.log('\nResponse Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('=== END ORDER UPDATE REQUEST ===\n');
    
    // Copy any headers from the original response
    for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
      if (key.toLowerCase() !== 'content-length') {  // Skip content-length as it will be set automatically
        res.setHeader(key, value);
      }
    }
    
    // Forward the status and data back to the client
    if (typeof data === 'string') {
      res.status(response.status).send(data);
    } else {
      res.status(response.status).json(data);
    }
    
    console.log(`Response sent to client with status ${response.status}`);
  } catch (error) {
    console.error('Error forwarding order update request:', error);
    res.status(500).json({ message: 'Internal server error during order update' });
  }
});

// Add specific endpoint for admin orders queue with mock data
app.get('/api/admin/orders/queue', async (req, res) => {
  try {
    console.log('\n=== ADMIN ORDERS QUEUE REQUEST ===');
    console.log('Generating mock admin orders queue data');
    
    // Get auth token from request
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Not present');
    
    // First, fetch orders from the real API to use as a base for our mock data
    const ordersResponse = await fetch(`${apiUrl}/api/orders`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      }
    });
    
    if (!ordersResponse.ok) {
      console.log(`Error fetching orders: ${ordersResponse.status} ${ordersResponse.statusText}`);
      return res.status(500).json({ message: 'Error fetching orders data' });
    }
    
    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];
    
    // Transform the orders into the format expected by the admin queue
    const adminQueueOrders = orders.map((order: any) => {
      return {
        id: order.id,
        order_number: order.order_number || `ORD-${Date.now()}`,
        status: order.status,
        modality: order.modality || 'MRI',
        created_at: order.created_at,
        updated_at: order.updated_at,
        patient: {
          id: order.patient_id,
          name: `${order.patient_first_name || 'John'} ${order.patient_last_name || 'Smith'}`,
          mrn: order.patient_mrn || `MRN-${Math.floor(Math.random() * 10000)}`,
          dob: order.patient_dob || '1980-01-01',
          gender: order.patient_gender || 'Male'
        },
        radiology_group: {
          id: order.radiology_organization_id,
          name: order.radiology_organization_name || 'City Radiology Center'
        }
      };
    });
    
    // Create a mock response
    const mockResponse = {
      orders: adminQueueOrders,
      pagination: {
        total: adminQueueOrders.length,
        page: 1,
        limit: 20,
        pages: 1
      }
    };
    
    console.log('\nGenerated mock admin queue data successfully');
    console.log('=== END ADMIN ORDERS QUEUE REQUEST ===\n');
    
    // Return the mock data
    res.status(200).json(mockResponse);
    
    console.log(`Response sent to client with status 200`);
  } catch (error) {
    console.error('Error generating admin orders queue data:', error);
    res.status(500).json({ message: 'Internal server error during admin orders queue request' });
  }
});

// Mount the API router for all other API routes
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
