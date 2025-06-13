import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Search, Filter, Calendar, Clock, ArrowUpDown, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { AppPage } from "@/App";
import PageHeader from "@/components/layout/PageHeader";

// Define the Order type based on API response
interface ApiAdminOrder {
  id: number;
  order_number?: string;
  status: 'pending_admin' | 'pending_validation' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';
  modality?: string;
  created_at: string;
  updated_at: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  patient_gender?: string;
  patient_mrn?: string;
  radiology_organization?: {
    id: number;
    name: string;
  } | null;
  referring_organization?: {
    id: number;
    name: string;
  };
}

// Define the API response type which might be an array or an object with orders property
interface ApiOrdersResponse {
  orders?: ApiAdminOrder[];
  [key: string]: any;
}

interface AdminQueueProps {
  navigateTo?: (page: AppPage) => void;
}

const AdminQueue: React.FC<AdminQueueProps> = ({ navigateTo }) => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Fetch orders from the API - using /api/orders since /api/admin/orders/queue might not be implemented
  const { data, isLoading, error } = useQuery<ApiAdminOrder[] | ApiOrdersResponse>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      console.log('Fetching orders from /api/orders');
      const response = await apiRequest('GET', '/api/orders', undefined);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch orders:', response.status, errorText);
        throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Orders response:', data);
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Extract orders from the response (handles both array and object with orders property)
  const orders: ApiAdminOrder[] = Array.isArray(data) ? data : data?.orders || [];
  
  // Filter orders by status for admin queue
  const filteredOrders = orders.filter((order: ApiAdminOrder) => {
    if (selectedFilter === "all") {
      return order.status === 'pending_admin' || order.status === 'pending_radiology';
    } else if (selectedFilter === "pending_admin") {
      return order.status === 'pending_admin';
    } else if (selectedFilter === "pending_radiology") {
      return order.status === 'pending_radiology';
    }
    return false;
  }) || [];
  
  // Further filter by search query
  const searchFilteredOrders = filteredOrders.filter((order: ApiAdminOrder) => {
    const searchLower = searchQuery.toLowerCase();
    const patientName = `${order.patient_first_name || ''} ${order.patient_last_name || ''}`.toLowerCase();
    const mrn = order.patient_mrn?.toLowerCase() || '';
    const modality = order.modality?.toLowerCase() || '';
    const radiologyGroup = order.radiology_organization?.name.toLowerCase() || '';
    
    return (
      patientName.includes(searchLower) ||
      mrn.includes(searchLower) ||
      modality.includes(searchLower) ||
      radiologyGroup.includes(searchLower)
    );
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  // Get status badge for an order
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_admin':
        return <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Pending Admin</Badge>;
      case 'pending_radiology':
        return <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Pending Radiology</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Admin Queue"
        description="Complete order information and prepare for scheduling"
      />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Orders Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">All Orders</TabsTrigger>
              <TabsTrigger value="incomplete">Pending Admin ({filteredOrders.filter((o: ApiAdminOrder) => o.status === 'pending_admin').length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Radiology ({filteredOrders.filter((o: ApiAdminOrder) => o.status === 'pending_radiology').length})</TabsTrigger>
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
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queue Items</SelectItem>
                    <SelectItem value="pending_admin">Needs Completion</SelectItem>
                    <SelectItem value="pending_radiology">Pending Radiology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value="orders" className="m-0">
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
                      <TableHead>Radiology Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchFilteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          No orders found matching your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      searchFilteredOrders.map((order: ApiAdminOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</TableCell>
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {formatDate(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {formatTime(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>{order.modality || 'N/A'}</TableCell>
                          <TableCell>{order.radiology_organization?.name || 'Not assigned'}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            {order.status === 'pending_admin' ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  console.log('Complete button clicked for order:', order.id);
                                  // Store the order ID in sessionStorage for the AdminOrderFinalization page
                                  sessionStorage.setItem('currentOrderId', order.id.toString());
                                  // Navigate using wouter to change the URL
                                  setLocation('/admin-order-finalization');
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="incomplete" className="m-0">
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
                      <TableHead className="w-[180px]">Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Modality</TableHead>
                      <TableHead>Radiology Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders
                      .filter((order: ApiAdminOrder) => order.status === 'pending_admin')
                      .map((order: ApiAdminOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</TableCell>
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {formatDate(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {formatTime(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>{order.modality || 'N/A'}</TableCell>
                          <TableCell>{order.radiology_organization?.name || 'Not assigned'}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                console.log('Complete button clicked for order (tab 2):', order.id);
                                // Store the order ID in sessionStorage for the AdminOrderFinalization page
                                sessionStorage.setItem('currentOrderId', order.id.toString());
                                // Navigate using wouter to change the URL
                                setLocation('/admin-order-finalization');
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="m-0">
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
                      <TableHead className="w-[180px]">Patient</TableHead>
                      <TableHead>MRN</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Modality</TableHead>
                      <TableHead>Radiology Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders
                      .filter((order: ApiAdminOrder) => order.status === 'pending_radiology')
                      .map((order: ApiAdminOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</TableCell>
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {formatDate(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {formatTime(order.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>{order.modality || 'N/A'}</TableCell>
                          <TableCell>{order.radiology_organization?.name || 'Not assigned'}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQueue;