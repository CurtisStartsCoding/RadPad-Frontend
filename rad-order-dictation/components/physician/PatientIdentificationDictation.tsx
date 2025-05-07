import { useState, useRef, useEffect } from "react";
import { Mic, Square, AlertTriangle, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PatientIdentificationDictationProps {
  onIdentify: (patientInfo: { name: string; dob: string }) => void;
  onCancel: () => void;
  open: boolean;
}

// Interface for patient suggestion
interface PatientSuggestion {
  name: string;
  dob: string;
  confidence: number;
}

/**
 * A component for dictating patient identification information
 * Uses the browser's native Web Speech API for recognition
 */
const PatientIdentificationDictation = ({ 
  onIdentify, 
  onCancel,
  open
}: PatientIdentificationDictationProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  
  // State for suggestions confirmation dialog
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [patientSuggestions, setPatientSuggestions] = useState<PatientSuggestion[]>([]);

  // Set up speech recognition
  useEffect(() => {
    try {
      // Access the browser's speech recognition API
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                            (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => {
          console.log("Speech recognition started");
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          const fullTranscript = finalTranscript || interimTranscript;
          setTranscript(fullTranscript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event);
          setError(`Speech recognition error: ${event.error}. Please try again or type the information manually.`);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          console.log("Speech recognition ended");
          // Only set isListening to false if we're not in the middle of toggling
          if (isListening) {
            setIsListening(false);
          }
        };
        
        recognitionRef.current = recognition;
      } else {
        setError("Speech recognition not supported in this browser. Please use Chrome or Safari.");
      }
    } catch (e) {
      console.error("Error setting up speech recognition:", e);
      setError("Failed to initialize speech recognition. Please try using a different browser.");
    }
    
    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.error("Error stopping recognition on cleanup:", e);
      }
    };
  }, []);

  // Toggle speech recognition
  const toggleRecording = () => {
    try {
      if (isListening) {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsListening(false);
        
        if (transcript.trim()) {
          parsePatientInfo(transcript);
        }
      } else {
        setTranscript("");
        setError("");
        
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setIsListening(true);
          
          toast({
            title: "Recording Started",
            description: "Say the patient's name and date of birth clearly.",
            duration: 2000, // Reduced to 2 seconds
          });
        } else {
          setError("Speech recognition is not available. Please reload the page or try a different browser.");
        }
      }
    } catch (e) {
      console.error("Error in toggleRecording:", e);
      setError(`Error ${isListening ? 'stopping' : 'starting'} recording: ${(e as Error).message}`);
    }
  };

  // Parse patient info from transcript and show suggestions dialog
  const parsePatientInfo = (text: string) => {
    if (!text.trim()) {
      return;
    }
    
    setIsParsing(true);
    
    try {
      // Define a list of potential parses with confidence scores
      const potentialParses: PatientSuggestion[] = [];
      
      // Clean up the input text
      const cleanText = text.trim().replace(/\s+/g, ' ');
      
      // Define month names and their numeric values
      const months: Record<string, string> = {
        'january': '01', 'jan': '01',
        'february': '02', 'feb': '02',
        'march': '03', 'mar': '03',
        'april': '04', 'apr': '04',
        'may': '05',
        'june': '06', 'jun': '06',
        'july': '07', 'jul': '07',
        'august': '08', 'aug': '08',
        'september': '09', 'sept': '09', 'sep': '09',
        'october': '10', 'oct': '10',
        'november': '11', 'nov': '11',
        'december': '12', 'dec': '12'
      };
      
      // Parse into words for different analyses
      const words = cleanText.split(' ');
      
      // --- APPROACH 1: Look for "patient name... dob..." pattern ---
      const dobKeywords = ["date of birth", "dob", "born", "birthdate", "birth date"];
      for (const keyword of dobKeywords) {
        const keywordPos = cleanText.toLowerCase().indexOf(keyword);
        if (keywordPos > 0) {
          const namePart = cleanText.substring(0, keywordPos).trim();
          const dobPart = cleanText.substring(keywordPos + keyword.length).trim();
          
          // Try to extract a date from the DOB part
          let extractedMonth = "";
          let extractedDay = "";
          let extractedYear = "";
          
          // Check for YYYY
          const yearMatch = dobPart.match(/\b(19\d{2}|20[0-2]\d)\b/);
          if (yearMatch) {
            extractedYear = yearMatch[1];
            
            // Look for month name
            for (const [monthName, monthValue] of Object.entries(months)) {
              if (dobPart.toLowerCase().includes(monthName)) {
                extractedMonth = monthValue;
                
                // Look for day
                const afterMonth = dobPart.substring(dobPart.toLowerCase().indexOf(monthName) + monthName.length);
                const dayMatch = afterMonth.match(/\s+(\d{1,2})(?:st|nd|rd|th)?/);
                if (dayMatch) {
                  extractedDay = dayMatch[1].padStart(2, '0');
                }
                break;
              }
            }
            
            // If we found month and day
            if (extractedMonth && extractedDay) {
              potentialParses.push({
                name: namePart,
                dob: `${extractedMonth}/${extractedDay}/${extractedYear}`,
                confidence: 0.9
              });
            } else if (extractedYear) {
              // Just use January 1st if we only found the year
              potentialParses.push({
                name: namePart,
                dob: `01/01/${extractedYear}`,
                confidence: 0.5
              });
            }
          }
        }
      }
      
      // --- APPROACH 2: "Name Month Day Year" pattern ---
      for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        let matchedMonth = '';
        
        // Check if this word is a month name
        for (const monthName of Object.keys(months)) {
          if (word === monthName || word.startsWith(monthName)) {
            matchedMonth = monthName;
            break;
          }
        }
        
        if (matchedMonth && i + 2 < words.length) {
          // Found a month, check if it's followed by day and year
          const potentialDay = words[i + 1].replace(/\D/g, '');
          const potentialYear = words[i + 2];
          
          if (potentialDay && 
              parseInt(potentialDay) >= 1 && 
              parseInt(potentialDay) <= 31 &&
              /^(19|20)\d{2}$/.test(potentialYear)) {
            
            // This is our "Name Month Day Year" pattern
            const nameWords = words.slice(0, i);
            const name = nameWords.join(' ');
            const monthNum = months[matchedMonth];
            const day = potentialDay.padStart(2, '0');
            
            potentialParses.push({
              name,
              dob: `${monthNum}/${day}/${potentialYear}`,
              confidence: 0.95
            });
          }
        }
      }
      
      // Add a fallback option if no parses were found
      if (potentialParses.length === 0) {
        potentialParses.push({
          name: cleanText,
          dob: "01/01/2000", // Generic date
          confidence: 0.1
        });
      }
      
      // Sort the parses by confidence (highest first)
      potentialParses.sort((a, b) => b.confidence - a.confidence);
      
      // Take the top 3 suggestions
      const topSuggestions = potentialParses.slice(0, 3);
      
      // Show suggestions dialog
      setPatientSuggestions(topSuggestions);
      setShowSuggestions(true);
      setIsParsing(false);
      
    } catch (e) {
      console.error("Error parsing patient info:", e);
      setError(`Error parsing patient information: ${(e as Error).message}`);
      setIsParsing(false);
    }
  };

  // Handle selection of a suggestion
  const handleSelectSuggestion = (suggestion: PatientSuggestion) => {
    onIdentify({
      name: suggestion.name,
      dob: suggestion.dob
    });
    setShowSuggestions(false);
  };

  // Handle manual text input
  const handleManualInput = () => {
    // Just use the raw transcript as the name
    onIdentify({
      name: transcript,
      dob: "01/01/2000" // Default date
    });
    setShowSuggestions(false);
  };

  // Clean up when dialog is closed
  useEffect(() => {
    if (!open) {
      setTranscript("");
      setError("");
      setIsListening(false);
      setShowSuggestions(false);
      try {
        if (recognitionRef.current && isListening) {
          recognitionRef.current.stop();
        }
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
  }, [open, isListening]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onCancel();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Patient Identification</DialogTitle>
          <DialogDescription>
            Please speak or type the patient's name and date of birth.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
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
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleRecording}
              disabled={isParsing}
              title={isListening ? "Stop recording" : "Start recording"}
              aria-label={isListening ? "Stop recording" : "Start recording"}
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          
          {isListening && (
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
              <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
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
                onChange={(e) => setTranscript(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => parsePatientInfo(transcript)}
                disabled={!transcript.trim() || isParsing}
              >
                Parse
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between border-t pt-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={() => parsePatientInfo(transcript)}
            disabled={!transcript.trim() || isParsing}
          >
            Identify Patient
          </Button>
        </DialogFooter>
      </DialogContent>
      
      {/* Patient suggestions dialog */}
      {showSuggestions && (
        <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Patient Information</DialogTitle>
              <DialogDescription>
                Please select the correct interpretation of your dictation:
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-2 space-y-3">
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
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{suggestion.name}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{suggestion.dob}</span>
                      </div>
                    </div>
                    <div className="ml-2">
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSuggestion(suggestion);
                      }}>
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Option to use raw text as name */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={handleManualInput}
              >
                Use entire text as patient name
              </Button>
            </div>
            
            <DialogFooter className="flex justify-end">
              <Button variant="outline" onClick={() => setShowSuggestions(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default PatientIdentificationDictation;