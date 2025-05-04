import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useLocation } from "wouter";
import { loginUser } from "@/lib/auth";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading: authLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Combined loading state for UI
  const isLoading = isSubmitting || authLoading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Attempting login with email:", email);
      
      // First try direct API call
      try {
        console.log("Attempting direct API login");
        const user = await loginUser(email, password);
        console.log("Direct API login successful, user data received:", user);
        
        // Verify localStorage has tokens
        const accessToken = localStorage.getItem('rad_order_pad_access_token');
        console.log("Token saved:", accessToken ? "Yes" : "No");
        
        // Redirect to dashboard
        setLocation("/");
        return;
      } catch (directError) {
        console.error("Direct API login failed, trying hook login:", directError);
      }
      
      // Fall back to hook's login function
      const user = await login(email, password);
      
      console.log("Hook login successful, user data received:", user);
      
      // Verify localStorage has tokens
      const accessToken = localStorage.getItem('rad_order_pad_access_token');
      
      console.log("Token saved:", accessToken ? "Yes" : "No");
      
      // Redirect to dashboard
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);
      
      // Display a more detailed error message if available
      let errorMessage = "Invalid email or password. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Clear password field on error for security
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center mb-2">
            <AlertCircle className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-primary ml-2">RadOrderPad</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your email and password to access your account
              </CardDescription>
            </CardHeader>
            {error && (
              <div className="px-6 -mt-2 mb-2">
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              </div>
            )}
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">Remember me for 30 days</Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              
              <div className="mt-4 text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <a href="#" className="text-primary hover:underline">
                  Request access
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RadOrderPad. All rights reserved.</p>
          <div className="mt-1 space-x-3">
            <a href="#" className="hover:underline">Terms of Service</a>
            <span>·</span>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
          
          {/* Test credentials */}
          <div className="mt-4 p-3 border border-slate-200 rounded-md bg-slate-50 text-left">
            <p className="font-medium text-sm text-slate-700 mb-1">Test Account:</p>
            <p className="text-xs text-slate-600">Email: test.physician@example.com</p>
            <p className="text-xs text-slate-600">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;