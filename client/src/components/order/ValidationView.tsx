import React from 'react';
import {
  CheckCircle,
  FileText,
  Info,
  Tag,
  Briefcase,
  AlertCircle,
  ClipboardCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for the validation data
interface MedicalCode {
  code: string;
  description: string;
  type: 'ICD-10' | 'CPT';
}

export interface ProcessedDictation {
  orderId?: string | number; // Order ID returned from the API
  validationStatus: 'valid' | 'incomplete' | 'invalid';
  feedback?: string;
  complianceScore?: number; // On a scale of 0-9
  suggestedCodes?: MedicalCode[];
  overridden?: boolean;
  overrideJustification?: string;
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

  // Separate diagnosis and procedure codes
  const diagnosisCodes = validationResult.suggestedCodes?.filter(code => code.type === 'ICD-10') || [];
  const procedureCodes = validationResult.suggestedCodes?.filter(code => code.type === 'CPT') || [];

  return (
    <Card className="bg-white mt-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-medium flex items-center">
          <ClipboardCheck className="h-5 w-5 mr-2 text-primary" />
          Order Validation
          {validationResult.validationStatus === 'valid' && (
            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-200">
              AUC Compliant
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-5 sm:p-6">
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
        
        {/* Diagnosis and Procedure Codes */}
        {(diagnosisCodes.length > 0 || procedureCodes.length > 0) && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-2 text-gray-600" />
              Coding & Billing Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">ICD-10 Diagnosis Codes</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  {diagnosisCodes.length > 0 ? (
                    <ul className="space-y-2">
                      {diagnosisCodes.map((code, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-mono text-primary font-medium">{code.code}</span>
                          <span className="text-gray-700 block">{code.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No diagnosis codes identified.</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">CPT Procedure Codes</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  {procedureCodes.length > 0 ? (
                    <ul className="space-y-2">
                      {procedureCodes.map((code, index) => (
                        <li key={index} className="text-sm">
                          <span className="font-mono text-primary font-medium">{code.code}</span>
                          <span className="text-gray-700 block">{code.description}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No procedure codes identified.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Guidelines and AUC Compliance Summary */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-2 flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-gray-600" />
            Guidelines & AUC Compliance
          </h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-3">
              <p className="text-sm font-semibold text-gray-700">Appropriateness Validation</p>
              <div className="ml-auto flex items-center gap-3 mr-1">
                {validationResult.validationStatus === 'valid' ? (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Compliant</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Review Required</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm">
              <div className="flex items-center">
                <span className="text-gray-600">ACR Guidelines</span>
                {validationResult.validationStatus === 'valid' && (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-2" />
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">CMS AUC</span>
                {validationResult.validationStatus === 'valid' && (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-2" />
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">NCCN Guidelines</span>
                {validationResult.validationStatus === 'valid' && (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-2" />
                )}
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">Medicare AUC</span>
                {validationResult.validationStatus === 'valid' && (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-2" />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="min-h-[44px] px-6"
          >
            Edit Dictation
          </Button>
          <Button
            onClick={onSign}
            disabled={validationResult.validationStatus !== 'valid'}
            className="min-h-[44px] px-6"
          >
            Sign Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationView;