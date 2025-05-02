import { useState } from "react";
import { AppPage } from "@/App";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { InfoIcon, FileText, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { allOrders } from "@/lib/mock-data";

interface AdminOrderFinalizationProps {
  navigateTo?: (page: AppPage) => void;
}

const AdminOrderFinalization: React.FC<AdminOrderFinalizationProps> = ({ navigateTo }) => {
  const [currentTab, setCurrentTab] = useState("patient");
  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const { toast } = useToast();
  
  // Mock order data based on ID (in a real app, this would be fetched from API)
  const order = allOrders[0]; // Just use first order for mock
  
  // Patient information state
  const [patientInfo, setPatientInfo] = useState({
    firstName: order.patient.name.split(' ')[0] || '',
    lastName: order.patient.name.split(' ')[1] || '',
    dateOfBirth: order.patient.dob,
    gender: "female",
    addressLine1: "123 Main Street",
    addressLine2: "",
    city: "Anytown",
    state: "CA",
    zipCode: "90210",
    phoneNumber: "(555) 123-4567",
    email: "",
    mrn: order.patient.mrn
  });
  
  // Insurance information state
  const [insuranceInfo, setInsuranceInfo] = useState({
    insurerName: "Blue Cross Blue Shield",
    policyNumber: "BCBS123456789",
    groupNumber: "GRP12345",
    policyHolderName: order.patient.name,
    policyHolderRelationship: "self",
    policyHolderDateOfBirth: order.patient.dob,
    secondaryInsurerName: "",
    secondaryPolicyNumber: "",
    secondaryGroupNumber: ""
  });
  
  // Supplemental information state
  const [supplementalInfo, setSupplementalInfo] = useState({
    text: "Patient has history of migraines. Previous imaging from 2024 showed no significant findings. Patient reports worsening symptoms in the past month."
  });
  
  // Handle patient info change
  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientInfo({
      ...patientInfo,
      [name]: value
    });
  };
  
  // Handle insurance info change
  const handleInsuranceInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInsuranceInfo({
      ...insuranceInfo,
      [name]: value
    });
  };
  
  // Handle supplemental info change
  const handleSupplementalInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSupplementalInfo({
      ...supplementalInfo,
      text: e.target.value
    });
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };
  
  // Handle navigation to next tab
  const handleNextTab = () => {
    if (currentTab === "patient") {
      setCurrentTab("insurance");
    } else if (currentTab === "insurance") {
      setCurrentTab("supplemental");
    } else if (currentTab === "supplemental") {
      setCurrentTab("review");
    }
  };
  
  // Handle navigation to previous tab
  const handlePreviousTab = () => {
    if (currentTab === "insurance") {
      setCurrentTab("patient");
    } else if (currentTab === "supplemental") {
      setCurrentTab("insurance");
    } else if (currentTab === "review") {
      setCurrentTab("supplemental");
    }
  };
  
  // Handle send to radiology
  const handleSendToRadiology = () => {
    setIsSending(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setOrderSent(true);
      
      toast({
        title: "Order sent to radiology",
        description: "Order #" + order.id + " has been successfully sent to " + order.radiologyGroup,
        variant: "default",
      });
    }, 1500);
  };
  
  // Handle go back to queue
  const handleBackToQueue = () => {
    navigateTo && navigateTo(AppPage.AdminQueue);
  };
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2" 
          onClick={handleBackToQueue}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Queue
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Complete Order Information</h1>
          <p className="text-sm text-slate-500">
            Add required patient details to send this order to radiology
          </p>
        </div>
      </div>
      
      {orderSent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-green-50 rounded-full p-3 mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-medium mb-2">Order Successfully Sent</h2>
              <p className="text-center text-slate-500 max-w-md mb-6">
                Order #{order.id} for {order.patient.name} has been sent to {order.radiologyGroup}.
                They will contact the patient directly for scheduling.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={handleBackToQueue}>
                  Return to Queue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order #{order.id} - {order.modality}</CardTitle>
                  <CardDescription>Created on {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                  Needs Completion
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Patient</p>
                  <p className="text-slate-600">{order.patient.name}</p>
                  <p className="text-xs text-slate-400">DOB: {order.patient.dob}</p>
                  <p className="text-xs text-slate-400">MRN: {order.patient.mrn}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Ordering Physician</p>
                  <p className="text-slate-600">Dr. Sarah Johnson</p>
                  <p className="text-xs text-slate-400">Internal Medicine</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Radiology Group</p>
                  <p className="text-slate-600">{order.radiologyGroup}</p>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Clinical Indication</p>
                    <p className="text-sm text-blue-700">
                      45-year-old female with chronic headaches persisting for over 3 months. 
                      Patient reports severe pain localized to the right temporal region with occasional 
                      visual disturbances. Not responsive to standard migraine medications. 
                      Request MRI brain to evaluate for structural abnormalities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="patient">Patient Info</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance</TabsTrigger>
                  <TabsTrigger value="supplemental">Supplemental</TabsTrigger>
                  <TabsTrigger value="review">Review & Send</TabsTrigger>
                </TabsList>
                
                <TabsContent value="patient">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          name="firstName" 
                          value={patientInfo.firstName} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          name="lastName" 
                          value={patientInfo.lastName} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input 
                          id="dateOfBirth" 
                          name="dateOfBirth" 
                          value={patientInfo.dateOfBirth} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select 
                          value={patientInfo.gender} 
                          onValueChange={(value) => setPatientInfo({...patientInfo, gender: value})}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input 
                        id="addressLine1" 
                        name="addressLine1" 
                        value={patientInfo.addressLine1} 
                        onChange={handlePatientInfoChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="addressLine2">Address Line 2</Label>
                      <Input 
                        id="addressLine2" 
                        name="addressLine2" 
                        value={patientInfo.addressLine2} 
                        onChange={handlePatientInfoChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input 
                          id="city" 
                          name="city" 
                          value={patientInfo.city} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input 
                          id="state" 
                          name="state" 
                          value={patientInfo.state} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input 
                          id="zipCode" 
                          name="zipCode" 
                          value={patientInfo.zipCode} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input 
                          id="phoneNumber" 
                          name="phoneNumber" 
                          value={patientInfo.phoneNumber} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          value={patientInfo.email} 
                          onChange={handlePatientInfoChange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="mrn">Medical Record Number (MRN)</Label>
                      <Input 
                        id="mrn" 
                        name="mrn" 
                        value={patientInfo.mrn} 
                        onChange={handlePatientInfoChange}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={handleNextTab}>
                      Continue to Insurance
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="insurance">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Primary Insurance</h3>
                    
                    <div>
                      <Label htmlFor="insurerName">Insurance Company</Label>
                      <Input 
                        id="insurerName" 
                        name="insurerName" 
                        value={insuranceInfo.insurerName} 
                        onChange={handleInsuranceInfoChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="policyNumber">Policy Number</Label>
                        <Input 
                          id="policyNumber" 
                          name="policyNumber" 
                          value={insuranceInfo.policyNumber} 
                          onChange={handleInsuranceInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="groupNumber">Group Number</Label>
                        <Input 
                          id="groupNumber" 
                          name="groupNumber" 
                          value={insuranceInfo.groupNumber} 
                          onChange={handleInsuranceInfoChange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="policyHolderName">Policy Holder Name</Label>
                      <Input 
                        id="policyHolderName" 
                        name="policyHolderName" 
                        value={insuranceInfo.policyHolderName} 
                        onChange={handleInsuranceInfoChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="policyHolderRelationship">Relationship to Patient</Label>
                        <Select 
                          value={insuranceInfo.policyHolderRelationship} 
                          onValueChange={(value) => setInsuranceInfo({...insuranceInfo, policyHolderRelationship: value})}
                        >
                          <SelectTrigger id="policyHolderRelationship">
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="self">Self</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="child">Child</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="policyHolderDateOfBirth">Policy Holder Date of Birth</Label>
                        <Input 
                          id="policyHolderDateOfBirth" 
                          name="policyHolderDateOfBirth" 
                          value={insuranceInfo.policyHolderDateOfBirth} 
                          onChange={handleInsuranceInfoChange}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Secondary Insurance (Optional)</h3>
                        {!insuranceInfo.secondaryInsurerName && (
                          <Button 
                            variant="ghost" 
                            onClick={() => setInsuranceInfo({...insuranceInfo, secondaryInsurerName: "Medicare"})}
                          >
                            + Add Secondary Insurance
                          </Button>
                        )}
                      </div>
                      
                      {insuranceInfo.secondaryInsurerName && (
                        <>
                          <div className="mt-4">
                            <Label htmlFor="secondaryInsurerName">Insurance Company</Label>
                            <Input 
                              id="secondaryInsurerName" 
                              name="secondaryInsurerName" 
                              value={insuranceInfo.secondaryInsurerName} 
                              onChange={handleInsuranceInfoChange}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label htmlFor="secondaryPolicyNumber">Policy Number</Label>
                              <Input 
                                id="secondaryPolicyNumber" 
                                name="secondaryPolicyNumber" 
                                value={insuranceInfo.secondaryPolicyNumber} 
                                onChange={handleInsuranceInfoChange}
                              />
                            </div>
                            <div>
                              <Label htmlFor="secondaryGroupNumber">Group Number</Label>
                              <Input 
                                id="secondaryGroupNumber" 
                                name="secondaryGroupNumber" 
                                value={insuranceInfo.secondaryGroupNumber} 
                                onChange={handleInsuranceInfoChange}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <Button onClick={handleNextTab}>
                      Continue to Supplemental Info
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="supplemental">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <Label htmlFor="supplementalText" className="text-lg font-medium mr-2">
                          Supplemental Information from EMR
                        </Label>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          HIPAA Protected
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        Add any additional clinical information from the EMR that would be helpful for the radiologist.
                      </p>
                      <Textarea 
                        id="supplementalText" 
                        className="min-h-[200px]"
                        value={supplementalInfo.text}
                        onChange={handleSupplementalInfoChange}
                      />
                    </div>
                    
                    <Alert className="bg-amber-50 border-amber-200">
                      <InfoIcon className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Important Note</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Only paste information relevant to this imaging order. Do not include sensitive patient 
                        information not directly related to this study.
                      </AlertDescription>
                    </Alert>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <Button onClick={handleNextTab}>
                      Review Order
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="review">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Review Order Information</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Please review all information carefully before sending this order to {order.radiologyGroup}.
                      </p>
                      
                      <div className="space-y-4">
                        <Card className="bg-slate-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Patient Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <dt className="text-slate-500">Name</dt>
                                <dd>{patientInfo.firstName} {patientInfo.lastName}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Date of Birth</dt>
                                <dd>{patientInfo.dateOfBirth}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Gender</dt>
                                <dd>{patientInfo.gender}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">MRN</dt>
                                <dd>{patientInfo.mrn}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-slate-500">Address</dt>
                                <dd>
                                  {patientInfo.addressLine1} 
                                  {patientInfo.addressLine2 && <>, {patientInfo.addressLine2}</>}<br />
                                  {patientInfo.city}, {patientInfo.state} {patientInfo.zipCode}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Phone</dt>
                                <dd>{patientInfo.phoneNumber}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Email</dt>
                                <dd>{patientInfo.email || <span className="text-slate-400">Not provided</span>}</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Insurance Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <dt className="text-slate-500">Primary Insurance</dt>
                                <dd>{insuranceInfo.insurerName}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Policy Number</dt>
                                <dd>{insuranceInfo.policyNumber}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Group Number</dt>
                                <dd>{insuranceInfo.groupNumber}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Policy Holder</dt>
                                <dd>{insuranceInfo.policyHolderName}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Relationship</dt>
                                <dd>{insuranceInfo.policyHolderRelationship}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Policy Holder DOB</dt>
                                <dd>{insuranceInfo.policyHolderDateOfBirth}</dd>
                              </div>
                              
                              {insuranceInfo.secondaryInsurerName && (
                                <>
                                  <div className="col-span-2 mt-2">
                                    <dt className="text-slate-500 font-medium">Secondary Insurance</dt>
                                  </div>
                                  <div>
                                    <dt className="text-slate-500">Insurance</dt>
                                    <dd>{insuranceInfo.secondaryInsurerName}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-slate-500">Policy Number</dt>
                                    <dd>{insuranceInfo.secondaryPolicyNumber || <span className="text-slate-400">Not provided</span>}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-slate-500">Group Number</dt>
                                    <dd>{insuranceInfo.secondaryGroupNumber || <span className="text-slate-400">Not provided</span>}</dd>
                                  </div>
                                </>
                              )}
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Clinical Information</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="space-y-2 text-sm">
                              <div>
                                <dt className="text-slate-500">Physician's Clinical Indication</dt>
                                <dd className="mt-1 bg-white p-2 rounded border">
                                  45-year-old female with chronic headaches persisting for over 3 months. 
                                  Patient reports severe pain localized to the right temporal region with occasional 
                                  visual disturbances. Not responsive to standard migraine medications. 
                                  Request MRI brain to evaluate for structural abnormalities.
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500 mt-2">Supplemental EMR Information</dt>
                                <dd className="mt-1 bg-white p-2 rounded border">
                                  {supplementalInfo.text || <span className="text-slate-400">None provided</span>}
                                </dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Order Details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <dt className="text-slate-500">Modality</dt>
                                <dd>{order.modality}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Radiology Group</dt>
                                <dd>{order.radiologyGroup}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">CPT Code</dt>
                                <dd>70551 - MRI Brain without contrast</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">ICD-10 Codes</dt>
                                <dd>G43.909, R51.9</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                        
                        <Alert className="bg-blue-50 border-blue-200">
                          <InfoIcon className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-700">
                            <strong>Credit Usage:</strong> Sending this order will use 1 credit from your organization's balance. 
                            You currently have 42 credits remaining.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleSendToRadiology} 
                      disabled={isSending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSending ? "Sending..." : "Send to Radiology"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminOrderFinalization;