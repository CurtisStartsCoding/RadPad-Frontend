import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PatentPendingNotice from "@/components/common/PatentPendingNotice";
import { ArrowRight, FileText, CheckCircle2, Sparkles } from "lucide-react";

export default function TrialPage() {
  const [_, setLocation] = useLocation();
  
  const handleStartTrial = () => {
    setLocation("/trial-auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="flex flex-col items-center mb-6">
        <svg
          className="h-12 w-12 text-primary mb-3"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 4v16H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12z"></path>
          <path d="M3 6v12a2 2 0 0 0 2 2h2"></path>
          <path d="M10 4v4"></path>
          <path d="M14 4v4"></path>
          <path d="M10 14h4"></path>
          <path d="M10 10h4"></path>
        </svg>
        <h1 className="text-3xl font-bold">RadOrderPad Trial</h1>
        <div className="mt-2">
          <PatentPendingNotice />
        </div>
      </div>
      
      <Card className="w-full max-w-4xl mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Physician Trial Sandbox</CardTitle>
          <CardDescription>
            Experience RadOrderPad's validation engine without full registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Try Before You Register</h3>
              <p className="text-slate-600">
                Our trial sandbox allows physicians to test the validation engine with no PHI involvement and no full registration required.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 mr-3">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Enter Clinical Dictation</h4>
                    <p className="text-sm text-slate-500">Submit your clinical notes for imaging studies</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 mr-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Instant Code Assignment</h4>
                    <p className="text-sm text-slate-500">Get accurate CPT and ICD-10 codes based on your clinical information</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 mr-3">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Risk-Free Evaluation</h4>
                    <p className="text-sm text-slate-500">No PHI storage, no risk, and no long-term commitment required</p>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleStartTrial} className="w-full mt-4">
                Start Trial Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">What's Included in the Trial</h3>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>10 free validations</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>AI-powered clinical validation</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>CPT & ICD-10 code suggestions</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>Clinical appropriateness feedback</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <span>Simplified registration (email, password, name, specialty)</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-800">
                  Limited Trial: Each trial account includes 10 free validations. Register for a full account to access all RadOrderPad features.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <p className="text-sm text-slate-500">
          Already have an account? <a href="/auth" className="text-primary hover:underline">Sign in here</a>
        </p>
      </div>
    </div>
  );
}