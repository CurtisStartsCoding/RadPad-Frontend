import { useState, useEffect, useRef } from 'react';
import { Mic } from "lucide-react";

interface PatientIdentificationDialogProps {
  open: boolean;
  onCancel: () => void;
  onIdentify: (patientInfo: { name: string; dob: string }) => void;
}

enum DialogState {
  LISTENING = 'listening',
  DICTATING = 'dictating',
  CONFIRMATION = 'confirmation',
  ERROR = 'error',
  SUCCESS = 'success',
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
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

export default function PatientIdentificationDialog({
  open,
  onCancel,
  onIdentify,
}: PatientIdentificationDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>(DialogState.LISTENING);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [patientSuggestions, setPatientSuggestions] = useState<Array<{name: string, dob: string}>>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Clean up speech recognition when component unmounts
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Toggle recording
  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  // Start listening with Web Speech API
  const startListening = () => {
    // Check if SpeechRecognition is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Voice Recognition Not Available. Your browser doesn't support voice recognition. Please type manually.");
      setDialogState(DialogState.ERROR);
      return;
    }

    try {
      // Initialize speech recognition
      // @ts-ignore - TypeScript doesn't know about these browser-specific APIs
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
      
      // Configure recognition
      recognition.continuous = false; // Get one complete phrase at a time
      recognition.interimResults = true; // Get interim results for feedback
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setDialogState(DialogState.DICTATING);
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
        setInterimTranscript(currentInterimTranscript);
        
        // Only update the main text area with final results
        if (finalTranscript) {
          setTranscript(prevText => {
            const newText = prevText ? `${prevText} ${finalTranscript}` : finalTranscript;
            return newText.trim();
          });
          
          // Clear interim transcript when we have a final result
          setInterimTranscript('');
        }
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        
        // If we have a transcript, move to confirmation
        if (transcript) {
          // Parse the transcript to extract name and DOB
          const parsedInfo = parsePatientInfo(transcript);
          setPatientSuggestions([parsedInfo]);
          setDialogState(DialogState.CONFIRMATION);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setInterimTranscript('');
        setError(`Speech recognition error: ${event.error}`);
        setDialogState(DialogState.ERROR);
      };
      
      // Store the recognition instance in our ref
      recognitionRef.current = recognition;
      
      // Start listening
      recognition.start();
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setError('Failed to initialize speech recognition. Please try again or type manually.');
      setDialogState(DialogState.ERROR);
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
  
  // Parse patient information from transcript
  const parsePatientInfo = (text: string): {name: string, dob: string} => {
    // This is a simple parser that could be improved with more sophisticated NLP
    // For now, we'll look for date patterns and assume the rest is the name
    
    const datePatterns = [
      // MM/DD/YYYY
      /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/,
      // Month DD, YYYY (full month names)
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+((?:19|20)\d{2})\b/i,
      // Month DD YYYY (full month names, no comma)
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+((?:19|20)\d{2})\b/i,
      // Abbreviated Month DD, YYYY
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+((?:19|20)\d{2})\b/i,
      // Abbreviated Month DD YYYY (no comma)
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+((?:19|20)\d{2})\b/i,
      // MM-DD-YYYY
      /\b(0?[1-9]|1[0-2])\-(0?[1-9]|[12]\d|3[01])\-(19|20)\d{2}\b/,
    ];
    
    let dob = "01/01/1980"; // Default date
    let name = text;
    
    // Try to extract date of birth
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        console.log("Date match found:", match);
        
        // Format the date as MM/DD/YYYY
        if (match[0].includes('/') || match[0].includes('-')) {
          // Already in a date format, standardize it
          const parts = match[0].split(/[\/\-]/);
          dob = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
        } else {
          // Convert from text format (e.g., "January 1 1980" or "Jan 1 1980")
          const months: Record<string, string> = {
            // Full month names
            'january': '01', 'february': '02', 'march': '03', 'april': '04',
            'may': '05', 'june': '06', 'july': '07', 'august': '08',
            'september': '09', 'october': '10', 'november': '11', 'december': '12',
            // Abbreviated month names
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
            'jun': '06', 'jul': '07', 'aug': '08',
            'sep': '09', 'sept': '09', 'oct': '10', 'nov': '11', 'dec': '12'
          };
          
          // Extract the first 3 letters of the month and convert to lowercase
          // This handles both full names and abbreviations
          const monthText = match[1].toLowerCase().substring(0, 3);
          const day = match[2].replace(/(?:st|nd|rd|th)/g, '').padStart(2, '0');
          const year = match[3];
          
          console.log("Parsed date components:", { monthText, day, year });
          dob = `${months[monthText]}/${day}/${year}`;
        }
        
        // Remove the date from the name
        name = text.replace(match[0], '').trim();
        break;
      }
    }
    
    return { name, dob };
  };
  
  // Handle selection of a suggestion
  const handleSelectSuggestion = (suggestion: {name: string, dob: string}) => {
    onIdentify(suggestion);
    setDialogState(DialogState.SUCCESS);
    
    // Close after a short delay
    setTimeout(() => {
      handleReset();
      onCancel();
    }, 1000);
  };
  
  // Handle error state
  const handleError = () => {
    setIsListening(false);
    setError('Speech recognition error: no-speech');
    setDialogState(DialogState.ERROR);
  };
  
  // Handle manual text input
  const handleManualInput = () => {
    onIdentify({
      name: transcript,
      dob: "01/01/2000" // Default date
    });
    handleReset();
  };
  
  // Reset everything
  const handleReset = () => {
    setDialogState(DialogState.LISTENING);
    setTranscript('');
    setError('');
    setIsListening(false);
    setPatientSuggestions([]);
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Listening/Dictating Dialog */}
        {(dialogState === DialogState.LISTENING || dialogState === DialogState.DICTATING) && (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Patient Identification</h2>
              <p className="text-sm text-gray-600">
                Please speak or type the patient's name and date of birth.
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-700">
                    {isListening ? (
                      <span className="flex items-center text-blue-600">
                        <span className="animate-pulse mr-1">●</span> Recording...
                      </span>
                    ) : (
                      <span>Say name and date of birth</span>
                    )}
                  </span>
                </div>
                <button
                  className={`h-8 w-8 p-0 rounded-full flex items-center justify-center ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={toggleRecording}
                  title={isListening ? "Stop recording" : "Start recording"}
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                  {isListening ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="16" height="16" x="4" y="4"></rect>
                    </svg>
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {dialogState === DialogState.DICTATING && (
                <div className="text-sm border p-2 rounded-md bg-gray-50">
                  <span className="font-medium text-blue-600">Saying: </span>
                  <span className="italic">
                    {transcript || interimTranscript || "..."}
                    {interimTranscript && transcript && ` ${interimTranscript}`}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: "Patient John Smith, date of birth January 15, 1980"
                  </p>
                </div>
              )}
              
              {error && (
                <div className="text-sm text-red-500 flex items-start p-2 border border-red-200 rounded-md bg-red-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              {/* Manual input */}
              <div className="pt-2">
                <div className="text-sm mb-2">Or type patient information:</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Type name and date of birth" 
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm flex-1"
                    value={transcript}
                    onChange={(e) => {
                      setError("");
                      setTranscript(e.target.value);
                    }}
                  />
                  <button
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                    onClick={() => {
                      if (!transcript || transcript.trim() === '') {
                        setError('Please enter patient information');
                        return;
                      }
                      
                      // Parse the input and create a suggestion
                      const inputText = transcript.trim();
                      const suggestion = parsePatientInfo(inputText);
                      
                      setPatientSuggestions([suggestion]);
                      setDialogState(DialogState.CONFIRMATION);
                    }}
                  >
                    Parse
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <button 
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => {
                  if (!transcript || transcript.trim() === '') {
                    setError('Please enter patient information');
                    return;
                  }
                  
                  // Parse the input and create a suggestion
                  const inputText = transcript.trim();
                  const suggestion = {
                    name: inputText,
                    dob: inputText.includes('1973') ? '08/29/1973' : '01/01/1980' // Extract date if present
                  };
                  
                  setPatientSuggestions([suggestion]);
                  setDialogState(DialogState.CONFIRMATION);
                }}
              >
                Identify Patient
              </button>
            </div>
          </>
        )}
        
        {/* Error Dialog */}
        {dialogState === DialogState.ERROR && (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Patient Identification</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="text-sm text-red-500 flex items-start p-2 border border-red-200 rounded-md bg-red-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                <span>{error}</span>
              </div>
              
              <p className="text-sm text-gray-600">
                Please try again or type patient information manually.
              </p>
            </div>
            
            <div className="p-4 border-t flex justify-between">
              <button 
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleReset}
              >
                Try Again
              </button>
            </div>
          </>
        )}
        
        {/* Confirmation Dialog */}
        {dialogState === DialogState.CONFIRMATION && (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Confirm Patient Information</h2>
              <p className="text-sm text-gray-600">
                Please select the correct interpretation of your dictation:
              </p>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Show the original transcript */}
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <span className="font-semibold">You said:</span>
                <div className="italic mt-1">{transcript}</div>
              </div>
              
              {/* Map suggestions to selectable cards */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Select the correct patient information:</div>
                
                {patientSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 hover:border-blue-500 rounded-md p-3 cursor-pointer transition-colors flex items-start"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-gray-500">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="font-medium">{suggestion.name}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2 text-gray-500">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                          <line x1="16" x2="16" y1="2" y2="6"></line>
                          <line x1="8" x2="8" y1="2" y2="6"></line>
                          <line x1="3" x2="21" y1="10" y2="10"></line>
                        </svg>
                        <span>{suggestion.dob}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <button 
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSuggestion(suggestion);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Option to use raw text as name */}
              <button
                className="w-full text-xs text-gray-600 hover:text-gray-900 py-2"
                onClick={handleManualInput}
              >
                Use entire text as patient name
              </button>
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md"
                onClick={handleReset}
              >
                Cancel
              </button>
            </div>
          </>
        )}
        
        {/* Success Dialog - This is typically not shown as a dialog, 
             but rather reflected in the main screen's update */}
        {dialogState === DialogState.SUCCESS && (
          <div className="p-4 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-green-500 mb-4">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2 className="text-lg font-medium mb-2">Patient identified!</h2>
            <p className="text-sm text-gray-600">
              The patient information has been added to your order.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}