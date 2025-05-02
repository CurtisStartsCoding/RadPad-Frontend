import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { temporaryPatient } from "@/lib/mock-data";
import PatientInfoCard from "@/components/order/PatientInfoCard";
import ValidationView from "@/components/order/ValidationView";
import { ArrowLeft, AlertCircle, Info, X } from "lucide-react";

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

const NewOrder = () => {
  const [orderStep, setOrderStep] = useState<'dictation' | 'validation' | 'signature'>('dictation');
  const [dictationText, setDictationText] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  
  // Process order
  const handleProcessOrder = () => {
    if (!dictationText || dictationText.trim().length < 10) {
      setValidationFeedback("Please provide more detailed dictation before submitting");
      return;
    }
    
    // Simulate validation result
    if (attemptCount === 0) {
      // First attempt shows validation issues
      setValidationFeedback("Ultrasound is first-line for suspected cholecystitis/biliary obstruction with higher sensitivity and specificity than MRI. If ultrasound is inconclusive, consider CT abdomen or MRCP, which is more appropriate for evaluating biliary pathology than standard MRI abdomen.");
      setAttemptCount(prev => prev + 1);
    } else {
      // Second attempt shows successful validation
      setValidationResult(mockValidationResult);
      setOrderStep('validation');
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
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <h1 className="text-xl font-medium">Radiology Order - Unknown Patient</h1>
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
      </div>
      
      <div className="py-4">
        <div className="text-sm font-medium text-blue-600 mb-4">
          Step 1 of 3: Dictation
        </div>
        
        {/* Patient Information */}
        <div className="mb-6">
          <PatientInfoCard 
            patient={temporaryPatient} 
            onEditPatient={() => console.log("Add patient clicked")}
          />
        </div>
        
        {/* Dictation Form */}
        {orderStep === 'dictation' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-base font-medium text-gray-900">Clinical Dictation</span>
                  <div className="ml-2 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                    <Info className="h-3 w-3 mr-1" />
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
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-white border border-gray-200">
                      + Add Clarification
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 ml-2">
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
                    <Button
                      variant="outline"
                      className="text-sm"
                      onClick={handleClearText}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      className="text-sm flex items-center"
                      onClick={handleVoiceInput}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="22"></line>
                      </svg>
                      Voice Input
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {characterCount} characters
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
              <h2 className="text-xl font-medium mb-4">Digital Signature</h2>
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NewOrder;