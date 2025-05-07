import { useState, useRef, useEffect } from "react";
import { ProcessedDictation, Patient } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Mic, RefreshCw, AlertTriangle, X, Plus, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface DictationFormProps {
  dictationText: string;
  setDictationText: (text: string) => void;
  patient: Patient;
  onProcessed: (result: ProcessedDictation) => void;
  validationFeedback?: string;
  onClearFeedback?: () => void;
  attemptCount?: number;
  onOverride?: () => void;
}

const DictationForm = ({ 
  dictationText, 
  setDictationText, 
  patient, 
  onProcessed,
  validationFeedback,
  onClearFeedback,
  attemptCount = 0,
  onOverride
}: DictationFormProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Set up speech recognition if available
  useEffect(() => {
    // Handle WebSpeechAPI TypeScript definitions
    interface SpeechRecognitionEvent extends Event {
      results: SpeechRecognitionResultList;
    }
    
    interface SpeechRecognitionResultList {
      [index: number]: SpeechRecognitionResult;
      length: number;
    }
    
    interface SpeechRecognitionResult {
      [index: number]: SpeechRecognitionAlternative;
      length: number;
      isFinal: boolean;
    }
    
    interface SpeechRecognitionAlternative {
      transcript: string;
      confidence: number;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from({ length: event.results.length }, (_, i) => event.results[i]);
        const transcript = results
          .map(result => result[0].transcript)
          .join('');
        
        // Always append to existing text when using speech recognition
        const updatedText = dictationText && dictationText.trim().length > 0
          ? `${dictationText}\n${transcript}`
          : transcript;
        setDictationText(updatedText);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        toast({
          title: "Voice Recognition Error",
          description: "There was an issue with voice recognition. Please try again or type manually.",
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [dictationText, setDictationText, toast]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Recognition Not Available",
        description: "Your browser doesn't support voice recognition. Please type manually.",
        variant: "destructive",
      });
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast({
        title: "Voice Recognition Activated",
        description: "Speak clearly into your microphone. Tap again to stop.",
      });
    }
  };

  const handleProcessDictation = async () => {
    if (dictationText.length < 20) {
      toast({
        title: "Dictation too short",
        description: "Please provide a more detailed clinical description",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const patientAge = calculateAgeFromDOB(patient.dob);
      const gender = patient.gender;
      
      // Get the auth token from localStorage - not needed with apiRequest
      // const accessToken = localStorage.getItem('rad_order_pad_access_token');
      
      // Make sure dictationText is a string and not an object
      if (typeof dictationText !== 'string') {
        toast({
          title: "Invalid dictation format",
          description: "The dictation text is in an invalid format. Please try again.",
          variant: "destructive",
        });
        throw new Error("Dictation text must be a string");
      }
      
      const cleanDictationText = dictationText;
      
      console.log('Sending dictation text:', cleanDictationText);
      
      // For unknown patients (id=0), use a placeholder ID of 1
      // The API doesn't accept 0 as a valid patient ID
      const patientId = Number(patient.id) === 0 ? 1 : Number(patient.id);
      console.log('Using patient ID:', patientId);
      
      // Make an API call to the validation endpoint using apiRequest
      // Try all possible field name variations based on API documentation
      const response = await apiRequest('POST', '/api/orders/validate', {
        dictation: cleanDictationText, // Field name from API docs
        dictationText: cleanDictationText, // Field name from error message
        modalityType: 'CT', // Required field according to API docs
        patientId: patientId, // camelCase version
        patient_id: patientId, // snake_case version from API docs
        patient: {
          id: patientId // Nested version
        },
        patientInfo: {
          id: patientId, // Include ID in patientInfo
          firstName: patient.name.split(' ')[0] || '',
          lastName: patient.name.split(' ').slice(1).join(' ') || '',
          dateOfBirth: patient.dob,
          gender: gender,
          mrn: patient.mrn || 'Unknown'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const apiResult = await response.json();
      console.log("API Response:", apiResult);
      
      // The remote API returns a different format than the local debug API
      try {
        // Check if we have the expected structure from the remote API
        if (apiResult.validationResult) {
          // Remote API format
          const validationData: ProcessedDictation = {
            validationStatus: apiResult.validationResult.validationStatus === 'appropriate' ? 'valid' : 'invalid',
            feedback: apiResult.validationResult.feedback || 'No feedback provided',
            complianceScore: apiResult.validationResult.complianceScore,
            cptCode: apiResult.validationResult.suggestedCPTCodes?.[0]?.code,
            procedureCodes: apiResult.validationResult.suggestedCPTCodes?.map((cpt: any) => ({
              code: cpt.code,
              description: cpt.description
            })),
            diagnosisCodes: apiResult.validationResult.suggestedICD10Codes?.map((icd: any) => ({
              code: icd.code,
              description: icd.description
            })),
            confidence: apiResult.validationResult.suggestedCPTCodes?.[0]?.confidence,
            // Store the orderId from the API response
            orderId: apiResult.orderId
          };
          
          console.log("Validation Data:", validationData);
          onProcessed(validationData);
        } else {
          // If we didn't find the expected structure, try to adapt the response
          const validationData: ProcessedDictation = {
            validationStatus: 'invalid',
            feedback: 'Unable to process validation result. Please try again.',
          };
          onProcessed(validationData);
        }
      } catch (parseError) {
        console.error("Error parsing validation data:", parseError);
        onProcessed(apiResult);
      }
    } catch (error) {
      console.error("Error processing dictation:", error);
      
      let errorMessage = "Failed to process the dictation. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to calculate age from DOB string
  const calculateAgeFromDOB = (dob: string | undefined): number | undefined => {
    if (!dob || dob === "Unknown") return undefined;
    
    try {
      // Try parsing the date string
      const birthDate = new Date(dob);
      
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        console.error('Invalid date format:', dob);
        return undefined;
      }
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return undefined;
    }
  };
  
  // Focus the textarea when clicked
  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Clear the textarea
  const clearDictation = () => {
    setDictationText("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Function to add additional clarification section
  const addAdditionalClarification = () => {
    const newText = dictationText + "\n\n--------Additional Clarification----------\n\n";
    setDictationText(newText);
    
    // Focus and move cursor to end of textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = newText.length;
        textareaRef.current.selectionEnd = newText.length;
      }
    }, 0);
  };
  
  // Handle override request
  const handleOverrideRequest = () => {
    if (onOverride) {
      onOverride();
    }
  };

  return (
    <Card className="bg-white border-0 shadow-sm mt-2">
      <CardHeader className="pb-0 pt-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-base font-medium text-gray-900">Clinical Dictation</span>
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              HIPAA Protected
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Include clinical indications, relevant history, and requested study details.
          {dictationText.trim().length > 0 && (
            <span className="ml-1 text-blue-600 font-medium">
              You may edit or append to your existing text.
            </span>
          )}
        </p>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Validation feedback panel */}
        {validationFeedback && (
          <div className="mb-4 border border-red-300 rounded-md overflow-hidden">
            <div className="bg-red-100 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <h3 className="text-sm font-medium text-red-800">Issues with Dictation</h3>
              </div>
              {onClearFeedback && (
                <button 
                  onClick={onClearFeedback}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="bg-white px-4 py-3 text-sm text-gray-700 border-t border-red-200">
              <p>{validationFeedback}</p>
              
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={addAdditionalClarification}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Clarification
                </Button>
                
                {attemptCount >= 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                    onClick={handleOverrideRequest}
                  >
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Override
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div 
          className="border border-gray-200 rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary"
          onClick={focusTextarea}
        >
          <Textarea 
            ref={textareaRef}
            value={dictationText}
            onChange={(e) => setDictationText(e.target.value)}
            className="w-full min-h-[300px] sm:min-h-[240px] p-4 border-0 shadow-none focus-visible:ring-0 resize-none text-gray-700 text-base rounded-none"
            placeholder="Examples: '55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.'"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="true"
          />
          
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={clearDictation}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
              
              <Button 
                type="button" 
                variant={isRecording ? "secondary" : "outline"}
                size="sm" 
                className={`h-8 px-2 text-xs ${isRecording ? 'bg-red-100 text-red-700 border-red-300' : ''}`}
                onClick={toggleRecording}
              >
                <Mic className={`h-3 w-3 mr-1 ${isRecording ? 'animate-pulse text-red-600' : ''}`} />
                {isRecording ? 'Recording...' : 'Voice Input'}
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              {dictationText.length} characters
            </div>
          </div>
        </div>
        
        <div className="flex justify-end items-center mt-6 sm:mt-10">
          <Button
            onClick={handleProcessDictation}
            disabled={dictationText.length < 20 || isProcessing}
            className="inline-flex items-center shadow-sm bg-primary hover:bg-primary/90 text-white px-4 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-medium rounded-lg"
            style={{ minWidth: '140px', touchAction: 'manipulation' }}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      </CardContent>
    </Card>
  );
};

export default DictationForm;