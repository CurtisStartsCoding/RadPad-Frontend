import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { 
  Mic, 
  RefreshCcw, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  FileText, 
  Sparkles,
  InfoIcon,
  MoveDown
} from "lucide-react";

const TrialValidation = () => {
  const { toast } = useToast();
  const [dictationText, setDictationText] = useState("");
  const [selectedModality, setSelectedModality] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    aucScore: number;
    isCompliant: boolean;
    suggestedCptCode: string;
    suggestedCptDescription: string;
    suggestedIcd10Code: string;
    suggestedIcd10Description: string;
    feedback: string[];
  } | null>(null);
  
  // Track remaining validation credits
  const [remainingCredits, setRemainingCredits] = useState(5);
  
  // Handle dictation text change
  const handleDictationTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDictationText(e.target.value);
    // Reset validation state when text changes
    if (validationComplete) {
      setValidationComplete(false);
      setValidationResults(null);
    }
  };
  
  // Handle modality change
  const handleModalityChange = (value: string) => {
    setSelectedModality(value);
    // Reset validation state when modality changes
    if (validationComplete) {
      setValidationComplete(false);
      setValidationResults(null);
    }
  };
  
  // Handle validation
  const handleValidate = () => {
    // Basic validation
    if (!dictationText.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your clinical dictation",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedModality) {
      toast({
        title: "Validation Error",
        description: "Please select a modality",
        variant: "destructive",
      });
      return;
    }
    
    setIsValidating(true);
    
    // Simulate API call to validate order
    setTimeout(() => {
      // Determine mock results based on modality and text content
      const isMRIKnee = selectedModality === 'mri-knee';
      const mentionsKnee = dictationText.toLowerCase().includes('knee');
      const mentionsPain = dictationText.toLowerCase().includes('pain');
      const mentionsHistory = dictationText.toLowerCase().includes('history');
      
      let score = 0;
      const feedback: string[] = [];
      
      // Calculate compliance score based on content
      if (mentionsKnee) score += 3;
      if (mentionsPain) score += 2;
      if (mentionsHistory) score += 2;
      
      // Add feedback messages
      if (!mentionsKnee) {
        feedback.push("Clinical indication should specifically mention the knee joint");
      }
      if (!mentionsPain) {
        feedback.push("Include details about pain characteristics (location, severity, duration)");
      }
      if (!mentionsHistory) {
        feedback.push("Include relevant patient history and previous treatments");
      }
      
      // Advanced mock validation
      const mockResults = {
        aucScore: isMRIKnee && mentionsKnee ? Math.min(7, score) : Math.min(5, score),
        isCompliant: isMRIKnee && mentionsKnee && score >= 5,
        suggestedCptCode: isMRIKnee ? "73721" : "70551",
        suggestedCptDescription: isMRIKnee ? "MRI knee without contrast" : "MRI brain without contrast",
        suggestedIcd10Code: isMRIKnee ? "M25.561" : "G43.909",
        suggestedIcd10Description: isMRIKnee ? "Pain in right knee" : "Migraine, unspecified, not intractable",
        feedback: feedback.length ? feedback : ["Order appears appropriate based on clinical indication"]
      };
      
      setValidationResults(mockResults);
      setIsValidating(false);
      setValidationComplete(true);
      
      // Decrement remaining credits
      setRemainingCredits(prev => Math.max(0, prev - 1));
      
      toast({
        title: mockResults.isCompliant ? "Validation Successful" : "Validation Complete with Suggestions",
        description: mockResults.isCompliant 
          ? "Your order meets clinical appropriateness criteria" 
          : "We've identified some suggestions to improve this order",
        variant: mockResults.isCompliant ? "default" : "destructive",
      });
    }, 2000);
  };
  
  // Handle trying another validation
  const handleTryAnother = () => {
    setDictationText("");
    setSelectedModality("");
    setValidationComplete(false);
    setValidationResults(null);
  };
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Trial Validation Sandbox" 
        description="Test your clinical dictations and see real-time validation feedback"
      />
      
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl">
        <div className="w-full lg:w-3/5">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Clinical Dictation</CardTitle>
                  <CardDescription>
                    Enter a sample clinical indication for testing
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 flex items-center">
                  <InfoIcon className="h-3 w-3 mr-1" />
                  {remainingCredits} Validations Remaining
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Select 
                  value={selectedModality} 
                  onValueChange={handleModalityChange}
                  disabled={isValidating}
                >
                  <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder="Select imaging modality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mri-brain">MRI Brain</SelectItem>
                    <SelectItem value="mri-knee">MRI Knee</SelectItem>
                    <SelectItem value="ct-chest">CT Chest</SelectItem>
                    <SelectItem value="ultrasound-abdomen">Ultrasound Abdomen</SelectItem>
                    <SelectItem value="xray-chest">X-Ray Chest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Textarea
                  placeholder="Enter your clinical dictation here. For example: '45-year-old female with right knee pain persisting for over 3 months, not responsive to NSAIDs and physical therapy. Previous X-ray showed mild degenerative changes.'"
                  className="min-h-[200px] resize-none pb-10"
                  onChange={handleDictationTextChange}
                  value={dictationText}
                  disabled={isValidating}
                />
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    disabled={isValidating}
                    onClick={() => setDictationText("")}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2"
                    disabled={isValidating}
                  >
                    <Mic className="h-4 w-4 mr-1.5" />
                    Voice Input
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  {dictationText.length > 0 && (
                    <span>{dictationText.length} characters</span>
                  )}
                </div>
                <Button 
                  onClick={handleValidate} 
                  disabled={isValidating || !dictationText.trim() || !selectedModality || remainingCredits <= 0}
                >
                  {isValidating ? (
                    <>
                      <span className="mr-2">Validating...</span>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : "Validate Order"}
                </Button>
              </div>
              
              {remainingCredits <= 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Trial limit reached</AlertTitle>
                  <AlertDescription>
                    You've used all your trial validations. Sign up for a full account to continue using the service.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full lg:w-2/5">
          {validationComplete && validationResults && (
            <Card className="h-full">
              <CardHeader className={`pb-3 ${validationResults.isCompliant ? 'bg-green-50' : 'bg-amber-50'}`}>
                <div className="flex items-start">
                  {validationResults.isCompliant ? (
                    <div className="mr-3 bg-green-100 rounded-full p-1.5">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="mr-3 bg-amber-100 rounded-full p-1.5">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className={validationResults.isCompliant ? 'text-green-800' : 'text-amber-800'}>
                      {validationResults.isCompliant 
                        ? 'Order Meets Appropriateness Criteria' 
                        : 'Suggestions for Order Improvement'}
                    </CardTitle>
                    <CardDescription className={validationResults.isCompliant ? 'text-green-600' : 'text-amber-600'}>
                      Appropriateness Score: {validationResults.aucScore}/8
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1.5 text-slate-400" />
                    Your Dictation
                  </h3>
                  <p className="text-sm bg-slate-50 p-3 rounded-md">
                    {selectedModality.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}: {dictationText}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5 text-slate-400" />
                    Suggested Codes
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-md space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">CPT Code</p>
                      <p className="text-sm font-medium">{validationResults.suggestedCptCode}: {validationResults.suggestedCptDescription}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">ICD-10 Code</p>
                      <p className="text-sm font-medium">{validationResults.suggestedIcd10Code}: {validationResults.suggestedIcd10Description}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2 flex items-center">
                    <InfoIcon className="h-4 w-4 mr-1.5 text-slate-400" />
                    Feedback
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <ul className="space-y-1.5">
                      {validationResults.feedback.map((item, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <div className={`mt-0.5 mr-2 h-3 w-3 rounded-full flex-shrink-0 ${validationResults.isCompliant ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleTryAnother} 
                    className="w-full" 
                    variant="outline"
                    disabled={remainingCredits <= 0}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1.5" />
                    Try Another Validation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {!validationComplete && (
            <Card className="h-full bg-slate-50 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center p-6">
              <div className="mb-4 bg-slate-100 rounded-full p-3">
                <MoveDown className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">Validation Results</h3>
              <p className="text-sm text-slate-500 text-center mb-4">
                Enter a clinical dictation and select a modality, then click "Validate Order" to see results here.
              </p>
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 mb-1">Example Validations:</span>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• MRI Knee for chronic pain</li>
                  <li>• CT Chest for persistent cough</li>
                  <li>• MRI Brain for recurrent headaches</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialValidation;