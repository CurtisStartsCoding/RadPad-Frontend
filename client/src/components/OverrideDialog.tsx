import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface OverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

/**
 * Dialog for overriding validation warnings
 */
const OverrideDialog: React.FC<OverrideDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [justification, setJustification] = useState('');
  const [error, setError] = useState('');
  
  const handleConfirm = () => {
    if (justification.trim().length < 10) {
      setError('Please provide a more detailed justification (at least 10 characters)');
      return;
    }
    
    onConfirm(justification);
    setJustification('');
    setError('');
  };

  const handleClose = () => {
    onClose();
    setJustification('');
    setError('');
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Clinical Validation Override</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-2">
                  Validation Override Warning
                </h3>
                <div className="text-sm text-amber-700">
                  <p className="mb-2">
                    You are about to override the validation. The order may not comply with current Appropriate Use Criteria for imaging, which could result in:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Denial of insurance coverage</li>
                    <li>Delays in patient care</li>
                    <li>Additional documentation requirements</li>
                    <li>Increased cost to the patient</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              Please provide clinical justification for this order:
            </p>
            <textarea
              id="justification"
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                if (e.target.value.trim().length >= 10) {
                  setError('');
                }
              }}
              className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why this order is clinically appropriate despite the validation warnings..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Required - will be included in patient record
            </p>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-end space-x-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={justification.trim().length < 10}
          >
            Confirm Override
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverrideDialog;