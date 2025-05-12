import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/config";
import { TRIAL_ACCESS_TOKEN_KEY, TRIAL_TOKEN_EXPIRY_KEY } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function TrialAuthPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Show a toast that we're attempting login
      const loginToast = toast({
        title: "Logging in",
        description: "Verifying your trial credentials...",
        duration: 5000,
      });
      
      // Call the trial login API endpoint
      const response = await fetch(getApiUrl('/auth/trial/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store the token in localStorage using trial-specific keys
      localStorage.setItem(TRIAL_ACCESS_TOKEN_KEY, data.token);
      
      // Store trial validation credits information if available
      if (data.trialInfo && data.trialInfo.validationsRemaining !== undefined) {
        localStorage.setItem('rad_order_pad_trial_validations_remaining', data.trialInfo.validationsRemaining.toString());
      }
      
      // Calculate expiry time (1 hour from now) and save it
      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(TRIAL_TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      toast({
        title: "Login Successful",
        description: "Welcome to the RadOrderPad Trial",
        variant: "default",
        duration: 3000,
      });
      
      // Navigate to the trial validation page
      setTimeout(() => {
        setLocation("/trial-validation");
      }, 500);
      
    } catch (error) {
      console.error("Trial login error:", error);
      
      let errorMessage = "Invalid email or password. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      
      // Clear password field on error for security
      setPassword("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!email || !password || !firstName || !lastName || !specialty) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Show a toast that we're attempting registration
      const registerToast = toast({
        title: "Creating Account",
        description: "Setting up your trial account...",
        duration: 5000,
      });
      
      // Call the trial registration API endpoint
      const response = await fetch(getApiUrl('/auth/trial/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          specialty
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store the token in localStorage using trial-specific keys
      localStorage.setItem(TRIAL_ACCESS_TOKEN_KEY, data.token);
      
      // Store trial validation credits information if available
      if (data.trialInfo && data.trialInfo.validationsRemaining !== undefined) {
        localStorage.setItem('rad_order_pad_trial_validations_remaining', data.trialInfo.validationsRemaining.toString());
      }
      
      // Calculate expiry time (1 hour from now) and save it
      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(TRIAL_TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      toast({
        title: "Registration Successful",
        description: "Your trial account has been created",
        variant: "default",
        duration: 3000,
      });
      
      // Navigate to the trial validation page
      setTimeout(() => {
        setLocation("/trial-validation");
      }, 500);
      
    } catch (error) {
      console.error("Trial registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-full lg:w-1/2 flex flex-col p-4 sm:p-8 justify-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">RadOrderPad Physician Trial</h1>
        </div>
        
        <Card className="w-full max-w-md mx-auto shadow-sm">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-2">Physician Trial Sandbox</h2>
            <p className="text-sm text-slate-500 mb-6">Experience RadOrderPad's validation engine without full registration</p>
            
            <Tabs defaultValue="login" onValueChange={setActiveTab} className="mb-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="pt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="physician@abcfamilymedicine.com"
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="••••••••••"
                        className="w-full pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="current-password"
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
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Logging in...</span>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </>
                    ) : "Login"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register" className="pt-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="w-full"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        className="w-full"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="trialEmail" className="text-sm font-medium">Email</label>
                    <Input
                      id="trialEmail"
                      type="email"
                      placeholder="physician@abcfamilymedicine.com"
                      className="w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="trialPassword" className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Input
                        id="trialPassword"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="••••••••••"
                        className="w-full pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="new-password"
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
                  
                  <div className="space-y-2">
                    <label htmlFor="specialty" className="text-sm font-medium">Medical Specialty</label>
                    <Select
                      value={specialty}
                      onValueChange={setSpecialty}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family_medicine">Family Medicine</SelectItem>
                        <SelectItem value="internal_medicine">Internal Medicine</SelectItem>
                        <SelectItem value="cardiology">Cardiology</SelectItem>
                        <SelectItem value="neurology">Neurology</SelectItem>
                        <SelectItem value="orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="ob_gyn">OB/GYN</SelectItem>
                        <SelectItem value="pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Registering...</span>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </>
                    ) : "Register"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <p className="text-xs text-slate-500 mt-4 text-center">
              Using this trial does not create patient records or store PHI
            </p>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account? <a href="/auth" className="text-primary hover:underline">Sign in here</a>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-primary p-8 text-white justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6">Experience RadOrderPad's AI-Powered Validation</h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-primary mr-3">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Enter Clinical Dictation</h3>
                <p className="text-sm text-blue-100">Submit your clinical notes and dictation for imaging studies</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-primary mr-3">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant Code Assignment</h3>
                <p className="text-sm text-blue-100">Get accurate CPT and ICD-10 codes based on your clinical information</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-primary mr-3">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Risk-Free Evaluation</h3>
                <p className="text-sm text-blue-100">No PHI storage, no risk, and no long-term commitment required</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-800 bg-opacity-30 rounded-lg">
            <p className="text-sm font-medium mb-1">Limited Trial:</p>
            <p className="text-sm">Each trial account includes 10 free validations. Register for a full account to access all RadOrderPad features.</p>
          </div>
        </div>
      </div>
    </div>
  );
}