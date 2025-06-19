import { useState, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Calendar, Clock, ArrowUpDown, FileText, CheckCircle2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/layout/PageHeader";
import DebugUserInfo from "@/components/debug/DebugUserInfo";

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
}

const RadiologyQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effect to handle debounced search
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Only set up debounce timer if search query is at least 3 characters
    if (searchQuery.length >= 3) {
      // Set a new timer for 2 seconds
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery);
      }, 2000);
    } else if (searchQuery.length === 0 && debouncedSearchQuery !== "") {
      // If search is cleared, update immediately
      setDebouncedSearchQuery("");
    }
    
    // Cleanup function to clear the timer if component unmounts or searchQuery changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);
  
  // Fetch orders from the API
  const { data, isLoading, error } = useQuery<{orders: ApiRadiologyOrder[]} | ApiRadiologyOrder[]>({
    queryKey: ['/api/radiology/orders', statusFilter, debouncedSearchQuery],
    queryFn: async () => {
      // Build the query parameters
      let endpoint = `/api/radiology/orders`;
      const params = new URLSearchParams();
      
      // Add status filter if not "all"
      if (statusFilter !== "all") {
        params.append('status', statusFilter);
      }
      
      // Add search query if provided and at least 3 characters
      if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
        params.append('search', debouncedSearchQuery);
      }
      
      // Append query parameters if any exist
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      console.log(`Fetching radiology orders with endpoint: ${endpoint}`);
      const response = await apiRequest('GET', endpoint, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch radiology orders');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Handle both response formats - either direct array or object with orders property
  const orders = Array.isArray(data) ? data : data?.orders || [];
  
  // Filter orders by status and modality for radiology queue
  const filteredOrders = orders.filter(order => {
    // First filter by selected status
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    
    // Then filter by modality
    if (selectedFilter === "all") {
      return true;
    } else if (selectedFilter === "mri") {
      return order.modality && order.modality.toLowerCase().includes('mri');
    } else if (selectedFilter === "ct") {
      return order.modality && order.modality.toLowerCase().includes('ct');
    } else if (selectedFilter === "xray") {
      return order.modality && order.modality.toLowerCase().includes('x-ray');
    }
    return false;
  }) || [];
  
  // Further filter by search query if not using API search
  const searchFilteredOrders = debouncedSearchQuery && debouncedSearchQuery.length >= 3
    ? filteredOrders
    : filteredOrders.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        if (searchLower === '') return true; // Always include all orders when search is empty
        
        return (
          (order.patient_name && order.patient_name.toLowerCase().includes(searchLower)) ||
          (order.patient_mrn && order.patient_mrn.toLowerCase().includes(searchLower)) ||
          (order.modality && order.modality.toLowerCase().includes(searchLower))
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
      
      <DebugUserInfo />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex flex-col space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
                <TabsTrigger value="mri">MRI ({filteredOrders.filter(o => o.modality && o.modality.toLowerCase().includes('mri')).length})</TabsTrigger>
                <TabsTrigger value="ct">CT ({filteredOrders.filter(o => o.modality && o.modality.toLowerCase().includes('ct')).length})</TabsTrigger>
                <TabsTrigger value="xray">X-Ray ({filteredOrders.filter(o => o.modality && o.modality.toLowerCase().includes('x-ray')).length})</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Status:</span>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending_radiology">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by patient, MRN, modality..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Prevent default form submission behavior
                      e.preventDefault();
                      
                      // Only trigger search if at least 3 characters
                      if (searchQuery.length >= 3) {
                        // Clear any existing timer
                        if (debounceTimerRef.current) {
                          clearTimeout(debounceTimerRef.current);
                        }
                        
                        // Update debounced query immediately
                        setDebouncedSearchQuery(searchQuery);
                      } else if (searchQuery.length === 0) {
                        // If search is cleared, update immediately
                        setDebouncedSearchQuery("");
                      } else {
                        // Show a message that at least 3 characters are required
                        console.log("Please enter at least 3 characters to search");
                      }
                    }
                  }}
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
                            {formatDate(order.created_at)}
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