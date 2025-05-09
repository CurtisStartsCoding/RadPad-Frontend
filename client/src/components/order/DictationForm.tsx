import { useState } from 'react';
import { Info } from 'lucide-react';

interface DictationFormProps {
  dictationText: string;
  setDictationText: (text: string) => void;
  patient: any;
  onProcessed: (result: any) => void;
  validationFeedback?: string;
  onClearFeedback?: () => void;
  attemptCount?: number;
  onOverride?: () => void;
}

const DictationForm = ({ 
  dictationText, 
  setDictationText, 
  onProcessed,
  validationFeedback,
  onClearFeedback,
  attemptCount = 0,
  onOverride
}: DictationFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const characterCount = dictationText.length;

  // Handle clearing text
  const handleClearText = () => {
    setDictationText('');
    if (onClearFeedback) {
      onClearFeedback();
    }
  };

  // Handle voice input
  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Simulate voice input for the mockup
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
      }, 3000);
    }
  };

  // Handle processing the order
  const handleProcessOrder = () => {
    if (dictationText.trim().length < 10) {
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate a successful validation
    setTimeout(() => {
      setIsProcessing(false);
      
      // Mock validation result
      const mockResult = {
        validationStatus: 'valid',
        modalityType: 'CT',
        bodyPart: 'chest, abdomen and pelvis',
        diagnosis: {
          primary: 'C50.919 - Malignant neoplasm of unspecified site of unspecified female breast',
          secondary: 'Z12.31 - Encounter for screening mammogram for malignant neoplasm of breast'
        },
        cptCodes: ['71260 - CT Thorax with contrast'],
        aucScore: 9,
        patientDemographics: {
          age: '55 y/o',
          gender: 'female'
        }
      };
      
      onProcessed(mockResult);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-base font-medium text-gray-900">Clinical Dictation</span>
          <div className="ml-2 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
            <Info className="h-3 w-3 mr-1" />
            HIPAA Protected
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600">
        Include clinical indications, relevant history, and requested study details.
        <span className="ml-1 text-blue-600 font-medium">
          You may edit or append to your existing text.
        </span>
      </p>
      
      {validationFeedback && (
        <div className="mb-4 border border-red-200 rounded-md overflow-hidden">
          {/* Header with red background */}
          <div className="bg-red-50 px-3 py-2 flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-red-500 mr-2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
              <h3 className="text-sm font-medium text-red-800">Issues with Dictation</h3>
            </div>
            {onClearFeedback && (
              <button 
                onClick={onClearFeedback}
                className="text-red-400 hover:text-red-600"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* Content with white background */}
          <div className="bg-white px-3 py-2 text-sm text-gray-700">
            <p>{validationFeedback}</p>
            
            <div className="mt-3">
              <button
                type="button"
                className="inline-flex items-center text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
              >
                <span className="mr-1">+</span>
                Add Clarification
              </button>
              
              {attemptCount >= 1 && onOverride && (
                <button
                  type="button"
                  className="ml-2 inline-flex items-center text-xs px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                  onClick={onOverride}
                >
                  Override
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div>
        <textarea 
          className="w-full h-48 p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          placeholder="Examples: '55-year-old female with newly diagnosed breast cancer. Request CT chest, abdomen and pelvis for staging.'"
          value={dictationText}
          onChange={(e) => setDictationText(e.target.value)}
        />
        
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              onClick={handleClearText}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Clear
            </button>
            
            <button
              className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              onClick={toggleVoiceInput}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
              Voice Input
            </button>
          </div>
          
          <div className="text-xs text-gray-500">
            {characterCount} characters
          </div>
        </div>
      </div>
      
      <div className="flex justify-end border-t border-gray-200 pt-4 mt-4">
        <button
          className={`px-4 py-2 rounded-md font-medium ${isProcessing || dictationText.trim().length < 10 
            ? 'bg-blue-300 text-white cursor-not-allowed' 
            : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
          disabled={isProcessing || dictationText.trim().length < 10}
          onClick={handleProcessOrder}
        >
          {isProcessing ? 'Processing...' : 'Process Order'}
        </button>
      </div>
    </div>
  );
};

export default DictationForm;