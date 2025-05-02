import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, AlertTriangle, Check, X, Loader2 } from "lucide-react";

interface PatientIdentificationDialogProps {
  open: boolean;
  onClose: () => void;
  onIdentify: (patientInfo: { name: string; dob: string }) => void;
}

enum DialogState {
  INITIAL = 'initial',
  LISTENING = 'listening',
  DICTATING = 'dictating',
  PROCESSING = 'processing',
  CONFIRMATION = 'confirmation',
  ERROR = 'error',
  SUCCESS = 'success',
}

export default function PatientIdentificationDialog({
  open,
  onClose,
  onIdentify,
}: PatientIdentificationDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>(DialogState.INITIAL);
  const [patientName, setPatientName] = useState<string>('');
  const [patientDob, setPatientDob] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Simulate starting the dictation
  const handleStartDictation = () => {
    setDialogState(DialogState.LISTENING);
    
    // Simulate waiting for voice input
    setTimeout(() => {
      setDialogState(DialogState.DICTATING);
      setTranscription('John Smith, date of birth 4/15/1975');
      
      // Simulate processing after voice input
      setTimeout(() => {
        setDialogState(DialogState.PROCESSING);
        
        // Simulate result
        setTimeout(() => {
          const parsed = {
            name: 'John Smith',
            dob: '04/15/1975 (48)'
          };
          
          if (Math.random() > 0.2) { // 80% success rate for demo
            setPatientName(parsed.name);
            setPatientDob(parsed.dob);
            setDialogState(DialogState.CONFIRMATION);
          } else {
            setError('Could not identify patient. Please try again or enter patient information manually.');
            setDialogState(DialogState.ERROR);
          }
        }, 1500);
      }, 1000);
    }, 1500);
  };
  
  // Handle confirmation
  const handleConfirm = () => {
    onIdentify({
      name: patientName,
      dob: patientDob
    });
    
    // Go to success state
    setDialogState(DialogState.SUCCESS);
    
    // Close after showing success message
    setTimeout(() => {
      handleClose();
    }, 1500);
  };
  
  // Handle dialog close
  const handleClose = () => {
    // Reset state
    setTimeout(() => {
      setDialogState(DialogState.INITIAL);
      setPatientName('');
      setPatientDob('');
      setTranscription('');
      setError('');
    }, 300);
    
    onClose();
  };
  
  // Handle trying again after error
  const handleTryAgain = () => {
    setDialogState(DialogState.INITIAL);
    setError('');
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Patient Identification</DialogTitle>
          <DialogDescription className="text-center">
            {dialogState === DialogState.INITIAL && "Identify a patient using voice recognition"}
            {dialogState === DialogState.LISTENING && "Listening for patient information..."}
            {dialogState === DialogState.DICTATING && "Recording patient information..."}
            {dialogState === DialogState.PROCESSING && "Processing patient information..."}
            {dialogState === DialogState.CONFIRMATION && "Please confirm patient information"}
            {dialogState === DialogState.ERROR && "Error identifying patient"}
            {dialogState === DialogState.SUCCESS && "Patient identified successfully!"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {/* Initial State */}
          {dialogState === DialogState.INITIAL && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Mic className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-6 max-w-xs mx-auto">
                Dictate the patient's name and date of birth to automatically identify them in your EMR system.
              </p>
              <Button 
                onClick={handleStartDictation}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Dictation
              </Button>
            </div>
          )}
          
          {/* Listening State */}
          {dialogState === DialogState.LISTENING && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4 relative">
                <Mic className="h-8 w-8 text-blue-600" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Ready to hear patient information
              </p>
              <p className="text-xs text-gray-500">
                Say the patient's full name and date of birth...
              </p>
            </div>
          )}
          
          {/* Dictating State */}
          {dialogState === DialogState.DICTATING && (
            <div className="text-center w-full">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Mic className="h-8 w-8 text-blue-600" />
                <div className="absolute w-16 h-16 rounded-full border-4 border-blue-400 animate-pulse"></div>
              </div>
              <Card className="mb-4 border-blue-200 w-full">
                <CardContent className="p-3">
                  <p className="text-sm text-gray-800 font-medium">{transcription}</p>
                </CardContent>
              </Card>
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Processing State */}
          {dialogState === DialogState.PROCESSING && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <p className="text-sm text-gray-600">
                Processing and validating patient information...
              </p>
            </div>
          )}
          
          {/* Confirmation State */}
          {dialogState === DialogState.CONFIRMATION && (
            <div className="w-full">
              <div className="flex items-center justify-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Patient Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Name:</span>
                    <p className="text-sm font-medium">{patientName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Date of Birth:</span>
                    <p className="text-sm font-medium">{patientDob}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                Is this information correct?
              </p>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleConfirm}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
          
          {/* Error State */}
          {dialogState === DialogState.ERROR && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <X className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-sm text-red-600 mb-6 max-w-xs mx-auto">
                {error}
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={handleTryAgain}
                >
                  Try Again
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {/* Success State */}
          {dialogState === DialogState.SUCCESS && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-green-600 mb-2 font-medium">
                Patient identified successfully!
              </p>
              <p className="text-xs text-gray-500">
                Patient information has been added to the order.
              </p>
            </div>
          )}
        </div>
        
        {dialogState === DialogState.INITIAL && (
          <DialogFooter className="text-xs text-gray-500 text-center">
            <p className="w-full">
              You can also type in patient information manually by clicking the edit button after closing this dialog.
            </p>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}