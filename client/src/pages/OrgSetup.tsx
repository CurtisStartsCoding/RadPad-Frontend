import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, LucideIcon, MapPin, CreditCard, CheckCircle2 } from "lucide-react";

// Setup step component
interface SetupStepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  onClick: () => void;
}

function SetupStep({ icon: Icon, title, description, status, onClick }: SetupStepProps) {
  return (
    <Card 
      className={`cursor-pointer hover:border-primary transition-colors ${
        status === 'current' ? 'border-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-full ${
            status === 'completed' ? 'bg-green-100' : 
            status === 'current' ? 'bg-blue-100' : 'bg-slate-100'
          }`}>
            <Icon className={`h-5 w-5 ${
              status === 'completed' ? 'text-green-600' : 
              status === 'current' ? 'text-primary' : 'text-slate-500'
            }`} />
          </div>
          
          {status === 'completed' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Completed
            </Badge>
          )}
          {status === 'current' && (
            <Badge variant="outline" className="bg-blue-50 text-primary border-blue-200">
              In Progress
            </Badge>
          )}
        </div>
        
        <h3 className="font-medium text-lg mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function OrgSetup() {
  const [activeStep, setActiveStep] = useState(0);
  
  // Steps for the onboarding process
  const steps = [
    {
      icon: Building2,
      title: "Verify Organization",
      description: "Confirm your organization details and contact information",
      status: 'completed' as const
    },
    {
      icon: MapPin,
      title: "Add Locations",
      description: "Set up physical locations or facilities for your organization",
      status: 'current' as const
    },
    {
      icon: Users,
      title: "Invite Team Members",
      description: "Add colleagues and staff members to your RadOrderPad account",
      status: 'pending' as const
    },
    {
      icon: CreditCard,
      title: "Billing Setup",
      description: "Confirm your subscription plan and payment details",
      status: 'pending' as const
    }
  ];
  
  const progressPercent = (activeStep + 1) * 25;
  
  // Function to navigate to a specific step
  const navigateToStep = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Organization Setup</h1>
        <p className="text-sm text-slate-500">Complete the following steps to set up your RadOrderPad account</p>
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Setup Progress</p>
          <p className="text-sm font-medium">{progressPercent}% Complete</p>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {steps.map((step, index) => (
          <SetupStep
            key={index}
            icon={step.icon}
            title={step.title}
            description={step.description}
            status={
              index < activeStep ? 'completed' : 
              index === activeStep ? 'current' : 'pending'
            }
            onClick={() => navigateToStep(index)}
          />
        ))}
      </div>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{steps[activeStep].title}</CardTitle>
            <CardDescription>{steps[activeStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {activeStep === 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg text-green-800 flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Organization Verified</p>
                    <p className="text-sm">Your organization details have been verified and your account is active.</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Organization Name</h3>
                    <p>ABC Family Medicine</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Organization Type</h3>
                    <p>Referring Practice</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Primary Address</h3>
                    <p>123 Main Street, New York, NY 10001</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">Contact Information</h3>
                    <p>contact@abcfamilymedicine.com</p>
                    <p>(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => navigateToStep(1)}>
                    Continue to Locations Setup
                  </Button>
                </div>
              </div>
            )}
            
            {activeStep === 1 && (
              <div className="space-y-4">
                <p>Please navigate to the Locations page to add your practice locations.</p>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => navigateToStep(0)}>
                    Back
                  </Button>
                  <Button onClick={() => navigateToStep(2)}>
                    Continue to Team Members
                  </Button>
                </div>
              </div>
            )}
            
            {activeStep === 2 && (
              <div className="space-y-4">
                <p>Please navigate to the Users page to invite team members to your organization.</p>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => navigateToStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => navigateToStep(3)}>
                    Continue to Billing Setup
                  </Button>
                </div>
              </div>
            )}
            
            {activeStep === 3 && (
              <div className="space-y-4">
                <p>Please navigate to the Billing & Credits page to confirm your subscription details.</p>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => navigateToStep(2)}>
                    Back
                  </Button>
                  <Button>
                    Complete Setup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}