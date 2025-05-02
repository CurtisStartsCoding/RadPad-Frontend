import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { temporaryPatient } from "@/lib/mock-data";
import PatientInfoCard from "@/components/order/PatientInfoCard";
import DictationForm from "@/components/order/DictationForm";
import ValidationView from "@/components/order/ValidationView";
import { ArrowLeft, AlertCircle, CheckCircle, Search } from "lucide-react";

// Mock validation result for demo
const mockValidationResult = {
  validationStatus: 'valid' as const,
  feedback: "The clinical information provided is sufficient for the requested MRI of the right knee. This order meets the appropriate use criteria (AUC) for imaging based on the documented history of trauma and ongoing symptoms.",
  complianceScore: 8,
  suggestedCodes: [
    {
      code: "S83.6XXA",
      description: "Sprain of the superior tibiofibular joint and ligament, initial encounter",
      type: "ICD-10" as const,
      confidence: 0.91
    },
    {
      code: "M25.561",
      description: "Pain in right knee",
      type: "ICD-10" as const,
      confidence: 0.85
    },
    {
      code: "73721",
      description: "Magnetic resonance imaging, any joint of lower extremity",
      type: "CPT" as const,
      confidence: 0.94
    }
  ]
};

const NewOrder = () => {
  const [orderStep, setOrderStep] = useState<'dictation' | 'validation' | 'summary'>('dictation');
  const [modalityValue, setModalityValue] = useState("");
  const [dictationText, setDictationText] = useState("");
  const [validationResult, setValidationResult] = useState(mockValidationResult);
  const [activeTab, setActiveTab] = useState('dictate');
  
  // Handle dictation submission
  const handleDictationSubmit = (modalityValue: string, dictationText: string) => {
    setModalityValue(modalityValue);
    setDictationText(dictationText);
    setOrderStep('validation');
  };
  
  // Handle returning to dictation
  const handleBackToDictation = () => {
    setOrderStep('dictation');
  };
  
  // Handle signing the order
  const handleSignOrder = () => {
    setOrderStep('summary');
  };

  // Modality name mapping
  const getModalityName = (value: string) => {
    const modalities: Record<string, string> = {
      'xray': 'X-Ray',
      'ct': 'CT Scan',
      'mri': 'MRI',
      'us': 'Ultrasound',
      'mammo': 'Mammography',
      'dexa': 'DEXA Scan',
      'nuclear': 'Nuclear Medicine',
    };
    
    return modalities[value] || value;
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">New Imaging Order</h1>
          <p className="text-sm text-slate-500">Create a new order for a patient</p>
        </div>
        <Button variant="outline" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
      
      {/* Patient Information */}
      <div className="mb-6">
        <PatientInfoCard 
          patient={temporaryPatient} 
          onEditPatient={() => console.log("Edit patient clicked")}
        />
      </div>
      
      {/* Order Creation Process */}
      {orderStep === 'dictation' && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="dictate" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dictate">Dictate Order</TabsTrigger>
                <TabsTrigger value="search">Search Existing</TabsTrigger>
              </TabsList>
              <TabsContent value="dictate" className="mt-4">
                <DictationForm onDictationSubmit={handleDictationSubmit} />
              </TabsContent>
              <TabsContent value="search" className="mt-4">
                <div className="text-center p-6 border border-gray-100 rounded-lg">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Search Previous Orders</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Find and reuse past orders for this patient
                  </p>
                  <Button variant="outline">
                    Search Past Orders
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {orderStep === 'validation' && (
        <Card>
          <CardHeader>
            <CardTitle>Review and Validate</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the clinical information and validation results before signing the order.
              </AlertDescription>
            </Alert>
            
            <div className="bg-slate-50 p-4 mb-6 rounded-lg border border-slate-100">
              <p className="text-sm font-medium text-slate-700">Modality</p>
              <p className="text-base mt-1">{getModalityName(modalityValue)}</p>
            </div>
            
            <ValidationView 
              dictationText={dictationText} 
              validationResult={validationResult}
              onBack={handleBackToDictation}
              onSign={handleSignOrder}
            />
          </CardContent>
        </Card>
      )}
      
      {orderStep === 'summary' && (
        <Card>
          <CardHeader>
            <CardTitle>Order Created Successfully</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Order #{Math.floor(Math.random() * 1000) + 1000} Created</h3>
              <p className="text-sm text-slate-500 mb-6">
                The {getModalityName(modalityValue)} order for {temporaryPatient.name} has been created successfully and sent to the admin queue.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline">
                  Order Details
                </Button>
                <Button>
                  Create Another Order
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewOrder;