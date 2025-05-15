import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from './queryClient';
import { User } from './types';
import { ApiUserResponse, getCurrentSession, isTokenExpired, isTrialTokenExpired } from './auth';
import { UserRole } from './roles';

// Local storage keys for authentication
const ACCESS_TOKEN_KEY = 'rad_order_pad_access_token';
const TOKEN_EXPIRY_KEY = 'rad_order_pad_token_expiry';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

// Create the context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => Promise.reject('AuthContext not initialized'),
  logout: () => Promise.reject('AuthContext not initialized'),
  requestPasswordReset: () => Promise.reject('AuthContext not initialized'),
  resetPassword: () => Promise.reject('AuthContext not initialized'),
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
    
    // For backward compatibility, also remove old trial tokens if they exist
    localStorage.removeItem('rad_order_pad_trial_access_token');
    localStorage.removeItem('rad_order_pad_trial_token_expiry');
    
    console.log("Authentication tokens cleared from localStorage");
  };

  // Check for existing token on initial load
  useEffect(() => {
    // Check token expiration
    if (isTokenExpired()) {
      clearToken();
    }
    
    // For backward compatibility, migrate any existing trial token to the main token
    const trialToken = localStorage.getItem('rad_order_pad_trial_access_token');
    if (trialToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, trialToken);
      localStorage.removeItem('rad_order_pad_trial_access_token');
      localStorage.removeItem('rad_order_pad_trial_token_expiry');
    }
  }, []);

  // Check for token expiry
  useEffect(() => {
    const checkTokenExpiry = () => {
      // Check token expiration
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
      const trialUserData = localStorage.getItem('rad_order_pad_trial_user');
      
      // For backward compatibility, migrate any existing trial token to the main token
      const trialToken = localStorage.getItem('rad_order_pad_trial_access_token');
      if (trialToken && !accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, trialToken);
        localStorage.removeItem('rad_order_pad_trial_access_token');
        localStorage.removeItem('rad_order_pad_trial_token_expiry');
      }
      
      if (sessionError || !sessionData) {
        console.log("Session endpoint not available or error occurred");
        
        // Check for token
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
                
                // If this is a trial user (based on trial user data), override the role
                if (trialUserData) {
                  try {
                    const trialUser = JSON.parse(trialUserData);
                    if (trialUser.isTrial) {
                      userData.role = UserRole.TrialUser as any;
                      userData.organizationType = 'trial';
                    }
                  } catch (e) {
                    console.error("Error parsing trial user data:", e);
                  }
                }
                
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
        
        // Store the complete user data in localStorage for profile use
        localStorage.setItem('rad_order_pad_user_data', JSON.stringify(apiUser));
        
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
        
        // Store the complete user data in localStorage for profile use
        localStorage.setItem('rad_order_pad_user_data', JSON.stringify(apiUser));
        
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
      
      // Clear user data from localStorage
      localStorage.removeItem('rad_order_pad_user_data');
      
      // Clear all user-related queries
      await queryClient.clear();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw the error, just clear tokens and user state
      clearToken();
      localStorage.removeItem('rad_order_pad_user_data');
      setUser(null);
      await queryClient.clear();
    }
  };

  // Password reset request mutation
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string): Promise<any> => {
      const response = await apiRequest('POST', '/api/auth/request-password-reset', { email });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request password reset');
      }
      return response.json();
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }): Promise<any> => {
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        password: newPassword
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }
      return response.json();
    },
  });

  // Request password reset function
  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      await requestPasswordResetMutation.mutateAsync(email);
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
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