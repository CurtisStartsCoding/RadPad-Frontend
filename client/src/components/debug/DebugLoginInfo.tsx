import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleDisplayNames, UserRole } from "@/lib/roles";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Interface for login response data
interface LoginResponse {
  token?: string;
  user?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    role: string;
    organization_id?: number;
    organizationId?: number;
    organizationType?: string;
    specialty?: string;
    is_active?: boolean;
    createdAt?: string;
    updatedAt?: string;
    lastLoginAt?: string;
  };
  message?: string;
  timestamp?: string;
}

const DebugLoginInfo: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Function to retrieve login response from storage
  const getStoredLoginResponse = () => {
    try {
      const storedResponse = localStorage.getItem('rad_order_pad_login_response');
      if (storedResponse) {
        return JSON.parse(storedResponse);
      }
    } catch (err) {
      console.error('Error parsing stored login response:', err);
    }
    return null;
  };
  
  // Function to test login API
  const testLoginApi = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      if (response.ok) {
        const data = await response.json();
        setLoginResponse(data);
        
        // Store the login response for future reference
        localStorage.setItem('rad_order_pad_login_response', JSON.stringify(data));
        
        return data;
      } else {
        const errorData = await response.json();
        setError(`Login failed: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      setError(`Error testing login API: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error testing login API:', err);
    } finally {
      setLoading(false);
    }
    
    return null;
  };
  
  // Load stored login response when component opens
  useEffect(() => {
    if (isOpen && !loginResponse) {
      const storedResponse = getStoredLoginResponse();
      if (storedResponse) {
        setLoginResponse(storedResponse);
      }
    }
  }, [isOpen, loginResponse]);
  
  if (!user) {
    return (
      <Card className="mb-4 bg-yellow-50 border-yellow-200">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger 
              asChild 
              className="w-full text-left cursor-pointer"
            >
              <div className="flex items-center">
                {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                <CardTitle className="text-lg">Login Info (Debug)</CardTitle>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <p className="text-yellow-700">No user authenticated</p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger
            asChild
            className="w-full text-left cursor-pointer"
          >
            <div className="flex items-center">
              {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              <CardTitle className="text-lg">Login Debug Information</CardTitle>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="mb-4">
                <TabsTrigger value="login">Login Response</TabsTrigger>
                <TabsTrigger value="token">Token Info</TabsTrigger>
                <TabsTrigger value="test">Test Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {loading ? (
                  <div className="text-center py-4">Loading login data...</div>
                ) : error ? (
                  <div className="text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                ) : loginResponse ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {loginResponse.user && (
                        <>
                          <div className="font-medium text-yellow-800">User ID:</div>
                          <div>{loginResponse.user.id}</div>
                          
                          <div className="font-medium text-yellow-800">Email:</div>
                          <div>{loginResponse.user.email}</div>
                          
                          {(loginResponse.user.first_name || loginResponse.user.last_name) && (
                            <>
                              <div className="font-medium text-yellow-800">First Name:</div>
                              <div>{loginResponse.user.first_name || 'N/A'}</div>
                              
                              <div className="font-medium text-yellow-800">Last Name:</div>
                              <div>{loginResponse.user.last_name || 'N/A'}</div>
                            </>
                          )}
                          
                          {loginResponse.user.name && (
                            <>
                              <div className="font-medium text-yellow-800">Name:</div>
                              <div>{loginResponse.user.name}</div>
                            </>
                          )}
                          
                          <div className="font-medium text-yellow-800">Role:</div>
                          <div>{roleDisplayNames[loginResponse.user.role as UserRole] || loginResponse.user.role}</div>
                          
                          <div className="font-medium text-yellow-800">Organization ID:</div>
                          <div>{loginResponse.user.organization_id || loginResponse.user.organizationId || 'None'}</div>
                          
                          {loginResponse.user.organizationType && (
                            <>
                              <div className="font-medium text-yellow-800">Organization Type:</div>
                              <div>{loginResponse.user.organizationType}</div>
                            </>
                          )}
                          
                          {loginResponse.user.specialty && (
                            <>
                              <div className="font-medium text-yellow-800">Specialty:</div>
                              <div>{loginResponse.user.specialty}</div>
                            </>
                          )}
                          
                          {loginResponse.user.is_active !== undefined && (
                            <>
                              <div className="font-medium text-yellow-800">Active Status:</div>
                              <div>{loginResponse.user.is_active ? 'Active' : 'Inactive'}</div>
                            </>
                          )}
                        </>
                      )}
                      
                      {loginResponse.message && (
                        <>
                          <div className="font-medium text-yellow-800">Message:</div>
                          <div>{loginResponse.message}</div>
                        </>
                      )}
                      
                      {loginResponse.timestamp && (
                        <>
                          <div className="font-medium text-yellow-800">Timestamp:</div>
                          <div>{new Date(loginResponse.timestamp).toLocaleString()}</div>
                        </>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          localStorage.removeItem('rad_order_pad_login_response');
                          setLoginResponse(null);
                        }}
                      >
                        Clear Stored Login Response
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No login response data available</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Login response data is stored when you log in or when you test the login API
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="token">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Authentication Token</h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-yellow-800">Token:</div>
                    <div className="break-all">
                      {loginResponse?.token ? 
                        `${loginResponse.token.substring(0, 20)}...` : 
                        'No token available'}
                    </div>
                    
                    {loginResponse?.token && (
                      <>
                        <div className="font-medium text-yellow-800">Token Length:</div>
                        <div>{loginResponse.token.length} characters</div>
                        
                        <div className="font-medium text-yellow-800">Token Parts:</div>
                        <div>{loginResponse.token.split('.').length}</div>
                      </>
                    )}
                    
                    <div className="font-medium text-yellow-800">Stored Token:</div>
                    <div className="break-all">
                      {(() => {
                        const storedToken = localStorage.getItem('rad_order_pad_access_token');
                        return storedToken ? 
                          `${storedToken.substring(0, 20)}...` : 
                          'No token stored';
                      })()}
                    </div>
                    
                    <div className="font-medium text-yellow-800">Token Expiry:</div>
                    <div>
                      {(() => {
                        const expiryTime = localStorage.getItem('rad_order_pad_token_expiry');
                        return expiryTime ? 
                          new Date(parseInt(expiryTime)).toLocaleString() : 
                          'No expiry stored';
                      })()}
                    </div>
                  </div>
                  
                  {loginResponse?.token && (
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            const tokenParts = loginResponse.token!.split('.');
                            if (tokenParts.length === 3) {
                              const payload = JSON.parse(atob(tokenParts[1]));
                              console.log('Token payload:', payload);
                              alert(`Token payload logged to console`);
                            }
                          } catch (err) {
                            console.error('Error decoding token:', err);
                            alert(`Error decoding token: ${err}`);
                          }
                        }}
                      >
                        Decode Token Payload
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="test">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Test Login API</h3>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-yellow-700">
                      This will attempt to log in with your current credentials.
                      It will not affect your current session.
                    </p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          // Get current user email from auth context
                          const email = user?.email;
                          
                          if (!email) {
                            alert('No user email available');
                            return;
                          }
                          
                          // Prompt for password
                          const password = prompt('Enter your password to test login:');
                          if (!password) {
                            return;
                          }
                          
                          const result = await testLoginApi(email, password);
                          if (result) {
                            alert(`Login test successful! Response stored.`);
                          }
                        } catch (err) {
                          console.error('Login test error:', err);
                          alert(`Login test error: ${err}`);
                        }
                      }}
                    >
                      Test Login with Current User
                    </Button>
                    
                    <p className="text-xs text-yellow-700 mt-2">
                      Check the browser console for detailed response information
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DebugLoginInfo;