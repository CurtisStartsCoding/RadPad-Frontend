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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Calendar, Clock, ArrowUpDown, FileText, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { allOrders } from "@/lib/mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/layout/PageHeader";

const RadiologyQueue = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  
  // Filter orders by status for radiology queue
  const filteredOrders = allOrders.filter(order => {
    if (selectedFilter === "all") {
      return order.status === 'pending_radiology';
    } else if (selectedFilter === "mri") {
      return order.status === 'pending_radiology' && order.modality === 'MRI';
    } else if (selectedFilter === "ct") {
      return order.status === 'pending_radiology' && order.modality === 'CT Scan';
    } else if (selectedFilter === "xray") {
      return order.status === 'pending_radiology' && order.modality === 'X-Ray';
    }
    return false;
  });
  
  // Further filter by search query
  const searchFilteredOrders = filteredOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.patient.name.toLowerCase().includes(searchLower) ||
      order.patient.mrn.toLowerCase().includes(searchLower) ||
      order.modality.toLowerCase().includes(searchLower)
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
  const getReferringPhysicianInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  // Mock referring physicians
  const referringPhysicians = [
    "Dr. John Smith",
    "Dr. Emily Chen",
    "Dr. Michael Rodriguez",
    "Dr. Sarah Johnson",
    "Dr. David Lee"
  ];
  
  // Assign a random referring physician to each order
  const getRandomReferringPhysician = (id: number) => {
    return referringPhysicians[id % referringPhysicians.length];
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
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pending Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
              <TabsTrigger value="mri">MRI ({filteredOrders.filter(o => o.modality === 'MRI').length})</TabsTrigger>
              <TabsTrigger value="ct">CT ({filteredOrders.filter(o => o.modality === 'CT Scan').length})</TabsTrigger>
              <TabsTrigger value="xray">X-Ray ({filteredOrders.filter(o => o.modality === 'X-Ray').length})</TabsTrigger>
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
                    <SelectItem value="mri">MRI</SelectItem>
                    <SelectItem value="ct">CT Scan</SelectItem>
                    <SelectItem value="xray">X-Ray</SelectItem>
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
                  searchFilteredOrders.map((order) => {
                    const referringPhysician = getRandomReferringPhysician(order.id);
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.patient.name}</TableCell>
                        <TableCell className="font-mono text-xs">{order.patient.mrn}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {formatDate(order.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                            {formatTime(order.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {order.modality}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getReferringPhysicianInitials(referringPhysician)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{referringPhysician}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="default" size="sm">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiologyQueue;