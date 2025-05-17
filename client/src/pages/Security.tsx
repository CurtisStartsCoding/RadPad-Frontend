import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Lock,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Calendar,
  LucideSmartphone,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  User
} from "lucide-react";

const Security = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [show2FAEnableDialog, setShow2FAEnableDialog] = useState(false);
  const [show2FADisableDialog, setShow2FADisableDialog] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  
  // Mock session and activity data
  const recentActivity = [
    {
      id: 1,
      action: "Login",
      device: "Chrome / macOS",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.1",
      date: "2023-07-30T14:30:00"
    },
    {
      id: 2,
      action: "Changed Password",
      device: "Chrome / macOS",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.1",
      date: "2023-07-15T10:45:00"
    },
    {
      id: 3,
      action: "Login",
      device: "Safari / iOS",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.2",
      date: "2023-07-10T09:20:00"
    },
    {
      id: 4,
      action: "Login",
      device: "Firefox / Windows",
      location: "Chicago, IL",
      ipAddress: "192.168.1.3",
      date: "2023-07-01T16:15:00"
    },
  ];
  
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
  
  // Function to handle 2FA toggle
  const handle2FAToggle = () => {
    if (twoFAEnabled) {
      setShow2FADisableDialog(true);
    } else {
      setShow2FAEnableDialog(true);
    }
  };
  
  // Function to confirm 2FA enable
  const confirm2FAEnable = () => {
    if (verificationCode === "123456") { // Mock verification for UI demo
      setTwoFAEnabled(true);
      setShow2FAEnableDialog(false);
      setVerificationCode("");
    }
  };
  
  // Function to confirm 2FA disable
  const confirm2FADisable = () => {
    if (verificationCode === "123456") { // Mock verification for UI demo
      setTwoFAEnabled(false);
      setShow2FADisableDialog(false);
      setVerificationCode("");
    }
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Mock recovery codes
  const recoveryCodes = [
    "ABCD-EFGH-IJKL-MNOP",
    "QRST-UVWX-YZ12-3456",
    "7890-ABCD-EFGH-IJKL",
    "MNOP-QRST-UVWX-YZ12",
    "3456-7890-ABCD-EFGH",
    "IJKL-MNOP-QRST-UVWX"
  ];

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Security Settings</h1>
          <p className="text-sm text-slate-500">Manage your account security and authentication options</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6 md:col-span-2">
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
          
          {/* Two-Factor Authentication Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-slate-600" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-base font-medium">{twoFAEnabled ? "Enabled" : "Not Enabled"}</h3>
                  <p className="text-sm text-slate-500">
                    {twoFAEnabled 
                      ? "Your account is protected with two-factor authentication" 
                      : "Protect your account with two-factor authentication"}
                  </p>
                </div>
                <Switch
                  checked={twoFAEnabled}
                  onCheckedChange={handle2FAToggle}
                />
              </div>
              
              {twoFAEnabled && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Recovery Codes</h4>
                        <p className="text-xs text-blue-600 mt-1">
                          Save these recovery codes in a secure location. You can use these codes to access your account if you lose your authentication device.
                        </p>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {recoveryCodes.map((code, index) => (
                            <div key={index} className="flex items-center bg-white p-2 rounded border border-blue-200">
                              <code className="text-xs font-mono text-blue-800">{code}</code>
                              <Button 
                                variant="ghost" 
                                className="h-6 w-6 p-0 ml-auto" 
                                onClick={() => navigator.clipboard.writeText(code)}
                              >
                                <Copy className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 flex justify-end">
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Copy className="h-3.5 w-3.5 mr-1.5" />
                            Copy All Codes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" onClick={() => setShow2FADisableDialog(true)}>
                      Disable 2FA
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Login Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyRound className="h-5 w-5 mr-2 text-slate-600" />
                Recent Login Activity
              </CardTitle>
              <CardDescription>
                Monitor your account activity and security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.device}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="mr-1">{activity.location}</span>
                          {activity.id === 4 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                          {formatDate(activity.date)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t flex justify-between items-center">
              <p className="text-xs text-slate-500">Last login was 2 days ago from San Francisco, CA</p>
              <Button variant="outline" size="sm">View All Activity</Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Security Recommendations & Notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Recommendations</CardTitle>
              <CardDescription>
                Steps to further secure your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Strong Password</p>
                  <p className="text-xs text-slate-500">Your password is secure</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                {twoFAEnabled ? (
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="bg-amber-100 p-1.5 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">
                    {twoFAEnabled 
                      ? "2FA is enabled" 
                      : "Enable 2FA for extra security"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 p-1.5 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Recovery Email</p>
                  <p className="text-xs text-slate-500">Recovery email is set</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 p-1.5 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Unusual Login Detected</p>
                  <p className="text-xs text-slate-500">Login from a new location</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Notifications</CardTitle>
              <CardDescription>
                Manage how you receive security alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-slate-500">Receive alerts via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Unusual Activity</p>
                  <p className="text-xs text-slate-500">Alert when login from new device</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Password Changes</p>
                  <p className="text-xs text-slate-500">Alert on password updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Account Updates</p>
                  <p className="text-xs text-slate-500">Alert on profile changes</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connected Devices</CardTitle>
              <CardDescription>
                Devices currently logged into your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div className="flex items-center">
                  <div className="bg-slate-100 p-2 rounded-full mr-3">
                    <LucideSmartphone className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">iPhone 13</p>
                    <p className="text-xs text-slate-500">San Francisco, CA • Current device</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-8">Remove</Button>
              </div>
              
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="bg-slate-100 p-2 rounded-full mr-3">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">MacBook Pro</p>
                    <p className="text-xs text-slate-500">San Francisco, CA • 2 days ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-8">Remove</Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
      
      {/* 2FA Enable Dialog */}
      <AlertDialog open={show2FAEnableDialog} onOpenChange={setShow2FAEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set Up Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-2">
                <p>Scan this QR code with your authenticator app:</p>
                
                <div className="flex justify-center">
                  <div className="bg-white p-3 border rounded">
                    {/* Placeholder for QR code - in a real app, this would be a generated QR code */}
                    <div className="w-48 h-48 bg-slate-900 flex items-center justify-center">
                      <span className="text-white text-xs">QR Code Placeholder</span>
                    </div>
                  </div>
                </div>
                
                <p>Then enter the 6-digit verification code from your app:</p>
                
                <div className="flex justify-center">
                  <Input 
                    className="max-w-[200px] text-center font-mono"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-xs text-blue-700">
                      For demo purposes, enter <span className="font-medium">123456</span> as the verification code
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirm2FAEnable}
              disabled={verificationCode.length !== 6}
            >
              Verify & Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 2FA Disable Dialog */}
      <AlertDialog open={show2FADisableDialog} onOpenChange={setShow2FADisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-2">
                <p>This will remove an additional layer of security from your account. Are you sure you want to continue?</p>
                
                <p>Enter the 6-digit verification code from your authenticator app to confirm:</p>
                
                <div className="flex justify-center">
                  <Input 
                    className="max-w-[200px] text-center font-mono"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    placeholder="000000"
                  />
                </div>
                
                <div className="bg-amber-50 p-3 rounded-md">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                    <p className="text-xs text-amber-700">
                      Warning: Your account will be less secure without two-factor authentication
                    </p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-xs text-blue-700">
                      For demo purposes, enter <span className="font-medium">123456</span> as the verification code
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirm2FADisable}
              disabled={verificationCode.length !== 6}
              className="bg-red-600 hover:bg-red-700"
            >
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Security;