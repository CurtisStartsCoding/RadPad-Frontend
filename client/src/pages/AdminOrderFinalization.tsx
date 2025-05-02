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
  const [order, setOrder] = useState({...allOrders[0]}); // Just use first order for mock
  
  // Function to update radiology group
  const setRadiologyGroup = (group: string) => {
    setOrder({
      ...order,
      radiologyGroup: group
    });
  };
  
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
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState({
    orderNumber: `ROP-${new Date().toISOString().slice(2,4)}${new Date().toISOString().slice(5,7)}${new Date().toISOString().slice(8,10)}-01`,
    location: "Advanced Imaging Center – East Campus",
    scheduling: "Within 14 days",
    priority: "Routine",
    primaryIcd10: "G43.909",
    primaryDescription: "Migraine, unspecified, not intractable, without status migrainosus",
    secondaryIcd10: "R51.9",
    secondaryDescription: "Headache, unspecified",
    cptCode: "70551",
    cptDescription: "MRI brain without contrast",
    instructions: "✓ No contraindications to contrast.\n✓ No known drug allergies.\n→ Patient reports claustrophobia; sedation may be required."
  });
  
  // Referring physician state
  const [referringPhysician, setReferringPhysician] = useState({
    name: "Dr. Sarah Johnson",
    npi: "1234567890",
    clinic: "Internal Medicine Associates",
    phone: "(212) 555-1234",
    signedDate: "04/15/2025"
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
  
  // Handle order details change
  const handleOrderDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderDetails({
      ...orderDetails,
      [name]: value
    });
  };
  
  // Handle referring physician change
  const handleReferringPhysicianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReferringPhysician({
      ...referringPhysician,
      [name]: value
    });
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };
  
  // EMR Paste state
  const [emrText, setEmrText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsingComplete, setParsingComplete] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<{
    patient: boolean;
    insurance: boolean;
    message: string;
  }>({
    patient: false,
    insurance: false,
    message: ""
  });

  // Handle EMR paste
  const handleEmrTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmrText(e.target.value);
  };

  // Parse EMR text
  const handleParseEmr = () => {
    if (!emrText.trim()) {
      toast({
        title: "Error",
        description: "Please paste EMR text first",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    // Simulate API call to parse EMR text
    setTimeout(() => {
      // Mock successful parsing
      setPatientInfo({
        ...patientInfo,
        firstName: "Margaret",
        lastName: "Thompson",
        dateOfBirth: "1975-08-15",
        gender: "female",
        addressLine1: "456 Park Avenue",
        addressLine2: "Apt 7B",
        city: "New York",
        state: "NY",
        zipCode: "10022",
        phoneNumber: "(212) 555-9876",
        email: "m.thompson@example.com",
        mrn: "PT789012"
      });
      
      setInsuranceInfo({
        ...insuranceInfo,
        insurerName: "Aetna Health Insurance",
        policyNumber: "AET12345678",
        groupNumber: "GRP-98765",
        policyHolderName: "Margaret Thompson",
        policyHolderRelationship: "self",
        policyHolderDateOfBirth: "1975-08-15",
        secondaryInsurerName: "Medicare Part B",
        secondaryPolicyNumber: "MED87654321",
        secondaryGroupNumber: "MEDGRP-54321"
      });
      
      setIsParsing(false);
      setParsingComplete(true);
      setParsingStatus({
        patient: true,
        insurance: true,
        message: "Successfully extracted patient and insurance information from EMR text."
      });

      toast({
        title: "Success",
        description: "Patient and insurance information extracted successfully",
        variant: "default",
      });
    }, 2000);
  };

  // Handle navigation to next tab
  const handleNextTab = () => {
    if (currentTab === "emr-paste") {
      setCurrentTab("patient");
    } else if (currentTab === "patient") {
      setCurrentTab("insurance");
    } else if (currentTab === "insurance") {
      setCurrentTab("supplemental");
    } else if (currentTab === "supplemental") {
      setCurrentTab("review");
    }
  };
  
  // Handle navigation to previous tab
  const handlePreviousTab = () => {
    if (currentTab === "patient") {
      setCurrentTab("emr-paste");
    } else if (currentTab === "insurance") {
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
                      Patient has history of migraines. Previous imaging from 2024 showed no significant findings.
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
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="emr-paste">EMR Paste</TabsTrigger>
                  <TabsTrigger value="patient">Patient Info</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance</TabsTrigger>
                  <TabsTrigger value="supplemental">Supplemental</TabsTrigger>
                  <TabsTrigger value="review">Review & Send</TabsTrigger>
                </TabsList>
                
                <TabsContent value="emr-paste">
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                      <h3 className="text-lg font-medium flex items-center mb-2">
                        <InfoIcon className="h-5 w-5 mr-2 text-blue-500" />
                        EMR Patient Summary Parser
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Copy and paste text from your EMR patient summary or face sheet below. The system will automatically
                        extract patient demographics and insurance information, saving you time on manual data entry.
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <Label htmlFor="emrText">EMR Patient Summary Text</Label>
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-xs text-blue-500"
                          onClick={() => setEmrText(`PATIENT DEMOGRAPHICS:
Name: Thompson, Margaret
DOB: 08/15/1975
Sex: Female
MRN: PT789012
Address: 456 Park Avenue, Apt 7B, New York, NY 10022
Phone: (212) 555-9876
Email: m.thompson@example.com

INSURANCE INFORMATION:
Primary Insurance: Aetna Health Insurance
Policy #: AET12345678
Group #: GRP-98765
Policy Holder: Thompson, Margaret
Relationship to Patient: Self
Policy Holder DOB: 08/15/1975

Secondary Insurance: Medicare Part B
Policy #: MED87654321
Group #: MEDGRP-54321

HEALTHCARE PROVIDER:
PCP: Dr. James Wilson
PCP Phone: (212) 555-1234
Referring Provider: Dr. Sarah Johnson`)}
                        >
                          Load example text
                        </Button>
                      </div>
                      <Textarea
                        id="emrText"
                        placeholder="Copy and paste text from EMR patient summary here..."
                        className="min-h-[200px] font-mono text-sm"
                        value={emrText}
                        onChange={handleEmrTextChange}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        {parsingComplete && (
                          <div className="flex items-center text-sm text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {parsingStatus.message}
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleParseEmr}
                        disabled={isParsing || !emrText.trim()}
                      >
                        {isParsing ? (
                          <>
                            <span className="mr-2">Parsing...</span>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </>
                        ) : "Extract Patient Information"}
                      </Button>
                    </div>

                    {parsingComplete && (
                      <Alert className="mt-4 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Information extracted successfully</AlertTitle>
                        <AlertDescription>
                          Patient and insurance information has been automatically extracted. You can review and edit the details in the next tabs.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end mt-6">
                      <Button onClick={handleNextTab}>
                        Continue to Patient Info
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
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
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Order Details</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="radiologyGroup">Radiology Group</Label>
                          <Select 
                            value={order.radiologyGroup} 
                            onValueChange={(value) => setRadiologyGroup(value)}
                          >
                            <SelectTrigger id="radiologyGroup">
                              <SelectValue placeholder="Select radiology group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="University Radiology Partners">University Radiology Partners</SelectItem>
                              <SelectItem value="Metro Imaging Associates">Metro Imaging Associates</SelectItem>
                              <SelectItem value="East Coast Diagnostic Imaging">East Coast Diagnostic Imaging</SelectItem>
                              <SelectItem value="Premier Radiology Group">Premier Radiology Group</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="location">Facility Location</Label>
                          <Select 
                            value={orderDetails.location} 
                            onValueChange={(value) => setOrderDetails({...orderDetails, location: value})}
                          >
                            <SelectTrigger id="location">
                              <SelectValue placeholder="Select facility location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Advanced Imaging Center – East Campus">Advanced Imaging Center – East Campus</SelectItem>
                              <SelectItem value="Medical Arts Building – Downtown">Medical Arts Building – Downtown</SelectItem>
                              <SelectItem value="North County Imaging Center">North County Imaging Center</SelectItem>
                              <SelectItem value="West Side Medical Plaza">West Side Medical Plaza</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select 
                            value={orderDetails.priority} 
                            onValueChange={(value) => setOrderDetails({...orderDetails, priority: value})}
                          >
                            <SelectTrigger id="priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Routine">Routine</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                              <SelectItem value="STAT">STAT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="scheduling">Scheduling Timeframe</Label>
                          <Select 
                            value={orderDetails.scheduling} 
                            onValueChange={(value) => setOrderDetails({...orderDetails, scheduling: value})}
                          >
                            <SelectTrigger id="scheduling">
                              <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Within 48 hours">Within 48 hours</SelectItem>
                              <SelectItem value="Within 7 days">Within 7 days</SelectItem>
                              <SelectItem value="Within 14 days">Within 14 days</SelectItem>
                              <SelectItem value="Within 30 days">Within 30 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
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
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Special Instructions</h3>
                      <p className="text-sm text-slate-500 mb-2">
                        Include any special instructions for the radiology facility (e.g., contrast allergies, claustrophobia, etc.)
                      </p>
                      <Textarea 
                        id="instructions" 
                        name="instructions"
                        className="min-h-[100px]"
                        value={orderDetails.instructions}
                        onChange={handleOrderDetailsChange}
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
                      
                      <div className="border border-slate-200 rounded-md p-6 bg-white font-sans">
                        <h1 className="text-xl font-bold mb-3">RADORDERPAD — VALIDATED IMAGING ORDER</h1>
                        
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Order #:</div>
                              <div>{orderDetails.orderNumber}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Study:</div>
                              <div>{order.modality}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Location:</div>
                              <div>{orderDetails.location}</div>
                            </div>
                          </div>
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Scheduling:</div>
                              <div>{orderDetails.scheduling}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Priority:</div>
                              <div>{orderDetails.priority}</div>
                            </div>
                          </div>
                        </div>
                        
                        <h2 className="text-lg font-medium border-b border-slate-200 mb-3 pb-1">Clinical Summary</h2>
                        <div className="bg-slate-50 p-3 rounded mb-6 font-mono text-sm whitespace-pre-wrap">
                          {supplementalInfo.text}
                        </div>
                        
                        <h2 className="text-lg font-medium border-b border-slate-200 mb-3 pb-1">Diagnosis + CPT</h2>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Primary ICD-10:</div>
                              <div>{orderDetails.primaryIcd10} — {orderDetails.primaryDescription}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Secondary ICD-10:</div>
                              <div>{orderDetails.secondaryIcd10} — {orderDetails.secondaryDescription}</div>
                            </div>
                          </div>
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">CPT Code:</div>
                              <div>{orderDetails.cptCode} — {orderDetails.cptDescription}</div>
                            </div>
                          </div>
                        </div>
                        
                        <h2 className="text-lg font-medium border-b border-slate-200 mb-3 pb-1">Referring Physician</h2>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Name:</div>
                              <div>{referringPhysician.name}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">NPI:</div>
                              <div>{referringPhysician.npi}</div>
                            </div>
                          </div>
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Clinic:</div>
                              <div>{referringPhysician.clinic}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Phone:</div>
                              <div>{referringPhysician.phone}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Signed:</div>
                              <div>{referringPhysician.signedDate}</div>
                            </div>
                          </div>
                        </div>
                        
                        <h2 className="text-lg font-medium border-b border-slate-200 mb-3 pb-1">Patient Information</h2>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Name:</div>
                              <div>{patientInfo.firstName} {patientInfo.lastName}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">DOB:</div>
                              <div>{patientInfo.dateOfBirth}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Sex:</div>
                              <div>{patientInfo.gender}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Phone:</div>
                              <div>{patientInfo.phoneNumber}</div>
                            </div>
                          </div>
                          <div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Address:</div>
                              <div>
                                {patientInfo.addressLine1}
                                {patientInfo.addressLine2 && <>, {patientInfo.addressLine2}</>}, {patientInfo.city}, {patientInfo.state} {patientInfo.zipCode}
                              </div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">MRN:</div>
                              <div>{patientInfo.mrn}</div>
                            </div>
                            <div className="flex mb-2">
                              <div className="w-40 font-medium">Insurance:</div>
                              <div>{insuranceInfo.insurerName} — Policy #{insuranceInfo.policyNumber}</div>
                            </div>
                          </div>
                        </div>
                        
                        <h2 className="text-lg font-medium border-b border-slate-200 mb-3 pb-1">Instructions</h2>
                        <div className="bg-slate-50 p-3 rounded mb-6 font-mono text-sm whitespace-pre-wrap">
                          {orderDetails.instructions}
                        </div>
                      </div>
                        
                      <Alert className="bg-blue-50 border-blue-200 mt-4">
                        <InfoIcon className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          <strong>Credit Usage:</strong> Sending this order will use 1 credit from your organization's balance. 
                          You currently have 42 credits remaining.
                        </AlertDescription>
                      </Alert>
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
                      {isSending ? (
                        <>
                          <span className="mr-2">Sending...</span>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </>
                      ) : "Send to Radiology"}
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