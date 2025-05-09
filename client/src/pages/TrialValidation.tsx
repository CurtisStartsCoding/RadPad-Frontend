import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { getApiUrl, logApiConfiguration, REMOTE_API_URL } from "@/lib/config";
import { TRIAL_ACCESS_TOKEN_KEY } from "@/lib/useAuth";
import {
  Mic,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Sparkles,
  InfoIcon,
  MoveDown
} from "lucide-react";

const TrialValidation = () => {
  const { toast } = useToast();
  const [dictationText, setDictationText] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  
  // Create a ref to store the recognition instance
  const recognitionRef = useRef<any>(null);
  const [validationResults, setValidationResults] = useState<{
    aucScore: number;
    isCompliant: boolean;
    suggestedCptCode: string;
    suggestedCptDescription: string;
    suggestedIcd10Code: string;
    suggestedIcd10Description: string;
    feedback: string[];
  } | null>(null);
  
  // Track remaining validation credits
  const [remainingCredits, setRemainingCredits] = useState(5);
  
  // Log API configuration on component mount
  useEffect(() => {
    logApiConfiguration();
    console.log(`API requests will be sent to: ${REMOTE_API_URL}`);
  }, []);
  
  // Handle dictation text change
  const handleDictationTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDictationText(e.target.value);
    // Reset validation state when text changes
    if (validationComplete) {
      setValidationComplete(false);
      setValidationResults(null);
    }
    // Clear validation feedback when text changes
    if (validationFeedback) {
      setValidationFeedback(null);
    }
  };
  
  // Handle validation
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
    
    setIsValidating(true);
    
    try {
      // Get the trial auth token from localStorage
      const token = localStorage.getItem(TRIAL_ACCESS_TOKEN_KEY);
      
      if (!token) {
        console.error('No authentication token found in localStorage');
        toast({
          title: "Authentication Error",
          description: "You need to be logged in to validate orders",
          variant: "destructive",
        });
        setIsValidating(false);
        return;
      }
      
      console.log('Sending validation request to remote API:', REMOTE_API_URL);
      console.log('Using authorization token:', token.substring(0, 15) + '...');
      
      // Make a real API call to validate the order
      const response = await fetch(getApiUrl('/orders/validate/trial'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dictationText: dictationText
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`API error: ${response.status}`, errorData);
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Validation response received:', data);
      
      // Check if the response has the expected structure
      if (!data.success || !data.validationResult) {
        throw new Error('Invalid API response format');
      }
      
      const result = data.validationResult;
      
      // Transform the API response to match our expected format
      const validationResults = {
        aucScore: result.complianceScore || 0,
        isCompliant: result.validationStatus === 'appropriate',
        suggestedCptCode: result.suggestedCPTCodes && result.suggestedCPTCodes.length > 0 ? result.suggestedCPTCodes[0].code : "",
        suggestedCptDescription: result.suggestedCPTCodes && result.suggestedCPTCodes.length > 0 ? result.suggestedCPTCodes[0].description : "",
        suggestedIcd10Code: result.suggestedICD10Codes && result.suggestedICD10Codes.length > 0 ? result.suggestedICD10Codes[0].code : "",
        suggestedIcd10Description: result.suggestedICD10Codes && result.suggestedICD10Codes.length > 0 ? result.suggestedICD10Codes[0].description : "",
        feedback: result.feedback ? [result.feedback] : ["Order appears appropriate based on clinical indication"]
      };
      
      setValidationResults(validationResults);
      setIsValidating(false);
      setValidationComplete(true);
      
      // If validation status indicates need for clarification, set the feedback
      if (result.validationStatus === 'needs_clarification' || !validationResults.isCompliant) {
        setValidationFeedback(result.feedback || "Additional information needed to validate this order.");
      } else {
        setValidationFeedback(null);
      }
      
      // Decrement remaining credits
      setRemainingCredits(prev => Math.max(0, prev - 1));
      
      toast({
        title: validationResults.isCompliant ? "Validation Successful" : "Validation Complete with Suggestions",
        description: validationResults.isCompliant
          ? "Your order meets clinical appropriateness criteria"
          : "We've identified some suggestions to improve this order",
        variant: validationResults.isCompliant ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Validation error:', error);
      setIsValidating(false);
      
      // Set validation feedback for display in the UI
      setValidationFeedback(
        error instanceof Error
          ? error.message
          : "There was an error validating your order. Please try again."
      );
      
      toast({
        title: "Validation Error",
        description: error instanceof Error ? error.message : "There was an error validating your order. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle trying another validation
  const handleTryAnother = () => {
    setDictationText("");
    setValidationComplete(false);
    setValidationResults(null);
    setValidationFeedback(null);
  };
  
  // Function to add additional clarification section
  const addAdditionalClarification = () => {
    const newText = dictationText + "\n\n--------Additional Clarification----------\n\n";
    setDictationText(newText);
    
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
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Try using Chrome or Edge.",
        variant: "destructive",
      });
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
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak clearly into your microphone",
        });
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let currentInterimTranscript = '';
        
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
          setDictationText(prevText => {
            const newText = prevText ? `${prevText} ${finalTranscript}` : finalTranscript;
            return newText.trim();
          });
          
          // Clear interim transcript when we have a final result
          setInterimTranscript('');
          
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
          setInterimTranscript('');
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
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
      console.error('Error initializing speech recognition:', error);
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
      setInterimTranscript('');
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
      <PageHeader 
        title="Trial Validation Sandbox" 
        description="Test your clinical dictations and see real-time validation feedback"
      />
      
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl">
        <div className="w-full lg:w-3/5">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Clinical Dictation</CardTitle>
                  <CardDescription>
                    Enter a sample clinical indication for testing
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  {remainingCredits} Validations Remaining
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {validationFeedback && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
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
                      <XCircle className="h-4 w-4" />
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
                  </div>
                </Alert>
              )}
              
              <div className="relative">
                <Textarea
                  placeholder="Enter your clinical dictation here. For example: '45-year-old female with right knee pain persisting for over 3 months, not responsive to NSAIDs and physical therapy. Previous X-ray showed mild degenerative changes.'"
                  className="min-h-[200px] resize-none pb-10"
                  onChange={handleDictationTextChange}
                  value={dictationText}
                  disabled={isValidating}
                />
                <p className="text-sm text-slate-500 mt-2">
                  Include clinical indications, relevant history, and requested study details.
                  <span className="ml-1 text-blue-600 font-medium">
                    You may edit or append to your existing text.
                  </span>
                </p>
                {interimTranscript && (
                  <div className="absolute bottom-12 left-0 right-0 bg-blue-50 px-3 py-2 text-blue-700 text-sm border-t border-blue-200">
                    <span className="opacity-70">{interimTranscript}</span>
                    <span className="ml-1 animate-pulse">...</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    disabled={isValidating}
                    onClick={() => setDictationText("")}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2 ${isListening ? 'bg-red-50 text-red-600 border-red-300' : ''}`}
                    disabled={isValidating}
                    onClick={toggleVoiceInput}
                  >
                    <Mic className={`h-4 w-4 mr-1.5 ${isListening ? 'text-red-600 animate-pulse' : ''}`} />
                    {isListening ? 'Stop Recording' : 'Voice Input'}
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  {dictationText.length > 0 && (
                    <span>{dictationText.length} characters</span>
                  )}
                </div>
                <Button 
                  onClick={handleValidate} 
                  disabled={isValidating || !dictationText.trim() || remainingCredits <= 0}
                >
                  {isValidating ? (
                    <>
                      <span className="mr-2">Validating...</span>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : "Validate Order"}
                </Button>
              </div>
              
              
              {remainingCredits <= 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Trial limit reached</AlertTitle>
                  <AlertDescription>
                    You've used all your trial validations. Sign up for a full account to continue using the service.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full lg:w-2/5">
          {validationComplete && validationResults && (
            <Card className="h-full">
              <CardHeader className={`pb-3 ${validationResults.isCompliant ? 'bg-green-50' : 'bg-amber-50'}`}>
                <div className="flex items-start">
                  {validationResults.isCompliant ? (
                    <div className="mr-3 bg-green-100 rounded-full p-1.5">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="mr-3 bg-amber-100 rounded-full p-1.5">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className={validationResults.isCompliant ? 'text-green-800' : 'text-amber-800'}>
                      {validationResults.isCompliant 
                        ? 'Order Meets Appropriateness Criteria' 
                        : 'Suggestions for Order Improvement'}
                    </CardTitle>
                    <CardDescription className={validationResults.isCompliant ? 'text-green-600' : 'text-amber-600'}>
                      Appropriateness Score: {validationResults.aucScore}/8
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1.5 text-slate-400" />
                    Your Dictation
                  </h3>
                  <p className="text-sm bg-slate-50 p-3 rounded-md">
                    {dictationText}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5 text-slate-400" />
                    Suggested Codes
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-md space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">CPT Code</p>
                      <p className="text-sm font-medium">{validationResults.suggestedCptCode}: {validationResults.suggestedCptDescription}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ICD-10 Code</p>
                      <p className="text-sm font-medium">{validationResults.suggestedIcd10Code}: {validationResults.suggestedIcd10Description}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <InfoIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                    Feedback
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <ul className="space-y-1.5">
                      {validationResults.feedback.map((item, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <div className={`mt-0.5 mr-2 h-3 w-3 rounded-full flex-shrink-0 ${validationResults.isCompliant ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleTryAnother}
                      className="flex-1"
                      variant="outline"
                      disabled={remainingCredits <= 0}
                    >
                      <RefreshCcw className="h-4 w-4 mr-1.5" />
                      Try Another Validation
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-800"
                      onClick={() => {
                        addAdditionalClarification();
                        setValidationComplete(false);
                      }}
                    >
                      + Add Clarification
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!validationComplete && (
            <Card className="h-full bg-slate-50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center p-6">
              <div className="mb-4 bg-slate-100 rounded-full p-3">
                <MoveDown className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">Validation Results</h3>
              <p className="text-sm text-slate-500 text-center mb-4">
                Enter your clinical dictation, then click "Validate Order" to see results here.
              </p>
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 mb-1">Example Validations:</span>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• MRI Knee for chronic pain</li>
                  <li>• CT Chest for persistent cough</li>
                  <li>• MRI Brain for recurrent headaches</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialValidation;