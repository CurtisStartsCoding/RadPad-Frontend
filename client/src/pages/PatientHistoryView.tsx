import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  Building2, 
  Phone,
  Mail,
  MapPin,
  Eye,
  Download,
  Printer,
  Clock,
  AlertCircle,
  Loader2,
  Heart,
  Activity
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatDateLong } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/lib/useAuth";
import { UserRole, canViewPatientHistory } from "@/lib/roles";

interface PatientInfo {
  id: number;
  pidn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mrn?: string;
  phoneNumber?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  lastVisit?: string;
}

interface PatientOrder {
  id: number;
  order_number?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  signature_date?: string;
  scheduled_date?: string;
  modality?: string;
  body_part?: string;
  clinical_indication?: string;
  radiology_organization_name?: string;
  referring_physician_name?: string;
  final_validation_status?: string;
  final_report_text?: string;
  results_acknowledged_at?: string;
  // Patient fields cached in orders
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  patient_gender?: string;
  patient_mrn?: string;
  patient_phone_number?: string;
  patient_email?: string;
}

interface OrdersApiResponse {
  orders: PatientOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const PatientHistoryView = () => {
  const [, params] = useRoute("/patients/:patientMrn");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const patientMrn = params?.patientMrn;
  
  const userRole = (user?.role as UserRole) || UserRole.Physician;
  
  // Check if user has permission to view patient history
  if (!canViewPatientHistory(userRole)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to view patient history.
          </p>
          <Button onClick={() => setLocation('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  // Fetch all orders and filter by patient MRN
  // Note: This is a workaround since there's no specific patient history API
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery<OrdersApiResponse>({
    queryKey: ['patient-orders', patientMrn],
    queryFn: async () => {
      if (!patientMrn) throw new Error('Patient MRN is required');
      const response = await apiRequest('GET', '/api/orders?limit=100', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!patientMrn
  });

  // Filter orders for this specific patient
  const patientOrders = ordersData?.orders?.filter(order => 
    order.patient_mrn === patientMrn
  ) || [];

  // Extract patient info from the most recent order
  const patientInfo: PatientInfo | null = patientOrders.length > 0 ? {
    id: 0, // Not available from orders endpoint
    pidn: '', // Not available from orders endpoint
    firstName: patientOrders[0].patient_first_name || '',
    lastName: patientOrders[0].patient_last_name || '',
    dateOfBirth: patientOrders[0].patient_dob || '',
    gender: patientOrders[0].patient_gender || '',
    mrn: patientMrn,
    phoneNumber: patientOrders[0].patient_phone_number,
    email: patientOrders[0].patient_email,
    lastVisit: patientOrders[0].created_at
  } : null;

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

  const handleBackClick = () => {
    setLocation('/orders');
  };

  const handleViewOrder = (orderId: number) => {
    setLocation(`/orders/${orderId}`);
  };

  const handleDownloadOrder = (orderId: number) => {
    // TODO: Implement PDF download functionality
    console.log('Download order:', orderId);
  };

  const handlePrintOrder = (orderId: number) => {
    // TODO: Implement print functionality
    console.log('Print order:', orderId);
  };

  // Calculate some basic statistics
  const totalOrders = patientOrders.length;
  const completedOrders = patientOrders.filter(order => order.status === 'completed').length;
  const pendingOrders = patientOrders.filter(order => 
    ['pending_admin', 'pending_validation', 'pending_radiology'].includes(order.status)
  ).length;
  const recentOrders = patientOrders.filter(order => {
    const orderDate = new Date(order.created_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return orderDate > sixMonthsAgo;
  }).length;

  if (ordersLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading patient history...</span>
      </div>
    );
  }

  if (ordersError || !patientInfo) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Not Found</h3>
          <p className="text-gray-600 mb-4">
            No patient found with MRN "{patientMrn}" or you don't have permission to view this patient's information.
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
        title={`${patientInfo.firstName} ${patientInfo.lastName}`}
        description={`Patient History - MRN: ${patientInfo.mrn}`}
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Patient Summary Stats */}
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedOrders}</div>
                <p className="text-xs text-muted-foreground">Finished studies</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOrders}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent (6mo)</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentOrders}</div>
                <p className="text-xs text-muted-foreground">Last 6 months</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="summary">Medical Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Order History ({totalOrders} orders)
                  </CardTitle>
                  <CardDescription>
                    Complete order history for this patient
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {patientOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No orders found for this patient</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Study</TableHead>
                          <TableHead>Indication</TableHead>
                          <TableHead>Facility</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patientOrders
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                                {formatDate(order.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.modality || 'Not specified'}</p>
                                <p className="text-sm text-gray-500">{order.body_part || 'N/A'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm truncate" title={order.clinical_indication}>
                                  {order.clinical_indication || 'Not provided'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{order.radiology_organization_name || 'Not assigned'}</p>
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                            <TableCell>
                              <div className="flex justify-end space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 px-2"
                                  onClick={() => handleViewOrder(order.id)}
                                  title="View Order Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {(order.status === 'completed' || order.status === 'results_available') && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-2"
                                      onClick={() => handleDownloadOrder(order.id)}
                                      title="Download Order"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-2"
                                      onClick={() => handlePrintOrder(order.id)}
                                      title="Print Order"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Medical Summary
                  </CardTitle>
                  <CardDescription>
                    Summary of imaging studies and findings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedOrders === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No completed studies available</p>
                      <p className="text-sm">Medical summary will appear when studies are completed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Most Recent Study</label>
                          <p className="text-sm">
                            {patientOrders
                              .filter(order => order.status === 'completed')
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                              ?.modality || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Last Visit</label>
                          <p className="text-sm">
                            {patientInfo.lastVisit ? formatDateLong(patientInfo.lastVisit) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Study Types</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Array.from(new Set(patientOrders
                            .filter(order => order.modality)
                            .map(order => order.modality)))
                            .map(modality => (
                              <Badge key={modality} variant="secondary">
                                {modality}
                              </Badge>
                            ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Common Indications</label>
                        <div className="space-y-2 mt-2">
                          {Array.from(new Set(patientOrders
                            .filter(order => order.clinical_indication)
                            .map(order => order.clinical_indication)))
                            .slice(0, 3)
                            .map((indication, index) => (
                              <p key={index} className="text-sm p-2 bg-gray-50 rounded">
                                {indication}
                              </p>
                            ))}
                        </div>
                      </div>
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
                <User className="h-5 w-5 mr-2" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-sm font-medium">{patientInfo.firstName} {patientInfo.lastName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                <p className="text-sm">{formatDate(patientInfo.dateOfBirth)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Gender</label>
                <p className="text-sm">{patientInfo.gender}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">MRN</label>
                <p className="text-sm font-mono">{patientInfo.mrn}</p>
              </div>

              {(patientInfo.phoneNumber || patientInfo.email) && (
                <>
                  <Separator />
                  {patientInfo.phoneNumber && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{patientInfo.phoneNumber}</span>
                    </div>
                  )}
                  {patientInfo.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{patientInfo.email}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patientOrders
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 3)
                .map((order, index) => (
                  <div key={order.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {order.modality} order {order.status === 'completed' ? 'completed' : 'created'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              
              {patientOrders.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryView;