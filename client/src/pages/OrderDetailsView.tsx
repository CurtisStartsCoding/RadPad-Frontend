import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Building2, 
  Stethoscope,
  Clock,
  Shield,
  Phone,
  Mail,
  MapPin,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatDateLong, formatDateTime } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/lib/useAuth";
import { UserRole, canViewOrderDetails, canViewPatientHistory } from "@/lib/roles";

interface OrderDetails {
  id: number;
  order_number: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  signature_date?: string;
  scheduled_date?: string;
  
  // Patient Information
  patient_first_name: string;
  patient_last_name: string;
  patient_dob: string;
  patient_gender: string;
  patient_mrn?: string;
  patient_phone_number?: string;
  patient_email?: string;
  
  // Order Details
  modality?: string;
  body_part?: string;
  laterality?: string;
  clinical_indication?: string;
  original_dictation?: string;
  final_cpt_code?: string;
  final_cpt_code_description?: string;
  final_icd10_codes?: string;
  final_icd10_code_descriptions?: string;
  is_contrast_indicated?: boolean;
  patient_pregnant?: string;
  authorization_number?: string;
  authorization_status?: string;
  special_instructions?: string;
  prep_instructions?: string;
  
  // Referring Information
  referring_physician_name?: string;
  referring_physician_npi?: string;
  referring_physician_phone?: string;
  referring_physician_email?: string;
  referring_organization_name?: string;
  referring_organization_phone?: string;
  referring_organization_address?: string;
  
  // Radiology Information  
  radiology_organization_name?: string;
  radiology_organization_phone?: string;
  radiology_organization_address?: string;
  
  // Insurance Information
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_authorization_number?: string;
  insurance_authorization_date?: string;
  
  // Validation Information
  final_validation_status?: string;
  final_compliance_score?: number;
  final_validation_notes?: string;
  validated_at?: string;
  overridden?: boolean;
  override_justification?: string;
  
  // Results (if available)
  final_report_text?: string;
  results_acknowledged_at?: string;
}

const OrderDetailsView = () => {
  const [, params] = useRoute("/orders/:orderId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const orderId = params?.orderId;
  
  const userRole = (user?.role as UserRole) || UserRole.Physician;
  
  // Check if user has permission to view order details
  if (!canViewOrderDetails(userRole)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to view order details.
          </p>
          <Button onClick={() => setLocation('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const { data: order, isLoading, error } = useQuery<OrderDetails>({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Order ID is required');
      const response = await apiRequest('GET', `/api/orders/${orderId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!orderId
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_admin':
        return <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Pending Admin</Badge>;
      case 'pending_validation':
        return <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Pending Validation</Badge>;
      case 'pending_radiology':
        return <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">Pending Radiology</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">Cancelled</Badge>;
      case 'results_available':
        return <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700">Results Available</Badge>;
      case 'results_acknowledged':
        return <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">Results Acknowledged</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">{status.replace('_', ' ')}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'stat':
        return <Badge variant="destructive">STAT</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">Urgent</Badge>;
      case 'routine':
        return <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">Routine</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getValidationStatusIcon = (status?: string, overridden?: boolean) => {
    if (overridden) {
      return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
    switch (status) {
      case 'appropriate':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'inappropriate':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleBackClick = () => {
    setLocation('/orders');
  };

  const handlePrintOrder = () => {
    window.print();
  };

  const handleDownloadOrder = () => {
    // TODO: Implement PDF download functionality
    console.log('Download order:', orderId);
  };

  const handleViewPatientHistory = () => {
    if (order?.patient_mrn) {
      setLocation(`/patients/${order.patient_mrn}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-600 mb-4">
            The order you're looking for could not be found or you don't have permission to view it.
          </p>
          <Button onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={`Order #${order.order_number || order.id}`}
        description={`${order.modality || 'Imaging'} order for ${order.patient_first_name} ${order.patient_last_name}`}
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <Button variant="outline" onClick={handlePrintOrder}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadOrder}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {order.patient_mrn && canViewPatientHistory(userRole) && (
            <Button variant="outline" onClick={handleViewPatientHistory}>
              <Eye className="h-4 w-4 mr-2" />
              Patient History
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Card */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Order Status</span>
                    {getStatusBadge(order.status)}
                  </CardTitle>
                  <CardDescription>
                    Created on {formatDateLong(order.created_at)}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  {getPriorityBadge(order.priority)}
                  {getValidationStatusIcon(order.final_validation_status, order.overridden)}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="order-details" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="order-details">Order Details</TabsTrigger>
              <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="order-details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="h-5 w-5 mr-2" />
                    Clinical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Modality</label>
                      <p className="text-sm">{order.modality || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Body Part</label>
                      <p className="text-sm">{order.body_part || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Laterality</label>
                      <p className="text-sm">{order.laterality || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contrast</label>
                      <p className="text-sm">{order.is_contrast_indicated ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Clinical Indication</label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{order.clinical_indication || 'Not provided'}</p>
                  </div>

                  {order.final_validation_notes && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-gray-500">Validation Notes</label>
                        {order.final_compliance_score !== null && order.final_compliance_score !== undefined && (
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs">
                            Score: {order.final_compliance_score}/9
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm p-3 bg-blue-50 rounded">{order.final_validation_notes}</p>
                    </div>
                  )}

                  {order.override_justification && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-medium text-gray-500">Override Justification</label>
                        <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs">
                          Overridden
                        </Badge>
                      </div>
                      <p className="text-sm p-3 bg-orange-50 rounded">{order.override_justification}</p>
                    </div>
                  )}

                  {(order.special_instructions || order.prep_instructions) && (
                    <>
                      <Separator />
                      {order.special_instructions && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Special Instructions</label>
                          <p className="text-sm mt-1 p-3 bg-yellow-50 rounded">{order.special_instructions}</p>
                        </div>
                      )}
                      {order.prep_instructions && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Prep Instructions</label>
                          <p className="text-sm mt-1 p-3 bg-blue-50 rounded">{order.prep_instructions}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Coding Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">CPT Code</label>
                      <div className="mt-2 bg-gray-50 p-4 rounded-md">
                        {order.final_cpt_code ? (
                          <div className="text-sm">
                            <span className="font-mono text-primary font-bold">{order.final_cpt_code}</span>
                            {order.final_cpt_code_description && order.final_cpt_code_description !== 'null' && (
                              <span className="text-gray-700 block mt-1">{order.final_cpt_code_description}</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No procedure code assigned.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">ICD-10 Codes</label>
                      <div className="mt-2 bg-gray-50 p-4 rounded-md">
                        {(() => {
                          try {
                            // Parse ICD-10 codes
                            let codes: string[] = [];
                            if (order.final_icd10_codes && order.final_icd10_codes !== 'null') {
                              if (typeof order.final_icd10_codes === 'string' && order.final_icd10_codes.startsWith('[')) {
                                codes = JSON.parse(order.final_icd10_codes);
                              } else if (Array.isArray(order.final_icd10_codes)) {
                                codes = order.final_icd10_codes;
                              }
                            }
                            
                            // Parse descriptions
                            let descriptions: string[] = [];
                            if (order.final_icd10_code_descriptions && order.final_icd10_code_descriptions !== 'null') {
                              if (typeof order.final_icd10_code_descriptions === 'string' && order.final_icd10_code_descriptions.startsWith('[')) {
                                descriptions = JSON.parse(order.final_icd10_code_descriptions);
                              } else if (Array.isArray(order.final_icd10_code_descriptions)) {
                                descriptions = order.final_icd10_code_descriptions;
                              }
                            }
                            
                            if (codes.length > 0) {
                              return (
                                <ul className="space-y-2">
                                  {codes.map((code, index) => (
                                    <li key={index} className="text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-primary font-bold">{code}</span>
                                        {index === 0 && (
                                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 text-xs">
                                            Primary
                                          </Badge>
                                        )}
                                      </div>
                                      {descriptions[index] && (
                                        <span className="text-gray-700 block">{descriptions[index]}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              );
                            } else {
                              return <p className="text-sm text-gray-500">No diagnosis codes assigned.</p>;
                            }
                          } catch (error) {
                            console.error('Error parsing ICD-10 codes:', error);
                            return <p className="text-sm text-gray-500">Error displaying diagnosis codes.</p>;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patient-info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Patient Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm font-medium">{order.patient_first_name} {order.patient_last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-sm">{formatDate(order.patient_dob)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-sm">{order.patient_gender}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">MRN</label>
                      <p className="text-sm font-mono">{order.patient_mrn || 'Not assigned'}</p>
                    </div>
                  </div>
                  
                  {(order.patient_phone_number || order.patient_email) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        {order.patient_phone_number && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Phone</label>
                            <p className="text-sm">{order.patient_phone_number}</p>
                          </div>
                        )}
                        {order.patient_email && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-sm">{order.patient_email}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {order.patient_pregnant && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pregnancy Status</label>
                        <p className="text-sm">{order.patient_pregnant}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {order.insurance_provider && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Insurance Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Provider</label>
                        <p className="text-sm">{order.insurance_provider}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Policy Number</label>
                        <p className="text-sm font-mono">{order.insurance_policy_number || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    {(order.authorization_number || order.insurance_authorization_number) && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Authorization #</label>
                            <p className="text-sm font-mono">{order.authorization_number || order.insurance_authorization_number}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Auth Status</label>
                            <p className="text-sm">{order.authorization_status || 'Pending'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Results & Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.final_report_text ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Final Report</label>
                      <div className="mt-2 p-4 bg-gray-50 rounded border">
                        <pre className="text-sm whitespace-pre-wrap">{order.final_report_text}</pre>
                      </div>
                      {order.results_acknowledged_at && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Results acknowledged on {formatDateLong(order.results_acknowledged_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No results available yet</p>
                      <p className="text-sm">Results will appear here once the exam is completed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Referring Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Physician</label>
                <p className="text-sm font-medium">{order.referring_physician_name || 'Not specified'}</p>
                {order.referring_physician_npi && (
                  <p className="text-xs text-gray-500">NPI: {order.referring_physician_npi}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Organization</label>
                <p className="text-sm">{order.referring_organization_name || 'Not specified'}</p>
              </div>

              {(order.referring_physician_phone || order.referring_physician_email) && (
                <Separator />
              )}

              {order.referring_physician_phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{order.referring_physician_phone}</span>
                </div>
              )}

              {order.referring_physician_email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{order.referring_physician_email}</span>
                </div>
              )}

              {order.referring_organization_address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{order.referring_organization_address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {order.radiology_organization_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Radiology Facility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Facility</label>
                  <p className="text-sm font-medium">{order.radiology_organization_name}</p>
                </div>

                {order.radiology_organization_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{order.radiology_organization_phone}</span>
                  </div>
                )}

                {order.radiology_organization_address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="text-sm">{order.radiology_organization_address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{formatDateTime(order.created_at)}</p>
              </div>

              {order.signature_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Signed</label>
                  <p className="text-sm">{formatDateTime(order.signature_date)}</p>
                </div>
              )}

              {order.scheduled_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Scheduled</label>
                  <p className="text-sm">{formatDateTime(order.scheduled_date)}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{formatDateTime(order.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsView;