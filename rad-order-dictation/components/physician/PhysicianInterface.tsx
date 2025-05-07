import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, UserPlus } from "lucide-react";
import OrderProgressIndicator from "@/components/common/OrderProgressIndicator";
import DictationForm from "./DictationForm";
import ValidationView from "./ValidationView";
import SignatureForm from "./SignatureForm";
import OverrideDialog from "./OverrideDialog";
import PatientInfoCard from "./PatientInfoCard";
import PatientIdentificationDictation from "./PatientIdentificationDictation";
import { Button } from "@/components/ui/button";
import { Patient, ProcessedDictation } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export interface PhysicianInterfaceProps {
  patientId?: number | null; // Make patientId optional
}

const PhysicianInterface = ({ patientId = null }: PhysicianInterfaceProps) => {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isClinicalContextCollapsed, setIsClinicalContextCollapsed] = useState(true);
  const [orderStep, setOrderStep] = useState(1);
  const [dictationText, setDictationText] = useState("");
  const [validationResult, setValidationResult] = useState<ProcessedDictation | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<string | undefined>(undefined);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [isPatientIdentificationOpen, setIsPatientIdentificationOpen] = useState(false);
  
  // State to track if we're in new patient mode (no patient selected yet)
  const [newPatientMode, setNewPatientMode] = useState(!patientId);
  
  // Track current patient ID (can be updated during the session)
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(patientId);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Create a placeholder patient for the "Unknown Patient" workflow
  const [placeholderPatient, setPlaceholderPatient] = useState<Patient>({ 
    id: 0, 
    name: "Unknown Patient", 
    dob: "Unknown", 
    mrn: `${Math.floor(1000000000000 + Math.random() * 9000000000000).toString()}`,
    radiologyGroupId: null,
    referringPracticeId: null,
    externalPatientId: null, 
    demographics: undefined, 
    encryptedData: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    gender: "unknown"
  });

  // Fetch patient data with enhanced error handling and logging
  const { data: patient, isLoading: isLoadingPatient, error: patientError } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });
  


  // Handle dictation processing
  const handleProcessDictation = (result: ProcessedDictation) => {
    setValidationResult(result);
    
    if (result.validationStatus === 'valid') {
      // Only navigate to validation screen if valid
      setOrderStep(2);
      setValidationFeedback(undefined);
    } else {
      // Stay on dictation page and show feedback
      setValidationFeedback(result.feedback || "Validation failed. Please provide additional information.");
      setAttemptCount(prev => prev + 1);
    }
  };
  
  // Clear validation feedback
  const handleClearFeedback = () => {
    setValidationFeedback(undefined);
  };
  
  // Handle override request
  const handleOverrideRequest = () => {
    setIsOverrideDialogOpen(true);
  };
  
  // Handle override confirmation
  const handleOverrideConfirm = (justification: string) => {
    if (validationResult) {
      const overriddenResult: ProcessedDictation = {
        ...validationResult,
        validationStatus: 'valid', // Force valid status
        overridden: true,
        overrideJustification: justification
      };
      
      setValidationResult(overriddenResult);
      setOrderStep(2); // Move to validation screen
      setValidationFeedback(undefined);
      setIsOverrideDialogOpen(false);
    }
  };

  // Handle moving back to dictation from validation
  const handleBackToDictation = () => {
    setOrderStep(1);
  };

  // Handle signing of the order
  const handleSignOrder = () => {
    setOrderStep(3);
  };

  // Handle successful order submission
  const handleOrderSubmitted = (orderIdResult: number) => {
    setOrderId(orderIdResult);
    
    // Check if this is a temporary patient order
    const isTemporaryPatient = activePatient?.id === 0;
    
    // Show success toast with view option (different for temporary patients)
    toast({
      title: isTemporaryPatient 
        ? "Order Queued for Patient Info" 
        : "Order Submitted Successfully",
      description: (
        <div className="flex flex-col space-y-2">
          {isTemporaryPatient ? (
            <p>Your order has been signed and will appear in the admin queue for attaching complete patient information.</p>
          ) : (
            <p>Order has been recorded and sent to radiology group</p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 text-xs"
            onClick={() => {
              // If admin, switch to admin dashboard
              if (window.confirm("View this order in the admin dashboard?")) {
                navigate("/");
                // Small delay to ensure navigation completes before triggering interface switch
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('switchToAdmin', { detail: { orderId: orderIdResult } }));
                }, 100);
              }
            }}
          >
            View in Admin Dashboard
          </Button>
        </div>
      ),
      variant: "default",
      duration: 4000, // Reduced from 10 seconds to 4 seconds
    });
    
    // Reset the form for a new order
    setTimeout(() => {
      setOrderStep(1);
      setDictationText("");
      setValidationResult(null);
      setValidationFeedback(undefined);
      setOrderId(null);
    }, 3000);
  };

  // Toggle clinical context panel
  const toggleClinicalContext = () => {
    setIsClinicalContextCollapsed(!isClinicalContextCollapsed);
  };
  
  // Handle patient detail editing
  const handleEditPatient = () => {
    // Show patient identification dictation dialog
    if (isTemporaryPatient || !currentPatientId) {
      setIsPatientIdentificationOpen(true);
    }
  };
  
  // Handle identified patient information
  const handlePatientIdentified = (patientInfo: { name: string; dob: string }) => {
    // Create updated patient with the identified information
    const updatedPatient: Patient = {
      ...placeholderPatient,
      name: patientInfo.name,
      dob: patientInfo.dob
    };
    
    // Update the component state with the new patient information
    // In a real implementation, this would save to the database
    setPlaceholderPatient(updatedPatient);
    
    toast({
      title: "Patient Updated",
      description: `Patient identified as ${patientInfo.name}, DOB: ${patientInfo.dob}`,
      variant: "default",
      duration: 2000, // Reduced to 2 seconds
    });
    
    // Close the identification dialog
    setIsPatientIdentificationOpen(false);
  };

  // Show spinner when loading patient
  if (isLoadingPatient) {
    return <div className="py-10 text-center">Loading patient information...</div>;
  }

  // Use a placeholder Unknown Patient for dictation
  const activePatient = patient || placeholderPatient;
  
  // Check if this is a temporary patient
  const isTemporaryPatient = activePatient.id === 0;

  return (
    <div className="py-1 sm:py-2">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="relative">
          {/* Main content area with improved contrast */}
          <div className="bg-white rounded-lg shadow p-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-0">
                <h1 className="text-lg font-semibold text-gray-900">
                  Radiology Order {isTemporaryPatient ? '- Unknown Patient' : `- ${activePatient.name}`}
                </h1>
                <div className="mt-1 sm:mt-0 sm:ml-4 px-2 py-1 bg-blue-50 rounded-md text-xs text-blue-700 font-medium">
                  Step {orderStep} of 3: {orderStep === 1 ? 'Dictation' : orderStep === 2 ? 'Validation' : 'Signature'}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                <OrderProgressIndicator currentStep={orderStep} />
                <button 
                  className="text-gray-500 hover:text-primary ml-1 p-2 rounded-full hover:bg-gray-100"
                  onClick={toggleClinicalContext}
                  title="Toggle clinical context"
                  style={{ touchAction: 'manipulation' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Main workflow area */}
            <div className="p-3 sm:p-4">
              {/* Patient information card */}
              <div className="mb-2 space-y-3">
                <PatientInfoCard 
                  patient={activePatient} 
                  onEditPatient={handleEditPatient} 
                />
              </div>
              
              {/* Step 1: Dictation area */}
              {orderStep === 1 && (
                <DictationForm 
                  dictationText={dictationText} 
                  setDictationText={setDictationText}
                  patient={activePatient}
                  onProcessed={handleProcessDictation}
                  validationFeedback={validationFeedback || undefined}
                  onClearFeedback={handleClearFeedback}
                  attemptCount={attemptCount}
                  onOverride={handleOverrideRequest}
                />
              )}
              
              {/* Step 2: Validation view */}
              {orderStep === 2 && validationResult && (
                <ValidationView 
                  dictationText={dictationText}
                  validationResult={validationResult}
                  onBack={handleBackToDictation}
                  onSign={handleSignOrder}
                />
              )}
              
              {/* Step 3: Signature form */}
              {orderStep === 3 && validationResult && (
                <SignatureForm 
                  patient={activePatient}
                  dictationText={dictationText}
                  validationResult={validationResult}
                  onBack={handleBackToDictation}
                  onSubmitted={handleOrderSubmitted}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Override dialog */}
      <OverrideDialog 
        isOpen={isOverrideDialogOpen}
        onClose={() => setIsOverrideDialogOpen(false)}
        onConfirm={handleOverrideConfirm}
      />
      
      {/* Patient identification dialog */}
      <PatientIdentificationDictation 
        open={isPatientIdentificationOpen}
        onCancel={() => setIsPatientIdentificationOpen(false)}
        onIdentify={handlePatientIdentified}
      />
    </div>
  );
};

export default PhysicianInterface;