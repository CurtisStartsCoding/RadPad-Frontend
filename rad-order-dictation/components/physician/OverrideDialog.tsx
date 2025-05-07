import { useState } from "react";
import { Shield, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface OverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

const OverrideDialog = ({ isOpen, onClose, onConfirm }: OverrideDialogProps) => {
  const [justification, setJustification] = useState("");
  
  if (!isOpen) return null;
  
  const handleConfirm = () => {
    if (justification.trim().length < 20) {
      return; // Require meaningful justification
    }
    
    onConfirm(justification);
    setJustification("");
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-amber-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Clinical Validation Override</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-start mb-4 bg-amber-50 p-3 rounded-md border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Validation Override Warning</p>
              <p>
                You are about to override the clinical validation system. The order may not 
                comply with current appropriate use criteria for imaging, which could result in:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Potential insurance denial</li>
                <li>Unnecessary radiation exposure</li>
                <li>Increased cost to the patient</li>
                <li>Audit flag for quality review</li>
              </ul>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="override-justification" className="block text-sm font-medium text-gray-700 mb-1">
              Please provide clinical justification for this override:
            </label>
            <Textarea
              id="override-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain clinical necessity for overriding the system recommendations..."
              className="w-full min-h-[120px] border-gray-300"
            />
            <div className="text-xs text-gray-500 mt-1 flex justify-between">
              <span>Required - will be included in patient record</span>
              <span>{justification.length} / 20 min characters</span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-5">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="default"
              disabled={justification.trim().length < 20}
              onClick={handleConfirm}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Confirm Override
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverrideDialog;