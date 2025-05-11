import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
      toast({
        title: "Success",
        description: "Password reset instructions have been sent to your email",
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
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
          <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 mt-1">We'll send you a link to reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <Card>
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email address and we'll send you a link to reset your password
                </CardDescription>
              </CardHeader>
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
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button
                  className="w-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => window.location.href = "/auth"}
                    className="text-sm inline-flex items-center text-slate-600 hover:text-primary"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to sign in
                  </button>
                </div>
              </CardFooter>
            </form>
          ) : (
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-center mb-2">Check your email</h3>
              <p className="text-center text-slate-500 mb-6">
                We've sent a password reset link to <span className="font-medium text-slate-700">{email}</span>
              </p>
              
              <Alert className="mb-6 bg-slate-50">
                <AlertDescription className="text-sm">
                  If you don't see the email in your inbox, check your spam folder or make sure the email address is correct.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => window.location.href = "/auth"}
                  className="text-sm inline-flex items-center text-slate-600 hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to sign in
                </button>
              </div>
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

export default ForgotPassword;