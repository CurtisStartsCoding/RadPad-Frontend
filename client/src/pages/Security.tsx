import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Lock,
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";
import { useAuth } from "@/lib/useAuth";

const Security = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const { requestPasswordReset } = useAuth();
  
  // Function to handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return;
    }
    
    // Get user email from localStorage
    const userDataStr = localStorage.getItem('rad_order_pad_user_data');
    if (!userDataStr) {
      console.error("User data not found in localStorage");
      return;
    }
    
    try {
      const userData = JSON.parse(userDataStr);
      const email = userData.email;
      
      // Get the user role from localStorage
      const userRole = localStorage.getItem('rad_order_pad_user_role');
      const isTrial = userRole === 'trial_physician';
      
      // Show loading state
      setIsUpdating(true);
      
      // Get the token for authorization
      const token = localStorage.getItem('rad_order_pad_access_token');
      
      // Prepare request body based on user type
      let requestBody;
      let endpoint;
      
      if (isTrial) {
        // For trial users, only email and newPassword are required
        endpoint = '/auth/trial/update-password';
        requestBody = {
          email,
          newPassword
        };
      } else {
        // For regular users, include currentPassword
        endpoint = '/auth/update-password';
        requestBody = {
          email,
          currentPassword,
          newPassword
        };
      }
      
      // Make the API request
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }
      
      // Show success message
      toast({
        title: "Success",
        description: "Your password has been updated successfully",
        variant: "default"
      });
      
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password update error:", error);
      
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to handle password reset request
  const handlePasswordReset = async () => {
    // Get user email from localStorage
    const userDataStr = localStorage.getItem('rad_order_pad_user_data');
    if (!userDataStr) {
      console.error("User data not found in localStorage");
      toast({
        title: "Error",
        description: "User information not found. Please log in again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsResetting(true);
      
      const userData = JSON.parse(userDataStr);
      const email = userData.email;
      
      // Check if this is a trial user
      const userRole = localStorage.getItem('rad_order_pad_user_role');
      const isTrial = userRole === 'trial_physician';
      
      if (isTrial) {
        // For trial users, show a message that this feature is not available
        setTimeout(() => {
          toast({
            title: "Trial Account Limitation",
            description: "Password reset is not available for trial accounts. Please register for a full account to access all features.",
            variant: "default"
          });
          setShowResetDialog(false);
        }, 1000);
        return;
      }
      
      // For regular users, call the requestPasswordReset function
      await requestPasswordReset(email);
      
      // Show success message
      toast({
        title: "Success",
        description: "Password reset link has been sent to your email",
        variant: "default"
      });
      
      // Close the dialog
      setShowResetDialog(false);
    } catch (error) {
      console.error("Password reset request error:", error);
      
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send password reset link",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Security Settings</h1>
          <p className="text-sm text-slate-500">Manage your account security settings</p>
        </div>
      </div>
      
      <div className="max-w-xl">
        {/* Password Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-slate-600" />
              Password Settings
            </CardTitle>
            <CardDescription>
              Update your password regularly to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <p className="text-xs text-slate-500">
                  Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Passwords don't match
                  </p>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center"
                  onClick={() => setShowResetDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                
                <Button
                  type="submit"
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      
      {/* Reset Password Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Your Password?</AlertDialogTitle>
            <AlertDialogDescription>
              We'll send a password reset link to your email address. You'll be logged out of all devices after resetting your password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset} disabled={isResetting}>
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </div>
  );
};

export default Security;