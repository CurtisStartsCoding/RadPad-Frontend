import { useState } from "react";
import { Save, Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center mb-6">
        <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
        <h1 className="text-2xl font-bold text-slate-900">RadOrderPad</h1>
        <p className="text-sm text-slate-500 mt-1">Patent Pending. RadOrderPad™ technology is protected by US and international patent applications.</p>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-center mb-6">Sign In</h2>
          <p className="text-sm text-center text-slate-500 mb-6">Enter your credentials to access your account</p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="physician@abcfamilymedicine.com" 
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={isPasswordVisible ? "text" : "password"} 
                  placeholder="••••••••••" 
                  className="w-full pr-10"
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility} 
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400"
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm">Remember me</label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
            </div>
            
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const email = (document.getElementById('email') as HTMLInputElement)?.value;
                const password = (document.getElementById('password') as HTMLInputElement)?.value;
                
                // Log the request
                console.log('Making login request to /api/auth/login with credentials:', { email });
                
                // Make a fetch call to the API
                fetch('/api/auth/login', {
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
                })
                .then(response => {
                  // Log the response status
                  console.log('Login response status:', response.status);
                  console.log('Login response headers:', response.headers);
                  
                  // Check if the response is ok
                  if (!response.ok) {
                    throw new Error(`Login failed with status: ${response.status}`);
                  }
                  
                  return response.json();
                })
                .then(data => {
                  // Log the authentication response to the browser console
                  console.log('=== AUTH RESPONSE IN BROWSER ===');
                  console.log(data);
                  
                  // Parse and display token information if present
                  if (data.token) {
                    console.log('Token received:', data.token);
                    
                    // Parse the JWT token to display its contents
                    const tokenParts = data.token.split('.');
                    if (tokenParts.length === 3) {
                      try {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        console.log('Token Payload:', payload);
                        
                        // Display token expiration
                        if (payload.exp) {
                          const expirationDate = new Date(payload.exp * 1000);
                          console.log(`Token Expires: ${expirationDate.toLocaleString()}`);
                          const timeUntilExpiry = Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60);
                          console.log(`Time until expiry: ${timeUntilExpiry} minutes`);
                        }
                      } catch (e) {
                        console.error('Error parsing token payload:', e);
                      }
                    }
                    
                    // Store token in localStorage
                    localStorage.setItem('rad_order_pad_access_token', data.token);
                    
                    // Calculate expiry time (from token or default to 1 hour)
                    let expiryTime = Date.now() + 60 * 60 * 1000; // Default: 1 hour
                    
                    try {
                      const tokenParts = data.token.split('.');
                      if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        if (payload.exp) {
                          expiryTime = payload.exp * 1000;
                        }
                      }
                    } catch (e) {
                      console.error('Error parsing token for expiry:', e);
                    }
                    
                    // Store the expiry time
                    localStorage.setItem('rad_order_pad_token_expiry', expiryTime.toString());
                    console.log(`Token expiry time set to: ${new Date(expiryTime).toLocaleString()}`);
                    
                    // Log user details if present
                    if (data.user) {
                      console.log('User Details:', data.user);
                    }
                    
                    console.log('=== END AUTH RESPONSE ===');
                    
                    // Redirect to dashboard
                    window.location.href = "/";
                  }
                })
                .catch(error => {
                  console.error("Login error:", error);
                  
                  // Display more detailed error information
                  console.error("Login request failed. Details:");
                  console.error("- URL: /api/auth/login");
                  console.error("- Method: POST");
                  console.error("- Credentials:", { email });
                  
                  // Show an alert to the user
                  alert(`Login failed: ${error.message}`);
                });
              }}
            >
              Sign In
            </Button>
          </div>
          
          <div className="mt-6 text-center text-xs text-slate-500">
            <div className="mb-1">Test Accounts:</div>
            <div>Physician: physician@abcfamilymedicine.com / physician123</div>
            <div>Radiologist: radiologist@nyradiology.com / radiologist123</div>
            <div className="mt-2">HIPAA-Compliant | Secure Authentication | PHI Protected</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account? <a href="/trial-auth" className="text-primary hover:underline">Try our free trial</a>
        </p>
      </div>
    </div>
  );
}