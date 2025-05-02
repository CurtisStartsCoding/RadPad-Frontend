import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes only - in a real app this would call an API
    if (password === confirmPassword) {
      console.log("Password reset submitted");
      setResetComplete(true);
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
          <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 mt-1">Create a new password for your account</p>
        </div>

        {/* Reset Password Card */}
        <Card>
          {!resetComplete ? (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Create New Password</CardTitle>
                <CardDescription>
                  Your password must be at least 8 characters and include a number and special character
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
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
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input 
                      id="confirm-password" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {password && confirmPassword && password !== confirmPassword && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Passwords do not match. Please ensure both passwords are the same.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button 
                  className="w-full" 
                  type="submit"
                  disabled={!password || !confirmPassword || password !== confirmPassword}
                >
                  Reset Password
                </Button>
              </CardFooter>
            </form>
          ) : (
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-center mb-2">Password reset successful</h3>
              <p className="text-center text-slate-500 mb-6">
                Your password has been successfully changed
              </p>
              
              <Button className="w-full">
                Continue to login
              </Button>
            </div>
          )}
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} RadOrderPad. All rights reserved.</p>
          <div className="mt-1 space-x-3">
            <a href="#" className="hover:underline">Terms of Service</a>
            <span>·</span>
            <a href="#" className="hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;