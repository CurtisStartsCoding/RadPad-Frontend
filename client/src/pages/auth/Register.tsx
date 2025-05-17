import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, Building, ChevronRight, Eye, EyeOff, Mail, Lock, User } from "lucide-react";

const Register = () => {
  const [activeTab, setActiveTab] = useState("organization");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo purposes only - in a real app this would call an API
    console.log("Registration attempted");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center mb-2">
            <AlertCircle className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-primary ml-2">RadOrderPad</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Create an account</h1>
          <p className="text-slate-500 mt-1">Choose the type of account you need</p>
        </div>

        {/* Registration Card */}
        <Card>
          <Tabs defaultValue="organization" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="trial">Trial User</TabsTrigger>
            </TabsList>
            
            <TabsContent value="organization">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Organization Registration</CardTitle>
                  <CardDescription>
                    Register your organization and create an admin account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Organization Details */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Organization Details</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="org-name">Organization Name</Label>
                        <div className="relative">
                          <Input 
                            id="org-name" 
                            placeholder="Your organization name" 
                            className="pl-10"
                            required
                          />
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="org-type">Organization Type</Label>
                        <Select required>
                          <SelectTrigger id="org-type">
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="referring">Referring Practice</SelectItem>
                            <SelectItem value="radiology">Radiology Group</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="npi">NPI Number</Label>
                          <Input id="npi" placeholder="10-digit NPI" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" placeholder="(123) 456-7890" required />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Admin User Details */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">Admin User Details</h3>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="first-name">First Name</Label>
                          <div className="relative">
                            <Input 
                              id="first-name" 
                              placeholder="First name" 
                              className="pl-10"
                              required
                            />
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last-name">Last Name</Label>
                          <Input 
                            id="last-name" 
                            placeholder="Last name" 
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="name@example.com" 
                            className="pl-10"
                            required
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
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
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
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
                  <Button className="w-full" type="submit" disabled={!agreeTerms}>
                    Create Organization Account
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <div className="mt-4 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <a href="#" className="text-primary hover:underline">
                      Sign in
                    </a>
                  </div>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="trial">
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Trial User Registration</CardTitle>
                  <CardDescription>
                    Create a free trial account to explore RadOrderPad
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trial-first-name">First Name</Label>
                      <div className="relative">
                        <Input 
                          id="trial-first-name" 
                          placeholder="First name" 
                          className="pl-10"
                          required
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trial-last-name">Last Name</Label>
                      <Input 
                        id="trial-last-name" 
                        placeholder="Last name" 
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select required>
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary_care">Primary Care</SelectItem>
                        <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trial-email">Email Address</Label>
                    <div className="relative">
                      <Input 
                        id="trial-email" 
                        type="email" 
                        placeholder="name@example.com" 
                        className="pl-10"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="trial-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="trial-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
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
                  </div>
                  
                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox 
                      id="trial-terms" 
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                      required
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor="trial-terms" 
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
                  <Button className="w-full" type="submit" disabled={!agreeTerms}>
                    Create Trial Account
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <div className="mt-4 text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <a href="#" className="text-primary hover:underline">
                      Sign in
                    </a>
                  </div>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
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

export default Register;