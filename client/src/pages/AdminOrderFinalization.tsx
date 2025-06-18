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
import { InfoIcon, FileText, ArrowLeft, CheckCircle, Printer, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { allOrders } from "@/lib/mock-data";
import DocumentManager from "@/components/upload/DocumentManager";
import PageHeader from "@/components/layout/PageHeader";

interface AdminOrderFinalizationProps {
  navigateTo?: (page: AppPage) => void;
}

const AdminOrderFinalization: React.FC<AdminOrderFinalizationProps> = ({ navigateTo }) => {
  console.log('\n🎯 AdminOrderFinalization component loaded at', new Date().toLocaleTimeString());
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("patient");
  const [isSending, setIsSending] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user info from query cache or storage
  const userFromCache = queryClient.getQueryData(['user']);
  const userFromStorage = localStorage.getItem('rad_order_pad_user_data');
  
  // Also check all localStorage keys to debug
  console.log('🔵 All localStorage keys:', Object.keys(localStorage).filter(k => k.includes('rad_order_pad')));
  
  // Try to get user from auth context or session
  const sessionData = queryClient.getQueryData(['session']) as any;
  const currentUser = userFromCache || (userFromStorage ? JSON.parse(userFromStorage) : null) || sessionData?.user;
  
  console.log('🔵 USER DATA SOURCES:');
  console.log('  - From cache:', userFromCache);
  console.log('  - From localStorage:', userFromStorage);
  console.log('  - From session:', sessionData);
  console.log('  - Final currentUser:', currentUser);
  
  console.log('🔵 CURRENT USER DEBUG:', {
    userId: currentUser?.id,
    userName: `${currentUser?.firstName || currentUser?.first_name} ${currentUser?.lastName || currentUser?.last_name}`,
    role: currentUser?.role,
    organizationId: currentUser?.organizationId || currentUser?.organization_id,
    email: currentUser?.email
  });
  
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
      console.log('🔴 FULL ORDER DATA:', result);
      console.log('🔴 ALL FIELDS:', Object.keys(result).sort());
      
      // Look for any field containing 'physician', 'doctor', 'user', 'created'
      const physicianFields = Object.keys(result).filter(key => 
        key.toLowerCase().includes('physician') || 
        key.toLowerCase().includes('doctor') || 
        key.toLowerCase().includes('user') || 
        key.toLowerCase().includes('created') ||
        key.toLowerCase().includes('referring')
      );
      console.log('🔴 PHYSICIAN-RELATED FIELDS:', physicianFields);
      physicianFields.forEach(field => {
        console.log(`  ${field}:`, result[field]);
      });
      
      // Look for study/procedure fields
      const studyFields = Object.keys(result).filter(key => 
        key.toLowerCase().includes('study') || 
        key.toLowerCase().includes('modality') || 
        key.toLowerCase().includes('procedure') ||
        key.toLowerCase().includes('cpt')
      );
      console.log('🔴 STUDY-RELATED FIELDS:', studyFields);
      studyFields.forEach(field => {
        console.log(`  ${field}:`, result[field]);
      });
      // TODO: Backend needs to return patient/insurance data with order
      return result.data || result; // Handle both {data: order} and direct order response
    },
    enabled: !!orderId,
    staleTime: 0, // Always fetch fresh data when returning to order
  });
  
  // Fetch connections - Stage 1: Just test if admin_staff can access this
  const { data: connectionsData, isLoading: connectionsLoading, error: connectionsError } = useQuery({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      console.log('🔧 Fetching connections for admin_staff...');
      const response = await apiRequest('GET', '/api/connections', undefined);
      console.log('🔧 Connections response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch connections:', response.status);
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      console.log('✅ Connections data received:', data);
      
      // Handle both response formats: {connections: [...]} and direct array
      if (Array.isArray(data)) {
        return { connections: data };
      }
      return data;
    },
    enabled: !!orderId,
    retry: 1
  });
  
  // Debug logging for connections state
  console.log('🔧 Connections state:', {
    loading: connectionsLoading,
    error: connectionsError,
    data: connectionsData
  });
  
  // COMPREHENSIVE DEBUG SECTION
  useEffect(() => {
    console.log('\n========== ADMIN ORDER FINALIZATION DEBUG ==========');
    console.log('📍 CURRENT USER:', {
      id: currentUser?.id,
      name: `${currentUser?.firstName || currentUser?.first_name} ${currentUser?.lastName || currentUser?.last_name}`,
      role: currentUser?.role,
      organizationId: currentUser?.organizationId || currentUser?.organization_id,
      organizationName: currentUser?.organizationName || 'Not available'
    });
    
    if (connectionsData?.connections) {
      console.log('\n🔗 CONNECTIONS SUMMARY:');
      console.log(`Total connections: ${connectionsData.connections.length}`);
      console.log(`Active connections: ${connectionsData.connections.filter((c: any) => c.status === 'active').length}`);
      console.log(`Pending connections: ${connectionsData.connections.filter((c: any) => c.status === 'pending').length}`);
      
      console.log('\n🔗 CONNECTION DETAILS:');
      connectionsData.connections.forEach((conn: any, index: number) => {
        console.log(`\nConnection ${index + 1}:`);
        console.log(`  - Partner: ${conn.partnerOrgName} (ID: ${conn.partnerOrgId})`);
        console.log(`  - Status: ${conn.status}`);
        console.log(`  - Direction: ${conn.isInitiator ? 'Outgoing' : 'Incoming'}`);
        console.log(`  - Created: ${new Date(conn.createdAt).toLocaleDateString()}`);
      });
    } else if (connectionsLoading) {
      console.log('\n⏳ CONNECTIONS: Loading...');
    } else if (connectionsError) {
      console.log('\n❌ CONNECTIONS ERROR:', connectionsError);
    } else {
      console.log('\n❓ CONNECTIONS: No data yet');
    }
    
    console.log('\n🎯 CURRENT ORDER:', {
      orderId: orderId,
      orderNumber: orderData?.order_number,
      status: orderData?.status
    });
    
    console.log('========== END DEBUG ==========\n');
  }, [currentUser, connectionsData, connectionsLoading, connectionsError, orderId, orderData]);
  
  // Stage 2: Let's see what's inside the connections
  if (connectionsData?.connections) {
    console.log('🔧 Raw connections array:', connectionsData.connections);
    console.log('🔧 First connection structure:', connectionsData.connections[0]);
    
    // Stage 3: Filter for active connections only
    const activeConnections = connectionsData.connections.filter((conn: any) => conn.status === 'active');
    console.log('🔧 Active connections only:', activeConnections);
    console.log('🔧 Number of active connections:', activeConnections.length);
    
    // Stage 4: Show the active connection details
    if (activeConnections.length > 0) {
      console.log('🔧 Active connection details:', activeConnections[0]);
      console.log('🔧 Partner Org ID:', activeConnections[0].partnerOrgId);
      console.log('🔧 Partner Org Name:', activeConnections[0].partnerOrgName);
    }
  }
  
  // Initialize order state with fetched data or mock data
  const [order, setOrder] = useState(orderData || {
    ...allOrders[0], 
    modality: "MOCK-MRI Knee (Test)",
    radiologyGroup: "" // Add this field for the dropdown
  });
  
  // Stage 5: Use real connections data instead of hardcoded
  const availableRadiologyOrgs = useMemo(() => {
    console.log('📊 Computing availableRadiologyOrgs...');
    console.log('📊 connectionsData:', connectionsData);
    console.log('📊 connectionsData?.connections:', connectionsData?.connections);
    
    // Handle the case where connectionsData might be the array directly
    const connections = connectionsData?.connections || (Array.isArray(connectionsData) ? connectionsData : null);
    
    if (!connections || connections.length === 0) {
      console.log('📊 No connections data, returning empty array');
      return [];
    }
    
    // Filter active connections and map to expected format
    const activeConnections = connections
      .filter((conn: any) => {
        console.log(`📊 Checking connection: ${conn.partnerOrgName} - Status: ${conn.status}`);
        return conn.status === 'active';
      })
      .map((conn: any) => ({
        id: conn.partnerOrgId,
        name: conn.partnerOrgName
      }));
    
    console.log('🔧 Available radiology orgs for dropdown:', activeConnections);
    console.log('🔧 Number of orgs available:', activeConnections.length);
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
  
  // Function to update radiology group
  const setRadiologyGroup = (group: string) => {
    setOrder({
      ...order,
      radiologyGroup: group
    });
    // Find and set the org ID
    const selectedOrg = availableRadiologyOrgs.find((org: any) => org.name === group);
    if (selectedOrg) {
      setSelectedRadiologyOrgId(selectedOrg.id);
      // Reset facility selection when changing radiology org
      setSelectedFacilityId(null);
      setOrderDetails(prev => ({
        ...prev,
        location: ''
      }));
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
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  
  // Fetch locations for selected radiology organization
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['/api/organizations', selectedRadiologyOrgId, 'locations'],
    queryFn: async () => {
      if (!selectedRadiologyOrgId) return null;
      
      console.log('🏢 Fetching locations for radiology org:', selectedRadiologyOrgId);
      const response = await apiRequest('GET', `/api/organizations/${selectedRadiologyOrgId}/locations`, undefined);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch locations:', response.status);
        throw new Error('Failed to fetch locations');
      }
      
      const data = await response.json();
      console.log('✅ Locations data received:', data);
      return data;
    },
    enabled: !!selectedRadiologyOrgId,
    retry: 1
  });
  
  // Get available locations from the selected radiology organization
  const availableFacilities = useMemo(() => {
    console.log('🏢 Computing availableFacilities...');
    console.log('🏢 locationsData:', locationsData);
    
    // Handle different API response formats
    const locations = locationsData?.locations || locationsData?.data || locationsData;
    
    if (!locations || !Array.isArray(locations)) {
      console.log('🏢 No locations array found');
      return [];
    }
    
    console.log('🏢 Raw locations array:', locations);
    
    const activeLocations = locations
      .filter((loc: any) => {
        // Handle different field names (is_active vs isActive)
        const isActive = loc.is_active !== undefined ? loc.is_active : loc.isActive !== false;
        console.log(`🏢 Location ${loc.name || loc.address_line1}: active=${isActive}`);
        return isActive;
      })
      .map((loc: any) => ({
        id: loc.id,
        name: loc.name || `${loc.address_line1}, ${loc.city}`,
        fullAddress: `${loc.address_line1}${loc.address_line2 ? ', ' + loc.address_line2 : ''}, ${loc.city}, ${loc.state} ${loc.zip_code}`
      }));
    
    console.log('🏢 Available facilities for dropdown:', activeLocations);
    console.log('🏢 Number of facilities:', activeLocations.length);
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
      
      {/* DEBUG INFO BOX - Remove this in production */}
      <Card className="mb-4 bg-blue-50 border-blue-200">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">🔍 Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="py-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <strong>Current User:</strong>
              <ul className="ml-4 mt-1">
                <li>Name: {currentUser?.firstName || currentUser?.first_name} {currentUser?.lastName || currentUser?.last_name}</li>
                <li>Role: {currentUser?.role}</li>
                <li>Org ID: {currentUser?.organizationId || currentUser?.organization_id}</li>
                <li>Email: {currentUser?.email}</li>
              </ul>
            </div>
            <div>
              <strong>Connections:</strong>
              {connectionsLoading ? (
                <p className="ml-4 mt-1">Loading...</p>
              ) : connectionsError ? (
                <p className="ml-4 mt-1 text-red-600">Error loading connections</p>
              ) : connectionsData?.connections ? (
                <ul className="ml-4 mt-1">
                  <li>Total: {connectionsData.connections.length}</li>
                  <li>Active: {connectionsData.connections.filter((c: any) => c.status === 'active').length}</li>
                  <li>Pending: {connectionsData.connections.filter((c: any) => c.status === 'pending').length}</li>
                  {connectionsData.connections
                    .filter((c: any) => c.status === 'active')
                    .slice(0, 3)
                    .map((c: any, i: number) => (
                      <li key={i} className="mt-1">
                        → {c.partnerOrgName} (ID: {c.partnerOrgId})
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="ml-4 mt-1">No connections data</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
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
                            value={order.radiologyGroup || ""} 
                            onValueChange={(value) => {
                              console.log('🎯 Selected radiology group:', value);
                              setRadiologyGroup(value);
                            }}
                          >
                            <SelectTrigger id="radiologyGroup">
                              <SelectValue placeholder="Select radiology group" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRadiologyOrgs.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  No active connections available
                                </div>
                              ) : (
                                availableRadiologyOrgs.map((org: any) => (
                                  <SelectItem key={org.id} value={org.name}>
                                    {org.name} (ID: {org.id})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="location">Facility Location</Label>
                          {!selectedRadiologyOrgId ? (
                            <div className="text-sm text-muted-foreground mt-2">
                              Please select a radiology group first
                            </div>
                          ) : locationsLoading ? (
                            <div className="text-sm text-muted-foreground mt-2">
                              Loading facilities...
                            </div>
                          ) : availableFacilities.length === 0 ? (
                            <div className="text-sm text-muted-foreground mt-2">
                              No facilities available for this organization
                            </div>
                          ) : (
                            <Select 
                              value={selectedFacilityId?.toString() || ""} 
                              onValueChange={(value) => {
                                const facilityId = parseInt(value);
                                setSelectedFacilityId(facilityId);
                                const facility = availableFacilities.find((f: any) => f.id === facilityId);
                                if (facility) {
                                  setOrderDetails({
                                    ...orderDetails,
                                    location: facility.name
                                  });
                                }
                              }}
                            >
                              <SelectTrigger id="location">
                                <SelectValue placeholder="Select facility location" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFacilities.map((facility: any) => (
                                  <SelectItem key={facility.id} value={facility.id.toString()}>
                                    {facility.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
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
                                targetFacilityId: selectedFacilityId || null, // Use selected radiology organization
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
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Review Order Information</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please review all information carefully before sending this order to {order.radiologyGroup}.
                      </p>
                      
                      {/* Compact print-friendly layout */}
                      <div className="space-y-3">
                        {/* Order Summary - All in one compact card */}
                        <Card className="print:break-inside-avoid">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Imaging Order Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Order Details Row */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground">Order #: </span>
                                  <span className="font-medium">{orderDetails.orderNumber}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Study: </span>
                                  <span className="font-medium">{order.modality}</span>
                                  {order.modality === 'Not specified' && (
                                    <span className="text-xs text-amber-600 ml-2">(Backend: modality field missing)</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Radiology Group: </span>
                                  <span className="font-medium">{order.radiologyGroup || 'Not selected'}</span>
                                  {orderDetails.location && (
                                    <>
                                      <br />
                                      <span className="text-muted-foreground">Facility: </span>
                                      <span className="font-medium">{orderDetails.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground">Priority: </span>
                                  <Badge variant={orderDetails.priority === 'stat' ? 'destructive' : orderDetails.priority === 'urgent' ? 'default' : 'secondary'} className="ml-1">
                                    {orderDetails.priority === 'stat' ? 'STAT' : orderDetails.priority.charAt(0).toUpperCase() + orderDetails.priority.slice(1)}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Scheduling: </span>
                                  <span className="font-medium">{orderDetails.scheduling}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Clinical Information & Diagnosis - Combined */}
                        <Card className="print:break-inside-avoid">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Clinical Information & Diagnosis</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Clinical Summary */}
                            <div className="bg-muted p-3 rounded text-sm">
                              {clinicalSummaryForReview}
                            </div>
                            
                            {/* Diagnosis Codes - Inline format */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground min-w-[100px]">Primary ICD-10:</span>
                                <Badge variant="secondary" className="mr-2">{orderDetails.primaryIcd10}</Badge>
                                <span>{orderDetails.primaryDescription}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground min-w-[100px]">Secondary ICD-10:</span>
                                <Badge variant="outline" className="mr-2">{orderDetails.secondaryIcd10}</Badge>
                                <span>{orderDetails.secondaryDescription}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground min-w-[100px]">CPT Code:</span>
                                <Badge variant="outline" className="mr-2">{orderDetails.cptCode}</Badge>
                                <span>{orderDetails.cptDescription}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Patient & Physician Info - Side by side */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Patient Information */}
                          <Card className="print:break-inside-avoid">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Patient Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Name: </span>
                                <span className="font-medium">{patientInfo.firstName} {patientInfo.lastName}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">DOB: </span>
                                <span className="font-medium">{patientInfo.dateOfBirth}</span>
                                <span className="text-muted-foreground ml-3">Gender: </span>
                                <span className="font-medium">{patientInfo.gender.charAt(0).toUpperCase() + patientInfo.gender.slice(1)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">MRN: </span>
                                <span className="font-medium">{patientInfo.mrn}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone: </span>
                                <span className="font-medium">{patientInfo.phoneNumber}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Email: </span>
                                <span className="font-medium">{patientInfo.email || 'Not provided'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Address: </span>
                                <span className="font-medium">
                                  {patientInfo.addressLine1}
                                  {patientInfo.addressLine2 && `, ${patientInfo.addressLine2}`}, 
                                  {' '}{patientInfo.city}, {patientInfo.state} {patientInfo.zipCode}
                                </span>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Referring Physician */}
                          <Card className="print:break-inside-avoid">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Referring Physician</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              {/* Backend Update Notice */}
                              {(referringPhysician.name === 'Not available' || referringPhysician.npi === 'Not available') && (
                                <Alert className="mb-3 border-amber-200 bg-amber-50">
                                  <AlertCircle className="h-4 w-4 text-amber-600" />
                                  <AlertDescription className="text-xs text-amber-800">
                                    <strong>Backend Update Needed:</strong> API should populate referring_physician_name and referring_physician_npi fields from the physician who created/signed the order.
                                  </AlertDescription>
                                </Alert>
                              )}
                              <div>
                                <span className="text-muted-foreground">Name: </span>
                                <span className="font-medium">{referringPhysician.name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">NPI: </span>
                                <span className="font-medium">{referringPhysician.npi}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Clinic: </span>
                                <span className="font-medium">{referringPhysician.clinic}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Phone: </span>
                                <span className="font-medium">{referringPhysician.phone}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Signed: </span>
                                <span className="font-medium">{referringPhysician.signedDate}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        {/* Insurance Information - Full details */}
                        <Card className="print:break-inside-avoid">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Insurance Information</CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm">
                            {!hasInsurance ? (
                              <p className="text-muted-foreground">Patient is uninsured/cash-pay</p>
                            ) : (
                              <div className="space-y-3">
                                {/* Primary Insurance */}
                                <div>
                                  <p className="font-medium text-muted-foreground mb-1">Primary Insurance</p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3">
                                    <div>
                                      <span className="text-muted-foreground">Company: </span>
                                      <span className="font-medium">{insuranceInfo.insurerName}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Plan: </span>
                                      <span className="font-medium">{insuranceInfo.planName}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Policy #: </span>
                                      <span className="font-medium">{insuranceInfo.policyNumber}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Group #: </span>
                                      <span className="font-medium">{insuranceInfo.groupNumber || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Policy Holder: </span>
                                      <span className="font-medium">{insuranceInfo.policyHolderName}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Relationship: </span>
                                      <span className="font-medium">{insuranceInfo.policyHolderRelationship}</span>
                                    </div>
                                    {insuranceInfo.policyHolderRelationship !== 'self' && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">Policy Holder DOB: </span>
                                        <span className="font-medium">{insuranceInfo.policyHolderDateOfBirth}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Secondary Insurance if present */}
                                {insuranceInfo.secondaryInsurerName && (
                                  <div>
                                    <p className="font-medium text-muted-foreground mb-1">Secondary Insurance</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3">
                                      <div>
                                        <span className="text-muted-foreground">Company: </span>
                                        <span className="font-medium">{insuranceInfo.secondaryInsurerName}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Plan: </span>
                                        <span className="font-medium">{insuranceInfo.secondaryPlanName || 'N/A'}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Policy #: </span>
                                        <span className="font-medium">{insuranceInfo.secondaryPolicyNumber}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Group #: </span>
                                        <span className="font-medium">{insuranceInfo.secondaryGroupNumber || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Special Instructions - Only if present */}
                        {orderDetails.instructions && (
                          <Card className="print:break-inside-avoid">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Special Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm whitespace-pre-wrap">{orderDetails.instructions}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Credit Usage Alert - Hide on print */}
                        <Alert className="print:hidden">
                          <InfoIcon className="h-4 w-4" />
                          <AlertDescription>
                            Sending this order will use 1 credit from your organization's balance.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button variant="outline" onClick={handlePreviousTab}>
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => window.print()}
                        className="print:hidden"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Order
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