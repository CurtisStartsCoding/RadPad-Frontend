import React, { useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { User, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppPage } from "@/App";
import { UserRole } from "@/lib/roles";

const HeaderTest: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.Physician);
  
  const handleNavigate = (page: AppPage) => {
    console.log(`Navigating to: ${page}`);
    // In a real app, this would use router navigation
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader 
        title="Radiology Order - Unknown Patient" 
        subtitle="Step 1 of 3: Dictation"
        onNavigate={handleNavigate}
        userRole={currentRole}
      />
      
      {/* Role selector for testing */}
      <div className="bg-white p-2 mx-auto mt-2 rounded-md shadow-sm flex flex-wrap gap-2 justify-center">
        <Button 
          size="sm" 
          variant={currentRole === UserRole.Physician ? "default" : "outline"}
          onClick={() => setCurrentRole(UserRole.Physician)}
        >
          Physician
        </Button>
        <Button 
          size="sm" 
          variant={currentRole === UserRole.AdminStaff ? "default" : "outline"}
          onClick={() => setCurrentRole(UserRole.AdminStaff)}
        >
          Admin Staff
        </Button>
        <Button 
          size="sm" 
          variant={currentRole === UserRole.Radiologist ? "default" : "outline"}
          onClick={() => setCurrentRole(UserRole.Radiologist)}
        >
          Radiologist
        </Button>
        <Button 
          size="sm" 
          variant={currentRole === UserRole.TrialPhysician ? "default" : "outline"}
          onClick={() => setCurrentRole(UserRole.TrialPhysician)}
        >
          Trial User
        </Button>
        <Button 
          size="sm" 
          variant={currentRole === UserRole.SuperAdmin ? "default" : "outline"}
          onClick={() => setCurrentRole(UserRole.SuperAdmin)}
        >
          Super Admin
        </Button>
      </div>
      
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {/* Patient Banner */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3 mb-4 flex items-start gap-2">
          <User className="h-5 w-5 text-gray-600 mt-0.5" />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Unknown Patient</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded flex items-center">
                <svg className="h-3 w-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 14a1 1 0 01-1-1V7a1 1 0 112 0v6a1 1 0 01-1 1zm0-12a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
                Temporary
              </span>
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Unknown
              </span>
              <span>PIDN: 9061935558645</span>
            </div>
          </div>
        </div>
        
        {/* Dictation Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Clinical Dictation</h2>
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                <path d="M10 5a1 1 0 011 1v4a1 1 0 01-1 1H6a1 1 0 010-2h3V6a1 1 0 011-1z" />
              </svg>
              HIPAA Protected
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Include clinical indications, relevant history, and requested study details.
          </p>
          <div className="border border-gray-200 rounded-md">
            <div className="p-3 text-gray-500 min-h-[200px]">
              Examples: '55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.'
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 p-2 bg-gray-50">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                  <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Voice Input
                </Button>
                <span className="text-xs text-gray-500">0 characters</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <Button className="w-full max-w-xs bg-blue-400 hover:bg-blue-500">
            Process Order
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HeaderTest;