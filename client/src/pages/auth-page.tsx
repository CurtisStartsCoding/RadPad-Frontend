import { useState } from "react";
import { Save, Eye, EyeOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center mb-6">
        <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
        <h1 className="text-2xl font-bold text-slate-900">RadOrderPad</h1>
        <p className="text-sm text-slate-500 mt-1">Patent Pending. RadOrderPad™ technology is protected by US and international patent applications.</p>
      </div>

      <Card className="w-full max-w-md shadow-sm">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-center mb-6">Sign In</h2>
          <p className="text-sm text-center text-slate-500 mb-6">Enter your credentials to access your account</p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="physician@abcfamilymedicine.com" 
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={isPasswordVisible ? "text" : "password"} 
                  placeholder="••••••••••" 
                  className="w-full pr-10"
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility} 
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400"
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm">Remember me</label>
              </div>
              <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
            </div>
            
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </div>
          
          <div className="mt-6 text-center text-xs text-slate-500">
            <div className="mb-1">Test Accounts:</div>
            <div>Physician: physician@abcfamilymedicine.com / physician123</div>
            <div>Radiologist: radiologist@nyradiology.com / radiologist123</div>
            <div className="mt-2">HIPAA-Compliant | Secure Authentication | PHI Protected</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account? <a href="/trial-auth" className="text-primary hover:underline">Try our free trial</a>
        </p>
      </div>
    </div>
  );
}