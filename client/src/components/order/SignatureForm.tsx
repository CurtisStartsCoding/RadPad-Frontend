import { useState, useRef, useEffect } from 'react';
import { ProcessedDictation } from '@/lib/types';
import { Patient } from '@/lib/mock-data';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from 'lucide-react';

interface SignatureFormProps {
  patient: Patient;
  dictationText: string;
  validationResult: ProcessedDictation;
  onBack: () => void;
  onSubmitted: (orderId: number) => void;
}

const SignatureForm = ({
  patient,
  dictationText,
  validationResult,
  onBack,
  onSubmitted
}: SignatureFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Check if this is a temporary patient
  const isTemporaryPatient = patient?.id === 0;
  
  // Check if patient has required minimum info (name and DOB)
  const hasRequiredPatientInfo = Boolean(
    patient && 
    patient.name !== "Unknown Patient" && 
    patient.dob !== "Unknown"
  );

  // Handle signature drawing with both mouse and touch events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let x, y;
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let x, y;
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmitOrder = async () => {
    console.log("Signature Form - handleSubmitOrder")
    if (!hasRequiredPatientInfo) {
      toast({
        title: "Missing Patient Information",
        description: "Please identify a patient with name and date of birth before signing the order",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasSignature || !fullName) {
      toast({
        title: "Missing Signature Information",
        description: "Please sign and type your full name to confirm",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit an order",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the patient info for temporary patients
      const isTemporaryPatient = patient.id === 0;
      
      // Use the remote API's order update endpoint
      // The order was already created during validation
      // Extract orderId from the validation result if available
      const orderId = validationResult.orderId;
      
      // If no orderId is available, we need to create a new order
      if (!orderId) {
        // Create a new order using the validation endpoint
        const createOrderResponse = await apiRequest("POST", "/api/orders/validate", {
          dictationText,
          patientInfo: {
            firstName: patient.name.split(' ')[0] || '',
            lastName: patient.name.split(' ').slice(1).join(' ') || '',
            dateOfBirth: patient.dob,
            gender: patient.gender,
            mrn: patient.mrn || 'Unknown'
          }
        });
        
        const createOrderData = await createOrderResponse.json();
        
        if (!createOrderData.orderId) {
          throw new Error("Failed to create order");
        }
        
        // Use the newly created order ID
        var newOrderId = createOrderData.orderId;
      }
      
      // Get the CPT code from validation result
      const cptCode = validationResult.cptCode ||
                     (validationResult.procedureCodes && validationResult.procedureCodes.length > 0 ?
                      validationResult.procedureCodes[0].code : undefined); // No default code
      
      // Update the order with final validation information
      // Use the correct endpoint for order finalization
      const orderResponse = await apiRequest("PUT", `/api/orders/${orderId || newOrderId}`, {
        status: "pending_admin", // Set the status to pending_admin
        final_validation_status: "appropriate", // Always use a valid value
        final_compliance_score: validationResult.complianceScore || 0.8,
        final_cpt_code: cptCode,
        clinical_indication: dictationText, // Always use the original dictation text
        overridden: validationResult.overridden || false,
        signed_by_user_id: user?.id,
        signature_date: new Date().toISOString(),
        signer_name: fullName
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error("Failed to update order");
      }
      
      // Display different message for temporary patients
      if (isTemporaryPatient) {
        toast({
          title: "Order Signed Successfully",
          description: "This order has been signed and queued for administrative staff to complete patient information.",
          variant: "default",
          duration: 5000
        });
      }
      
      onSubmitted(orderId || newOrderId);
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Submission Error",
        description: "Failed to submit the order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use effect to initialize and handle the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas drawing styles
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e40af'; // Blue color for signature
    
    // Set canvas to be responsive
    function resizeCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      if (!container) return;
      
      // Get the parent's dimensions
      const containerWidth = container.clientWidth - 16; // Adjusting for padding
      
      // Set canvas size
      canvas.width = Math.min(450, containerWidth);
      canvas.height = 140;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Reset drawing settings (they get reset on resize)
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e40af';
    }
    
    // Initial sizing
    resizeCanvas();
    
    // Resize on window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <Card className="bg-white mt-6">
      <CardContent className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h2>
        
        <div className="mb-6 bg-blue-50 p-4 rounded-md">
          <p className="text-sm text-blue-700">
            By electronically signing this order, I certify that this radiology study is medically necessary and appropriate according to AUC guidelines. This order has been validated with {((validationResult.complianceScore ?? 80) / 10).toFixed(1)}% compliance.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="border border-gray-300 rounded-md p-4">
            <div className="flex items-center justify-center h-32 bg-gray-50 mb-4">
              <canvas
                ref={canvasRef}
                width={450}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="signature-pad touch-manipulate border border-gray-200 rounded"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
              >
                Clear
              </Button>
              <div className="text-sm text-gray-500">Type your full name to confirm</div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <Label htmlFor="signature-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</Label>
          <Input
            id="signature-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            placeholder="Type your full name"
          />
        </div>
        
        {/* Show temporary patient notice if applicable */}
        {isTemporaryPatient && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 mr-2" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Temporary Patient Detected</p>
                <p className="mt-1">This order will be queued for administrative staff to attach complete patient information.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !hasSignature || !fullName || !hasRequiredPatientInfo}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              isTemporaryPatient ? "Sign & Queue for Admin" : "Submit Order"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureForm;