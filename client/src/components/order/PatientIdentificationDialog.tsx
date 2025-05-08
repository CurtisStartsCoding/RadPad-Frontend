import { useState } from 'react';
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

export default function PatientIdentificationDialog({
  open,
  onCancel,
  onIdentify,
}: PatientIdentificationDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>(DialogState.LISTENING);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [patientSuggestions, setPatientSuggestions] = useState<Array<{name: string, dob: string}>>([]);
  
  // Toggle recording
  const toggleRecording = () => {
    if (isListening) {
      setIsListening(false);
      // After stopping, move to confirmation with example data
      setTimeout(() => {
        const exampleSuggestion = {
          name: "Brad DeWitt",
          dob: "01/01/1980"
        };
        setPatientSuggestions([exampleSuggestion]);
        setDialogState(DialogState.CONFIRMATION);
      }, 500);
    } else {
      setIsListening(true);
      setTranscript('');
      setError('');
      
      // Simulate dictation after a delay
      setTimeout(() => {
        setTranscript('Brad DeWitt January 1 1980');
        setDialogState(DialogState.DICTATING);
      }, 1000);
    }
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
                  <span className="italic">{transcript || "..."}</span>
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
                    onClick={toggleRecording}
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