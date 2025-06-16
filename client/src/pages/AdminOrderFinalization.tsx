import { useState, useEffect } from "react";
import { AppPage } from "@/App";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import { InfoIcon, FileText, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { allOrders } from "@/lib/mock-data";
import DocumentManager from "@/components/upload/DocumentManager";
import PageHeader from "@/components/layout/PageHeader";

interface AdminOrderFinalizationProps {
  navigateTo?: (page: AppPage) => void;
}

const AdminOrderFinalization: React.FC<AdminOrderFinalizationProps> = ({ navigateTo }) => {
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("patient");
  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get order ID from sessionStorage
  const orderId = sessionStorage.getItem('currentOrderId');
  
  // Fetch order data from API
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('No order ID found');
      const response = await apiRequest('GET', `/api/orders/${orderId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const result = await response.json();
      console.log('Order data fetched:', result);
      console.log('Patient fields in response:', {
        patient_first_name: result.patient_first_name,
        patient_last_name: result.patient_last_name,
        patient_dob: result.patient_dob,
        patient_date_of_birth: result.patient_date_of_birth,
        patient_city: result.patient_city,
        patient_state: result.patient_state,
        patient_zip_code: result.patient_zip_code,
        insurance_name: result.insurance_name,
        insurance_group_number: result.insurance_group_number
      });
      // TODO: Backend needs to return patient/insurance data with order
      return result.data || result; // Handle both {data: order} and direct order response
    },
    enabled: !!orderId,
    staleTime: 0, // Always fetch fresh data when returning to order
  });
  
  // Initialize order state with fetched data or mock data
  const [order, setOrder] = useState(orderData || {
    ...allOrders[0], 
    modality: "MOCK-MRI Knee (Test)"
  });
  
  // Available radiology organizations (hardcoded for now since admin_staff can access connections)
  const availableRadiologyOrgs = [
    { id: 2, name: "City Imaging Center" },
    { id: 3, name: "Regional Radiology Group" },
    { id: 4, name: "Advanced Imaging Solutions" }
  ];
  
  // Update order state when data is loaded
  useEffect(() => {
    if (orderData) {
      setOrder(orderData);
      // Also update patient info with real data
      // Format date to YYYY-MM-DD if it exists
      let formattedDob = '';
      // Check both possible field names
      const dobValue = orderData.patient_date_of_birth || orderData.patient_dob;
      if (dobValue) {
        // Handle various date formats
        const date = new Date(dobValue);
        if (!isNaN(date.getTime())) {
          formattedDob = date.toISOString().split('T')[0];
        } else {
          formattedDob = dobValue; // Use as-is if parsing fails
        }
      }
      
      setPatientInfo({
        firstName: orderData.patient_first_name || '',
        lastName: orderData.patient_last_name || '',
        dateOfBirth: formattedDob,
        gender: orderData.patient_gender || '',
        addressLine1: orderData.patient_address_line1 || '',
        addressLine2: orderData.patient_address_line2 || '',
        city: orderData.patient_city || '',
        state: orderData.patient_state || '',
        zipCode: orderData.patient_zip_code || '',
        phoneNumber: orderData.patient_phone_number || '',
        email: orderData.patient_email || '',
        mrn: orderData.patient_mrn || ''
      });
      // Also update insurance info with real data
      setInsuranceInfo({
        insurerName: orderData.insurance_name || '',
        planName: orderData.insurance_plan_name || '',
        policyNumber: orderData.insurance_policy_number || '',
        groupNumber: orderData.insurance_group_number || '',
        policyHolderName: `${orderData.patient_first_name || ''} ${orderData.patient_last_name || ''}`,
        policyHolderRelationship: orderData.insurance_policy_holder_relationship || 'self',
        policyHolderDateOfBirth: orderData.insurance_policy_holder_dob || orderData.patient_dob || '',
        secondaryInsurerName: '',
        secondaryPlanName: '',
        secondaryPolicyNumber: '',
        secondaryGroupNumber: ''
      });
      // Update supplemental info if available
      if (orderData.supplemental_text || orderData.supplemental_info || orderData.supplemental_emr_content) {
        setSupplementalInfo({
          text: orderData.supplemental_text || orderData.supplemental_info || orderData.supplemental_emr_content || ''
        });
      }
      // Update order details if available
      if (orderData.priority || orderData.special_instructions) {
        setOrderDetails(prev => ({
          ...prev,
          priority: orderData.priority || prev.priority,
          instructions: orderData.special_instructions || prev.instructions,
          // TODO: Map target_facility_id back to location name
          // scheduling_timeframe is not stored in DB
        }));
      }
    }
  }, [orderData]);
  
  // Function to update radiology group
  const setRadiologyGroup = (group: string) => {
    setOrder({
      ...order,
      radiologyGroup: group
    });
    // Find and set the org ID
    const selectedOrg = availableRadiologyOrgs.find(org => org.name === group);
    if (selectedOrg) {
      setSelectedRadiologyOrgId(selectedOrg.id);
    }
  };
  
  // Patient information state - use actual data if available
  const [patientInfo, setPatientInfo] = useState({
    firstName: orderData?.patient_first_name || "TEST_" + (order.patient?.name?.split(' ')[0] || ''),
    lastName: orderData?.patient_last_name || "MOCK_" + (order.patient?.name?.split(' ')[1] || ''),
    dateOfBirth: orderData?.patient_dob || order.patient?.dob || '',
    gender: orderData?.patient_gender || "female",
    addressLine1: orderData?.patient_address_line1 || "123 FAKE Street",
    addressLine2: orderData?.patient_address_line2 || "MOCK Suite 456",
    city: orderData?.patient_city || "TESTVILLE",
    state: orderData?.patient_state || "ZZ",
    zipCode: orderData?.patient_zip_code || "00000",
    phoneNumber: orderData?.patient_phone_number || "(555) MOCK-DATA",
    email: orderData?.patient_email || "fake.patient@mockdata.test",
    mrn: orderData?.patient_mrn || "MOCK-" + (order.patient?.mrn || '')
  });
  
  // Insurance information state
  const [hasInsurance, setHasInsurance] = useState(true); // Default to true, can be changed by user
  const [insuranceInfo, setInsuranceInfo] = useState({
    insurerName: orderData?.insurance_name || "MOCK-Insurance Company (TEST)",
    planName: orderData?.insurance_plan_name || "FAKE-Care PPO SAMPLE",
    policyNumber: orderData?.insurance_policy_number || "TEST-POLICY-123456789",
    groupNumber: orderData?.insurance_group_number || "MOCK-GRP-12345",
    policyHolderName: orderData ? `${orderData.patient_first_name || ''} ${orderData.patient_last_name || ''}` : "TEST_Patient",
    policyHolderRelationship: orderData?.insurance_policy_holder_relationship || "self",
    policyHolderDateOfBirth: orderData?.insurance_policy_holder_dob || orderData?.patient_dob || '',
    secondaryInsurerName: "",
    secondaryPlanName: "",
    secondaryPolicyNumber: "",
    secondaryGroupNumber: ""
  });
  
  // Supplemental information state
  const [supplementalInfo, setSupplementalInfo] = useState({
    text: "[MOCK DATA] Patient has fictional history of right knee pain. Previous SAMPLE imaging from 2024 showed no significant findings. TEST patient reports worsening symptoms in the past month. THIS IS FAKE CLINICAL DATA FOR TESTING PURPOSES ONLY."
  });
  
  // Clinical Summary for Review Page - Matches the reference image
  const clinicalSummaryForReview = "[MOCK DATA] Patient has fictional history of right knee pain. Previous SAMPLE imaging from 2024 showed no significant findings. TEST patient reports worsening symptoms in the past month. THIS IS FAKE CLINICAL DATA FOR TESTING PURPOSES ONLY.";
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState({
    orderNumber: orderData?.order_number || `TEST-ROP-${new Date().toISOString().slice(2,4)}${new Date().toISOString().slice(5,7)}${new Date().toISOString().slice(8,10)}-MOCK`,
    location: "MOCK Imaging Center – TEST Campus",
    scheduling: "Within 14 days",
    priority: "routine",
    primaryIcd10: orderData?.final_icd10_codes?.[0] || "M25.561-MOCK",
    primaryDescription: orderData?.final_icd10_code_descriptions?.[0] || "FAKE Pain in right knee (TEST)",
    secondaryIcd10: orderData?.final_icd10_codes?.[1] || "M17.11-MOCK",
    secondaryDescription: orderData?.final_icd10_code_descriptions?.[1] || "SAMPLE Unilateral primary osteoarthritis, right knee (TEST)",
    cptCode: orderData?.final_cpt_code || "73721-TEST",
    cptDescription: orderData?.final_cpt_code_description || "MOCK MRI knee without contrast (SAMPLE)",
    instructions: ""
  });
  
  // Track selected radiology organization
  const [selectedRadiologyOrgId, setSelectedRadiologyOrgId] = useState<number | null>(null);
  
  // Referring physician state
  const [referringPhysician, setReferringPhysician] = useState({
    name: "Dr. TEST_Sarah MOCK_Johnson",
    npi: "TEST-1234567890",
    clinic: "MOCK Internal Medicine Associates (TEST)",
    phone: "(555) FAKE-TEST",
    signedDate: "04/15/2025 (MOCK DATE)"
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
  const handleParseEmr = async () => {
    if (!emrText.trim()) {
      toast({
        title: "Error",
        description: "Please paste EMR text first",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    try {
      // Call the real API to parse EMR text
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/paste-summary`, {
        pastedText: emrText
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update patient info with parsed data
        if (result.parsedData?.patientInfo) {
          const parsed = result.parsedData.patientInfo;
          setPatientInfo(prev => ({
            ...prev,
            addressLine1: parsed.address || prev.addressLine1,
            city: parsed.city || prev.city,
            state: parsed.state || prev.state,
            zipCode: parsed.zipCode || prev.zipCode,
            phoneNumber: parsed.phone || prev.phoneNumber,
            email: parsed.email || prev.email
          }));
        }
        
        // Update insurance info with parsed data
        if (result.parsedData?.insuranceInfo) {
          const parsed = result.parsedData.insuranceInfo;
          setInsuranceInfo(prev => ({
            ...prev,
            insurerName: parsed.insurerName || prev.insurerName,
            policyNumber: parsed.policyNumber || prev.policyNumber,
            groupNumber: parsed.groupNumber || prev.groupNumber,
            policyHolderName: parsed.policyHolderName || prev.policyHolderName,
            policyHolderRelationship: parsed.relationship || prev.policyHolderRelationship
          }));
        }
        
        setIsParsing(false);
        setParsingComplete(true);
        setParsingStatus({
          patient: true,
          insurance: true,
          message: result.message || "Successfully extracted patient and insurance information from EMR text."
        });

        toast({
          title: "Success",
          description: "Patient and insurance information extracted successfully",
          variant: "default",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to parse EMR text");
      }
    } catch (error) {
      setIsParsing(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse EMR text",
        variant: "destructive",
      });
    }
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
      setCurrentTab("documents");
    } else if (currentTab === "documents") {
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
    } else if (currentTab === "documents") {
      setCurrentTab("supplemental");
    } else if (currentTab === "review") {
      setCurrentTab("documents");
    }
  };
  
  // Handle send to radiology
  const handleSendToRadiology = async () => {
    // Check if radiology organization is selected
    if (!selectedRadiologyOrgId) {
      toast({
        title: "Error",
        description: "Please select a radiology organization",
        variant: "destructive",
      });
      return;
    }
    
    const radiologyOrganizationId = selectedRadiologyOrgId;
    
    setIsSending(true);
    
    try {
      // Use the unified endpoint to save all data at once
      const updateData: any = {
        patient: {
          firstName: patientInfo.firstName,
          lastName: patientInfo.lastName,
          middleName: '',
          dateOfBirth: patientInfo.dateOfBirth,
          gender: patientInfo.gender,
          addressLine1: patientInfo.addressLine1,
          addressLine2: patientInfo.addressLine2,
          city: patientInfo.city,
          state: patientInfo.state,
          zipCode: patientInfo.zipCode,
          phoneNumber: patientInfo.phoneNumber,
          email: patientInfo.email,
          mrn: patientInfo.mrn
        }
      };

      // Add insurance based on user selection
      updateData.hasInsurance = hasInsurance;
      
      if (hasInsurance && (insuranceInfo.insurerName || insuranceInfo.policyNumber)) {
        updateData.insurance = {
          insurerName: insuranceInfo.insurerName,
          policyNumber: insuranceInfo.policyNumber,
          groupNumber: insuranceInfo.groupNumber,
          planType: insuranceInfo.planName,
          policyHolderName: insuranceInfo.policyHolderName,
          policyHolderRelationship: insuranceInfo.policyHolderRelationship,
          policyHolderDateOfBirth: insuranceInfo.policyHolderDateOfBirth,
          isPrimary: true
        };
      }

      // Save all data using unified endpoint
      const saveResponse = await apiRequest('PUT', `/api/admin/orders/${orderId}`, updateData);

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save order information",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Then send to radiology
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/send-to-radiology`, {
        radiologyOrganizationId: radiologyOrganizationId
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to send order to radiology",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      const result = await response.json();
      
      setIsSending(false);
      setOrderSent(true);
      
      toast({
        title: "Order sent to radiology",
        description: `Order #${order.id} has been successfully sent to radiology.${result.remainingCredits !== undefined ? ` Credits remaining: ${result.remainingCredits}` : ''}`,
        variant: "default",
      });
    } catch (error) {
      setIsSending(false);
      toast({
        title: "Error",
        description: "Failed to send order to radiology. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle go back to queue
  const handleBackToQueue = () => {
    setLocation('/admin-queue');
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !order) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Order</AlertTitle>
          <AlertDescription>
            {error?.message || 'Unable to load order details. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={handleBackToQueue}
        >
          Back to Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Complete Order Information"
        description="Add required patient details to send this order to radiology"
        backButton={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBackToQueue}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Queue
          </Button>
        }
      />
      
      {orderSent ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-10">
              <div className="bg-green-50 rounded-full p-3 mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="text-xl font-medium mb-2">Order Successfully Sent</h2>
              <p className="text-center text-slate-500 max-w-md mb-6">
                Order #{order.id} for {`${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim() || 'Patient'} has been sent to {order.radiology_organization?.name || order.radiologyGroup || 'the radiology facility'}.
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
                  <CardTitle>Order #{order.id || order.order_number} - {order.modality || 'N/A'}</CardTitle>
                  <CardDescription>Created on {new Date(order.created_at || order.createdAt).toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                  Pending Admin
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Patient</p>
                  <p className="text-slate-600">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</p>
                  <p className="text-xs text-slate-400">DOB: {order.patient_dob || 'N/A'}</p>
                  <p className="text-xs text-slate-400">MRN: {order.patient_mrn || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Ordering Physician</p>
                  <p className="text-slate-600">{order.referring_physician_name || 'N/A'}</p>
                  <p className="text-xs text-slate-400">{order.specialty || ''}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Radiology Group</p>
                  <p className="text-slate-600">{order.radiology_organization?.name || order.radiologyGroup || 'Not assigned'}</p>
                </div>
              </div>
              
              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Clinical Indication</p>
                    <p className="text-sm text-blue-700">
                      {order.clinical_indication || order.dictation || '[No clinical indication provided]'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Tabs value={currentTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-6 mb-6">
                  <TabsTrigger value="emr-paste">EMR Paste</TabsTrigger>
                  <TabsTrigger value="patient">Patient Info</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance</TabsTrigger>
                  <TabsTrigger value="supplemental">Order Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
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
                          onClick={() => setEmrText(`*** MOCK DATA - FOR TESTING ONLY ***

PATIENT DEMOGRAPHICS:
Name: TEST_Thompson, MOCK_Margaret
DOB: 08/15/1975
Sex: Female
MRN: MOCK-PT789012-TEST
Address: 456 FAKE Park Avenue, TEST Apt 7B, MOCK New York, ZZ 00000
Phone: (555) MOCK-TEST
Email: fake.patient@mockdata.test

INSURANCE INFORMATION:
Primary Insurance: MOCK Aetna Health Insurance (TEST)
Policy #: TEST-AET12345678-MOCK
Group #: MOCK-GRP-98765-TEST
Policy Holder: TEST_Thompson, MOCK_Margaret
Relationship to Patient: Self
Policy Holder DOB: 08/15/1975

Secondary Insurance: MOCK Medicare Part B (TEST)
Policy #: TEST-MED87654321-MOCK
Group #: MOCK-MEDGRP-54321-TEST

HEALTHCARE PROVIDER:
PCP: Dr. TEST_James MOCK_Wilson
PCP Phone: (555) FAKE-TEST
Referring Provider: Dr. TEST_Sarah MOCK_Johnson

*** THIS IS FAKE DATA FOR TESTING PURPOSES ONLY ***`)}
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
                          type="date"
                          value={patientInfo.dateOfBirth} 
                          onChange={handlePatientInfoChange}
                          placeholder="YYYY-MM-DD"
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
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Use the unified endpoint with camelCase fields
                            const payload = {
                              patient: {
                                firstName: patientInfo.firstName,
                                lastName: patientInfo.lastName,
                                middleName: '',
                                dateOfBirth: patientInfo.dateOfBirth,
                                gender: patientInfo.gender,
                                addressLine1: patientInfo.addressLine1,
                                addressLine2: patientInfo.addressLine2,
                                city: patientInfo.city,
                                state: patientInfo.state,
                                zipCode: patientInfo.zipCode,
                                phoneNumber: patientInfo.phoneNumber,
                                email: patientInfo.email,
                                mrn: patientInfo.mrn
                              }
                            };
                            
                            console.log('Sending patient data to unified endpoint:', payload);
                            console.log('Date of birth value:', patientInfo.dateOfBirth);
                            
                            const response = await apiRequest('PUT', `/api/admin/orders/${orderId}`, payload);
                            
                            if (response.ok) {
                              const result = await response.json();
                              console.log('Save patient response:', result);
                              toast({
                                title: "Success",
                                description: "Patient information saved successfully",
                                variant: "default",
                              });
                            } else {
                              const error = await response.json();
                              console.error('Save patient error:', error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to save patient information",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to save patient information",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Patient Info
                      </Button>
                      <Button onClick={handleNextTab}>
                        Continue to Insurance
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="insurance">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Insurance Information</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="hasInsurance" 
                          checked={hasInsurance}
                          onCheckedChange={(checked) => setHasInsurance(checked as boolean)}
                        />
                        <Label htmlFor="hasInsurance" className="cursor-pointer">
                          Patient has insurance
                        </Label>
                      </div>
                    </div>
                    
                    {!hasInsurance ? (
                      <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertTitle>No Insurance</AlertTitle>
                        <AlertDescription>
                          This patient is uninsured/cash-pay. No insurance information will be saved.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <h3 className="text-lg font-medium">Primary Insurance</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="insurerName">Insurance Company</Label>
                        <Input 
                          id="insurerName" 
                          name="insurerName" 
                          value={insuranceInfo.insurerName} 
                          onChange={handleInsuranceInfoChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="planName">Plan Name</Label>
                        <Input 
                          id="planName" 
                          name="planName" 
                          value={insuranceInfo.planName} 
                          onChange={handleInsuranceInfoChange}
                        />
                      </div>
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
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label htmlFor="secondaryInsurerName">Insurance Company</Label>
                              <Input 
                                id="secondaryInsurerName" 
                                name="secondaryInsurerName" 
                                value={insuranceInfo.secondaryInsurerName} 
                                onChange={handleInsuranceInfoChange}
                              />
                            </div>
                            <div>
                              <Label htmlFor="secondaryPlanName">Plan Name</Label>
                              <Input 
                                id="secondaryPlanName" 
                                name="secondaryPlanName" 
                                value={insuranceInfo.secondaryPlanName} 
                                onChange={handleInsuranceInfoChange}
                              />
                            </div>
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
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Use the unified endpoint with proper structure
                            const payload: any = {
                              hasInsurance: hasInsurance
                            };
                            
                            // Only include insurance data if patient has insurance
                            if (hasInsurance) {
                              payload.insurance = {
                                insurerName: insuranceInfo.insurerName,
                                policyNumber: insuranceInfo.policyNumber,
                                groupNumber: insuranceInfo.groupNumber,
                                planType: insuranceInfo.planName,
                                policyHolderName: insuranceInfo.policyHolderName,
                                policyHolderRelationship: insuranceInfo.policyHolderRelationship,
                                policyHolderDateOfBirth: insuranceInfo.policyHolderDateOfBirth,
                                isPrimary: true
                              };
                            }
                            
                            const response = await apiRequest('PUT', `/api/admin/orders/${orderId}`, payload);
                            
                            if (response.ok) {
                              toast({
                                title: "Success",
                                description: "Insurance information saved successfully",
                                variant: "default",
                              });
                            } else {
                              const error = await response.json();
                              toast({
                                title: "Error",
                                description: error.message || "Failed to save insurance information",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to save insurance information",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Insurance Info
                      </Button>
                      <Button onClick={handleNextTab}>
                        Continue to Order Details
                      </Button>
                    </div>
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
                              {availableRadiologyOrgs.map((org) => (
                                <SelectItem key={org.id} value={org.name}>
                                  {org.name}
                                </SelectItem>
                              ))}
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
                              <SelectItem value="routine">Routine</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="stat">STAT</SelectItem>
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
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Save order details and supplemental text using the unified endpoint
                            const detailsPayload = {
                              orderDetails: {
                                priority: orderDetails.priority,
                                targetFacilityId: selectedRadiologyOrgId || null, // Use selected radiology organization
                                specialInstructions: orderDetails.instructions,
                                schedulingTimeframe: orderDetails.scheduling
                              },
                              // Also save supplemental text with unified endpoint
                              supplementalText: supplementalInfo.text
                            };
                            
                            const detailsResponse = await apiRequest('PUT', `/api/admin/orders/${orderId}`, detailsPayload);
                            
                            if (detailsResponse.ok) {
                              toast({
                                title: "Success",
                                description: "All order details saved successfully",
                                variant: "default",
                              });
                            } else {
                              const error = await detailsResponse.json();
                              throw new Error(error.message || "Failed to save order details");
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to save order details",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Save Order Details
                      </Button>
                      <Button onClick={handleNextTab}>
                        Review Order
                      </Button>
                    </div>
                  </div>
                  
                </TabsContent>
                
                <TabsContent value="documents">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Document Management</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Upload and manage patient documents for this order. You can upload insurance cards, 
                        referrals, and other relevant documents using drag-and-drop or copy-paste.
                      </p>
                      
                      <DocumentManager 
                        orderId={order.id} 
                        patientId={Number(order.patient_id || order.patient?.id || 0)} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <Button onClick={handleNextTab}>
                      Continue to Review
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
                          {clinicalSummaryForReview}
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
                              <div>{insuranceInfo.insurerName} ({insuranceInfo.planName}) — Policy #{insuranceInfo.policyNumber}</div>
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
                          <strong>Credit Usage (MOCK):</strong> Sending this order will use 1 credit from your organization's balance.
                          You currently have 42 TEST credits remaining.
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