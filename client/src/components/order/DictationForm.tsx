import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DictationFormProps {
  onDictationSubmit?: (modalityValue: string, dictationText: string) => void;
  onCancel?: () => void;
}

export function DictationForm({ onDictationSubmit, onCancel }: DictationFormProps) {
  const [modality, setModality] = useState<string>("");
  const [dictationText, setDictationText] = useState<string>("");

  // This is a visual-only mockup, so these handlers are just placeholders
  const handleSubmit = () => {
    if (onDictationSubmit) {
      onDictationSubmit(modality, dictationText);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="mb-4">
        <Label htmlFor="modality" className="block text-sm font-medium text-slate-700 mb-1">
          Imaging Modality<span className="text-red-500">*</span>
        </Label>
        <Select value={modality} onValueChange={setModality}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a modality" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="x-ray">X-Ray</SelectItem>
            <SelectItem value="ct">CT Scan</SelectItem>
            <SelectItem value="mri">MRI</SelectItem>
            <SelectItem value="ultrasound">Ultrasound</SelectItem>
            <SelectItem value="nuclear">Nuclear Medicine</SelectItem>
            <SelectItem value="pet">PET Scan</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mb-4">
        <Label htmlFor="dictation" className="block text-sm font-medium text-slate-700 mb-1">
          Clinical Indication<span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Textarea 
            id="dictation" 
            rows={5} 
            className="w-full resize-none pr-10" 
            placeholder="Describe clinical indication for this imaging study..."
            value={dictationText}
            onChange={(e) => setDictationText(e.target.value)}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-3 bottom-3 text-primary hover:text-primary-light h-8 w-8 p-1"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Describe the clinical indication for this imaging study. Include relevant history, symptoms, and physical findings.
        </div>
      </div>
      
      <div className="flex justify-end items-center space-x-3 border-t border-slate-200 pt-4 mt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
        >
          Process Order
        </Button>
      </div>
    </div>
  );
}

export default DictationForm;
