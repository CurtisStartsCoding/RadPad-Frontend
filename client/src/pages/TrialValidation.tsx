import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ValidationView from "@/components/order/ValidationView";
import { ArrowLeft, AlertCircle, Info, X, Beaker, InfoIcon, Mic, RefreshCcw, CheckCircle, XCircle, FileText, Sparkles, MoveDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/roles";
import PageHeader from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { TRIAL_ACCESS_TOKEN_KEY } from "@/lib/useAuth";
import { getApiUrl, logApiConfiguration, REMOTE_API_URL } from "@/lib/config";
import { Textarea } from "@/components/ui/textarea";

const TrialValidation = () => {
  const { toast } = useToast();
  const [orderStep, setOrderStep] = useState<'dictation' | 'validation' | 'signature'>('dictation');
  const [dictationText, setDictationText] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  
  // Track remaining validation credits
  const [remainingCredits, setRemainingCredits] = useState(0);
  
  // Load validation credits from localStorage on component mount
  useEffect(() => {
    const storedCredits = localStorage.getItem('rad_order_pad_trial_validations_remaining');
    if (storedCredits) {
      setRemainingCredits(parseInt(storedCredits, 10));
    }
  }, []);
  
  // For compatibility with the existing validation results structure
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    aucScore: number;
    isCompliant: boolean;
    suggestedCptCode: string;
    suggestedCptDescription: string;
    suggestedIcd10Code: string;
    suggestedIcd10Description: string;
    feedback: string[];
  } | null>(null);

  // Log API configuration on component mount
  useEffect(() => {
    logApiConfiguration();
    console.log(`API requests will be sent to: ${REMOTE_API_URL}`);
  }, []);

  // Handle dictation input
  const handleDictationTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDictationText(e.target.value);
    setCharacterCount(e.target.value.length);
    
    // Don't clear validation feedback when typing
    // Only reset validation completion state
    if (validationComplete) {
      setValidationComplete(false);
      setValidationResults(null);
    }
  };

  // Process order (validation)
  const handleValidate = async () => {
    // Basic validation
    if (!dictationText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your clinical dictation",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get the trial auth token from localStorage
      const token = localStorage.getItem(TRIAL_ACCESS_TOKEN_KEY);

      if (!token) {
        console.error("No authentication token found in localStorage");
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to validate orders",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      console.log("Sending validation request to remote API:", REMOTE_API_URL);
      console.log("Using authorization token:", token.substring(0, 15) + "...");
      
      // Prepare the request payload
      const requestPayload = {
        dictationText,
        isOverrideValidation: attemptCount > 0
      };
      
      // Make a real API call to validate the order
      const response = await fetch(getApiUrl("/orders/validate/trial"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error(`API error: ${response.status}`, errorData);
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Validation response received:", data);

      // Check if the response has the expected structure
      if (!data.success || !data.validationResult) {
        throw new Error("Invalid API response format");
      }

      const result = data.validationResult;

      // Update remaining credits from the API response if available
      if (data.trialInfo && data.trialInfo.validationsRemaining !== undefined) {
        setRemainingCredits(data.trialInfo.validationsRemaining);
        localStorage.setItem('rad_order_pad_trial_validations_remaining', data.trialInfo.validationsRemaining.toString());
      }

      // Transform the API response to match our expected format
      const validationResults = {
        aucScore: result.complianceScore || 0,
        isCompliant: result.validationStatus === "appropriate",
        suggestedCptCode:
          result.suggestedCPTCodes && result.suggestedCPTCodes.length > 0
            ? result.suggestedCPTCodes[0].code
            : "",
        suggestedCptDescription:
          result.suggestedCPTCodes && result.suggestedCPTCodes.length > 0
            ? result.suggestedCPTCodes[0].description
            : "",
        suggestedIcd10Code:
          result.suggestedICD10Codes && result.suggestedICD10Codes.length > 0
            ? result.suggestedICD10Codes[0].code
            : "",
        suggestedIcd10Description:
          result.suggestedICD10Codes && result.suggestedICD10Codes.length > 0
            ? result.suggestedICD10Codes[0].description
            : "",
        feedback: result.feedback
          ? [result.feedback]
          : ["Order appears appropriate based on clinical indication"],
      };

      // Set both validation structures for compatibility
      setValidationResults(validationResults);
      setValidationResult({
        validationStatus: validationResults.isCompliant ? 'valid' : 'invalid',
        feedback: validationResults.feedback[0],
        complianceScore: validationResults.aucScore,
        suggestedCodes: [
          ...(result.suggestedICD10Codes?.map((icd: any) => ({
            code: icd.code,
            description: icd.description,
            type: 'ICD-10' as const
          })) || []),
          ...(result.suggestedCPTCodes?.map((cpt: any) => ({
            code: cpt.code,
            description: cpt.description,
            type: 'CPT' as const
          })) || [])
        ]
      });
      
      setIsProcessing(false);
      setValidationComplete(true);
      
      // If validation is successful, move to validation step
      if (validationResults.isCompliant) {
        setOrderStep('validation');
        setValidationFeedback(null);
      } else {
        // If validation has issues, show feedback
        setValidationFeedback(
          result.feedback ||
            "Additional information needed to validate this order."
        );
        setAttemptCount(prev => prev + 1);
      }

      // Note: We no longer need to manually decrement credits here
      // as we're getting the updated count from the API response

      toast({
        title: validationResults.isCompliant
          ? "Validation Successful"
          : "Validation Complete with Suggestions",
        description: validationResults.isCompliant
          ? "Your order meets clinical appropriateness criteria"
          : "We've identified some suggestions to improve this order",
        variant: validationResults.isCompliant ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Validation error:", error);
      setIsProcessing(false);

      // Set validation feedback for display in the UI
      setValidationFeedback(
        error instanceof Error
          ? error.message
          : "There was an error validating your order. Please try again."
      );

      toast({
        title: "Validation Error",
        description:
          error instanceof Error
            ? error.message
            : "There was an error validating your order. Please try again.",
        variant: "destructive",
      });
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
  
  // Handle trying another validation
  const handleTryAnother = () => {
    setDictationText("");
    setValidationComplete(false);
    setValidationResults(null);
    setValidationResult(null);
    setValidationFeedback(null);
    setOrderStep('dictation');
    setAttemptCount(0);
    setCharacterCount(0);
  };
  
  // Handle clear dictation text
  const handleClearText = () => {
    setDictationText("");
    setCharacterCount(0);
  };

  // Function to add additional clarification section
  const addAdditionalClarification = () => {
    const newText = dictationText + "\n\n--------Additional Clarification----------\n\n";
    setDictationText(newText);
    setCharacterCount(newText.length);
    
    // Focus and move cursor to end of textarea
    setTimeout(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = newText.length;
        textarea.selectionEnd = newText.length;
      }
    }, 0);
  };

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

  // Handle voice input using Web Speech API
  const toggleVoiceInput = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  const startListening = () => {
    // Check if SpeechRecognition is available
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast({
        title: "Speech Recognition Not Supported",
        description:
          "Your browser doesn't support speech recognition. Try using Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Initialize speech recognition
      // TypeScript declarations for browser-specific Speech APIs
      const SpeechRecognitionAPI = (window as any).SpeechRecognition ||
                                  (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI() as SpeechRecognition;

      // Configure recognition
      recognition.continuous = false; // Get one complete phrase at a time
      recognition.interimResults = true; // Still get interim results for feedback
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak clearly into your microphone",
        });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let currentInterimTranscript = "";

        // Process results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            currentInterimTranscript += result[0].transcript;
          }
        }

        // Update interim transcript for visual feedback
        setInterimTranscript(currentInterimTranscript);

        // Only update the main text area with final results
        if (finalTranscript) {
          setDictationText((prevText) => {
            const newText = prevText
              ? `${prevText} ${finalTranscript}`
              : finalTranscript;
            setCharacterCount(newText.length);
            return newText.trim();
          });

          // Clear interim transcript when we have a final result
          setInterimTranscript("");

          // Restart recognition to get the next phrase
          // This creates a small pause between phrases for better accuracy
          recognition.stop();
        }
      };

      // When recognition ends, restart it if still in listening mode
      recognition.onend = () => {
        if (isListening && recognitionRef.current) {
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
          setIsListening(false);
          setInterimTranscript("");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast({
          title: "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
      };

      // Store the recognition instance in our ref
      recognitionRef.current = recognition;

      // Start listening
      recognition.start();
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      toast({
        title: "Error",
        description: "Failed to initialize speech recognition",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript("");
      toast({
        title: "Voice Input Stopped",
        description: "Text has been added to your dictation",
      });
    }
  };

  // Clean up speech recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Trial Validation">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="h-2 w-2 bg-blue-600 rounded-full mr-1"></span>
            <span className="h-2 w-2 bg-gray-300 rounded-full mr-1"></span>
            <span className="h-2 w-2 bg-gray-300 rounded-full"></span>
          </div>
        </div>
      </PageHeader>
      
      <div>
        {/* Trial User Banner */}
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
        
        <div className="text-sm font-medium text-blue-600 mb-4">
          Step 1 of 3: Dictation
        </div>
        
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
                <span className="ml-1 text-blue-600 font-medium">
                  You may edit or append to your existing text.
                </span>
              </p>
              
              {validationFeedback && (
                <Alert variant="destructive" className="mt-3 bg-red-50 border-red-200 text-red-800">
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      <AlertDescription className="text-sm">
                        {!isProcessing && <div className="font-medium mb-1">Issues with Dictation</div>}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800"
                      onClick={addAdditionalClarification}
                    >
                      + Add Clarification
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 ml-2 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-300"
                      onClick={() => {
                        // Force validation to proceed by setting attemptCount to 3 and resubmitting
                        setAttemptCount(3);
                        handleValidate();
                      }}
                    >
                      Override
                    </Button>
                  </div>
                </Alert>
              )}
              
              <div className="mt-3 relative">
                <Textarea
                  className="w-full h-48 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Examples: '55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.'"
                  value={dictationText}
                  onChange={handleDictationTextChange}
                />
                
                <div className={`absolute bottom-12 left-0 right-0 bg-blue-50 px-3 py-2 text-blue-700 text-sm border-t border-blue-200 ${interimTranscript ? 'block' : 'hidden'}`}>
                  <span className="opacity-70">{interimTranscript}</span>
                  <span className="ml-1 animate-pulse">...</span>
                </div>
                
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
                      className={`flex items-center justify-center px-4 py-2 ml-2 text-sm font-medium ${isListening ? 'text-red-700 bg-red-50 border-red-300' : 'text-gray-700 bg-white border-gray-300'} rounded-md shadow-sm hover:bg-gray-50`}
                      onClick={toggleVoiceInput}
                    >
                      <Mic className={`h-4 w-4 mr-2 ${isListening ? 'animate-pulse text-red-600' : ''}`} />
                      {isListening ? 'Stop Recording' : 'Voice Input'}
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
                disabled={dictationText.trim().length < 10 || isProcessing || remainingCredits <= 0}
                onClick={handleValidate}
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
        
        {remainingCredits <= 0 && orderStep === 'dictation' && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Trial limit reached</AlertTitle>
            <AlertDescription>
              You've used all your trial validations. Sign up for a full
              account to continue using the service.
            </AlertDescription>
          </Alert>
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
        
        {/* Signature Form */}
        {orderStep === 'signature' && validationResult && (
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
                  <Button className="mt-3 bg-blue-700 hover:bg-blue-800">
                    Sign Up for Full Account
                  </Button>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBackToDictation}>
                  Back to Dictation
                </Button>
                <Button className="bg-gray-800 hover:bg-gray-900 text-white" onClick={handleTryAnother}>
                  Start New Validation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TrialValidation;
