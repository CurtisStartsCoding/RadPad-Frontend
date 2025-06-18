import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import { InfoIcon, FileText, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { allOrders } from "@/lib/mock-data";
import PageHeader from "@/components/layout/PageHeader";
import OrderReviewSummary from "@/components/order/OrderReviewSummary";
import EmrPasteTab from "@/components/order/EmrPasteTab";
import PatientInfoTab from "@/components/order/PatientInfoTab";
import InsuranceInfoTab from "@/components/order/InsuranceInfoTab";
import OrderDetailsTab from "@/components/order/OrderDetailsTab";
import DocumentsTab from "@/components/order/DocumentsTab";
import OrderDebugInfo from "@/components/debug/OrderDebugInfo";

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
  
  // Get current user info from query cache or storage
  const userFromCache = queryClient.getQueryData(['user']);
  const userFromStorage = localStorage.getItem('rad_order_pad_user_data');
  
  
  // Try to get user from auth context or session
  const sessionData = queryClient.getQueryData(['session']) as any;
  const currentUser = userFromCache || (userFromStorage ? JSON.parse(userFromStorage) : null) || sessionData?.user;
  
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
      // TODO: Backend needs to return patient/insurance data with order
      return result.data || result; // Handle both {data: order} and direct order response
    },
    enabled: !!orderId,
    staleTime: 0, // Always fetch fresh data when returning to order
  });
  
  // Fetch connections
  const { data: connectionsData, isLoading: connectionsLoading, error: connectionsError } = useQuery({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/connections', undefined);
      
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      
      // Handle both response formats: {connections: [...]} and direct array
      if (Array.isArray(data)) {
        return { connections: data };
      }
      return data;
    },
    enabled: !!orderId,
    retry: 1
  });
  
  // Initialize order state with fetched data or mock data
  const [order, setOrder] = useState(orderData || {
    ...allOrders[0], 
    modality: "MOCK-MRI Knee (Test)",
    radiologyGroup: "" // Add this field for the dropdown
  });
  
  // Stage 5: Use real connections data instead of hardcoded
  const availableRadiologyOrgs = useMemo(() => {
    
    // Handle the case where connectionsData might be the array directly
    const connections = connectionsData?.connections || (Array.isArray(connectionsData) ? connectionsData : null);
    
    if (!connections || connections.length === 0) {
      return [];
    }
    
    // Filter active connections and map to expected format
    const activeConnections = connections
      .filter((conn: any) => {
        return conn.status === 'active';
      })
      .map((conn: any) => ({
        id: conn.partnerOrgId,
        name: conn.partnerOrgName
      }));
    
    return activeConnections;
  }, [connectionsData]);
  
  // Update order state when data is loaded
  useEffect(() => {
    if (orderData) {
      setOrder({
        ...orderData,
        // Map the correct field for modality/study type - use modality field from orders table
        modality: orderData.modality || orderData.final_cpt_code_description || 'Not specified',
        radiologyGroup: "" // Ensure radiologyGroup field exists
      });
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
      // Update referring physician with real data
      // The referring physician is the one who created/signed the order
      setReferringPhysician({
        name: orderData.referring_physician_name || 'Not available',
        npi: orderData.referring_physician_npi || 'Not available',
        clinic: orderData.referring_physician_specialty || orderData.referring_organization_name || 'Not available',
        phone: orderData.referring_physician_phone || 'Not available',
        signedDate: orderData.signature_date ? new Date(orderData.signature_date).toLocaleDateString() : 
                   (orderData.created_at ? new Date(orderData.created_at).toLocaleDateString() : 'Not available')
      });
    }
  }, [orderData]);
  
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
  const [radiologyGroup, setRadiologyGroup] = useState<string>("");
  const [selectedRadiologyOrgId, setSelectedRadiologyOrgId] = useState<number | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  
  // Fetch locations for selected radiology organization
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/organizations', selectedRadiologyOrgId, 'locations'],
    queryFn: async () => {
      if (!selectedRadiologyOrgId) return null;
      
      const response = await apiRequest('GET', `/api/organizations/${selectedRadiologyOrgId}/locations`, undefined);
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!selectedRadiologyOrgId,
    retry: 1
  });
  
  // Get available locations from the selected radiology organization
  const availableFacilities = useMemo(() => {
    
    // Handle different API response formats
    const locations = locationsData?.locations || locationsData?.data || locationsData;
    
    if (!locations || !Array.isArray(locations)) {
      return [];
    }
    
    
    const activeLocations = locations
      .filter((loc: any) => {
        // Handle different field names (is_active vs isActive)
        const isActive = loc.is_active !== undefined ? loc.is_active : loc.isActive !== false;
        return isActive;
      })
      .map((loc: any) => ({
        id: loc.id,
        name: loc.name || `${loc.address_line1}, ${loc.city}`,
        fullAddress: `${loc.address_line1}${loc.address_line2 ? ', ' + loc.address_line2 : ''}, ${loc.city}, ${loc.state} ${loc.zip_code}`
      }));
    
    return activeLocations;
  }, [locationsData]);
  
  // Referring physician state
  const [referringPhysician, setReferringPhysician] = useState({
    name: "Dr. TEST_Sarah MOCK_Johnson",
    npi: "TEST-1234567890",
    clinic: "MOCK Internal Medicine Associates (TEST)",
    phone: "(555) FAKE-TEST",
    signedDate: "04/15/2025 (MOCK DATE)"
  });
  
  // Handle patient info change
  const handlePatientInfoChange = (field: string, value: string) => {
    setPatientInfo({
      ...patientInfo,
      [field]: value
    });
  };
  
  // Handle insurance info change
  const handleInsuranceInfoChange = (field: string, value: string) => {
    setInsuranceInfo({
      ...insuranceInfo,
      [field]: value
    });
  };
  
  // Handle supplemental info change
  const handleSupplementalInfoChange = (text: string) => {
    setSupplementalInfo({
      ...supplementalInfo,
      text: text
    });
  };
  
  // Handle order details change
  const handleOrderDetailsChange = (field: string, value: string) => {
    setOrderDetails({
      ...orderDetails,
      [field]: value
    });
  };
  
  // Handle radiology organization selection
  const handleRadiologyOrgSelect = (orgId: number) => {
    setSelectedRadiologyOrgId(orgId);
    setSelectedFacilityId(null); // Reset facility when org changes
  };
  
  // Handle facility selection
  const handleFacilitySelect = (facilityId: number, facilityName: string) => {
    setSelectedFacilityId(facilityId);
    setOrderDetails({
      ...orderDetails,
      location: facilityName
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
    
    // Check if facility location is selected
    if (!selectedFacilityId) {
      toast({
        title: "Error",
        description: "Please select a facility location",
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
      
      {/* Debug Information Component */}
      <OrderDebugInfo
        currentUser={currentUser}
        orderId={orderId}
        orderData={orderData}
        connectionsData={connectionsData}
        connectionsLoading={connectionsLoading}
        connectionsError={connectionsError}
        userFromCache={userFromCache}
        userFromStorage={userFromStorage}
        sessionData={sessionData}
        enableDebugLogging={process.env.NODE_ENV === 'development'}
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
                  <EmrPasteTab 
                    orderId={orderId!}
                    onParseComplete={(patientData, insuranceData) => {
                      // Update patient info with parsed data
                      if (patientData) {
                        setPatientInfo(prev => ({
                          ...prev,
                          addressLine1: patientData.address || prev.addressLine1,
                          city: patientData.city || prev.city,
                          state: patientData.state || prev.state,
                          zipCode: patientData.zipCode || prev.zipCode,
                          phoneNumber: patientData.phone || prev.phoneNumber,
                          email: patientData.email || prev.email
                        }));
                      }
                      
                      // Update insurance info with parsed data
                      if (insuranceData) {
                        setInsuranceInfo(prev => ({
                          ...prev,
                          insurerName: insuranceData.insurerName || prev.insurerName,
                          planName: insuranceData.planName || prev.planName,
                          policyNumber: insuranceData.policyNumber || prev.policyNumber,
                          groupNumber: insuranceData.groupNumber || prev.groupNumber,
                          policyHolderName: insuranceData.policyHolderName || prev.policyHolderName,
                          policyHolderRelationship: insuranceData.policyHolderRelationship || prev.policyHolderRelationship,
                          policyHolderDateOfBirth: insuranceData.policyHolderDateOfBirth || prev.policyHolderDateOfBirth,
                          secondaryInsurerName: insuranceData.secondaryInsurerName || prev.secondaryInsurerName,
                          secondaryPlanName: insuranceData.secondaryPlanName || prev.secondaryPlanName,
                          secondaryPolicyNumber: insuranceData.secondaryPolicyNumber || prev.secondaryPolicyNumber,
                          secondaryGroupNumber: insuranceData.secondaryGroupNumber || prev.secondaryGroupNumber
                        }));
                        
                        if (insuranceData.insurerName) {
                          setHasInsurance(true);
                        }
                      }
                    }}
                    onContinue={handleNextTab}
                  />
                </TabsContent>
                
                <TabsContent value="patient">
                  <PatientInfoTab
                    orderId={orderId!}
                    patientInfo={patientInfo}
                    onPatientInfoChange={handlePatientInfoChange}
                    onBack={handlePreviousTab}
                    onContinue={handleNextTab}
                  />
                </TabsContent>
                
                <TabsContent value="insurance">
                  <InsuranceInfoTab
                    orderId={orderId!}
                    hasInsurance={hasInsurance}
                    insuranceInfo={insuranceInfo}
                    onHasInsuranceChange={setHasInsurance}
                    onInsuranceInfoChange={handleInsuranceInfoChange}
                    onBack={handlePreviousTab}
                    onContinue={handleNextTab}
                  />
                </TabsContent>
                
                <TabsContent value="supplemental">
                  <OrderDetailsTab
                    orderId={orderId!}
                    order={order}
                    orderDetails={orderDetails}
                    supplementalText={supplementalInfo.text}
                    radiologyGroup={radiologyGroup}
                    selectedRadiologyOrgId={selectedRadiologyOrgId}
                    selectedFacilityId={selectedFacilityId}
                    availableRadiologyOrgs={availableRadiologyOrgs}
                    availableFacilities={availableFacilities}
                    locationsLoading={locationsLoading}
                    onRadiologyGroupChange={setRadiologyGroup}
                    onRadiologyOrgSelect={handleRadiologyOrgSelect}
                    onFacilitySelect={handleFacilitySelect}
                    onOrderDetailsChange={handleOrderDetailsChange}
                    onSupplementalTextChange={handleSupplementalInfoChange}
                    onBack={handlePreviousTab}
                    onContinue={handleNextTab}
                  />
                </TabsContent>
                
                <TabsContent value="documents">
                  <DocumentsTab
                    orderId={order.id}
                    patientId={Number(order.patient_id || order.patient?.id || 0)}
                    onBack={handlePreviousTab}
                    onContinue={handleNextTab}
                  />
                </TabsContent>
                
                <TabsContent value="review">
                  <OrderReviewSummary
                    order={order}
                    orderDetails={orderDetails}
                    patientInfo={patientInfo}
                    insuranceInfo={insuranceInfo}
                    hasInsurance={hasInsurance}
                    referringPhysician={referringPhysician}
                    clinicalSummary={clinicalSummaryForReview}
                    onSendToRadiology={handleSendToRadiology}
                    onBack={handlePreviousTab}
                    isSending={isSending}
                  />
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