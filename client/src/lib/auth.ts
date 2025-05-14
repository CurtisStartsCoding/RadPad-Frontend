import { User } from "./types";
import { apiRequest, queryClient } from "./queryClient";
import { TRIAL_ACCESS_TOKEN_KEY, TRIAL_TOKEN_EXPIRY_KEY } from "./useAuth";

// Regular authentication token keys
const ACCESS_TOKEN_KEY = 'rad_order_pad_access_token';
const TOKEN_EXPIRY_KEY = 'rad_order_pad_token_expiry';

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
    console.group('🔐 Authentication: Login Attempt');
    console.log('📧 Email:', email);
    console.log('🔗 Target: Remote API (https://api.radorderpad.com)');
    console.groupEnd();
    
    // Use apiRequest to make the login request to the remote API
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    
    const result = await response.json();
    
    console.group('🔐 Authentication: Login Result');
    console.log('📊 Status:', response.status, response.statusText);
    console.log('🔑 Token Present:', !!result.token);
    console.log('👤 User Data Present:', !!result.user);
    console.groupEnd();
    
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
      
      // Store the token in localStorage using regular auth keys
      localStorage.setItem(ACCESS_TOKEN_KEY, result.token);
      
      // Calculate expiry time (1 hour from now) and save it
      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Store the complete user data in localStorage for profile use
      localStorage.setItem('rad_order_pad_user_data', JSON.stringify(apiUser));
      
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
    
    // Remove both regular and trial tokens from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TRIAL_ACCESS_TOKEN_KEY);
    localStorage.removeItem(TRIAL_TOKEN_EXPIRY_KEY);
    
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
    
    // Remove both regular and trial tokens from localStorage even if the server request failed
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(TRIAL_ACCESS_TOKEN_KEY);
    localStorage.removeItem(TRIAL_TOKEN_EXPIRY_KEY);
    
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
    console.group('🔐 Authentication: Session Check');
    console.log('🔗 Target: Remote API (https://api.radorderpad.com)');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    // Check for token in localStorage
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const trialToken = localStorage.getItem(TRIAL_ACCESS_TOKEN_KEY);
    
    // If no token, return not authenticated
    if (!token && !trialToken) {
      return { authenticated: false };
    }
    
    // If we have a token, try to decode it
    const activeToken = token || trialToken;
    if (activeToken) {
      try {
        const payload = parseJwtToken(activeToken);
        
        if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
          // Token is valid and not expired
          console.log('Token is valid and not expired');
          
          // Create a session response with user info from token
          const sessionResponse = {
            authenticated: true,
            user: {
              id: payload.userId || payload.sub,
              email: payload.email || '',
              name: payload.name || payload.email || 'User',
              role: payload.role as any,
              organizationId: payload.orgId || payload.organizationId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };
          
          // Enhanced logging for session state
          console.group('🔐 Authentication: Session Result');
          console.log('🔑 Authenticated:', sessionResponse.authenticated);
          if (sessionResponse.authenticated && sessionResponse.user) {
            console.log('👤 User:', {
              id: sessionResponse.user.id,
              email: sessionResponse.user.email,
              role: sessionResponse.user.role,
              organizationId: sessionResponse.user.organizationId
            });
          }
          console.groupEnd();
          
          return sessionResponse;
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
    
    // If we get here, token is invalid or expired
    return { authenticated: false };
  } catch (error) {
    console.error('Error checking session:', error);
    // On error, return not authenticated
    return { authenticated: false };
  }
}

/**
 * Parse JWT token and extract payload
 */
function parseJwtToken(token: string): any {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    return JSON.parse(atob(tokenParts[1]));
  } catch (e) {
    console.error("Error parsing token:", e);
    return null;
  }
}

/**
 * Check if the current token is expired
 * 
 * @returns True if the token is expired or not present, false otherwise
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return true;
  }
  
  const expiryTimeNum = parseInt(expiryTime, 10);
  return expiryTimeNum <= Date.now();
}

/**
 * Check if the current trial token is expired
 *
 * @returns True if the trial token is expired or not present, false otherwise
 */
export function isTrialTokenExpired(): boolean {
  const token = localStorage.getItem(TRIAL_ACCESS_TOKEN_KEY);
  const expiryTime = localStorage.getItem(TRIAL_TOKEN_EXPIRY_KEY);
  
  if (!token || !expiryTime) {
    return true;
  }
  
  const expiryTimeNum = parseInt(expiryTime, 10);
  return expiryTimeNum <= Date.now();
}

/**
 * Get the current authentication token
 *
 * @param trialOnly If true, only return the trial token
 * @returns The authentication token or null if not present
 */
export function getAuthToken(trialOnly: boolean = false): string | null {
  // If trialOnly is true, only check for trial token
  if (trialOnly) {
    return localStorage.getItem(TRIAL_ACCESS_TOKEN_KEY);
  }
  
  // Otherwise, prioritize regular token, then fall back to trial token
  const regularToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (regularToken) {
    return regularToken;
  }
  
  return localStorage.getItem(TRIAL_ACCESS_TOKEN_KEY);
}