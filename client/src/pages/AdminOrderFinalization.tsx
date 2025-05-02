import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PatientInfoCard from "@/components/order/PatientInfoCard";
import { 
  ArrowLeft, 
  CheckCircle, 
  ChevronRight, 
  FileText, 
  AlertCircle,
  Calendar,
  HelpCircle,
  Upload,
  PlusCircle,
  Edit
} from "lucide-react";
import { temporaryPatient } from "@/lib/mock-data";

// Mock validation result for displaying in order summary
const mockValidationResult = {
  validationStatus: 'valid',
  feedback: "The clinical information provided is sufficient for the requested MRI of the right knee. This order meets the appropriate use criteria (AUC) for imaging based on the documented history of trauma and ongoing symptoms.",
  complianceScore: 8,
  suggestedCodes: [
    {
      code: "S83.6XXA",
      description: "Sprain of the superior tibiofibular joint and ligament, initial encounter",
      type: "ICD-10",
      confidence: 0.91
    },
    {
      code: "M25.561",
      description: "Pain in right knee",
      type: "ICD-10",
      confidence: 0.85
    },
    {
      code: "73721",
      description: "Magnetic resonance imaging, any joint of lower extremity",
      type: "CPT",
      confidence: 0.94
    }
  ]
};

// Mock dictation text
const mockDictationText = "MRI right knee due to persistent pain and swelling following sports injury 3 weeks ago. Patient reports limited range of motion and instability when walking. Previous X-ray showed no fracture.";

// Mock modality
const mockModality = "MRI";

// Mock insurance options
const insuranceProviders = [
  "Blue Cross Blue Shield",
  "UnitedHealthcare",
  "Aetna",
  "Cigna",
  "Medicare",
  "Medicaid",
  "Kaiser Permanente",
  "Humana",
  "Other"
];

const AdminOrderFinalization = () => {
  const [activeTab, setActiveTab] = useState("patient");
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("routine");
  const [selectedInsurance, setSelectedInsurance] = useState("Blue Cross Blue Shield");
  const [policyNumber, setPolicyNumber] = useState("");
  const [groupNumber, setGroupNumber] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [relationshipToSubscriber, setRelationshipToSubscriber] = useState("self");
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Mock patient demographic fields
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  // Function to handle sending to radiology
  const handleSendToRadiology = () => {
    setShowCreditAlert(true);
  };
  
  // Function to confirm credit usage and complete order
  const confirmCreditUsage = () => {
    setShowCreditAlert(false);
    // In a real app, this would call an API to complete the order
    console.log("Order sent to radiology");
  };
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Complete Order Details</h1>
          <p className="text-sm text-slate-500">Finalize order information before sending to radiology</p>
        </div>
        <Button variant="outline" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Button>
      </div>
      
      {/* Order Info Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Order Information</CardTitle>
              <Badge className="uppercase font-normal text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">
                Awaiting Completion
              </Badge>
            </div>
            <CardDescription>
              Order #{Math.floor(Math.random() * 1000) + 5000} • Created on {new Date().toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">Modality</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{mockModality}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Ordering Physician</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">Dr. Sarah Johnson</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Date Ordered</p>
                <div className="flex items-center mt-0.5">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  <p className="text-sm font-medium text-slate-900">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-slate-500">Clinical Information</p>
              <p className="text-sm text-slate-700 mt-0.5 bg-slate-50 p-3 rounded-md">
                {mockDictationText}
              </p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-slate-500">Diagnostic Codes</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {mockValidationResult.suggestedCodes.map((code, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                    {code.code}: {code.description}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Required Actions</CardTitle>
            <CardDescription>
              Complete these items before sending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activeTab === "patient" || phone ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                {phone ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Patient Demographics</p>
                <p className="text-xs text-slate-500">Complete patient contact details</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activeTab === "insurance" || policyNumber ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                {policyNumber ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Insurance Information</p>
                <p className="text-xs text-slate-500">Add insurance details</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${activeTab === "additional" || selectedPriority !== "routine" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"}`}>
                {selectedPriority !== "routine" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Additional Details</p>
                <p className="text-xs text-slate-500">Optional priority and notes</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-slate-50">
            <Button 
              onClick={handleSendToRadiology}
              disabled={!phone || !policyNumber}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Send to Radiology
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Patient Info Card */}
      <div className="mb-4">
        <PatientInfoCard
          patient={temporaryPatient}
          onEditPatient={() => setActiveTab("patient")}
        />
      </div>
      
      {/* Order Completion Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="patient">
                Patient Demographics
              </TabsTrigger>
              <TabsTrigger value="insurance">
                Insurance Information
              </TabsTrigger>
              <TabsTrigger value="additional">
                Additional Details
              </TabsTrigger>
            </TabsList>
            
            {/* Patient Demographics Tab */}
            <TabsContent value="patient" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Patient Demographics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="phone"
                      placeholder="(123) 456-7890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="patient@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="address"
                      placeholder="123 Main St"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                    <Input
                      id="city"
                      placeholder="Anytown"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                      <Input
                        id="state"
                        placeholder="CA"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipcode">Zip Code <span className="text-red-500">*</span></Label>
                      <Input
                        id="zipcode"
                        placeholder="12345"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("insurance")}>
                  Continue to Insurance
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Insurance Information Tab */}
            <TabsContent value="insurance" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="insurance-provider">Insurance Provider <span className="text-red-500">*</span></Label>
                    <Select
                      value={selectedInsurance}
                      onValueChange={setSelectedInsurance}
                    >
                      <SelectTrigger id="insurance-provider">
                        <SelectValue placeholder="Select insurance provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceProviders.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="policy-number">Policy Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="policy-number"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="group-number">Group Number</Label>
                    <Input
                      id="group-number"
                      placeholder="XXX-XXXXXX"
                      value={groupNumber}
                      onChange={(e) => setGroupNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subscriber-name">Subscriber Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="subscriber-name"
                      placeholder="John Doe"
                      value={subscriberName}
                      onChange={(e) => setSubscriberName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship to Subscriber <span className="text-red-500">*</span></Label>
                    <Select
                      value={relationshipToSubscriber}
                      onValueChange={setRelationshipToSubscriber}
                    >
                      <SelectTrigger id="relationship">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-start">
                  <HelpCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">Insurance Card</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Upload images of the front and back of the insurance card for verification.
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <Button variant="outline" size="sm" className="h-8">
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Upload Front
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Upload Back
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("patient")}>
                  Back to Demographics
                </Button>
                <Button onClick={() => setActiveTab("additional")}>
                  Continue to Additional Details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            {/* Additional Details Tab */}
            <TabsContent value="additional" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Additional Details</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={selectedPriority}
                      onValueChange={setSelectedPriority}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent (24-48 hours)</SelectItem>
                        <SelectItem value="stat">STAT (Same day)</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedPriority !== "routine" && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center">
                        <AlertCircle className="h-3.5 w-3.5 mr-1" />
                        {selectedPriority === "urgent" 
                          ? "Urgent orders may incur additional fees." 
                          : "STAT orders will incur additional fees."}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes for Radiology</Label>
                    <Textarea
                      id="notes"
                      placeholder="Enter any special instructions or relevant clinical details..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Additional Documents</Label>
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-700">
                          Drag & drop files or click to upload
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Upload relevant scans, lab reports, or clinical notes
                        </p>
                        <Button variant="outline" size="sm" className="mt-3">
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Select Files
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("insurance")}>
                  Back to Insurance
                </Button>
                <Button 
                  onClick={handleSendToRadiology}
                  disabled={!phone || !policyNumber}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Send to Radiology
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Credit Usage Alert Dialog */}
      <AlertDialog open={showCreditAlert} onOpenChange={setShowCreditAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Credit Usage</AlertDialogTitle>
            <AlertDialogDescription>
              Sending this {mockModality} order will use{" "}
              <span className="font-medium text-blue-600">
                {mockModality.toLowerCase().includes("x-ray") || mockModality.toLowerCase().includes("ultrasound") ? "2 standard credits" : "7 advanced credits"}
              </span>.
              {selectedPriority === "urgent" && (
                <p className="mt-2 text-amber-600">
                  An additional 1 credit will be used for urgent processing.
                </p>
              )}
              {selectedPriority === "stat" && (
                <p className="mt-2 text-amber-600">
                  An additional 3 credits will be used for STAT processing.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCreditUsage}>
              Confirm and Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrderFinalization;