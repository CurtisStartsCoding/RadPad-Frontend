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
  RefreshCw
} from "lucide-react";

const Security = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  // Function to handle password change
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return;
    }
    
    // In a real app, this would call an API
    console.log("Changing password:", { currentPassword, newPassword });
    
    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
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
                  disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  Update Password
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
            <AlertDialogAction>
              Send Reset Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </div>
  );
};

export default Security;