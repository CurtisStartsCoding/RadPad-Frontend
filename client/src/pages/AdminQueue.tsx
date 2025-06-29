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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Clock, ArrowUpDown, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDateShort } from "@/lib/utils";
import { AppPage } from "@/App";
import PageHeader from "@/components/layout/PageHeader";

// Define the Order type based on admin queue API response
// Now matches the /api/orders pattern with separate first/last names
interface ApiAdminOrder {
  id: number;
  order_number: string;
  priority?: 'stat' | 'urgent' | 'routine';
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob?: string;
  patient_gender?: string;
  referring_physician_name: string;
  modality: string;
  body_part: string;
  laterality: string;
  final_cpt_code: string;
  final_cpt_code_description: string;
  final_icd10_codes: string[];
  final_icd10_code_descriptions: string[];
  originating_location_id: number | null;
  target_facility_id: number | null;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional fields since backend returns o.*
}

// Define the API response type for admin queue endpoint
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
  const [showStatOnly, setShowStatOnly] = useState(false);
  const [selectedModality, setSelectedModality] = useState("all");
  
  // Fetch orders from the admin queue endpoint
  const { data, isLoading, error } = useQuery<ApiOrdersResponse>({
    queryKey: ['/api/admin/orders/queue'],
    queryFn: async () => {
      console.log('Fetching orders from admin queue endpoint');
      const response = await apiRequest('GET', '/api/admin/orders/queue?limit=1000', undefined);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch admin queue:', response.status, errorText);
        throw new Error(`Failed to fetch admin queue: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Admin queue response:', data);
      console.log('First order example:', data.orders?.[0]);
      return data;
    },
    staleTime: 5000, // 5 seconds (STAT orders need immediate visibility)
    refetchInterval: 10000, // Auto-refetch every 10 seconds
  });
  
  // Extract orders from the admin queue response
  const orders: ApiAdminOrder[] = data?.orders || [];
  
  // Count STAT orders for alert button
  const statOrdersCount = orders.filter(order => order.priority === 'stat').length;
  
  // Get unique modalities and their counts
  const modalityCounts = orders.reduce((acc, order) => {
    const modality = order.modality || 'Unknown';
    acc[modality] = (acc[modality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Admin queue endpoint already pre-filters to pending_admin orders
  let filteredOrders = orders || [];
  
  // If STAT filter is enabled, show ALL STAT orders regardless of modality
  if (showStatOnly) {
    filteredOrders = filteredOrders.filter(order => order.priority === 'stat');
  } else {
    // Only apply modality filter when STAT is not active
    if (selectedModality !== "all") {
      filteredOrders = filteredOrders.filter(order => order.modality === selectedModality);
    }
  }
  
  // Further filter by search query
  const searchFilteredOrders = filteredOrders.filter((order: ApiAdminOrder) => {
    const searchLower = searchQuery.toLowerCase();
    const patientName = `${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim().toLowerCase();
    const modality = order.modality?.toLowerCase() || '';
    const physicianName = order.referring_physician_name?.toLowerCase() || '';
    
    return (
      patientName.includes(searchLower) ||
      modality.includes(searchLower) ||
      physicianName.includes(searchLower)
    );
  });
  
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
          <Tabs value="queue" className="space-y-4">
            <TabsList>
              <TabsTrigger 
                value="queue" 
                onClick={() => setSelectedModality("all")}
                className={selectedModality === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                Admin Queue ({selectedModality === "all" ? searchFilteredOrders.length : orders.length})
              </TabsTrigger>
              {Object.entries(modalityCounts)
                .sort(([,a], [,b]) => b - a)
                .map(([modality, count]) => (
                <TabsTrigger 
                  key={modality}
                  value="queue"
                  onClick={() => setSelectedModality(modality)}
                  className={selectedModality === modality ? "bg-primary text-primary-foreground" : ""}
                >
                  {modality} ({count})
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex justify-between items-center">
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by patient, modality, physician..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant={showStatOnly ? "default" : statOrdersCount > 0 ? "destructive" : "outline"}
                  onClick={() => setShowStatOnly(!showStatOnly)}
                  className={`${
                    statOrdersCount > 0 && !showStatOnly 
                      ? "bg-red-600 hover:bg-red-700 text-white" 
                      : ""
                  }`}
                >
                  {showStatOnly ? "Show All Orders" : statOrdersCount > 0 ? `STAT Orders (${statOrdersCount})` : "STAT Orders"}
                </Button>
              </div>
            </div>
            
            <TabsContent value="queue" className="m-0">
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
                      <TableHead>Order Number</TableHead>
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
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No orders found matching your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      searchFilteredOrders.map((order: ApiAdminOrder) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{`${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim() || 'Not yet added'}</TableCell>
                          <TableCell>{order.order_number || 'N/A'}</TableCell>
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
                          <TableCell>{order.referring_physician_name || 'Not yet added'}</TableCell>
                          <TableCell className="text-right">
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
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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