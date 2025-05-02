import { useState } from 'react';
import { 
  Label 
} from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mic, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DictationFormProps {
  onDictationSubmit?: (modalityValue: string, dictationText: string) => void;
  onCancel?: () => void;
}

const DictationForm = ({ onDictationSubmit, onCancel }: DictationFormProps) => {
  const [dictationText, setDictationText] = useState('');
  const [modalityValue, setModalityValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modalityValue) {
      setError('Please select a modality before submitting');
      return;
    }
    
    if (!dictationText || dictationText.trim().length < 10) {
      setError('Please provide more detailed dictation before submitting');
      return;
    }
    
    if (onDictationSubmit) {
      onDictationSubmit(modalityValue, dictationText);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    
    // This is just for demo purposes
    if (!isRecording) {
      // Simulate recording for demo purposes
      setTimeout(() => {
        setIsRecording(false);
      }, 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="modality" className="text-sm font-medium text-gray-700">
              Modality
            </Label>
            <Select 
              value={modalityValue} 
              onValueChange={setModalityValue}
            >
              <SelectTrigger id="modality" className="mt-1">
                <SelectValue placeholder="Select imaging modality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xray">X-Ray</SelectItem>
                <SelectItem value="ct">CT Scan</SelectItem>
                <SelectItem value="mri">MRI</SelectItem>
                <SelectItem value="us">Ultrasound</SelectItem>
                <SelectItem value="mammo">Mammography</SelectItem>
                <SelectItem value="dexa">DEXA Scan</SelectItem>
                <SelectItem value="nuclear">Nuclear Medicine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="dictation" className="text-sm font-medium text-gray-700">
                Dictation
              </Label>
              <Button 
                type="button" 
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                className="h-8"
                onClick={toggleRecording}
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''} mr-1`} />
                {isRecording ? 'Recording...' : 'Start Dictation'}
              </Button>
            </div>
            <Textarea
              id="dictation"
              placeholder="Dictate order details here... (e.g., 'MRI of the right knee due to persistent pain following sports injury 3 weeks ago. Patient reports limited range of motion and swelling.')"
              value={dictationText}
              onChange={(e) => {
                setDictationText(e.target.value);
                if (error) setError(null);
              }}
              className="mt-1 h-32 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dictate patient symptoms, medical history, and reason for this imaging study
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              Submit Dictation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DictationForm;