import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Calendar, Clock, ArrowUpDown, FileText, CheckCircle2, Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDateShort } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/layout/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/lib/useAuth";

// Define the Order type based on actual API response
interface ApiRadiologyOrder {
  id: number;
  order_number?: string;
  status: 'pending_admin' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';
  priority?: string;
  modality: string | null;
  body_part?: string | null;
  final_cpt_code?: string;
  final_cpt_code_description?: string | null;
  final_validation_status?: string;
  created_at: string;
  updated_at: string;
  patient_name: string | null;
  patient_dob: string | null;
  patient_gender: string | null;
  patient_mrn?: string | null;
  referring_physician_name: string | null;
  referring_organization_id?: number;
  radiology_organization_id?: number;
  radiology_organization_name?: string;
}

const RadiologyQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  
  // Get current user info - try multiple sources
  const sessionData = queryClient.getQueryData(['session']) as any;
  const userFromCache = queryClient.getQueryData(['user']) as any;
  const userFromStorage = localStorage.getItem('rad_order_pad_user_data');
  const parsedUserFromStorage = userFromStorage ? JSON.parse(userFromStorage) : null;
  
  // Try to get user from different sources, including useAuth hook
  const currentUser = authUser || sessionData?.user || userFromCache || parsedUserFromStorage;
  
  // Log for debugging
  console.log('🔍 Debug - Auth User:', authUser);
  console.log('🔍 Debug - Session Data:', sessionData);
  console.log('🔍 Debug - User from Cache:', userFromCache);
  console.log('🔍 Debug - User from Storage:', parsedUserFromStorage);
  console.log('🔍 Debug - Current User:', currentUser);
  
  // Fetch orders from the API
  const { data, isLoading, error } = useQuery<{orders: ApiRadiologyOrder[]} | ApiRadiologyOrder[]>({
    queryKey: ['/api/radiology/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/radiology/orders', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch radiology orders');
      }
      const data = await response.json();
      console.log('📋 Radiology Orders Response:', data);
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Handle both response formats - either direct array or object with orders property
  const orders = Array.isArray(data) ? data : data?.orders || [];
  
  // Filter orders by status for radiology queue
  const filteredOrders = orders.filter(order => {
    if (selectedFilter === "all") {
      return order.status === 'pending_radiology';
    } else if (selectedFilter === "mri") {
      return order.status === 'pending_radiology' && order.modality && order.modality.toLowerCase().includes('mri');
    } else if (selectedFilter === "ct") {
      return order.status === 'pending_radiology' && order.modality && order.modality.toLowerCase().includes('ct');
    } else if (selectedFilter === "xray") {
      return order.status === 'pending_radiology' && order.modality && order.modality.toLowerCase().includes('x-ray');
    }
    return false;
  }) || [];
  
  // Further filter by search query
  const searchFilteredOrders = filteredOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (order.patient_name && order.patient_name.toLowerCase().includes(searchLower)) ||
      (order.patient_mrn && order.patient_mrn.toLowerCase().includes(searchLower)) ||
      (order.modality && order.modality.toLowerCase().includes(searchLower)) ||
      searchLower === ''  // Always include all orders when search is empty
    );
  });
  
  // Format date for display
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  // Generating some referring physician initials
  const getReferringPhysicianInitials = (name: string | null) => {
    if (!name) return "DR";
    
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };
  

  return (
    <div className="p-6">
      <PageHeader
        title="Radiology Queue"
        description="Review and schedule pending orders"
      >
        <Button size="sm">
          <CalendarIcon className="h-4 w-4 mr-2" />
          View Schedule
        </Button>
      </PageHeader>
      
      {/* Debug Information - Temporarily always show for debugging */}
      {true && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Debug Information (Scheduler View)</AlertTitle>
          <AlertDescription className="text-blue-800">
            <div className="space-y-1 mt-2">
              <p><strong>Current User:</strong> {currentUser?.email || 'Not logged in'}</p>
              <p><strong>User Role:</strong> {currentUser?.role || 'Unknown'}</p>
              <p><strong>Organization ID:</strong> {currentUser?.organizationId || currentUser?.organization_id || 'None'}</p>
              <p><strong>API Endpoint:</strong> /api/radiology/orders</p>
              <p><strong>Orders Found:</strong> {orders.length}</p>
              <p><strong>Response Data:</strong> {data ? JSON.stringify(data).substring(0, 100) + '...' : 'No data'}</p>
              {orders.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Order Details (click to expand)</summary>
                  <div className="mt-2 space-y-2 text-xs">
                    {orders.slice(0, 5).map((order, idx) => (
                      <div key={order.id} className="p-2 bg-gray-50 rounded">
                        <p><strong>Order #{idx + 1}:</strong> {order.order_number || `ID: ${order.id}`}</p>
                        <p>Status: {order.status}</p>
                        <p>Created: {new Date(order.created_at).toLocaleDateString()}</p>
                        <p>Radiology Org ID: {order.radiology_organization_id || 'NULL'}</p>
                        <p>Referring Org ID: {order.referring_organization_id || 'NULL'}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
              <TabsTrigger value="mri">MRI ({filteredOrders.filter(o => o.modality && o.modality.toLowerCase().includes('mri')).length})</TabsTrigger>
              <TabsTrigger value="ct">CT ({filteredOrders.filter(o => o.modality && o.modality.toLowerCase().includes('ct')).length})</TabsTrigger>
              <TabsTrigger value="xray">X-Ray ({filteredOrders.filter(o => o.modality && o.modality.toLowerCase().includes('x-ray')).length})</TabsTrigger>
            </TabsList>
            
            <div className="flex justify-between items-center">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by patient, MRN, modality..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Select
                  value={selectedFilter}
                  onValueChange={setSelectedFilter}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filter by modality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modalities</SelectItem>
                    <SelectItem value="mri">MRI</SelectItem>
                    <SelectItem value="ct">CT Scan</SelectItem>
                    <SelectItem value="xray">X-Ray</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading orders...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>Error loading orders. Please try again later.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <Button variant="ghost" className="flex items-center text-slate-600 font-medium p-0 h-auto">
                        Patient
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>MRN</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="flex items-center text-slate-600 font-medium p-0 h-auto">
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Modality</TableHead>
                    <TableHead>Referring Physician</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchFilteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        No orders found matching your search criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    searchFilteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.patient_name || 'Unknown Patient'}</TableCell>
                        <TableCell className="font-mono text-xs">{order.patient_mrn || 'No MRN'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {formatDateShort(order.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {formatTime(order.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {order.modality || 'Not Specified'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getReferringPhysicianInitials(order.referring_physician_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{order.referring_physician_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="default" size="sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiologyQueue;