import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Info, AlertCircle } from "lucide-react";

interface PatientIdentificationDialogProps {
  open: boolean;
  onClose: () => void;
  onIdentify: (patientInfo: { name: string; dob: string }) => void;
}

export function PatientIdentificationDialog({
  open,
  onClose,
  onIdentify
}: PatientIdentificationDialogProps) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ name: string; dob: string }[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTranscript("");
      setError(null);
      setSelectedSuggestion(-1);
      setShowSuggestions(false);
      setIsParsing(false);
    }
  }, [open]);

  // Simulate voice recognition
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (transcript) {
        parsePatientInfo();
      }
    } else {
      setIsListening(true);
      setError(null);
      
      // Simulate speech input
      const sampleTexts = [
        "Patient John Smith, date of birth January 15, 1978",
        "Sarah Johnson, born on March 22nd, 1985",
        "Robert Williams, DOB 11/30/1967"
      ];
      
      // Choose a random sample text
      const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
      
      // Set a timeout to simulate processing
      setTimeout(() => {
        setTranscript(randomText);
        setIsListening(false);
        parsePatientInfo(randomText);
      }, 2000);
    }
  };

  // Simulate parsing patient information
  const parsePatientInfo = (text: string = transcript) => {
    setIsParsing(true);
    setError(null);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsParsing(false);
      
      try {
        // Simple regex pattern matching for demo purposes
        const nameMatch = text.match(/Patient\s+([A-Za-z]+\s+[A-Za-z]+)|([A-Za-z]+\s+[A-Za-z]+),\s+/);
        const dobMatch = text.match(/(?:date of birth|DOB|born on)\s+([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4})/i);
        
        if (nameMatch && dobMatch) {
          const name = nameMatch[1] || nameMatch[2];
          let dob = dobMatch[1];
          
          // Format DOB consistently
          if (dob.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
            // Already in MM/DD/YYYY format
          } else if (dob.match(/\d{1,2}-\d{1,2}-\d{4}/)) {
            // Convert MM-DD-YYYY to MM/DD/YYYY
            dob = dob.replace(/-/g, '/');
          } else {
            // Convert text format to MM/DD/YYYY
            const months = {
              'january': '01', 'february': '02', 'march': '03', 'april': '04',
              'may': '05', 'june': '06', 'july': '07', 'august': '08',
              'september': '09', 'october': '10', 'november': '11', 'december': '12'
            };
            
            for (const [month, num] of Object.entries(months)) {
              if (dob.toLowerCase().includes(month)) {
                const dayYear = dob.match(/(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/);
                if (dayYear) {
                  dob = `${num}/${dayYear[1].padStart(2, '0')}/${dayYear[2]}`;
                }
                break;
              }
            }
          }
          
          // Generate multiple suggestions for demo purposes
          const suggestions = [
            { name, dob },
            { name: name.split(' ')[0] + ' ' + name.split(' ')[1], dob }
          ];
          
          setSuggestions(suggestions);
          setShowSuggestions(true);
        } else {
          setError("Couldn't extract patient information. Please try again or enter manually.");
        }
      } catch (e) {
        setError("Error parsing patient information. Please try again.");
      }
    }, 1000);
  };

  // Handle manual text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
  };

  // Handle parse button click
  const handleParseClick = () => {
    if (transcript.trim()) {
      parsePatientInfo();
    } else {
      setError("Please enter or dictate patient information first.");
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
  };

  // Handle confirmation of selected suggestion
  const handleConfirmSelection = () => {
    if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
      onIdentify(suggestions[selectedSuggestion]);
      onClose();
    } else {
      setError("Please select a suggestion first.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Patient Identification</DialogTitle>
          <DialogDescription>
            Dictate or type the patient's name and date of birth.
          </DialogDescription>
        </DialogHeader>
        
        {!showSuggestions ? (
          <>
            <div className="grid gap-4">
              <Card className={`p-3 relative ${isListening ? 'border-blue-400 bg-blue-50' : ''}`}>
                {isListening && (
                  <Badge className="absolute top-2 right-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    Listening...
                  </Badge>
                )}
                <Textarea
                  placeholder="Example: 'Patient John Smith, date of birth January 15, 1978'"
                  value={transcript}
                  onChange={handleTextChange}
                  rows={4}
                  className="border-0 focus-visible:ring-0 resize-none p-0"
                  disabled={isListening || isParsing}
                />
                {isParsing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-blue-700">Parsing patient information...</p>
                    </div>
                  </div>
                )}
              </Card>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className={isListening ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                  onClick={toggleListening}
                  disabled={isParsing}
                >
                  {isListening ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isListening ? 'Stop Listening' : 'Voice Input'}
                </Button>
                <Button 
                  onClick={handleParseClick}
                  disabled={!transcript.trim() || isParsing || isListening}
                >
                  Parse Information
                </Button>
              </div>
            </div>
              
            <DialogFooter className="sm:justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <Info className="h-4 w-4 mr-1" />
                Speak clearly for best results
              </div>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Detected Patient Information:</p>
              
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Card 
                    key={index}
                    className={`p-3 cursor-pointer ${selectedSuggestion === index ? 'border-blue-500 bg-blue-50' : ''}`}
                    onClick={() => handleSelectSuggestion(index)}
                  >
                    <div className="font-medium">{suggestion.name}</div>
                    <div className="text-sm text-gray-500">
                      <span className="inline-block mr-2">DOB:</span>
                      {suggestion.dob}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setShowSuggestions(false)}>
                Back
              </Button>
              <Button 
                disabled={selectedSuggestion < 0} 
                onClick={handleConfirmSelection}
              >
                Confirm Selection
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PatientIdentificationDialog;