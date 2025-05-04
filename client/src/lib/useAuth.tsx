import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from './queryClient';
import { User } from './types';
import { ApiUserResponse, getCurrentSession, isTokenExpired } from './auth';

// Local storage keys for tokens
const ACCESS_TOKEN_KEY = 'rad_order_pad_access_token';
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

  // Function to save auth token
  const saveToken = (accessToken: string, expiresIn: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    
    // Calculate expiry time and save it
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    console.log("Authentication token saved to localStorage");
  };

  // Function to clear auth token
  const clearToken = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    console.log("Authentication token cleared from localStorage");
  };

  // Check for existing token on initial load
  useEffect(() => {
    if (isTokenExpired()) {
      clearToken();
    }
  }, []);

  // Check for token expiry
  useEffect(() => {
    const checkTokenExpiry = () => {
      if (isTokenExpired()) {
        clearToken();
        setUser(null);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
      }
    };

    // Check token on component mount and every 5 minutes
    checkTokenExpiry();
    const tokenCheckInterval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    
    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Check for existing session
  const { data: sessionData, isLoading: isSessionLoading, error: sessionError } = useQuery<SessionResponse>({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      const response = await getCurrentSession();
      return response;
    },
    retry: 0, // Don't retry since we know the endpoint might not exist
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // Consider session data stale after 5 minutes
    refetchInterval: false, // Don't auto-refresh
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Update auth state when session data is available or when there's an error
  useEffect(() => {
    if (!isSessionLoading) {
      // Check if we have a token in localStorage
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      
      if (sessionError || !sessionData) {
        console.log("Session endpoint not available or error occurred");
        
        // If we have a token in localStorage, try to use it
        if (accessToken && !isTokenExpired()) {
          console.log("Found valid token in localStorage, attempting to use it");
          
          try {
            // Try to decode the token to get user information
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              
              if (payload) {
                console.log("Successfully decoded token payload");
                
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
        // If session isn't authenticated, clear user state
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [isSessionLoading, sessionData, sessionError]);

  // Define the expected response type from the login API
  interface LoginResponse {
    success?: boolean;
    data?: {
      accessToken: string;
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
      // Use the API endpoint for authentication
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data: LoginResponse) => {
      console.log('Login response:', data);
      
      // Handle the API response format
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
        
        // Save token
        const expiresIn = 3600; // Default to 1 hour
        saveToken(data.token, expiresIn);
        return;
      }
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        let endpoint = '/api/auth/logout';
        let method = 'GET';
        
        try {
          // Try to call the server endpoint, but don't fail if it doesn't exist
          const response = await apiRequest(method, endpoint, undefined);
          if (response.ok) {
            return response.json();
          }
        } catch (error) {
          // Log the error but continue with local logout
          console.log('Server logout failed, continuing with local logout', error);
        }
        
        // Always clear tokens from storage
        clearToken();
        
        return { success: true };
      } catch (error) {
        // If any unexpected error occurs, still clear tokens
        console.error('Unexpected logout error:', error);
        clearToken();
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
      
      // Clear all user-related queries
      await queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw the error, just clear tokens and user state
      clearToken();
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