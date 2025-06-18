import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { UserRole } from "@/lib/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { getNewOrderPath } from "@/lib/navigation";
import { useLocation } from "wouter";

// Define the Order type based on API response
interface ApiOrder {
  id: number;
  order_number?: string;
  status: 'pending_admin' | 'pending_validation' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';
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
  referring_physician_name?: string;
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [_, setLocation] = useLocation();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // Handle navigation to new order page
  const handleNewOrderClick = () => {
    // Use the navigation utility to determine the correct path
    const newOrderPath = getNewOrderPath();
    setLocation(newOrderPath);
  };
  
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
        // Reset to page 1 when search query changes
        setCurrentPage(1);
        setDebouncedSearchQuery(searchQuery);
      }, 2000);
    } else if (searchQuery.length === 0 && debouncedSearchQuery !== "") {
      // If search is cleared, update immediately and reset to page 1
      setCurrentPage(1);
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
  const { data, isLoading, error, refetch } = useQuery<OrdersApiResponse>({
    queryKey: ['/api/orders', debouncedSearchQuery, selectedFilter, currentPage],
    queryFn: async () => {
      // Build the query parameters
      let endpoint = '/api/orders';
      const params = new URLSearchParams();
      
      // Add search query if provided and at least 3 characters
      if (debouncedSearchQuery && debouncedSearchQuery.length >= 3) {
        params.append('search', debouncedSearchQuery);
      }
      
      // Add filter if not "all"
      if (selectedFilter !== "all") {
        params.append('status', selectedFilter);
      }
      
      // Add pagination
      params.append('page', currentPage.toString());
      
      // Append query parameters if any exist
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
      
      console.log(`Fetching orders with endpoint: ${endpoint}`);
      const response = await apiRequest('GET', endpoint, undefined);
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
      return order.status === 'pending_admin' || order.status === 'pending_validation' || order.status === 'pending_radiology';
    } else if (selectedFilter === "scheduled") {
      return order.status === 'scheduled';
    } else if (selectedFilter === "completed") {
      return order.status === 'completed';
    } else if (selectedFilter === "cancelled") {
      return order.status === 'cancelled';
    }
    return false;
  });
  
  // Use the filtered orders directly from the API if debounced search query is provided
  // Otherwise, filter client-side
  const searchFilteredOrders = debouncedSearchQuery && debouncedSearchQuery.length >= 3
    ? filteredOrders
    : filteredOrders.filter(order => {
        if (!order) return false;
        
        const patientName = `${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim();
        
        const searchLower = debouncedSearchQuery.toLowerCase() || searchQuery.toLowerCase();
        return (
          (patientName.toLowerCase() || '').includes(searchLower) ||
          (order.patient_mrn?.toLowerCase() || '').includes(searchLower) ||
          (order.modality?.toLowerCase() || '').includes(searchLower) ||
          (order.radiology_organization_name?.toLowerCase() || '').includes(searchLower)
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
      case 'pending_validation':
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
            <Button variant="outline" size="sm" onClick={handleNewOrderClick}>
              <PlusCircle className="h-4 w-4 mr-1" />
              New Order
            </Button>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the table when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Helper function to determine the number of columns based on user role
  const getColSpan = () => {
    if (!user) return 7; // Default fallback
    
    switch (user.role) {
      case UserRole.Physician:
        return 5; // Patient, Date, Time, Modality, View
      case UserRole.AdminReferring:
        return 7; // Patient, MRN, Date, Modality, Radiology Group, Status, Actions
      case UserRole.Radiologist:
      case UserRole.Scheduler:
      case UserRole.AdminRadiology:
        return 7; // Patient, MRN, Date, Time, Modality, Referring Physician, Actions
      default:
        return 7; // Default fallback
    }
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    if (!data?.pagination) return null;
    
    const { total, page, limit, pages } = data.pagination;
    const currentPage = page;
    const totalPages = pages;
    
    // If no pages or only one page, don't show pagination
    if (totalPages <= 1) return null;
    
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => handlePageChange(currentPage - 1)}
          className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // First page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis after first page
    if (currentPage > 3) {
      items.push(<PaginationItem key="ellipsis1"><PaginationEllipsis /></PaginationItem>);
    }
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis before last page
    if (currentPage < totalPages - 2) {
      items.push(<PaginationItem key="ellipsis2"><PaginationEllipsis /></PaginationItem>);
    }
    
    // Last page (if more than one page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => handlePageChange(currentPage + 1)}
          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return items;
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
                        
                        // Reset to page 1 and update debounced query immediately
                        setCurrentPage(1);
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
                  onValueChange={(value) => {
                    setSelectedFilter(value);
                    // Reset to page 1 when filter changes
                    setCurrentPage(1);
                    // Refetch orders when filter changes
                    refetch();
                  }}
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
            
            {/* Top Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <Pagination className="my-4">
                <PaginationContent>
                  {renderPaginationItems()}
                </PaginationContent>
              </Pagination>
            )}
            
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
                    {/* Patient column - shown for all roles */}
                    <TableHead className="w-[180px]">
                      <Button variant="ghost" className="flex items-center text-slate-600 font-medium p-0 h-auto">
                        Patient
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    
                    {/* MRN column - not shown for physician role */}
                    {user?.role !== UserRole.Physician && (
                      <TableHead>MRN</TableHead>
                    )}
                    
                    {/* Date column - shown for all roles */}
                    <TableHead>
                      <Button variant="ghost" className="flex items-center text-slate-600 font-medium p-0 h-auto">
                        Date
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    
                    {/* Time column - shown for physician, radiologist, scheduler, admin_radiology roles */}
                    {(user?.role === UserRole.Physician ||
                      user?.role === UserRole.Radiologist ||
                      user?.role === UserRole.Scheduler ||
                      user?.role === UserRole.AdminRadiology) && (
                      <TableHead>Time</TableHead>
                    )}
                    
                    {/* Modality column - shown for all roles */}
                    <TableHead>Modality</TableHead>
                    
                    {/* Radiology Group column - shown only for admin_referring role */}
                    {user?.role === UserRole.AdminReferring && (
                      <TableHead>Radiology Group</TableHead>
                    )}
                    
                    {/* Referring Physician column - shown for radiologist, scheduler, admin_radiology roles */}
                    {(user?.role === UserRole.Radiologist ||
                      user?.role === UserRole.Scheduler ||
                      user?.role === UserRole.AdminRadiology) && (
                      <TableHead>Referring Physician</TableHead>
                    )}
                    
                    {/* Status column - shown for physician and admin_referring roles */}
                    {(user?.role === UserRole.Physician ||
                      user?.role === UserRole.AdminReferring) && (
                      <TableHead>Status</TableHead>
                    )}
                    
                    {/* Actions/View column - shown for all roles but with different labels */}
                    <TableHead className="text-right">
                      {user?.role === UserRole.Physician ? 'View' : 'Actions'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchFilteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={getColSpan()} className="text-center py-8 text-slate-500">
                        No orders found matching your search criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    searchFilteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        {/* Patient column - shown for all roles */}
                        <TableCell className="font-medium">
                          {`${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim() || 'Unknown'}
                        </TableCell>
                        
                        {/* MRN column - not shown for physician role */}
                        {user?.role !== UserRole.Physician && (
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
                        )}
                        
                        {/* Date column - shown for all roles */}
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {order.created_at ? formatDate(order.created_at) : 'N/A'}
                          </div>
                        </TableCell>
                        
                        {/* Time column - shown for physician, radiologist, scheduler, admin_radiology roles */}
                        {(user?.role === UserRole.Physician ||
                          user?.role === UserRole.Radiologist ||
                          user?.role === UserRole.Scheduler ||
                          user?.role === UserRole.AdminRadiology) && (
                          <TableCell>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {order.created_at ? formatTime(order.created_at) : 'N/A'}
                            </div>
                          </TableCell>
                        )}
                        
                        {/* Modality column - shown for all roles */}
                        <TableCell>{order.modality || 'N/A'}</TableCell>
                        
                        {/* Radiology Group column - shown only for admin_referring role */}
                        {user?.role === UserRole.AdminReferring && (
                          <TableCell>{order.radiology_organization_name || 'N/A'}</TableCell>
                        )}
                        
                        {/* Referring Physician column - shown for radiologist, scheduler, admin_radiology roles */}
                        {(user?.role === UserRole.Radiologist ||
                          user?.role === UserRole.Scheduler ||
                          user?.role === UserRole.AdminRadiology) && (
                          <TableCell>
                            {order.referring_physician_name || 'N/A'}
                          </TableCell>
                        )}
                        
                        {/* Status column - shown for physician and admin_referring roles */}
                        {(user?.role === UserRole.Physician ||
                          user?.role === UserRole.AdminReferring) && (
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                        )}
                        
                        {/* Actions/View column - shown for all roles */}
                        <TableCell>
                          {getActionButtons(order.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
            
            {/* Bottom Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <Pagination className="my-4">
                <PaginationContent>
                  {renderPaginationItems()}
                </PaginationContent>
              </Pagination>
            )}
            
            {/* Pagination Summary */}
            {data?.pagination && (
              <div className="text-sm text-slate-500 text-center mt-2">
                Showing page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total orders)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;