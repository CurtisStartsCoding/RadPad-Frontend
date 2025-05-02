import React from 'react';
import { 
  CheckCircle, 
  FileText,
  Info
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// Define types for the validation data
interface MedicalCode {
  code: string;
  description: string;
  type: 'ICD-10' | 'CPT';
  confidence: number;
}

export interface ProcessedDictation {
  validationStatus: 'valid' | 'incomplete' | 'invalid';
  feedback?: string;
  complianceScore?: number; // On a scale of 0-9
  suggestedCodes?: MedicalCode[];
}

interface ValidationViewProps {
  dictationText: string;
  validationResult: ProcessedDictation;
  onBack: () => void;
  onSign: () => void;
}

/**
 * Component for displaying validation results
 */
const ValidationView: React.FC<ValidationViewProps> = ({ 
  dictationText, 
  validationResult, 
  onBack, 
  onSign 
}) => {
  // Format compliance score for display (on a scale of 0-9)
  const displayComplianceScore = validationResult.complianceScore ? 
    `${validationResult.complianceScore}/9` : 
    null;

  return (
    <div className="bg-white rounded-lg shadow-sm mt-6">
      <div className="pb-0 p-4 border-b border-gray-200">
        <div className="text-lg font-medium flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
          Order Validation
          {validationResult.validationStatus === 'valid' && (
            <span className="ml-2 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
              AUC Compliant
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        {/* Feedback panel - Only displayed when there's feedback */}
        {validationResult.feedback && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-600" />
              Feedback
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-800">{validationResult.feedback}</p>
              
              {validationResult.complianceScore && validationResult.validationStatus === 'valid' && (
                <div className="mt-2 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-700">Compliance Score: {displayComplianceScore}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Clinical Information Section */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-gray-600" />
            Clinical Information
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Dictated Notes</p>
              <p className="text-sm text-gray-700">{dictationText}</p>
            </div>
          </div>
        </div>
        
        {/* Suggested Codes Section */}
        {validationResult.suggestedCodes && validationResult.suggestedCodes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-2 text-gray-600" />
              Suggested Codes
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-3">
                {validationResult.suggestedCodes.map((code, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-white border border-gray-200 px-2 py-1 rounded text-xs font-mono font-medium text-gray-800 mr-3">
                      {code.code}
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">{code.description}</p>
                      <div className="flex items-center mt-0.5">
                        <span className="text-xs text-gray-500 mr-2">{code.type}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                          {Math.round(code.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={onBack}>
            Edit Dictation
          </Button>
          <Button onClick={onSign} disabled={validationResult.validationStatus === 'invalid'}>
            Sign Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ValidationView;