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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Calendar, Clock, ArrowUpDown, FileText, CheckCircle2, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDateShort } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/layout/PageHeader";
import DebugRadiologyUserInfo from "@/components/debug/DebugRadiologyUserInfo";

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
  patient_name?: string | null;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_dob: string | null;
  patient_gender: string | null;
  patient_mrn?: string | null;
  referring_physician_name: string | null;
  referring_organization_id?: number;
}

// Define modality groups based on the API source code
const MODALITY_GROUPS = {
  'xray': {
    label: 'X-Ray',
    terms: ['x-ray', 'xray', 'radiograph', 'radiography', 'plain film'],
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  'ct': {
    label: 'CT',
    terms: ['ct', 'cat scan', 'computed tomography', 'ct scan', 'ct angiogram', 'cta'],
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  'mri': {
    label: 'MRI',
    terms: ['mri', 'magnetic resonance', 'mr', 'fmri', 'mr angiogram', 'mra', 'mrcp'],
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  'ultrasound': {
    label: 'Ultrasound',
    terms: ['ultrasound', 'sonogram', 'sonography', 'doppler', 'echocardiogram', 'echo'],
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700'
  },
  'nuclear': {
    label: 'Nuclear',
    terms: ['pet', 'pet scan', 'pet-ct', 'nuclear', 'nuclear medicine', 'spect', 'bone scan'],
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  'angiography': {
    label: 'Angiography',
    terms: ['angiogram', 'angiography', 'venogram', 'venography', 'arteriogram'],
    color: 'bg-red-50 border-red-200 text-red-700'
  },
  'other': {
    label: 'Other',
    terms: ['mammogram', 'mammography', 'dexa', 'bone density', 'fluoroscopy', 'myelogram', 'discogram', 'arthrogram'],
    color: 'bg-gray-50 border-gray-200 text-gray-700'
  }
};

const RadiologyQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Get the user's role to determine which API endpoint to use
  const userRole = localStorage.getItem('rad_order_pad_user_role');
  
  // Use the appropriate API endpoint based on the user's role
  // Scheduler role should use /api/orders, other roles use /api/radiology/orders
  const apiEndpoint = userRole === 'scheduler' ? '/api/orders' : '/api/radiology/orders';
  
  // Fetch orders from the API
  const { data, isLoading, error } = useQuery<{orders: ApiRadiologyOrder[]} | ApiRadiologyOrder[]>({
    queryKey: [apiEndpoint],
    queryFn: async () => {
      const response = await apiRequest('GET', apiEndpoint, undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch radiology orders');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 RadiologyQueue Debug Info:');
      console.log('  User Role:', userRole);
      console.log('  API Endpoint:', apiEndpoint);
      console.log('  Data Structure:', data ? (Array.isArray(data) ? 'Array' : 'Object') : 'No data');
      console.log('  Orders Count:', Array.isArray(data) ? data.length : data?.orders?.length || 0);
    }
  }, [data, userRole, apiEndpoint]);
  
  // Handle both response formats - either direct array or object with orders property
  const orders = Array.isArray(data) ? data : data?.orders || [];
  
  // Helper function to check if a modality matches any terms in a group
  const modalityMatchesGroup = (modality: string | null, groupKey: string): boolean => {
    if (!modality) return false;
    const modalityLower = modality.toLowerCase();
    const group = MODALITY_GROUPS[groupKey as keyof typeof MODALITY_GROUPS];
    return group.terms.some(term => modalityLower.includes(term));
  };
  
  // Helper function to get the count of orders for a specific modality group
  const getModalityGroupCount = (groupKey: string): number => {
    return orders.filter(order => {
      const validStatus = order.status === 'pending_radiology' || order.status === 'scheduled';
      return validStatus && modalityMatchesGroup(order.modality, groupKey);
    }).length;
  };
  
  // Helper function to get the appropriate color class for a modality
  const getModalityColorClass = (modality: string | null): string => {
    if (!modality) return 'bg-gray-50 border-gray-200 text-gray-700';
    
    const groupEntry = Object.entries(MODALITY_GROUPS).find(([_, group]) =>
      group.terms.some(term => modality.toLowerCase().includes(term))
    );
    
    return groupEntry ? groupEntry[1].color : 'bg-gray-50 border-gray-200 text-gray-700';
  };
  
  // Filter orders by status for radiology queue
  // Include both 'pending_radiology' and 'scheduled' status orders
  const filteredOrders = orders.filter(order => {
    // Check if the order has a valid status for the radiology queue
    const validStatus = order.status === 'pending_radiology' || order.status === 'scheduled';
    
    if (selectedFilter === "all") {
      return validStatus;
    } else {
      return validStatus && modalityMatchesGroup(order.modality, selectedFilter);
    }
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
      {process.env.NODE_ENV === 'development' && <DebugRadiologyUserInfo />}
      
      <PageHeader
        title="Radiology Queue"
        description="Review and schedule pending orders"
      >
        <Button size="sm">
          <CalendarIcon className="h-4 w-4 mr-2" />
          View Schedule
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4" onValueChange={setSelectedFilter}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="all">All Orders ({orders.filter(o => o.status === 'pending_radiology' || o.status === 'scheduled').length})</TabsTrigger>
              {Object.entries(MODALITY_GROUPS).map(([key, group]) => (
                <TabsTrigger key={key} value={key}>
                  {group.label} ({getModalityGroupCount(key)})
                </TabsTrigger>
              ))}
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
                    {Object.entries(MODALITY_GROUPS).map(([key, group]) => (
                      <SelectItem key={key} value={key}>
                        {group.label}
                      </SelectItem>
                    ))}
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
                        <TableCell className="font-medium">
                          {order.patient_name ||
                           `${order.patient_first_name || ''} ${order.patient_last_name || ''}`.trim() ||
                           'Unknown Patient'}
                        </TableCell>
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
                          <Badge variant="outline" className={getModalityColorClass(order.modality)}>
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