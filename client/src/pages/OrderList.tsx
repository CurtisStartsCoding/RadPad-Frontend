import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowUpDown,
  FileText,
  CheckCircle2,
  Calendar as CalendarIcon,
  Printer,
  Download,
  Eye,
  PlusCircle,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDateShort } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { getNewOrderPath } from "@/lib/navigation";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/useAuth";
import { UserRole, getAvailableOrderActions } from "@/lib/roles";

// Define the Order type based on API response
interface ApiOrder {
  id: number;
  order_number?: string;
  status: 'pending_admin' | 'pending_validation' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled' | 'results_available' | 'results_acknowledged';
  priority?: 'routine' | 'urgent' | 'stat';
  modality?: string;
  created_at: string;
  updated_at: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  patient_mrn?: string;
  patient_gender?: string;
  radiology_organization_name?: string;
  clinical_indication?: string;
  original_dictation?: string;
}

// Define the API response structure
interface OrdersApiResponse {
  orders: ApiOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const OrderList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  
  const userRole = (user?.role as UserRole) || UserRole.Physician;
  
  // Handle navigation to new order page
  const handleNewOrderClick = () => {
    // Use the navigation utility to determine the correct path
    const newOrderPath = getNewOrderPath();
    setLocation(newOrderPath);
  };
  
  // Fetch orders from the API
  const { data, isLoading, error } = useQuery<OrdersApiResponse>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?limit=1000', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Extract orders array from response
  const orders = data?.orders || [];
  
  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (selectedFilter === "all") {
      return true;
    } else {
      return order.status === selectedFilter;
    }
  });
  
  // Further filter by search query
  const searchFilteredOrders = filteredOrders.filter(order => {
    if (!order) return false;
    
    const patientName = `${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim();
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (patientName.toLowerCase() || '').includes(searchLower) ||
      (order.patient_mrn?.toLowerCase() || '').includes(searchLower) ||
      (order.modality?.toLowerCase() || '').includes(searchLower) ||
      (order.radiology_organization_name?.toLowerCase() || '').includes(searchLower)
    );
  });
  
  // Format date for display
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  // Get status badge for an order
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_admin':
        return <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Awaiting Admin</Badge>;
      case 'pending_validation':
        return <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">Pending Validation</Badge>;
      case 'pending_radiology':
        return <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Awaiting Schedule</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">{status.replace('_', ' ')}</Badge>;
    }
  };
  
  // Get priority badge for an order
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'stat':
        return <Badge variant="destructive">STAT</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">Urgent</Badge>;
      case 'routine':
        return <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">Routine</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">Routine</Badge>;
    }
  };
  
  // Navigate to order details
  const handleViewOrder = (orderId: number) => {
    setLocation(`/orders/${orderId}`);
  };

  // Handle order download
  const handleDownloadOrder = (orderId: number) => {
    // TODO: Implement PDF download functionality
    console.log('Download order:', orderId);
  };

  // Handle order print
  const handlePrintOrder = (orderId: number) => {
    // TODO: Implement print functionality
    console.log('Print order:', orderId);
  };

  // Navigate to patient history
  const handleViewPatientHistory = (patientMrn: string | null) => {
    if (patientMrn) {
      setLocation(`/patients/${patientMrn}`);
    }
  };

  // Get action buttons for an order based on status and user role
  const getActionButtons = (order: ApiOrder) => {
    const permissions = getAvailableOrderActions(userRole, order.status);
    
    switch (order.status) {
      case 'completed':
      case 'results_available':
      case 'results_acknowledged':
        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => handleViewOrder(order.id)}
              title="View Order Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {permissions.canDownload && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => handleDownloadOrder(order.id)}
                title="Download Order"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {permissions.canPrint && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => handlePrintOrder(order.id)}
                title="Print Order"
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      case 'scheduled':
        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewOrder(order.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        );
      case 'pending_admin':
      case 'pending_validation':
      case 'pending_radiology':
        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewOrder(order.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewOrder(order.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewOrderClick}>
              <PlusCircle className="h-4 w-4 mr-1" />
              New Order
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewOrder(order.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Orders"
        description="View and track all imaging orders"
      >
        <Button onClick={handleNewOrderClick}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending_admin">Awaiting Admin</SelectItem>
                    <SelectItem value="pending_radiology">Awaiting Schedule</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
              <div className="border rounded-md">
                {/* Fixed Header using CSS Grid */}
                <div className="bg-gray-50 border-b p-0">
                  <div className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1.6fr_1fr_1.2fr_1.4fr] gap-0 px-4 py-3 font-medium text-sm text-slate-600">
                    <div className="flex items-center truncate">
                      <Button variant="ghost" className="flex items-center text-slate-600 font-medium p-0 h-auto">
                        Patient
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    <div className="truncate">MRN</div>
                    <div className="flex items-center truncate">
                      <Button variant="ghost" className="flex items-center text-slate-600 font-medium p-0 h-auto">
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                    <div className="truncate">Modality</div>
                    <div className="truncate">Radiology Group</div>
                    <div className="truncate">Priority</div>
                    <div className="truncate">Status</div>
                    <div className="text-right truncate">Actions</div>
                  </div>
                </div>
                
                {/* Scrollable Body using CSS Grid */}
                <div className="max-h-64 sm:max-h-80 md:max-h-96 lg:max-h-[32rem] xl:max-h-[40rem] overflow-y-auto">
                  {searchFilteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      No orders found matching your search criteria
                    </div>
                  ) : (
                    searchFilteredOrders.map((order) => (
                      <div key={order.id} className="grid grid-cols-[2fr_1fr_1.2fr_1fr_1.6fr_1fr_1.2fr_1.4fr] gap-0 px-4 py-3 border-b hover:bg-gray-50 text-sm">
                        <div className="font-medium truncate">
                          {order.patient_mrn && getAvailableOrderActions(userRole, order.status).canViewPatient ? (
                            <button 
                              className="text-left hover:text-blue-600 hover:underline cursor-pointer"
                              onClick={() => handleViewPatientHistory(order.patient_mrn || null)}
                              title="View patient history"
                            >
                              {`${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim() || 'Unknown'}
                            </button>
                          ) : (
                            <span>{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim() || 'Unknown'}</span>
                          )}
                        </div>
                        <div className="truncate">{order.patient_mrn || 'Not Assigned'}</div>
                        <div className="truncate">
                          <div className="flex items-center min-w-0">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{order.created_at ? formatDateShort(order.created_at) : 'N/A'}</span>
                          </div>
                        </div>
                        <div className="truncate">{order.modality || 'N/A'}</div>
                        <div className="truncate">{order.radiology_organization_name || 'Not Assigned'}</div>
                        <div className="truncate">{getPriorityBadge(order.priority)}</div>
                        <div className="truncate">{getStatusBadge(order.status)}</div>
                        <div className="truncate">{getActionButtons(order)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;