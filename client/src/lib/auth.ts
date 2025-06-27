import { User } from "./types";
import { apiRequest, queryClient } from "./queryClient";
import { FileUploadService } from "./fileUploadService";

// Authentication token keys
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
  phone_number?: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  organization_name?: string;
  lastLoginAt?: string;
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
      
      // If phone_number is missing, try to fetch it from /api/users/me
      if (!apiUser.phone_number) {
        try {
          const meResponse = await apiRequest('GET', '/api/users/me');
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData.success && meData.data) {
              // Update the stored user data with the complete profile including phone
              const completeUserData = {
                ...apiUser,
                phone_number: meData.data.phone || meData.data.phone_number,
                // Update any other fields that might be missing
                npi: meData.data.npi || apiUser.npi,
                specialty: meData.data.specialty || apiUser.specialty
              };
              localStorage.setItem('rad_order_pad_user_data', JSON.stringify(completeUserData));
            }
          }
        } catch (e) {
          console.log('Could not fetch additional user data:', e);
        }
      }
      
      // Clear any documents from previous users
      FileUploadService.clearAllDocuments();
      
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
    
    // Remove tokens from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Clear all user documents
    FileUploadService.clearAllUserDocuments();
    
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
    
    // Remove tokens from localStorage even if the server request failed
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Clear all user documents even on error
    FileUploadService.clearAllUserDocuments();
        
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
    
    // For backward compatibility, also check for old trial token
    const trialToken = localStorage.getItem('rad_order_pad_trial_access_token');
    
    // If no token, return not authenticated
    if (!token && !trialToken) {
      return { authenticated: false };
    }
    
    // If we have a token, try to decode it
    // Prioritize the main token, fall back to trial token for backward compatibility
    const activeToken = token || trialToken;
    
    // If we're using the trial token, migrate it to the main token key for future use
    if (!token && trialToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, trialToken);
      // Don't remove the trial token here to avoid breaking existing sessions
    }
    
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
  const token = localStorage.getItem('rad_order_pad_trial_access_token');
  const expiryTime = localStorage.getItem('rad_order_pad_trial_token_expiry');
  
  if (!token || !expiryTime) {
    return true;
  }
  
  const expiryTimeNum = parseInt(expiryTime, 10);
  return expiryTimeNum <= Date.now();
}

/**
 * Get the current authentication token
 *
 * @param trialOnly Deprecated parameter, kept for backward compatibility
 * @returns The authentication token or null if not present
 */
export function getAuthToken(trialOnly: boolean = false): string | null {
  // First check the main token
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    console.log(`🔑 Using main token: ${token.substring(0, 15)}...`);
    
    // Check if this is a trial token by decoding it
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload && payload.isTrial === true) {
          console.log('🔑 Token identified as trial token');
          console.log('👤 User role:', payload.role);
          console.log('📧 Email:', payload.email);
        }
      }
    } catch (e) {
      console.error("Error decoding token:", e);
    }
    
    return token;
  }
  
  // For backward compatibility, check for trial token
  const trialToken = localStorage.getItem('rad_order_pad_trial_access_token');
  if (trialToken) {
    console.log(`🔑 Found trial token: ${trialToken.substring(0, 15)}...`);
    // Migrate the trial token to the main token key for future use
    localStorage.setItem(ACCESS_TOKEN_KEY, trialToken);
    console.log('🔄 Migrated trial token to main token key');
    return trialToken;
  }
  
  console.log('⚠️ No authentication token found');
  return null;
}