import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/layout/PageHeader";
import { Lock, KeyRound, Smartphone, Shield, Copy, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const Security = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Security Settings" 
        description="Manage your account security and password"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Overview - Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 p-2 mr-3">
                    <Lock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Password</p>
                    <p className="text-xs text-slate-500">Last changed 30 days ago</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-red-100 p-2 mr-3">
                    <Smartphone className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-500">Not enabled</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-full bg-amber-100 p-2 mr-3">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Recovery Codes</p>
                    <p className="text-xs text-slate-500">Not generated</p>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Login Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Today at 9:30 AM</p>
                    <p className="text-xs text-slate-500">Seattle, WA • Chrome on Windows</p>
                  </div>
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Current</div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Yesterday at 2:45 PM</p>
                    <p className="text-xs text-slate-500">Seattle, WA • Chrome on Windows</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Aug 10, 2023 at 10:15 AM</p>
                    <p className="text-xs text-slate-500">Seattle, WA • Safari on iPhone</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Full Activity Log
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Security Settings - Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input 
                    id="current-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your current password" 
                    className="pr-10"
                  />
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
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input 
                    id="new-password" 
                    type={showNewPassword ? "text" : "password"} 
                    placeholder="Enter new password" 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Password must be at least 8 characters and include a number and special character</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm-password" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirm new password" 
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button className="mt-2">
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900">Enable Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                </div>
                <Switch 
                  checked={is2FAEnabled} 
                  onCheckedChange={setIs2FAEnabled} 
                  aria-label="Toggle 2FA"
                />
              </div>
              
              {is2FAEnabled && (
                <div className="mt-4 space-y-4">
                  <Separator />
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-900">Set up Two-Factor Authentication</h3>
                    <p className="text-xs text-slate-500">Scan the QR code with an authenticator app like Google Authenticator or Authy.</p>
                    
                    <div className="flex justify-center py-4">
                      <div className="bg-slate-100 rounded-lg p-4 inline-block">
                        <div className="w-40 h-40 bg-slate-300 rounded-lg flex items-center justify-center">
                          <KeyRound className="h-12 w-12 text-slate-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Or enter this code manually:</p>
                      <div className="flex">
                        <code className="bg-slate-100 text-slate-800 px-3 py-1 rounded text-sm flex-1">ABCD-EFGH-IJKL-MNOP</code>
                        <Button variant="ghost" size="sm" className="ml-2 h-8">
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="verification-code">Enter the 6-digit verification code</Label>
                      <Input id="verification-code" placeholder="000000" maxLength={6} className="font-mono" />
                    </div>
                    
                    <Button className="mt-2">
                      Verify and Enable
                    </Button>
                  </div>
                </div>
              )}
              
              {!is2FAEnabled && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="flex items-start">
                    <Shield className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
                    <span>
                      We strongly recommend enabling two-factor authentication to add an extra layer of security to your account.
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Recovery codes can be used to access your account if you lose your two-factor authentication device.</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                {is2FAEnabled ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {[...Array(8)].map((_, i) => (
                        <code key={i} className="bg-slate-100 text-slate-800 px-3 py-1 rounded text-sm text-center">
                          ••••••••••••
                        </code>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 text-center">
                      Keep these recovery codes in a safe place. Each code can only be used once.
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Codes
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-3">Recovery codes are only available after enabling two-factor authentication.</p>
                    <Button size="sm" variant="outline" disabled={!is2FAEnabled}>
                      Generate Recovery Codes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Security;
