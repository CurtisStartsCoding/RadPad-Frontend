import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl } from "./config";
import { getAuthToken } from "./auth";

/**
 * Custom error handling for API responses
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse the error as JSON first
      const json = await res.json();
      throw new Error(`${res.status}: ${json.error || json.message || JSON.stringify(json)}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes(`${res.status}:`)) {
        throw e; // Re-throw the error we just created
      }
      // If JSON parsing fails, fall back to text
      const text = await res.text() || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

/**
 * Enhanced API request function with caching disabled
 * to ensure authentication state is always fresh
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add cache-busting query parameter for GET requests
  const cacheBustUrl = method === 'GET' ?
    `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}` :
    url;
  
  // For authentication-related endpoints, add extra cache prevention
  const isAuthEndpoint = url.includes('/api/auth/');
  
  // Get auth token - use trial token for trial endpoints, otherwise use regular token
  const isTrial = url.includes('/trial');
  const accessToken = getAuthToken(isTrial);
  
  // Prepare headers
  const headers: Record<string, string> = {
    // Add standard headers
    'Accept': 'application/json',
  };
  
  // Add Content-Type for requests with data
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add Authorization header if we have a token (except for login)
  if (accessToken && !url.includes('/api/auth/login')) {
    headers['Authorization'] = `Bearer ${accessToken}`;
    console.log(`API Request: Adding Authorization token to ${url}`);
  }
  
  // Add cache prevention headers for all API requests
  headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  headers['Pragma'] = 'no-cache';
  headers['Expires'] = '0';
  
  try {
    // Enhanced logging - Request details
    console.group(`🌐 API Request: ${method} ${cacheBustUrl}`);
    
    // Use the getApiUrl function to get the full API URL
    const fullUrl = getApiUrl(cacheBustUrl);
    
    console.log(`🔗 Target: ${fullUrl}`);
    console.log(`📤 Headers:`, headers);
    if (data) {
      console.log(`📦 Request Body:`, data);
    }
    console.groupEnd();
    
    const startTime = Date.now();
    try {
      const res = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        // Set cache to 'no-store' to prevent caching
        cache: 'no-store',
      });
      const endTime = Date.now();

      // Enhanced logging - Response details
      console.group(`🌐 API Response: ${method} ${url}`);
      console.log(`⏱️ Time: ${endTime - startTime}ms`);
      console.log(`📊 Status: ${res.status} ${res.statusText}`);
      // Log headers in a TypeScript-compatible way
      const headerObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headerObj[key] = value;
      });
      console.log(`📥 Headers:`, headerObj);
      
      // Clone the response to read the body without consuming it
      const resClone = res.clone();
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const jsonBody = await resClone.json();
          console.log(`📦 Response Body:`, jsonBody);
        } else {
          const textBody = await resClone.text();
          console.log(`📦 Response Body:`, textBody.length > 500 ? textBody.substring(0, 500) + '...' : textBody);
        }
      } catch (e) {
        console.log(`📦 Response Body: [Could not parse]`);
      }
      console.groupEnd();
      
      // Check for token refresh header
      const refreshToken = res.headers.get('X-Refresh-Token');
      if (refreshToken) {
        console.log('Received X-Refresh-Token header, updating token');
        // Store the refreshed token in the appropriate storage location
        if (isTrial) {
          localStorage.setItem('rad_order_pad_trial_access_token', refreshToken);
          
          // Update token expiry (add 15 minutes)
          const expiryTime = Date.now() + 15 * 60 * 1000;
          localStorage.setItem('rad_order_pad_trial_token_expiry', expiryTime.toString());
        } else {
          localStorage.setItem('rad_order_pad_access_token', refreshToken);
          
          // Update token expiry (add 15 minutes)
          const expiryTime = Date.now() + 15 * 60 * 1000;
          localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
        }
      }
      
      await throwIfResNotOk(res);
      return res;
    } catch (fetchError) {
      console.error(`Network error during fetch: ${method} ${fullUrl}`, fetchError);
      // Handle the error with proper type checking
      if (fetchError instanceof Error) {
        throw new Error(`Network error: ${fetchError.message}`);
      } else {
        throw new Error('Network error: Failed to fetch');
      }
    }
  } catch (error) {
    console.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
}

/**
 * Type for handling unauthorized responses
 */
type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced query function factory with improved error handling
 * and cache busting for authentication endpoints
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    // Add cache busting for auth endpoints
    const cacheBustUrl = url.includes('/api/auth/') ?
      `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}` :
      url;
    
    // Get auth token - use trial token for trial endpoints, otherwise use regular token
    const isTrial = url.includes('/trial');
    const accessToken = getAuthToken(isTrial);
    
    try {
      // Prepare headers with auth token
      const headers: HeadersInit = {
        // Add standard headers
        'Accept': 'application/json',
      };
      
      // Add Authorization header if we have a token
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('Added Authorization header with Bearer token');
      }
      
      // Add cache prevention headers for all API requests
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
      
      // Use the getApiUrl function to get the full API URL
      const fullUrl = getApiUrl(cacheBustUrl);
      
      // Enhanced logging - Query Request
      console.group(`🔍 Query Request: GET ${cacheBustUrl}`);
      console.log(`🔗 Target: ${fullUrl}`);
      console.log(`📤 Headers:`, headers);
      console.groupEnd();
      
      const startTime = Date.now();
      try {
        const res = await fetch(fullUrl, {
          credentials: "include",
          headers,
          cache: 'no-store',
        });
        const endTime = Date.now();

        // Enhanced logging - Query Response
        console.group(`🔍 Query Response: GET ${url}`);
        console.log(`⏱️ Time: ${endTime - startTime}ms`);
        console.log(`📊 Status: ${res.status} ${res.statusText}`);
        // Log headers in a TypeScript-compatible way
        const headerObj: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          headerObj[key] = value;
        });
        console.log(`📥 Headers:`, headerObj);
        console.groupEnd();

        // Check for token refresh header
        const refreshToken = res.headers.get('X-Refresh-Token');
        if (refreshToken) {
          console.log('Received X-Refresh-Token header in query, updating token');
          // Store the refreshed token in the appropriate storage location
          if (isTrial) {
            localStorage.setItem('rad_order_pad_trial_access_token', refreshToken);
            
            // Update token expiry (add 15 minutes)
            const expiryTime = Date.now() + 15 * 60 * 1000;
            localStorage.setItem('rad_order_pad_trial_token_expiry', expiryTime.toString());
          } else {
            localStorage.setItem('rad_order_pad_access_token', refreshToken);
            
            // Update token expiry (add 15 minutes)
            const expiryTime = Date.now() + 15 * 60 * 1000;
            localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
          }
        }

        // Handle specific status codes more explicitly
        if (res.status === 401) {
          console.warn(`Authentication required for: ${url} - Status: ${res.status}`);
          
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
        }

        await throwIfResNotOk(res);
        const jsonData = await res.json();
        
        // Log the response data
        console.group(`🔍 Query Data: GET ${url}`);
        console.log(`📦 Response Data:`, jsonData);
        console.groupEnd();
        
        return jsonData;
      } catch (fetchError) {
        console.error(`Network error during fetch: GET ${fullUrl}`, fetchError);
        // Handle the error with proper type checking
        if (fetchError instanceof Error) {
          throw new Error(`Network error: ${fetchError.message}`);
        } else {
          throw new Error('Network error: Failed to fetch');
        }
      }
    } catch (error) {
      console.error(`Query failed: ${url}`, error);
      throw error;
    }
  };

/**
 * Custom QueryClient with enhanced configuration for more stable auth handling
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Enable to refresh when tab becomes active
      staleTime: 5 * 60 * 1000, // 5 minutes instead of infinity
      retry: 1, // Allow one retry on failure
      retryDelay: 1000, // Wait 1 second before retry
    },
    mutations: {
      retry: 1, // Allow one retry for mutations
      retryDelay: 1000,
    },
  },
});
