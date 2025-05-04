import { User } from "./types";
import { apiRequest, queryClient } from "./queryClient";

/**
 * Authentication helper utilities
 */

// Define the expected shape of the session response
export interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

// Define login response type
export interface LoginResponse {
  success?: boolean;
  user?: User;
  // New API response format
  token?: string;
}

// Define the API user response format
export interface ApiUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: number;
  npi: string | null;
  specialty: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Log in a user with email and password
 * 
 * @param email User's email
 * @param password User's password
 * @returns The logged in user data
 */
export async function loginUser(email: string, password: string): Promise<User> {
  try {
    console.log('Attempting login with credentials:', { email });
    
    // First, try direct fetch to avoid any middleware issues
    const directResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('Direct login response status:', directResponse.status);
    
    // If direct fetch fails, try the apiRequest function
    if (!directResponse.ok) {
      console.log('Direct fetch failed, trying apiRequest');
      return await loginWithApiRequest(email, password);
    }
    
    const result = await directResponse.json();
    console.log('Login API response:', result);
    
    // Handle API response format (with token and user with snake_case fields)
    if (result.token && result.user) {
      // Cast to the proper type
      const apiUser = result.user as ApiUserResponse;
      
      // Convert to our User type
      const user: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: `${apiUser.first_name} ${apiUser.last_name}`,
        role: apiUser.role as any,
        organizationId: apiUser.organization_id,
        createdAt: new Date(apiUser.created_at),
        updatedAt: new Date(apiUser.updated_at)
      };
      
      // Store the token in localStorage
      localStorage.setItem('rad_order_pad_access_token', result.token);
      
      // Calculate expiry time (1 hour from now) and save it
      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
      
      // Clear any stale queries and reset the cache
      await queryClient.clear();
      
      // Force the session query to invalidate and refetch to update auth state
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      
      // Log a successful login attempt
      console.log('Login successful for user:', user.email);
      
      return user;
    }
    
    throw new Error('Login failed - invalid response format');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Helper function to login using apiRequest
async function loginWithApiRequest(email: string, password: string): Promise<User> {
  // Perform the login using apiRequest
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  const result = await response.json();
  
  console.log('Login API response from apiRequest:', result);
  
  // Handle API response format (with token and user with snake_case fields)
  if (result.token && result.user) {
    // Cast to the proper type
    const apiUser = result.user as ApiUserResponse;
    
    // Convert to our User type
    const user: User = {
      id: apiUser.id,
      email: apiUser.email,
      name: `${apiUser.first_name} ${apiUser.last_name}`,
      role: apiUser.role as any,
      organizationId: apiUser.organization_id,
      createdAt: new Date(apiUser.created_at),
      updatedAt: new Date(apiUser.updated_at)
    };
    
    // Store the token in localStorage
    localStorage.setItem('rad_order_pad_access_token', result.token);
    
    // Calculate expiry time (1 hour from now) and save it
    const expiryTime = Date.now() + 60 * 60 * 1000;
    localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
    
    // Clear any stale queries and reset the cache
    await queryClient.clear();
    
    // Force the session query to invalidate and refetch to update auth state
    await queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    
    // Log a successful login attempt
    console.log('Login successful for user:', user.email);
    
    return user;
  }
  
  throw new Error('Login failed - invalid response format');
}

/**
 * Log out the current user
 */
export async function logoutUser(): Promise<void> {
  try {
    // Add a timestamp to avoid caching
    const timestamp = new Date().getTime();
    
    // Attempt to logout
    const response = await apiRequest('GET', `/api/auth/logout?_=${timestamp}`, undefined);
    await response.json();
    
    // Remove the token from localStorage
    localStorage.removeItem('rad_order_pad_access_token');
    localStorage.removeItem('rad_order_pad_token_expiry');
    
    // Clear all queries from the cache to force a fresh state
    await queryClient.clear();
    
    // Force a delay to ensure server has time to process the logout
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Log the logout attempt for debugging
    console.log('Logout attempted successfully');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there was an error, still clear local cache to ensure UI shows logged out state
    await queryClient.clear();
    
    // Remove the token from localStorage even if the server request failed
    localStorage.removeItem('rad_order_pad_access_token');
    localStorage.removeItem('rad_order_pad_token_expiry');
    
    // Rethrow to allow proper error handling
    throw error;
  }
}

/**
 * Get the current session state
 * 
 * @returns The current session response
 */
export async function getCurrentSession(): Promise<SessionResponse> {
  try {
    // Add cache busting timestamp
    const timestamp = new Date().getTime();
    const url = `/api/auth/session?_=${timestamp}`;
    
    // Get the token from localStorage
    const token = localStorage.getItem('rad_order_pad_access_token');
    
    // Prepare headers
    const headers: HeadersInit = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    // Add Authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      credentials: 'include',
      cache: 'no-cache',
      headers
    });
    
    if (!response.ok) {
      console.error(`Session check failed with status: ${response.status}`);
      return { authenticated: false };
    }
    
    const data = await response.json() as SessionResponse;
    
    // Log session state for debugging
    console.log('Session state:', data.authenticated ? 'authenticated' : 'not authenticated');
    
    return data;
  } catch (error) {
    console.error('Error checking session:', error);
    // On error, return not authenticated
    return { authenticated: false };
  }
}

/**
 * Check if the current token is expired
 * 
 * @returns True if the token is expired or not present, false otherwise
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem('rad_order_pad_access_token');
  const expiryTime = localStorage.getItem('rad_order_pad_token_expiry');
  
  if (!token || !expiryTime) {
    return true;
  }
  
  const expiryTimeNum = parseInt(expiryTime, 10);
  return expiryTimeNum <= Date.now();
}