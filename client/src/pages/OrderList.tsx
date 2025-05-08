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
import PageHeader from "@/components/layout/PageHeader";

// Define the Order type based on API response
interface ApiOrder {
  id: number;
  order_number?: string;
  status: 'pending_admin' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';
  modality: string;
  created_at: string;
  updated_at: string;
  patient: {
    id: number;
    name: string;
    mrn: string;
    dob: string;
    gender?: string;
  };
  radiology_group: {
    id: number;
    name: string;
  };
}

const OrderList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Fetch orders from the API
  const { data, isLoading, error } = useQuery<{orders: ApiOrder[]}>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders', undefined);
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
    } else if (selectedFilter === "pending") {
      return order.status === 'pending_admin' || order.status === 'pending_radiology';
    } else if (selectedFilter === "scheduled") {
      return order.status === 'scheduled';
    } else if (selectedFilter === "completed") {
      return order.status === 'completed';
    } else if (selectedFilter === "cancelled") {
      return order.status === 'cancelled';
    }
    return false;
  });
  
  // Further filter by search query
  const searchFilteredOrders = filteredOrders.filter(order => {
    if (!order || !order.patient || !order.radiology_group) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (order.patient.name?.toLowerCase() || '').includes(searchLower) ||
      (order.patient.mrn?.toLowerCase() || '').includes(searchLower) ||
      (order.modality?.toLowerCase() || '').includes(searchLower) ||
      (order.radiology_group.name?.toLowerCase() || '').includes(searchLower)
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
        return <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Processing</Badge>;
      case 'pending_radiology':
        return <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Awaiting Schedule</Badge>;
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
  
  // Get action buttons for an order based on status
  const getActionButtons = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" className="h-8 px-2">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'scheduled':
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>
        );
      case 'pending_admin':
      case 'pending_radiology':
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Track
            </Button>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">
              <PlusCircle className="h-4 w-4 mr-1" />
              New Order
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Orders"
        description="View and track all imaging orders"
      >
        <Button>
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <TableHead>Modality</TableHead>
                    <TableHead>Radiology Group</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell className="font-medium">{order.patient?.name || 'Unknown'}</TableCell>
                        <TableCell className="font-mono text-xs">{order.patient?.mrn || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {order.created_at ? formatDate(order.created_at) : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{order.modality || 'N/A'}</TableCell>
                        <TableCell>{order.radiology_group?.name || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{getActionButtons(order.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;