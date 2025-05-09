import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
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
  PieChart as PieChartIcon,
  Loader2
} from "lucide-react";

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

// Define the Analytics type based on API response
interface ApiAnalytics {
  activity_data: {
    name: string;
    orders: number;
    validations: number;
  }[];
  modality_distribution: {
    name: string;
    value: number;
  }[];
  stats: {
    total_orders: number;
    completed_studies: number;
    active_patients: number;
    pending_orders: number;
    avg_completion_time: number;
    validation_success_rate: number;
    orders_this_quarter: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Import AppPage enum for navigation
import { AppPage } from "@/App";

// Define props interface for Dashboard component
interface DashboardProps {
  navigateTo: (page: AppPage) => void;
}

const Dashboard = ({ navigateTo }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch recent orders from the API
  const { data: ordersResponse, isLoading: isLoadingOrders, error: ordersError } = useQuery<OrdersApiResponse>({
    queryKey: ['/api/orders', { limit: 5 }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?limit=5', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch recent orders');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Extract orders from the response
  const recentOrders = ordersResponse?.orders;
  
  // Fetch analytics data from the API
  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery<ApiAnalytics>({
    queryKey: ['/api/analytics/dashboard'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/dashboard', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 300000, // 5 minutes
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

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back to RadOrderPad"
      >
        <Button onClick={() => navigateTo(AppPage.NewOrder)}>
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
          {isLoadingAnalytics ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading analytics...</span>
            </div>
          ) : analyticsError ? (
            <div className="text-center py-12 text-red-500">
              <p>Error loading analytics data. Please try again later.</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <FileText className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.stats.total_orders || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">+23% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Studies</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.stats.completed_studies || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">{analytics?.stats.validation_success_rate || 0}% completion rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                  <Users className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.stats.active_patients || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">+12 this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Activity className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.stats.pending_orders || 0}</div>
                  <p className="text-xs text-slate-500 mt-1">Awaiting processing</p>
                </CardContent>
              </Card>
            </div>
          )}
          
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
              {isLoadingOrders ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading orders...</span>
                </div>
              ) : ordersError ? (
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
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Modality</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders && recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.patient_first_name} {order.patient_last_name}
                          </TableCell>
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
                          <TableCell>{order.modality || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          No recent orders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="border-t bg-slate-50 px-6 py-3">
              <div className="flex items-center justify-between w-full">
                <p className="text-xs text-slate-500">Showing {recentOrders?.length || 0} of {ordersResponse?.pagination.total || analytics?.stats.total_orders || 0} orders</p>
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
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center justify-center py-6 px-4"
                  onClick={() => navigateTo(AppPage.NewOrder)}
                >
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
                {isLoadingAnalytics ? (
                  <div className="flex justify-center items-center h-80 w-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Loading chart data...</span>
                  </div>
                ) : analyticsError ? (
                  <div className="text-center h-80 w-full flex flex-col justify-center items-center">
                    <p className="text-red-500">Error loading chart data</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={analytics?.activity_data}
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
                )}
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
                {isLoadingAnalytics ? (
                  <div className="flex justify-center items-center h-64 w-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Loading chart data...</span>
                  </div>
                ) : analyticsError ? (
                  <div className="text-center h-64 w-full flex flex-col justify-center items-center">
                    <p className="text-red-500">Error loading chart data</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart width={400} height={300}>
                        <Pie
                          data={analytics?.modality_distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analytics?.modality_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
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
                      <p className="text-2xl font-bold">{analytics?.stats.avg_completion_time.toFixed(1) || 0} days</p>
                    </div>
                    <ArrowUpCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Validation Success Rate</p>
                      <p className="text-2xl font-bold">{analytics?.stats.validation_success_rate.toFixed(1) || 0}%</p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Orders this Quarter</p>
                      <p className="text-2xl font-bold">{analytics?.stats.orders_this_quarter || 0}</p>
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