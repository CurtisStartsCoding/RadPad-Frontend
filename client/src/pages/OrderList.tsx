import { useState } from "react";
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
  PlusCircle
} from "lucide-react";
import { allOrders } from "@/lib/mock-data";

const OrderList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Filter orders by status for order list
  const filteredOrders = allOrders.filter(order => {
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
    const searchLower = searchQuery.toLowerCase();
    return (
      order.patient.name.toLowerCase().includes(searchLower) ||
      order.patient.mrn.toLowerCase().includes(searchLower) ||
      order.modality.toLowerCase().includes(searchLower) ||
      order.radiologyGroup.toLowerCase().includes(searchLower)
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
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-slate-500">View and track all imaging orders</p>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>
      
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
                      <TableCell className="font-medium">{order.patient.name}</TableCell>
                      <TableCell className="font-mono text-xs">{order.patient.mrn}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>{order.modality}</TableCell>
                      <TableCell>{order.radiologyGroup}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getActionButtons(order.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderList;