import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl } from "./config";

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
  
  // Get auth token from localStorage
  const accessToken = localStorage.getItem('rad_order_pad_access_token');
  
  // Debug log for authentication debugging
  console.log(`API Request for ${url} - Token exists: ${!!accessToken}`);
  
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
    console.log(`API Request: Adding Authorization token to ${url}`, {
      tokenPreview: `${accessToken.slice(0, 5)}...${accessToken.slice(-5)}`
    });
  } else if (!url.includes('/api/auth/login')) {
    console.warn(`No auth token available for request to ${url}`);
  }
  
  // Add cache prevention for auth endpoints
  if (isAuthEndpoint) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }
  
  try {
    console.log(`API Request ${method} ${cacheBustUrl}`, {
      hasToken: accessToken ? true : false,
      isAuthEndpoint,
      method,
      headersIncluded: Object.keys(headers)
    });
    
    // Use the getApiUrl function to get the full API URL
    const fullUrl = getApiUrl(cacheBustUrl);
    console.log(`Making request to ${fullUrl}`);
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Additional cache control for modern browsers
      cache: isAuthEndpoint ? 'no-store' : 'default',
    });

    // Log the response status for better debugging
    console.log(`API Response: ${method} ${url} - Status: ${res.status}`);
    
    // Check for token refresh header
    const refreshToken = res.headers.get('X-Refresh-Token');
    if (refreshToken) {
      console.log('Received X-Refresh-Token header, updating token');
      localStorage.setItem('rad_order_pad_access_token', refreshToken);
      
      // Update token expiry (add 15 minutes)
      const expiryTime = Date.now() + 15 * 60 * 1000;
      localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
    }
    
    await throwIfResNotOk(res);
    return res;
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
    
    // Get auth token from localStorage
    const accessToken = localStorage.getItem('rad_order_pad_access_token');
    
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
      
      // Add cache prevention headers for auth endpoints
      if (url.includes('/api/auth/')) {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      
      // Use the getApiUrl function to get the full API URL
      const fullUrl = getApiUrl(cacheBustUrl);
      console.log(`Making request to ${fullUrl}`);
      
      const res = await fetch(fullUrl, {
        credentials: "include",
        headers,
        cache: url.includes('/api/auth/') ? 'no-store' : 'default',
      });

      // Check for token refresh header
      const refreshToken = res.headers.get('X-Refresh-Token');
      if (refreshToken) {
        console.log('Received X-Refresh-Token header in query, updating token');
        localStorage.setItem('rad_order_pad_access_token', refreshToken);
        
        // Update token expiry (add 15 minutes)
        const expiryTime = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
      }

      // Handle specific status codes more explicitly
      if (res.status === 401) {
        console.warn(`Authentication required for: ${url} - Status: ${res.status}`);
        
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
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