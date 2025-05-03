import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { recentOrders } from "@/lib/mock-data";
import PageHeader from "@/components/layout/PageHeader";
import { 
  Activity, 
  Users, 
  ChevronRight, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  ArrowUpCircle, 
  Plus,
  PlusCircle,
  FileText,
  ListFilter,
  CheckCircle2, 
  BarChart as BarChartIcon,
  PieChart as PieChartIcon
} from "lucide-react";

// Mock data for charts
const activityData = [
  { name: 'Jan', orders: 21, validations: 19 },
  { name: 'Feb', orders: 32, validations: 30 },
  { name: 'Mar', orders: 26, validations: 24 },
  { name: 'Apr', orders: 38, validations: 36 },
  { name: 'May', orders: 42, validations: 40 },
  { name: 'Jun', orders: 37, validations: 35 },
  { name: 'Jul', orders: 44, validations: 42 },
];

const modalityData = [
  { name: 'MRI', value: 35 },
  { name: 'CT Scan', value: 25 },
  { name: 'X-Ray', value: 20 },
  { name: 'Ultrasound', value: 15 },
  { name: 'Other', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
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

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back to RadOrderPad"
      >
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </PageHeader>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white">
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Activity Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <FileText className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">214</div>
                <p className="text-xs text-slate-500 mt-1">+23% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Studies</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">189</div>
                <p className="text-xs text-slate-500 mt-1">92% completion rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87</div>
                <p className="text-xs text-slate-500 mt-1">+12 this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Activity className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-slate-500 mt-1">4 awaiting schedule</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Button variant="outline" size="sm" className="h-8">
                  <ListFilter className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>
              <CardDescription>
                Your most recent imaging orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Modality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.patient.name}</TableCell>
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
                      <TableCell>{order.modality}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="border-t bg-slate-50 px-6 py-3">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-slate-500">Showing 5 of 214 orders</p>
                <Button variant="outline" size="sm" className="h-8">
                  View All Orders
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6 px-4">
                  <PlusCircle className="h-6 w-6 mb-2" />
                  <span>New Order</span>
                </Button>
                <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6 px-4">
                  <ListFilter className="h-6 w-6 mb-2" />
                  <span>View Orders</span>
                </Button>
                <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6 px-4">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Manage Users</span>
                </Button>
                <Button variant="outline" className="h-auto flex flex-col items-center justify-center py-6 px-4">
                  <Activity className="h-6 w-6 mb-2" />
                  <span>Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activity Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BarChartIcon className="h-5 w-5 mr-2" />
                    Orders Activity
                  </CardTitle>
                </div>
                <CardDescription>
                  Monthly orders and validations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={activityData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      <Bar name="Orders" dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar name="Validations" dataKey="validations" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Modality Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Modality Distribution
                  </CardTitle>
                </div>
                <CardDescription>
                  Breakdown of orders by modality type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={300}>
                      <Pie
                        data={modalityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {modalityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Order Stats</CardTitle>
                <CardDescription>
                  Key statistics about your orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Average Completion Time</p>
                      <p className="text-2xl font-bold">2.4 days</p>
                    </div>
                    <ArrowUpCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Validation Success Rate</p>
                      <p className="text-2xl font-bold">94.2%</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Orders this Quarter</p>
                      <p className="text-2xl font-bold">127</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;