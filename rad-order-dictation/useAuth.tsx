import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from './queryClient';
import { User } from './types';
import { ApiUserResponse } from './auth';

// Local storage keys for tokens
const ACCESS_TOKEN_KEY = 'rad_order_pad_access_token';
const REFRESH_TOKEN_KEY = 'rad_order_pad_refresh_token';
const TOKEN_EXPIRY_KEY = 'rad_order_pad_token_expiry';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => Promise.reject('AuthContext not initialized'),
  logout: () => Promise.reject('AuthContext not initialized'),
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Define the expected shape of the session response
  interface SessionResponse {
    authenticated: boolean;
    user?: User;
  }

  // Function to save auth tokens
  const saveTokens = (accessToken: string, refreshToken: string, expiresIn: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    // Calculate expiry time and save it
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    console.log("Authentication tokens saved to localStorage");
    
    // Log the token for debugging (without showing the full value)
    const maskedToken = accessToken.substring(0, 10) + "..." + 
                      (accessToken.length > 20 ? accessToken.substring(accessToken.length - 5) : "");
    console.log(`Access token saved (preview): ${maskedToken}`);
    
    // Add access token to all future API requests
    setupTokenInterceptor(accessToken);
  };

  // Function to clear auth tokens
  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    console.log("Authentication tokens cleared from localStorage");
    
    // Remove authorization header for fetch calls
    removeTokenInterceptor();
  };

  // We're not going to use an interceptor approach, as it can cause issues
  // with React's rendering and other libraries. Instead, we'll rely on
  // direct token inclusion in our apiRequest function.
  
  // This function notifies that token is available
  const setupTokenInterceptor = (token: string) => {
    console.log("Token saved, will be included in future requests");
    // No need to modify global fetch - we're handling this in apiRequest
  };

  // Remove the token interceptor
  const removeTokenInterceptor = () => {
    console.log("Authentication tokens removed");
  };

  // Check for existing tokens on initial load
  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (accessToken && expiryTime) {
      const expiryTimeNum = parseInt(expiryTime, 10);
      
      // If token is not expired, set up the interceptor
      if (expiryTimeNum > Date.now()) {
        setupTokenInterceptor(accessToken);
      } else {
        // Token expired, clear it
        clearTokens();
      }
    }
  }, []);

  // Check for token expiry
  useEffect(() => {
    const checkTokenExpiry = () => {
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expiryTime) {
        const expiryTimeNum = parseInt(expiryTime, 10);
        // If token expires in less than 5 minutes, try to refresh it
        if (expiryTimeNum - Date.now() < 5 * 60 * 1000) {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (refreshToken) {
            console.log("Token expiring soon, attempting refresh");
            refreshAuthToken(refreshToken);
          }
        }
      }
    };

    // Check token on component mount and every 3 minutes
    checkTokenExpiry();
    const tokenCheckInterval = setInterval(checkTokenExpiry, 3 * 60 * 1000);
    
    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Token refresh logic
  const refreshAuthToken = async (refreshToken: string) => {
    try {
      console.log("Attempting to refresh authentication token");
      
      // Since we're in client-only mode with a proxy to the remote API,
      // and the remote API doesn't have a /api/auth/refresh endpoint,
      // we'll use the session endpoint to check if we're still authenticated
      
      // First, try to get the current session
      const sessionResponse = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(ACCESS_TOKEN_KEY)}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const sessionData = await sessionResponse.json();
      
      // If we're still authenticated, we don't need to refresh
      if (sessionData.authenticated) {
        console.log("Session is still valid, no need to refresh token");
        return true;
      }
      
      console.log("Session is not valid, attempting to re-login");
      
      // Session is not valid and we don't have a proper refresh endpoint
      console.log("Session is not valid and refresh endpoint is not available");
      
      // Clear tokens since we can't refresh them
      clearTokens();
      setUser(null);
      
      // Force session refresh
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      return false;
      
      console.error("Failed to refresh token via re-login");
      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      
      // Clear tokens and user data on error
      clearTokens();
      setUser(null);
      
      // Force session refresh
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      
      return false;
    }
  };

  // Check for existing session - but handle the case where the endpoint doesn't exist
  const { data: sessionData, isLoading: isSessionLoading, error: sessionError } = useQuery<SessionResponse>({
    queryKey: ['/api/auth/session'],
    retry: 0, // Don't retry since we know the endpoint might not exist
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // Consider session data stale after 5 minutes
    refetchInterval: false, // Don't auto-refresh since the endpoint doesn't exist
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Update auth state when session data is available or when there's an error
  useEffect(() => {
    if (!isSessionLoading) {
      // Check if we have a token in localStorage
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      
      if (sessionError || !sessionData) {
        console.log("Session endpoint not available (using remote API) or error occurred");
        
        // If we have a token in localStorage, try to use it
        if (accessToken) {
          console.log("Found token in localStorage, attempting to use it");
          
          try {
            // Try to decode the token to get user information
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              
              if (payload) {
                console.log("Successfully decoded token payload:", payload);
                
                // Create a user object from the token payload
                const userData: User = {
                  id: payload.userId || payload.sub,
                  email: payload.email || '',
                  name: payload.name || payload.email || 'User',
                  role: payload.role as any,
                  organizationId: payload.orgId || payload.organizationId,
                  organizationType: payload.organizationType || 'referring_practice',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                setUser(userData);
                setIsLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error("Error decoding token:", e);
          }
        }
        
        // If we couldn't get user info from the token, clear auth state
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // If session data is available and authenticated, use it
      if (sessionData && 'authenticated' in sessionData && sessionData.authenticated &&
          'user' in sessionData && sessionData.user) {
        setUser(sessionData.user);
        console.log("User set from session:", sessionData.user);
      } else {
        // Check if we have a token but session isn't authenticated
        const hasToken = !!accessToken;
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (hasToken && refreshToken) {
          console.warn("Token exists but session is not authenticated. Attempting token refresh.");
          refreshAuthToken(refreshToken).then(success => {
            if (!success) {
              console.warn("Token refresh failed, clearing auth state");
              setUser(null);
              clearTokens();
            }
          });
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    }
  }, [isSessionLoading, sessionData, sessionError]);

  // Define the expected response type from the login API
  interface LoginResponse {
    success?: boolean;
    data?: {
      accessToken: string;
      refreshToken: string;
      user: User;
    };
    message?: string;
    expiresIn?: number;
    // New API response format fields
    token?: string;
    user?: ApiUserResponse;
  }

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
      // Use the new API endpoint for authentication
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data: LoginResponse) => {
      console.log('Login response:', data);
      
      // Handle the remote API response format
      if (data.token && data.user) {
        // Convert snake_case to camelCase for user fields
        const apiUser = data.user;
        const userData: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: `${apiUser.first_name} ${apiUser.last_name}`,
          role: apiUser.role as any,
          organizationId: apiUser.organization_id,
          organizationType: 'referring_practice', // Default to referring_practice
          // Convert string dates to Date objects
          createdAt: new Date(apiUser.created_at),
          updatedAt: new Date(apiUser.updated_at)
        };
        
        setUser(userData);
        
        // Save token (we only have one token in the new format)
        const expiresIn = 3600; // Default to 1 hour
        saveTokens(data.token, data.token, expiresIn); // Use same token for both
        return;
      }
      
      // Handle the old API response format - this is likely not needed for the remote API
      if (data.success && data.data) {
        // Extract user data from the response
        const userData = data.data.user;
        setUser(userData as User);
        
        // Save tokens from successful login
        if (data.data.accessToken && data.data.refreshToken) {
          // Calculate expiresIn if not provided directly
          const expiresIn = data.expiresIn || 3600; // Default to 1 hour if not specified
          saveTokens(data.data.accessToken, data.data.refreshToken, expiresIn);
        }
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // Get refresh token to revoke it on the server
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        let endpoint = '/api/auth/logout';
        let method = 'GET';
        let data: any = undefined;
        
        // If we have a refresh token, use it to explicitly revoke the token
        if (refreshToken) {
          endpoint = '/api/auth/logout';
          method = 'POST';
          data = { refreshToken };
        }
        
        try {
          // Try to call the server endpoint, but don't fail if it doesn't exist
          const response = await apiRequest(method, endpoint, data);
          if (response.ok) {
            return response.json();
          }
        } catch (error) {
          // Log the error but continue with local logout
          console.log('Server logout failed, continuing with local logout', error);
        }
        
        // Always clear tokens from storage
        clearTokens();
        
        return { success: true };
      } catch (error) {
        // If any unexpected error occurs, still clear tokens
        console.error('Unexpected logout error:', error);
        clearTokens();
        return { success: true };
      }
    },
    onSuccess: () => {
      setUser(null);
    },
  });

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      // For the remote API, we don't need to check for success/data/user
      // since we handle the token directly in the mutation's onSuccess
      
      // Don't try to invalidate the session query since the endpoint doesn't exist
      // Just return the user from the mutation result
      if (user) {
        return user;
      } else if (result.user) {
        // Convert ApiUserResponse to User
        const apiUser = result.user;
        const userData: User = {
          id: apiUser.id,
          email: apiUser.email,
          name: `${apiUser.first_name} ${apiUser.last_name}`,
          role: apiUser.role as any,
          organizationId: apiUser.organization_id,
          organizationType: 'referring_practice', // Default to referring_practice
          createdAt: new Date(apiUser.created_at),
          updatedAt: new Date(apiUser.updated_at)
        };
        return userData;
      } else {
        throw new Error('Login failed - no user data returned');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
      
      // Don't try to invalidate the session query since the endpoint doesn't exist
      
      // Clear all user-related queries
      await queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw the error, just clear tokens and user state
      clearTokens();
      setUser(null);
      await queryClient.clear();
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}