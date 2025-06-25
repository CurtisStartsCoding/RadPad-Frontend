import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  const userRole = (user?.role as UserRole) || UserRole.Physician;
  
  // Handle navigation to new order page
  const handleNewOrderClick = () => {
    // Use the navigation utility to determine the correct path
    const newOrderPath = getNewOrderPath();
    setLocation(newOrderPath);
  };
  
  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch orders from the API with pagination
  const { data, isLoading, error } = useQuery<OrdersApiResponse>({
    queryKey: ['/api/orders', currentPage, itemsPerPage, selectedFilter, debouncedSearchQuery],
    queryFn: async () => {
      let url = `/api/orders?page=${currentPage}&limit=${itemsPerPage}`;
      
      // Add filter parameter if not "all"
      if (selectedFilter !== "all") {
        url += `&status=${selectedFilter}`;
      }
      
      // Add search parameter if provided
      if (debouncedSearchQuery) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      
      const response = await apiRequest('GET', url, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Extract orders array and pagination from response
  const orders = data?.orders || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    setCurrentPage(newPage);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    const limit = parseInt(value);
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing limit
  };
  
  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };
  
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
              Track
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
              View
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
              View
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
                  onValueChange={handleFilterChange}
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
            
            {/* Top Pagination Controls */}
            {!isLoading && !error && pagination.total > 0 && (
              <div className="flex items-center justify-between space-x-6 py-4 border-b">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Orders per page</p>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={pageSize.toString()}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-muted-foreground">
                    ({pagination.total} total orders)
                  </div>
                </div>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pagination.page - 1);
                        }}
                        className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {/* First page */}
                    {pagination.page > 3 && pagination.pages > 5 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Ellipsis before current page range */}
                    {pagination.page > 4 && pagination.pages > 6 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Page numbers around current page */}
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(pageNum => {
                        const distance = Math.abs(pageNum - pagination.page);
                        if (pagination.pages <= 7) return true;
                        if (pageNum === 1 || pageNum === pagination.pages) return false;
                        return distance <= 2;
                      })
                      .map(pageNum => {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNum);
                              }}
                              isActive={pageNum === pagination.page}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                    {/* Ellipsis after current page range */}
                    {pagination.page < pagination.pages - 3 && pagination.pages > 6 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page */}
                    {pagination.page < pagination.pages - 2 && pagination.pages > 5 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pagination.pages);
                          }}
                        >
                          {pagination.pages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pagination.page + 1);
                        }}
                        className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
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
              <>
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
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          No orders found matching your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
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
                          </TableCell>
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                              {order.created_at ? formatDateShort(order.created_at) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>{order.modality || 'N/A'}</TableCell>
                          <TableCell>{order.radiology_organization_name || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>{getActionButtons(order)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Bottom Pagination Controls */}
                <div className="flex items-center justify-between space-x-6 py-4 border-t">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Orders per page</p>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={pageSize.toString()}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">
                      ({pagination.total} total orders)
                    </div>
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pagination.page - 1);
                          }}
                          className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>

                      {/* First page */}
                      {pagination.page > 3 && pagination.pages > 5 && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(1);
                            }}
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      {/* Ellipsis before current page range */}
                      {pagination.page > 4 && pagination.pages > 6 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Page numbers around current page */}
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(pageNum => {
                          const distance = Math.abs(pageNum - pagination.page);
                          if (pagination.pages <= 7) return true;
                          if (pageNum === 1 || pageNum === pagination.pages) return false;
                          return distance <= 2;
                        })
                        .map(pageNum => {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(pageNum);
                                }}
                                isActive={pageNum === pagination.page}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                      {/* Ellipsis after current page range */}
                      {pagination.page < pagination.pages - 3 && pagination.pages > 6 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Last page */}
                      {pagination.page < pagination.pages - 2 && pagination.pages > 5 && (
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pagination.pages);
                            }}
                          >
                            {pagination.pages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pagination.page + 1);
                          }}
                          className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;