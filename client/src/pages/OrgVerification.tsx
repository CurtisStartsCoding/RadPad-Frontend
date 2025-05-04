import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Mail, MailCheck, AlertCircle, RefreshCw } from "lucide-react";

export default function OrgVerification() {
  const [verificationState, setVerificationState] = useState<'waiting' | 'verified' | 'expired'>('waiting');
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleVerification = () => {
    // Simulate verification success
    setVerificationState('verified');
  };

  const handleResend = () => {
    // Simulate resending the email
    setResendCountdown(60);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="container max-w-xl py-12">
      <Card className="shadow-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            {verificationState === 'waiting' && (
              <Mail className="h-12 w-12 text-primary" />
            )}
            {verificationState === 'verified' && (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            )}
            {verificationState === 'expired' && (
              <AlertCircle className="h-12 w-12 text-amber-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationState === 'waiting' && "Verify Your Email"}
            {verificationState === 'verified' && "Email Verified Successfully"}
            {verificationState === 'expired' && "Verification Link Expired"}
          </CardTitle>
          <CardDescription>
            {verificationState === 'waiting' && (
              "We've sent a verification link to your email address. Please click the link in the email to verify your account."
            )}
            {verificationState === 'verified' && (
              "Your email address has been successfully verified. You can now proceed to set up your organization."
            )}
            {verificationState === 'expired' && (
              "Your verification link has expired. Please request a new verification email."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationState === 'waiting' && (
            <div className="space-y-6">
              <Alert className="bg-blue-50 border-blue-100">
                <MailCheck className="h-4 w-4 text-blue-600" />
                <AlertTitle>Check your inbox</AlertTitle>
                <AlertDescription>
                  A verification email was sent to <span className="font-medium">jane.smith@abcfamilymedicine.com</span>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Don't see the email? Check your spam folder or enter your verification code manually:</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter verification code" />
                  <Button onClick={handleVerification}>Verify</Button>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Still can't find the email?</p>
                <Button 
                  variant="outline" 
                  className="flex items-center" 
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Email"}
                </Button>
              </div>
            </div>
          )}
          
          {verificationState === 'verified' && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 rounded-lg text-green-800 text-center">
                <p>You can now complete your organization setup</p>
              </div>
              
              <div className="flex justify-center">
                <Button>
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          )}
          
          {verificationState === 'expired' && (
            <div className="space-y-4 text-center">
              <Button 
                variant="default" 
                className="flex items-center mx-auto" 
                onClick={() => setVerificationState('waiting')}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Request New Verification Email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-sm text-slate-500">
        <p>Need help? <a href="#" className="text-primary hover:underline">Contact Support</a></p>
      </div>
    </div>
  );
}