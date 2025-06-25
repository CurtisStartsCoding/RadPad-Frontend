import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Filter, Calendar, Clock, ArrowUpDown, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDateShort } from "@/lib/utils";
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

// Define the API response type with pagination
interface ApiOrdersResponse {
  orders: ApiAdminOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface AdminQueueProps {
  navigateTo?: (page: AppPage) => void;
}

const AdminQueue: React.FC<AdminQueueProps> = ({ navigateTo }) => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortField, setSortField] = useState<'patient' | 'date' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch orders from the API with pagination
  const { data, isLoading, error } = useQuery<ApiOrdersResponse>({
    queryKey: ['/api/orders', currentPage, itemsPerPage, selectedFilter, debouncedSearchQuery],
    queryFn: async () => {
      console.log('Fetching orders from /api/orders');
      let url = `/api/orders?page=${currentPage}&limit=${itemsPerPage}`;
      
      // Add filter parameter - admin queue only shows pending orders
      if (selectedFilter === "pending_admin") {
        url += `&status=pending_admin`;
      } else if (selectedFilter === "pending_radiology") {
        url += `&status=pending_radiology`;
      }
      // For "all", don't add a status filter - let the API return all orders
      // and we'll filter on the client side to show only admin-relevant orders
      
      // Add search parameter if provided
      if (debouncedSearchQuery) {
        url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      }
      
      const response = await apiRequest('GET', url, undefined);
      
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
  
  // Extract orders and pagination from the response
  const orders: ApiAdminOrder[] = data?.orders || [];
  
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
  
  // Handle sorting
  const handleSort = (field: 'patient' | 'date') => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a different field, set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Sort the orders
  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: string | Date;
    let bValue: string | Date;
    
    if (sortField === 'patient') {
      // Sort by patient last name, then first name
      const aLastName = a.patient_last_name || '';
      const bLastName = b.patient_last_name || '';
      const aFirstName = a.patient_first_name || '';
      const bFirstName = b.patient_first_name || '';
      
      aValue = `${aLastName}, ${aFirstName}`.toLowerCase();
      bValue = `${bLastName}, ${bFirstName}`.toLowerCase();
    } else if (sortField === 'date') {
      aValue = new Date(a.created_at);
      bValue = new Date(b.created_at);
    } else {
      return 0;
    }
    
    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });
  
  // Filter orders for tab counts (client-side for display purposes)
  const pendingAdminOrders = sortedOrders.filter(order => order.status === 'pending_admin');
  const pendingRadiologyOrders = sortedOrders.filter(order => order.status === 'pending_radiology');
  
  
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
              <TabsTrigger value="incomplete">Pending Admin ({pendingAdminOrders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Radiology ({pendingRadiologyOrders.length})</TabsTrigger>
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
                  onValueChange={handleFilterChange}
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
              {/* Top Pagination Controls */}
              {!isLoading && !error && pagination.total > 0 && (
                <div className="flex items-center justify-between space-x-6 py-4 border-b">
                  <div className="flex items-center space-x-2">
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
                          <Button
                            variant="ghost"
                            className="flex items-center text-slate-600 font-medium p-0 h-auto hover:text-slate-900"
                            onClick={() => handleSort('patient')}
                          >
                            Patient
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>MRN</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="flex items-center text-slate-600 font-medium p-0 h-auto hover:text-slate-900"
                            onClick={() => handleSort('date')}
                          >
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
                      {sortedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                            No orders found matching your search criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedOrders.map((order: ApiAdminOrder) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</TableCell>
                            <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    console.log('View button clicked for order:', order.id);
                                    // Store the source page in sessionStorage
                                    sessionStorage.setItem('orderDetailsSource', 'admin-queue');
                                    // Navigate to the order details view
                                    setLocation(`/orders/${order.id}`);
                                  }}
                                >
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
                  
                  {/* Bottom Pagination Controls */}
                  <div className="flex items-center justify-between space-x-6 py-4 border-t">
                    <div className="flex items-center space-x-2">
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
                    {pendingAdminOrders.map((order: ApiAdminOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</TableCell>
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
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
                    {pendingRadiologyOrders.map((order: ApiAdminOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`}</TableCell>
                          <TableCell className="font-mono text-xs">{order.patient_mrn || 'N/A'}</TableCell>
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
                          <TableCell>{order.modality || 'N/A'}</TableCell>
                          <TableCell>{order.radiology_organization?.name || 'Not assigned'}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('View button clicked for order (tab 3):', order.id);
                                // Navigate to the order details view
                                setLocation(`/orders/${order.id}`);
                              }}
                            >
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