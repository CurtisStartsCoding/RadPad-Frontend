import { useState, useEffect, useMemo } from "react";
import { AppPage } from "@/App";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/utils";
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
  const { data: orderData, isLoading, error, refetch: refetchOrder } = useQuery({
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
  
  // Initialize order state with fetched data or empty object
  const [order, setOrder] = useState(orderData || {
    id: null,
    modality: "",
    radiologyGroup: ""
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
        radiologyGroup: radiologyGroup || orderData.radiology_organization_name || "" // Use selected or existing radiology group name
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
      
      console.log('=== INITIALIZING PATIENT INFO FROM ORDER DATA ===');
      console.log('Order data patient fields:');
      console.log('  - patient_first_name:', orderData.patient_first_name);
      console.log('  - patient_last_name:', orderData.patient_last_name);
      console.log('  - patient_gender:', orderData.patient_gender);
      console.log('  - patient_city:', orderData.patient_city);
      console.log('  - patient_state:', orderData.patient_state);
      console.log('  - patient_mrn:', orderData.patient_mrn);
      console.log('  - patient_ssn:', orderData.patient_ssn);
      
      const newPatientInfo = {
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
        mrn: orderData.patient_mrn || '',
        ssn: orderData.patient_ssn || ''
      };
      
      console.log('Setting patient info to:', newPatientInfo);
      setPatientInfo(newPatientInfo);
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
      if (orderData.priority || orderData.special_instructions || orderData.scheduling_timeframe) {
        setOrderDetails(prev => ({
          ...prev,
          priority: orderData.priority || prev.priority,
          specialInstructions: orderData.special_instructions || prev.specialInstructions,
          schedulingTimeframe: orderData.scheduling_timeframe || prev.schedulingTimeframe
        }));
      }

      // Update radiology organization and facility if available
      if (orderData.radiology_organization_id && orderData.radiology_organization_name) {
        setSelectedRadiologyOrgId(orderData.radiology_organization_id);
        setRadiologyGroup(orderData.radiology_organization_name);
      }
      
      if (orderData.target_facility_id) {
        setSelectedFacilityId(orderData.target_facility_id);
      }
      
      // Extract and populate diagnostic codes from order data
      const extractDiagnosticCodes = () => {
        let primaryIcd10 = '';
        let primaryDescription = '';
        let secondaryIcd10 = '';
        let secondaryDescription = '';
        
        // Parse ICD-10 codes - handle both JSON string and array formats
        let icd10Codes: string[] = [];
        let icd10Descriptions: string[] = [];
        
        if (orderData.final_icd10_codes && orderData.final_icd10_codes !== 'null') {
          if (typeof orderData.final_icd10_codes === 'string' && orderData.final_icd10_codes.startsWith('[')) {
            try {
              icd10Codes = JSON.parse(orderData.final_icd10_codes);
            } catch (e) {
              console.warn('Failed to parse final_icd10_codes as JSON:', e);
            }
          } else if (Array.isArray(orderData.final_icd10_codes)) {
            icd10Codes = orderData.final_icd10_codes;
          }
        }
        
        if (orderData.final_icd10_code_descriptions && orderData.final_icd10_code_descriptions !== 'null') {
          if (typeof orderData.final_icd10_code_descriptions === 'string' && orderData.final_icd10_code_descriptions.startsWith('[')) {
            try {
              icd10Descriptions = JSON.parse(orderData.final_icd10_code_descriptions);
            } catch (e) {
              console.warn('Failed to parse final_icd10_code_descriptions as JSON:', e);
            }
          } else if (Array.isArray(orderData.final_icd10_code_descriptions)) {
            icd10Descriptions = orderData.final_icd10_code_descriptions;
          }
        }
        
        // Handle multiple ICD-10 codes - show first as primary, combine rest as secondary
        if (icd10Codes.length > 0) {
          primaryIcd10 = icd10Codes[0] || '';
          primaryDescription = icd10Descriptions[0] || '';
        }
        
        // If there are additional codes, combine them in the secondary field
        if (icd10Codes.length > 1) {
          const additionalCodes = icd10Codes.slice(1);
          const additionalDescriptions = icd10Descriptions.slice(1);
          
          // Format as "Code1\nCode2\nCode3" for line breaks
          secondaryIcd10 = additionalCodes.join('\n');
          
          // Format descriptions with line breaks to match codes
          secondaryDescription = additionalDescriptions
            .filter(desc => desc && desc.trim())
            .join('\n');
        }
        
        return {
          primaryIcd10,
          primaryDescription,
          secondaryIcd10,
          secondaryDescription,
          cptCode: orderData.final_cpt_code || '',
          cptDescription: orderData.final_cpt_code_description || ''
        };
      };
      
      // Update order details with diagnostic codes and order number
      const diagnosticCodes = extractDiagnosticCodes();
      if (diagnosticCodes.primaryIcd10 || diagnosticCodes.cptCode || orderData.order_number) {
        setOrderDetails(prev => ({
          ...prev,
          orderNumber: orderData.order_number ? 
            `${orderData.order_number} (ID: ${orderData.id})` : 
            orderData.id ? `#${orderData.id}` : prev.orderNumber,
          primaryIcd10: diagnosticCodes.primaryIcd10,
          primaryDescription: diagnosticCodes.primaryDescription,
          secondaryIcd10: diagnosticCodes.secondaryIcd10,
          secondaryDescription: diagnosticCodes.secondaryDescription,
          cptCode: diagnosticCodes.cptCode,
          cptDescription: diagnosticCodes.cptDescription
        }));
      }
      // Update referring physician with real data
      // The referring physician is the one who created/signed the order
      setReferringPhysician({
        name: orderData.referring_physician_name || 'Not available',
        npi: orderData.referring_physician_npi || 'Not available',
        clinic: orderData.referring_physician_specialty || orderData.referring_organization_name || 'Not available',
        phone: orderData.referring_physician_phone || 'Not available',
        signedDate: orderData.signature_date ? formatDate(orderData.signature_date) : 
                   (orderData.created_at ? formatDate(orderData.created_at) : 'Not available')
      });
    }
  }, [orderData]);
  
  // Patient information state - initialize with empty values
  const [patientInfo, setPatientInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    email: '',
    mrn: '',
    ssn: ''
  });
  
  // Insurance information state
  const [hasInsurance, setHasInsurance] = useState(true); // Default to true, can be changed by user
  const [insuranceInfo, setInsuranceInfo] = useState({
    insurerName: '',
    planName: '',
    policyNumber: '',
    groupNumber: '',
    policyHolderName: '',
    policyHolderRelationship: 'self',
    policyHolderDateOfBirth: '',
    secondaryInsurerName: '',
    secondaryPlanName: '',
    secondaryPolicyNumber: '',
    secondaryGroupNumber: ''
  });
  
  // Supplemental information state - starts empty, can be populated via EMR paste
  const [supplementalInfo, setSupplementalInfo] = useState({
    text: ''
  });
  
  // Clinical Summary for Review Page - uses supplemental info text
  const clinicalSummaryForReview = supplementalInfo.text || 'No clinical summary provided';
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState({
    orderNumber: '',
    location: '',
    schedulingTimeframe: 'Within 14 days',
    priority: 'routine',
    primaryIcd10: '',
    primaryDescription: '',
    secondaryIcd10: '',
    secondaryDescription: '',
    cptCode: '',
    cptDescription: '',
    specialInstructions: ''
  });
  
  // Track selected radiology organization
  const [radiologyGroup, setRadiologyGroup] = useState<string>("");
  const [selectedRadiologyOrgId, setSelectedRadiologyOrgId] = useState<number | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  
  // Update order radiologyGroup when selection changes
  useEffect(() => {
    if (order && radiologyGroup) {
      setOrder((prevOrder: any) => ({
        ...prevOrder,
        radiologyGroup: radiologyGroup
      }));
    }
  }, [radiologyGroup, order]);
  
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
    name: '',
    npi: '',
    clinic: '',
    phone: '',
    signedDate: ''
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
          mrn: patientInfo.mrn,
          ssn: patientInfo.ssn
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

      // Add order details including facility and radiology organization
      updateData.orderDetails = {
        targetFacilityId: selectedFacilityId,
        priority: orderDetails.priority,
        specialInstructions: orderDetails.instructions,
        schedulingTimeframe: orderDetails.scheduling
      };

      // Add radiology organization ID at the root level
      updateData.radiologyOrganizationId = selectedRadiologyOrgId;

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
        radiologyOrganizationId: selectedRadiologyOrgId,
        radiologyOrganizationName: radiologyGroup
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
        enableDebugLogging={false}
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
                  <CardDescription>Created on {formatDate(order.created_at || order.createdAt)}</CardDescription>
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
                      console.log('=== ADMIN ORDER FINALIZATION - onParseComplete ===');
                      console.log('Received patientData:', patientData);
                      console.log('Received insuranceData:', insuranceData);
                      
                      // Update patient info with parsed data
                      if (patientData) {
                        console.log('=== UPDATING PATIENT INFO ===');
                        console.log('Previous patient info state:', patientInfo);
                        
                        const newPatientInfo = {
                          ...patientInfo,
                          // Basic demographics - backend now extracts these
                          firstName: patientData.firstName || patientInfo.firstName,
                          lastName: patientData.lastName || patientInfo.lastName,
                          dateOfBirth: patientData.dateOfBirth || patientInfo.dateOfBirth,
                          gender: patientData.gender || patientInfo.gender,
                          mrn: patientData.mrn || patientInfo.mrn,
                          ssn: patientData.ssn || patientInfo.ssn,
                          
                          // Contact information
                          addressLine1: patientData.address || patientInfo.addressLine1,
                          city: patientData.city || patientInfo.city,
                          state: patientData.state || patientInfo.state,
                          zipCode: patientData.zipCode || patientInfo.zipCode,
                          phoneNumber: patientData.phone || patientInfo.phoneNumber,
                          email: patientData.email || patientInfo.email
                        };
                        
                        console.log('New patient info to be set:', newPatientInfo);
                        console.log('Field updates:');
                        console.log('  - firstName:', patientData.firstName, '→', newPatientInfo.firstName);
                        console.log('  - lastName:', patientData.lastName, '→', newPatientInfo.lastName);
                        console.log('  - city:', patientData.city, '→', newPatientInfo.city);
                        console.log('  - state:', patientData.state, '→', newPatientInfo.state);
                        console.log('  - gender:', patientData.gender, '→', newPatientInfo.gender);
                        
                        setPatientInfo(newPatientInfo);
                      }
                      
                      // Update insurance info with parsed data
                      if (insuranceData) {
                        console.log('=== UPDATING INSURANCE INFO ===');
                        console.log('Previous insurance info state:', insuranceInfo);
                        
                        const newInsuranceInfo = {
                          ...insuranceInfo,
                          insurerName: insuranceData.insurerName || insuranceInfo.insurerName,
                          planName: insuranceData.planName || insuranceInfo.planName,
                          policyNumber: insuranceData.policyNumber || insuranceInfo.policyNumber,
                          groupNumber: insuranceData.groupNumber || insuranceInfo.groupNumber,
                          policyHolderName: insuranceData.policyHolderName || insuranceInfo.policyHolderName,
                          policyHolderRelationship: insuranceData.relationship || insuranceData.policyHolderRelationship || insuranceInfo.policyHolderRelationship,
                          policyHolderDateOfBirth: insuranceData.policyHolderDateOfBirth || insuranceInfo.policyHolderDateOfBirth,
                          secondaryInsurerName: insuranceData.secondaryInsurerName || insuranceInfo.secondaryInsurerName,
                          secondaryPlanName: insuranceData.secondaryPlanName || insuranceInfo.secondaryPlanName,
                          secondaryPolicyNumber: insuranceData.secondaryPolicyNumber || insuranceInfo.secondaryPolicyNumber,
                          secondaryGroupNumber: insuranceData.secondaryGroupNumber || insuranceInfo.secondaryGroupNumber
                        };
                        
                        console.log('New insurance info to be set:', newInsuranceInfo);
                        
                        setInsuranceInfo(newInsuranceInfo);
                        
                        if (insuranceData.insurerName) {
                          console.log('Setting hasInsurance to true');
                          setHasInsurance(true);
                        }
                      } else {
                        console.log('No insurance data received');
                      }
                      
                      console.log('=== onParseComplete END ===');
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
                    documents={orderData?.documents || order.documents}
                    onDocumentUploaded={() => {
                      // Refetch order data to get updated documents list
                      refetchOrder();
                    }}
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