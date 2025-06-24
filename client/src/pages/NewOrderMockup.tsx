import { useState, useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/useAuth";
import { Patient, ProcessedDictation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OverrideDialog from "@/components/OverrideDialog";
import PatientInfoCard from "@/components/order/PatientInfoCard";
import ValidationView from "@/components/order/ValidationView";
import PatientIdentificationDialog from "@/components/order/PatientIdentificationDialog";
import SignatureForm from "@/components/order/SignatureForm";
import { ArrowLeft, AlertCircle, Info, X, Beaker, InfoIcon, Mic, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/roles";
import PageHeader from "@/components/layout/PageHeader";


interface NewOrderProps {
  userRole?: UserRole;
}

const NewOrderMockup = ({ userRole = UserRole.Physician }: NewOrderProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orderStep, setOrderStep] = useState<'dictation' | 'validation' | 'signature'>('dictation');
  const [dictationText, setDictationText] = useState("");
  const [validationResult, setValidationResult] = useState<ProcessedDictation | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState<string>("");
  const [characterCount, setCharacterCount] = useState(0);
  const [remainingCredits, setRemainingCredits] = useState(5);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [patient, setPatient] = useState<Patient>({
    id: 0,
    name: 'No Patient Identified',
    dob: '',
    mrn: '',
    pidn: '',
    radiologyGroupId: null,
    referringPracticeId: null,
    externalPatientId: null,
    encryptedData: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    gender: ''
  });
  const [submittedOrderId, setSubmittedOrderId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  
  // Check if user is trial user - use the role from auth if available
  const effectiveUserRole = user?.role || userRole;
  const isTrialUser = effectiveUserRole === UserRole.TrialPhysician;
  
  // Check authentication status on component mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setValidationFeedback("You must be logged in to validate orders. Please log in and try again.");
    }
  }, [isLoading, isAuthenticated]);
  
  // Type declarations for Web Speech API
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
    interpretation: any;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    onstart: () => void;
  }

  // Clean up speech recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
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
  const handleProcessOrderWithOverride = async (justification: string) => {
    // Do one final validation pass with current dictation text
    try {
      setIsProcessing(true);
      
      const endpoint = isTrialUser ? '/api/orders/validate/trial' : '/api/orders/validate';
      
      // First, try one more validation with the current dictation text
      // The physician may have added clarifying information
      const requestPayload = {
        dictationText,
        attemptCount: 4 // Final attempt
      };
      
      const response = await apiRequest('POST', endpoint, requestPayload);
      const apiResult = await response.json();
      
      // Check if the final validation passed
      if (apiResult.validationResult && apiResult.validationResult.validationStatus === 'valid') {
        // Great! The additional information resolved the issues
        const result: ProcessedDictation = {
          validationStatus: 'valid',
          feedback: apiResult.validationResult.feedback || 'Order validated successfully',
          complianceScore: apiResult.validationResult.complianceScore,
          suggestedCodes: [
            ...(apiResult.validationResult.suggestedICD10Codes?.map((icd: any) => ({
              code: icd.code,
              description: icd.description,
              type: 'ICD-10' as const,
              confidence: icd.confidence || 0.8,
              isPrimary: icd.isPrimary || false
            })) || []),
            ...(apiResult.validationResult.suggestedCPTCodes?.map((cpt: any) => ({
              code: cpt.code,
              description: cpt.description,
              type: 'CPT' as const,
              confidence: cpt.confidence || 0.8,
              isPrimary: cpt.isPrimary || false
            })) || [])
          ],
          overridden: true,
          overrideJustification: justification
        };
        
        setValidationResult(result);
        setOrderStep('validation');
        setValidationFeedback(null); // Clear any previous feedback
      } else {
        // Final validation still failed, proceed with override
        const overridePayload = {
          dictationText,
          isOverrideValidation: true,
          overrideJustification: justification
        };
        
        const overrideResponse = await apiRequest('POST', endpoint, overridePayload);
        const overrideResult = await overrideResponse.json();
        
        if (overrideResult.validationResult) {
          const result: ProcessedDictation = {
            validationStatus: 'valid', // Force valid for override
            feedback: overrideResult.validationResult.feedback || 'Order overridden by physician',
            complianceScore: overrideResult.validationResult.complianceScore,
            suggestedCodes: [
              ...(overrideResult.validationResult.suggestedICD10Codes?.map((icd: any) => ({
                code: icd.code,
                description: icd.description,
                type: 'ICD-10' as const,
                confidence: icd.confidence || 0.8,
                isPrimary: icd.isPrimary || false
              })) || []),
              ...(overrideResult.validationResult.suggestedCPTCodes?.map((cpt: any) => ({
                code: cpt.code,
                description: cpt.description,
                type: 'CPT' as const,
                confidence: cpt.confidence || 0.8,
                isPrimary: cpt.isPrimary || false
              })) || [])
            ],
            overridden: true,
            overrideJustification: justification
          };
          
          setValidationResult(result);
          setOrderStep('validation');
          setValidationFeedback(null); // Clear any previous feedback
        }
      }
    } catch (error) {
      console.error("Override error:", error);
      setValidationFeedback("An error occurred while processing the override. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

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
      setIsProcessing(true);
      // Don't set validation feedback for processing state
      
      // Determine which API endpoint to use based on user role
      const endpoint = isTrialUser ? '/api/orders/validate/trial' : '/api/orders/validate';
      
      console.log("Making API call to:", endpoint);
      console.log("Request payload:", {
        dictationText,
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
        // Full payload for regular endpoint - same as trial, just dictation
        requestPayload = {
          dictationText,
          isOverrideValidation: attemptCount > 0
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
      const apiResult = await response.json();
      
      // Log the full response data
      console.log("API Response data:", apiResult);
      
      // Handle the validation result
      try {
        // Check if we have the expected structure from the remote API
        if (apiResult.validationResult) {
          // Remote API format
          const result: ProcessedDictation = {
            validationStatus: apiResult.validationResult.validationStatus === 'appropriate' ? 'valid' : 'invalid',
            feedback: apiResult.validationResult.feedback || 'No feedback provided',
            complianceScore: apiResult.validationResult.complianceScore,
            suggestedCodes: [
              ...(apiResult.validationResult.suggestedICD10Codes?.map((icd: any) => ({
                code: icd.code,
                description: icd.description,
                type: 'ICD-10' as const,
                confidence: icd.confidence || 0.8,
                isPrimary: icd.isPrimary || false
              })) || []),
              ...(apiResult.validationResult.suggestedCPTCodes?.map((cpt: any) => ({
                code: cpt.code,
                description: cpt.description,
                type: 'CPT' as const,
                confidence: cpt.confidence || 0.8,
                isPrimary: cpt.isPrimary || false
              })) || [])
            ]
            // orderId is no longer returned by the validation endpoint
          };
          
          console.log("Processed validation result:", result);
          
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
        } else {
          // If we didn't find the expected structure, try to use the response directly
          if (apiResult.validationStatus === 'valid') {
            // Successful validation
            console.log("Validation successful:", apiResult);
            setValidationResult(apiResult);
            setOrderStep('validation');
            setValidationFeedback(null);
          } else {
            // Validation issues
            console.log("Validation issues:", apiResult.feedback);
            setValidationFeedback(apiResult.feedback || "There are issues with your order that need to be addressed.");
            setAttemptCount(prev => prev + 1);
          }
        }
      } catch (parseError) {
        console.error("Error parsing validation data:", parseError);
        setValidationFeedback("Error processing the validation response. Please try again.");
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
        
        // Provide more specific error message based on the error type
        if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
          setValidationFeedback("Network error: Unable to connect to the validation service. Please check your internet connection and try again.");
        } else if (error.message.includes('401')) {
          setValidationFeedback("Authentication error: Your session may have expired. Please log out and log back in, then try again.");
        } else if (error.message.includes('403')) {
          setValidationFeedback("Authorization error: You don't have permission to perform this action. Please contact support.");
        } else if (error.message.includes('500')) {
          setValidationFeedback("Server error: The validation service encountered an error. Our team has been notified and is working to resolve the issue.");
        } else {
          setValidationFeedback(`Error: ${error.message}. Please try again or contact support if the issue persists.`);
        }
      } else {
        console.error("Unknown error type:", error);
        setValidationFeedback("An unexpected error occurred while processing your order. Please try again.");
      }
      
      // Log additional diagnostic information
      console.log("Diagnostic information:");
      console.log("- API endpoint:", isTrialUser ? '/api/orders/validate/trial' : '/api/orders/validate');
      console.log("- Token exists:", !!localStorage.getItem('rad_order_pad_access_token'));
      console.log("- Dictation length:", dictationText.length);
      console.log("- Attempt count:", attemptCount);
    } finally {
      setIsProcessing(false);
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
  
  // Handle order submission
  const handleOrderSubmitted = (orderId: number) => {
    console.log("NewOrder - handleOrderSubmitted  orderId:", {orderId});
    setSubmittedOrderId(orderId);
    // You could redirect to a confirmation page or show a success message
    alert(`Order #${orderId} has been successfully submitted!`);
    // Reset the form to start a new order
    setOrderStep('dictation');
    setDictationText("");
    setValidationResult(null);
  };

  // Handle clear dictation text
  const handleClearText = () => {
    setDictationText("");
    setCharacterCount(0);
  };

  // Function to add additional clarification section
  const addAdditionalClarification = () => {
    const newText = dictationText + "\n--------Additional Clarification----------\n";
    setDictationText(newText);
    setCharacterCount(newText.length);
    
    // Focus and move cursor to end of textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = newText.length;
        textarea.selectionEnd = newText.length;
      }
    }, 0);
  };

  // Handle dictation input
  const handleDictationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDictationText(e.target.value);
    setCharacterCount(e.target.value.length);
    // Don't clear validation feedback when typing
  };

  // Handle voice input using Web Speech API
  const handleVoiceInput = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    // Check if SpeechRecognition is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice Recognition Not Available. Your browser doesn't support voice recognition. Please type manually.");
      return;
    }

    try {
      // Initialize speech recognition
      // @ts-ignore - TypeScript doesn't know about these browser-specific APIs
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
      
      // Configure recognition
      recognition.continuous = false; // Get one complete phrase at a time
      recognition.interimResults = true; // Still get interim results for feedback
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
        console.log("Speech recognition started");
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let currentInterimTranscript = '';
        
        console.log("Speech recognition result received", event.results);
        
        // Process results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
            console.log("Final transcript:", result[0].transcript);
          } else {
            currentInterimTranscript += result[0].transcript;
            console.log("Interim transcript:", result[0].transcript);
          }
        }
        
        // Update interim transcript for visual feedback
        console.log("Setting interim transcript:", currentInterimTranscript);
        setInterimTranscript(currentInterimTranscript);
        
        // Only update the main text area with final results
        if (finalTranscript) {
          console.log("Updating dictation text with final transcript:", finalTranscript);
          setDictationText(prevText => {
            const newText = prevText ? `${prevText} ${finalTranscript}` : finalTranscript;
            setCharacterCount(newText.length);
            return newText.trim();
          });
          
          // Clear interim transcript when we have a final result
          setInterimTranscript('');
          
          // Restart recognition to get the next phrase
          // This creates a small pause between phrases for better accuracy
          recognition.stop();
        }
      };
      
      // When recognition ends, restart it if still in recording mode
      recognition.onend = () => {
        if (isRecording && recognitionRef.current) {
          // Small delay before restarting to avoid rapid restarts
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (error) {
              // Ignore errors from trying to start when already started
              console.log("Recognition restart error (can be ignored):", error);
            }
          }, 300);
        } else {
          setIsRecording(false);
          setInterimTranscript('');
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        setInterimTranscript('');
      };
      
      // Store the recognition instance in our ref
      recognitionRef.current = recognition;
      
      // Start listening
      recognition.start();
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript('');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={`Radiology Order - ${patient.name}`}
      >
        <div className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium">
          {orderStep === 'dictation' && "Step 1 of 3: Dictation"}
          {orderStep === 'validation' && "Step 2 of 3: Review"}
          {orderStep === 'signature' && "Step 3 of 3: Sign Order"}
        </div>
      </PageHeader>
      
      <div>
        {/* Trial User Banner */}
        {isTrialUser && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardHeader className="pb-2 px-4 sm:px-6">
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
                <span className="ml-1 text-primary font-medium">
                  You may edit or append to your existing text.
                </span>
              </p>
              
              {/* Validation feedback - prototype style */}
              {validationFeedback && !isProcessing && (
                <div className="mt-3 border border-red-300 rounded-md overflow-hidden">
                  <div className="bg-red-100 px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <h3 className="text-sm font-medium text-red-800">Issues with Dictation</h3>
                    </div>
                    <button 
                      onClick={() => setValidationFeedback(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="bg-white px-4 py-3 text-sm text-gray-700 border-t border-red-200">
                    <p>{validationFeedback}</p>
                    
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="h-8 text-xs px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                        onClick={addAdditionalClarification}
                      >
                        <Plus className="h-3 w-3 mr-1 inline-block" />
                        Add Clarification
                      </button>
                      
                      {attemptCount >= 3 && (
                        <button
                          type="button"
                          className="h-8 text-xs px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300"
                          onClick={() => setIsOverrideDialogOpen(true)}
                        >
                          Override
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-3 border border-gray-200 rounded-md bg-white overflow-hidden focus-within:outline focus-within:outline-1 focus-within:outline-primary">
                <div className="relative">
                  <textarea
                    className="w-full min-h-[200px] sm:h-48 p-3 sm:p-4 border-0 shadow-none focus:outline-none resize-none rounded-none"
                    placeholder="Examples: '55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.'"
                    value={dictationText}
                    onChange={handleDictationChange}
                  />
                  {/* Always render the interim transcript div, but only show content when there is interim text */}
                  <div className={`absolute bottom-0 left-0 right-0 bg-blue-50 px-3 py-2 text-blue-700 text-sm border-t border-blue-200 ${interimTranscript ? 'block' : 'hidden'}`}>
                    <span className="opacity-70">{interimTranscript}</span>
                    <span className="ml-1 animate-pulse">...</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="h-8 px-2 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                      onClick={handleClearText}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 inline-block">
                        <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="hidden sm:inline">Clear</span>
                      <span className="sm:hidden">Clear</span>
                    </button>
                    <button
                      type="button"
                      className={`h-8 px-2 text-xs border ${isRecording ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300'} rounded-md hover:bg-gray-50`}
                      onClick={handleVoiceInput}
                    >
                      <Mic className={`h-3 w-3 mr-1 inline-block ${isRecording ? 'animate-pulse text-red-600' : ''}`} />
                      {isRecording ? (
                        <>
                          <span className="hidden sm:inline">Stop Recording</span>
                          <span className="sm:hidden">Stop</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Voice Input</span>
                          <span className="sm:hidden">Voice</span>
                        </>
                      )}
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
                disabled={dictationText.trim().length < 10 || isProcessing}
                onClick={handleProcessOrder}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Process Order"
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Validation View */}
        {orderStep === 'validation' && validationResult && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <ValidationView 
                dictationText={dictationText} 
                validationResult={validationResult}
                onBack={handleBackToDictation}
                onSign={handleSignOrder}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Signature Form */}
        {orderStep === 'signature' && validationResult && (
          isTrialUser ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4">Order Validation Complete</h2>
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
                    <p className="mt-3 text-sm text-blue-700 font-medium">
                      Please contact support to upgrade to a full account.
                    </p>
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
              </CardContent>
            </Card>
          ) : (
            <SignatureForm
              patient={patient}
              dictationText={dictationText}
              validationResult={validationResult}
              onBack={handleBackToDictation}
              onSubmitted={handleOrderSubmitted}
            />
          )
        )}
      </div>
      
      {/* Override Dialog */}
      <OverrideDialog
        isOpen={isOverrideDialogOpen}
        onClose={() => setIsOverrideDialogOpen(false)}
        onConfirm={(justification) => {
          setOverrideJustification(justification);
          setIsOverrideDialogOpen(false);
          handleProcessOrderWithOverride(justification);
        }}
      />
    </div>
  );
};

export default NewOrderMockup;