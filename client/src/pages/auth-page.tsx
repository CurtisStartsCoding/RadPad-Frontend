import { useState } from "react";
import PatentPendingNotice from "@/components/common/PatentPendingNotice";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, LockKeyhole, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, dismiss } = useToast();
  const [_, navigate] = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  
  // Combined loading state for UI
  const isLoading = isSubmitting || authLoading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, show a toast that we're attempting login
      const loginToast = toast({
        title: "Logging in",
        description: "Verifying your credentials...",
        duration: 5000, // Show for 5 seconds
      });
      
      console.log("Attempting login with email:", email);
      
      // Use the hook's login function
      const user = await login(email, password);
      
      console.log("Login successful, user data received:", user);
      
      // Verify localStorage has tokens
      const accessToken = localStorage.getItem('rad_order_pad_access_token');
      const refreshToken = localStorage.getItem('rad_order_pad_refresh_token');
      const expiryTime = localStorage.getItem('rad_order_pad_token_expiry');
      
      console.log("Tokens saved: ", {
        accessToken: accessToken ? "Exists (masked)" : "Missing",
        refreshToken: refreshToken ? "Exists (masked)" : "Missing",
        expiryTime: expiryTime || "Missing"
      });
      
      // Dismiss the login toast before showing success toast
      dismiss(loginToast.id);
      
      // This is a success toast, so use a different variant
      const userName = user.name || user.email;
        
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userName}`,
        variant: "default",
        duration: 3000, // Show for 3 seconds
      });
      
      console.log("Login successful, preparing to navigate...");
      
      // Short delay before navigation to ensure state updates
      setTimeout(() => {
        // Log before navigation
        console.log("Navigating to dashboard...");
        navigate("/");
      }, 1000); // Slightly longer delay to ensure token processing
    } catch (error) {
      console.error("Login error:", error);
      
      // Display a more detailed error message if available
      let errorMessage = "Invalid email or password. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds
      });
      
      // Clear password field on error for security
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="flex flex-col items-center mb-6">
        <svg
          className="h-12 w-12 text-primary mb-3"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 4v16H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12z"></path>
          <path d="M3 6v12a2 2 0 0 0 2 2h2"></path>
          <path d="M10 4v4"></path>
          <path d="M14 4v4"></path>
          <path d="M10 14h4"></path>
          <path d="M10 10h4"></path>
        </svg>
        <h1 className="text-3xl font-bold">RadOrderPad</h1>
        <div className="mt-2">
          <PatentPendingNotice />
        </div>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 flex-shrink-0">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                    className="!h-4 !w-4"
                  />
                </div>
                <Label htmlFor="remember" className="text-sm cursor-pointer">Remember me</Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-xs text-gray-500 text-center">
            <p>Test Accounts:</p>
            <p>Physician: physician@abcfamilymedicine.com / Physician123</p>
            <p>Radiologist: radiologist@xyzradiology.com / radiologist123</p>
            <p className="mt-2">HIPAA-Compliant | Secure Authentication | PHI Protected</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;