import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { temporaryPatient } from "@/lib/mock-data";
import PatientInfoCard from "@/components/order/PatientInfoCard";
import ValidationView from "@/components/order/ValidationView";
import PatientIdentificationDialog from "@/components/order/PatientIdentificationDialog";
import { ArrowLeft, AlertCircle, Info, X, Beaker, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/roles";
import PageHeader from "@/components/layout/PageHeader";

// Mock validation result for demo
const mockValidationResult = {
  validationStatus: 'valid' as const,
  feedback: "The clinical information provided is sufficient for the requested MRI of the right knee. This order meets the appropriate use criteria (AUC) for imaging based on the documented history of trauma and ongoing symptoms.",
  complianceScore: 8,
  suggestedCodes: [
    {
      code: "S83.6XXA",
      description: "Sprain of the superior tibiofibular joint and ligament, initial encounter",
      type: "ICD-10" as const,
      confidence: 0.91
    },
    {
      code: "M25.561",
      description: "Pain in right knee",
      type: "ICD-10" as const,
      confidence: 0.85
    },
    {
      code: "73721",
      description: "Magnetic resonance imaging, any joint of lower extremity",
      type: "CPT" as const,
      confidence: 0.94
    }
  ]
};

interface NewOrderProps {
  userRole?: UserRole;
}

const NewOrder = ({ userRole = UserRole.Physician }: NewOrderProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orderStep, setOrderStep] = useState<'dictation' | 'validation' | 'signature'>('dictation');
  const [dictationText, setDictationText] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [remainingCredits, setRemainingCredits] = useState(5);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [patient, setPatient] = useState(temporaryPatient);
  
  // Check if user is trial user - use the role from auth if available
  const effectiveUserRole = user?.role || userRole;
  const isTrialUser = effectiveUserRole === UserRole.TrialPhysician;
  
  // Check authentication status on component mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setValidationFeedback("You must be logged in to validate orders. Please log in and try again.");
    }
  }, [isLoading, isAuthenticated]);
  
  // Handle opening patient identification dialog
  const handleEditPatient = () => {
    setIsPatientDialogOpen(true);
  };
  
  // Handle patient identification
  const handlePatientIdentified = (patientInfo: { name: string; dob: string }) => {
    // Update patient with identified information
    setPatient({
      ...patient,
      name: patientInfo.name,
      dob: patientInfo.dob
    });
    
    // Close the dialog
    setIsPatientDialogOpen(false);
  };
  
  // Process order
  const handleProcessOrder = async () => {
    // Check if user is authenticated
    if (!isLoading && !isAuthenticated) {
      setValidationFeedback("You must be logged in to validate orders. Please log in and try again.");
      return;
    }
    
    if (!dictationText || dictationText.trim().length < 10) {
      setValidationFeedback("Please provide more detailed dictation before submitting");
      return;
    }
    
    // For trial users, decrement remaining credits
    if (isTrialUser) {
      setRemainingCredits(prev => Math.max(0, prev - 1));
    }
    
    try {
      // Show loading state
      setValidationFeedback("Processing your order...");
      
      // Determine which API endpoint to use based on user role
      const endpoint = isTrialUser ? '/api/orders/validate/trial' : '/api/orders/validate';
      
      console.log("Making API call to:", endpoint);
      console.log("Request payload:", {
        dictationText,
        orderId: validationResult?.orderId,
        isOverrideValidation: attemptCount > 0
      });
      
      // Check if token exists in localStorage
      const token = localStorage.getItem('rad_order_pad_access_token');
      if (!token) {
        console.error("No authentication token found");
        setValidationFeedback("Authentication error: No token found. Please log in again.");
        return;
      }
      
      // Prepare the request payload based on the endpoint
      let requestPayload;
      
      if (isTrialUser) {
        // Simplified payload for trial endpoint
        requestPayload = {
          dictationText,
          isOverrideValidation: attemptCount > 0
        };
      } else {
        // Full payload for regular endpoint
        requestPayload = {
          dictationText,
          orderId: validationResult?.orderId,
          isOverrideValidation: attemptCount > 0,
          patientId: patient.id || null,
          patient: {
            id: patient.id,
            name: patient.name,
            dob: patient.dob,
            mrn: patient.mrn
          }
        };
      }
      
      console.log("Making API call to:", endpoint);
      console.log("Request payload:", requestPayload);
      
      // Make API call to validate the order
      const response = await apiRequest('POST', endpoint, requestPayload);
      
      console.log("API Response status:", response.status);
      // Log headers in a TypeScript-compatible way
      const headerObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headerObj[key] = value;
      });
      console.log("API Response headers:", headerObj);
      
      // Parse the response
      const result = await response.json();
      
      // Log the full response data
      console.log("API Response data:", result);
      
      // Handle the validation result
      if (result.validationStatus === 'valid') {
        // Successful validation
        console.log("Validation successful:", result);
        setValidationResult(result);
        setOrderStep('validation');
        setValidationFeedback(null);
      } else {
        // Validation issues
        console.log("Validation issues:", result.feedback);
        setValidationFeedback(result.feedback || "There are issues with your order that need to be addressed.");
        setAttemptCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error validating order:", error);
      // Type guard for Error objects
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error("Unknown error type:", error);
      }
      setValidationFeedback("An error occurred while processing your order. Please try again.");
    }
  };
  
  // Handle returning to dictation
  const handleBackToDictation = () => {
    setOrderStep('dictation');
  };
  
  // Handle signing the order
  const handleSignOrder = () => {
    setOrderStep('signature');
  };

  // Handle clear dictation text
  const handleClearText = () => {
    setDictationText("");
    setCharacterCount(0);
  };

  // Handle dictation input
  const handleDictationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDictationText(e.target.value);
    setCharacterCount(e.target.value.length);
    if (validationFeedback) {
      setValidationFeedback(null);
    }
  };

  // Handle voice input (simulated)
  const handleVoiceInput = () => {
    // Simulate voice input for demo purposes
    const voiceTexts = [
      "55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.",
      "MRI abdomen with and without contrast for a 60-year-old male with acute right upper quadrant pain, fever, and elevated liver enzymes, concern for cholecystitis or biliary obstruction."
    ];
    
    const newText = dictationText 
      ? dictationText + "\n\n" + voiceTexts[attemptCount % 2] 
      : voiceTexts[attemptCount % 2];
    
    setDictationText(newText);
    setCharacterCount(newText.length);
  };

  return (
    <div className="p-6">
      <PageHeader
        title={`Radiology Order - ${patient.name === "Unknown Patient" ? "Unknown Patient" : patient.name}`}
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="h-2 w-2 bg-blue-600 rounded-full mr-1"></span>
            <span className="h-2 w-2 bg-gray-300 rounded-full mr-1"></span>
            <span className="h-2 w-2 bg-gray-300 rounded-full"></span>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </Button>
        </div>
      </PageHeader>
      
      <div>
        {/* Trial User Banner */}
        {isTrialUser && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Beaker className="h-5 w-5 text-blue-500 mr-2" />
                  <CardTitle className="text-lg text-blue-700">Trial Mode</CardTitle>
                </div>
                <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                  {remainingCredits} validation credits remaining
                </Badge>
              </div>
              <CardDescription className="text-blue-700 mt-1">
                You are using RadOrderPad in trial mode. In this mode, you can test the clinical validation features without sending orders to radiology groups.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      
        <div className="text-sm font-medium text-blue-600 mb-4">
          Step 1 of 3: Dictation
        </div>
        
        {/* Patient Information - Only show if not trial user */}
        {!isTrialUser && (
          <div className="mb-6">
            <PatientInfoCard 
              patient={patient} 
              onEditPatient={handleEditPatient}
            />
          </div>
        )}
        
        {/* Patient Identification Dialog */}
        <PatientIdentificationDialog
          open={isPatientDialogOpen}
          onCancel={() => setIsPatientDialogOpen(false)}
          onIdentify={handlePatientIdentified}
        />
        
        {/* Dictation Form */}
        {orderStep === 'dictation' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-base font-medium text-gray-900">Clinical Dictation</span>
                  <div className="ml-2 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    HIPAA Protected
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Include clinical indications, relevant history, and requested study details.
                {dictationText.trim().length > 0 && validationFeedback && (
                  <span className="ml-1 text-blue-600 font-medium">
                    You may edit or append to your existing text.
                  </span>
                )}
              </p>
              
              {validationFeedback && (
                <Alert variant="destructive" className="mt-3 bg-red-50 border-red-200 text-red-800">
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      <AlertDescription className="text-sm">
                        <div className="font-medium mb-1">Issues with Dictation</div>
                        {validationFeedback}
                      </AlertDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-500"
                      onClick={() => setValidationFeedback(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 ml-6">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800">
                      + Add Clarification
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 ml-2 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300">
                      Override
                    </Button>
                  </div>
                </Alert>
              )}
              
              <div className="mt-3">
                <textarea 
                  className="w-full h-48 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Examples: '55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.'"
                  value={dictationText}
                  onChange={handleDictationChange}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-2">
                    <button
                      className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                      onClick={handleClearText}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                        <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Clear
                    </button>
                    <button
                      className="flex items-center justify-center px-4 py-2 ml-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                      onClick={handleVoiceInput}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                        <rect x="7" y="4" width="10" height="16" rx="5" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 4V2M12 20V22M4 12H2M6 6L4.5 4.5M18 6L19.5 4.5M22 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Voice Input
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {characterCount} characters
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              <Button
                className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-4 py-2 h-auto"
                disabled={dictationText.trim().length < 10}
                onClick={handleProcessOrder}
              >
                Process Order
              </Button>
            </div>
          </div>
        )}
        
        {/* Validation View */}
        {orderStep === 'validation' && validationResult && (
          <Card>
            <CardContent className="p-6">
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review the clinical information and validation results before signing the order.
                </AlertDescription>
              </Alert>
              
              <ValidationView 
                dictationText={dictationText} 
                validationResult={validationResult}
                onBack={handleBackToDictation}
                onSign={handleSignOrder}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Signature View would go here for step 3 */}
        {orderStep === 'signature' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-medium mb-4">
                {isTrialUser ? "Order Validation Complete" : "Digital Signature"}
              </h2>
              
              {isTrialUser ? (
                <>
                  <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
                    <div className="flex items-start">
                      <div className="mr-2 flex-shrink-0">✓</div>
                      <AlertDescription>
                        Your order has been successfully validated! In a full account, you would be able to sign and submit this order to a radiology group.
                      </AlertDescription>
                    </div>
                  </Alert>
                  
                  <Card className="mb-6 bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md text-blue-700">Trial Validation Credits</CardTitle>
                      <CardDescription className="text-blue-600">
                        You have used 1 validation credit. You have {remainingCredits} credits remaining in your trial.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <p className="text-sm text-blue-700">
                        To continue using RadOrderPad with unlimited validations and to submit orders to radiology groups, please sign up for a full account.
                      </p>
                      <Button className="mt-3 bg-blue-700 hover:bg-blue-800">
                        Sign Up for Full Account
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBackToDictation}>
                      Back to Dictation
                    </Button>
                    <Button className="bg-gray-800 hover:bg-gray-900 text-white">
                      Start New Validation
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
                    <AlertDescription>
                      By electronically signing this order, I certify that this radiology study is medically necessary and appropriate according to AUC guidelines. This order has been validated with 0.9% compliance.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border border-gray-200 rounded-md p-4 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"></div>
                      <div className="col-span-1 border border-gray-200 rounded-md min-h-[100px] flex items-center justify-center">
                        <svg viewBox="0 0 100 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                          <path d="M 10 25 C 20 10, 40 10, 50 25" stroke="#1e3a8a" strokeWidth="2" fill="none"></path>
                          <path d="M 50 25 C 60 40, 80 40, 90 25" stroke="#1e3a8a" strokeWidth="2" fill="none"></path>
                        </svg>
                      </div>
                      <div className="col-span-1 text-right text-sm text-gray-500">
                        Type your full name to confirm
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">Clear</Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
                    <div className="flex items-start">
                      <Info className="h-4 w-4 mt-0.5 mr-2" />
                      <div>
                        <div className="font-medium">Temporary Patient Detected</div>
                        <div className="text-sm">This order will be queued for administrative staff to attach complete patient information.</div>
                      </div>
                    </div>
                  </Alert>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBackToDictation}>
                      Back
                    </Button>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      Sign & Queue for Admin
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewOrder;