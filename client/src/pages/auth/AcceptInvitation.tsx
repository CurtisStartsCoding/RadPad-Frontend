import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Lock, CheckCircle, Building, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AcceptInvitation = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [invitationAccepted, setInvitationAccepted] = useState(false);

  // Mock invitation data - in a real app, this would come from the API based on the token in the URL
  const invitationData = {
    organizationName: "Northwest Medical Group",
    role: "Administrative Staff",
    email: "alice.johnson@example.com",
    invitedBy: "Dr. John Doe"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes only - in a real app this would call an API
    if (password === confirmPassword && agreeTerms) {
      console.log("Invitation accepted with password:", password);
      setInvitationAccepted(true);
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
          <h1 className="text-2xl font-semibold text-slate-900">Accept Invitation</h1>
          <p className="text-slate-500 mt-1">Complete your registration to join the organization</p>
        </div>

        {/* Accept Invitation Card */}
        <Card>
          {!invitationAccepted ? (
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>Join {invitationData.organizationName}</CardTitle>
                  <Badge variant="secondary">{invitationData.role}</Badge>
                </div>
                <CardDescription>
                  You've been invited by {invitationData.invitedBy} to join RadOrderPad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="flex items-start space-x-3">
                    <Building className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{invitationData.organizationName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Your role: {invitationData.role}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 mt-3">
                    <User className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Your account details</p>
                      <p className="text-xs text-slate-500 mt-0.5">{invitationData.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="new-password"
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
                  <p className="text-xs text-slate-500">
                    Password must be at least 8 characters and include a number and special character
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="new-password"
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
                
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    required
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label 
                      htmlFor="terms" 
                      className="text-sm text-slate-500 font-normal leading-tight cursor-pointer"
                    >
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button 
                  className="w-full" 
                  type="submit"
                  disabled={!password || !confirmPassword || password !== confirmPassword || !agreeTerms}
                >
                  Complete Registration
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
              
              <h3 className="text-lg font-medium text-center mb-2">Welcome aboard!</h3>
              <p className="text-center text-slate-500 mb-6">
                Your account has been successfully created and you are now part of {invitationData.organizationName}
              </p>
              
              <Button className="w-full">
                Go to Dashboard
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

export default AcceptInvitation;