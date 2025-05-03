import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  Users,
  Building,
  Link,
  AlertCircle,
  Clock,
  Database,
  Server,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  FileText,
  User,
  Settings,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";
import { UserRole } from "@/lib/roles";
import PageHeader from "@/components/layout/PageHeader";

// Mock data
const kpiData = {
  systemThroughput: {
    ordersValidatedHour: 42,
    ordersValidatedDay: 387,
    ordersSentHour: 38,
    ordersSentDay: 356,
    llmFallbackRateHour: 0.8,
    llmFallbackRateDay: 1.2
  },
  userActivity: {
    activeUsersNow: 123,
    activeUsers15Min: 98,
    newSignupsDay: 5,
    newSignupsWeek: 22
  },
  financialHealth: {
    paymentFailuresDay: 3,
    organizationsInPurgatory: 2
  }
};

const queuesData = {
  pendingAdmin: {
    count: 32,
    trend: "up" as const
  },
  pendingRadiology: {
    count: 27,
    trend: "down" as const
  },
  avgTimeInStatusAdmin: "2h 14m",
  avgTimeInStatusRadiology: "4h 22m"
};

const systemHealthData = {
  apiPerformance: {
    errorRate: 0.3,
    keyEndpointLatencyP90: 230,
    keyEndpointLatencyP99: 520
  },
  databaseHealth: {
    cpuUtil: 42,
    connectionCount: 78
  },
  cacheHealth: {
    hitRate: 96.7,
    memoryUtil: 37.2
  },
  llmServiceStatus: {
    openAiErrorRate: 0.1,
    anthropicErrorRate: 0.0
  }
};

// Alerts mock data
const alerts = [
  {
    id: 1,
    level: "critical",
    message: "High API error rate detected in validation endpoints",
    timestamp: "2025-05-03T08:23:12Z"
  },
  {
    id: 2,
    level: "warning",
    message: "DB connection count approaching configured limit",
    timestamp: "2025-05-03T07:45:33Z"
  }
];

interface SuperAdminDashboardProps {
  navigateTo?: (page: string) => void;
}

const SuperAdminDashboard = ({ navigateTo }: SuperAdminDashboardProps) => {
  const [selectedOverviewTab, setSelectedOverviewTab] = useState("overview");

  // Helper function to render trend indicator
  const renderTrend = (value: number, trend: "up" | "down" | "neutral", positiveIsGood = true) => {
    let color = "text-slate-500";
    let Icon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : ChevronRight;
    
    if (trend === "up") {
      color = positiveIsGood ? "text-green-500" : "text-red-500";
    } else if (trend === "down") {
      color = positiveIsGood ? "text-red-500" : "text-green-500";
    }
    
    return (
      <span className={`inline-flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {value > 0 ? `${value}%` : ""}
      </span>
    );
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Super Admin Dashboard" 
        description="System-wide monitoring and management"
      >
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>
      </PageHeader>

      <Tabs value={selectedOverviewTab} onValueChange={setSelectedOverviewTab} className="mt-6">
        <TabsList className="w-full flex justify-start mb-6 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="flex-grow max-w-[200px]">Overview</TabsTrigger>
          <TabsTrigger value="organizations" className="flex-grow max-w-[200px]">Organizations</TabsTrigger>
          <TabsTrigger value="users" className="flex-grow max-w-[200px]">Users</TabsTrigger>
          <TabsTrigger value="validation" className="flex-grow max-w-[200px]">Validation</TabsTrigger>
          <TabsTrigger value="billing" className="flex-grow max-w-[200px]">Billing</TabsTrigger>
          <TabsTrigger value="logs" className="flex-grow max-w-[200px]">System Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-red-800 flex items-center mb-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                Active Alerts ({alerts.length})
              </h3>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-start">
                    <div className={`mt-0.5 h-2 w-2 rounded-full ${alert.level === 'critical' ? 'bg-red-600' : 'bg-amber-500'} mr-2`} />
                    <div>
                      <p className="text-sm text-slate-900">{alert.message}</p>
                      <p className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Throughput */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-slate-500" />
                  System Throughput
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2">
                  <div>
                    <p className="text-sm text-slate-500">Orders Validated (1h)</p>
                    <p className="text-xl font-semibold">{kpiData.systemThroughput.ordersValidatedHour}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Orders Validated (24h)</p>
                    <p className="text-xl font-semibold">{kpiData.systemThroughput.ordersValidatedDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Orders Sent (1h)</p>
                    <p className="text-xl font-semibold">{kpiData.systemThroughput.ordersSentHour}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Orders Sent (24h)</p>
                    <p className="text-xl font-semibold">{kpiData.systemThroughput.ordersSentDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">LLM Fallback Rate (1h)</p>
                    <p className="text-xl font-semibold flex items-center">
                      {kpiData.systemThroughput.llmFallbackRateHour}%
                      {renderTrend(0.3, "down", false)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">LLM Fallback Rate (24h)</p>
                    <p className="text-xl font-semibold flex items-center">
                      {kpiData.systemThroughput.llmFallbackRateDay}%
                      {renderTrend(0.1, "up", false)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 mr-2 text-slate-500" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2">
                  <div>
                    <p className="text-sm text-slate-500">Active Users (Now)</p>
                    <p className="text-xl font-semibold">{kpiData.userActivity.activeUsersNow}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Users (15m)</p>
                    <p className="text-xl font-semibold">{kpiData.userActivity.activeUsers15Min}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">New Signups (24h)</p>
                    <p className="text-xl font-semibold flex items-center">
                      {kpiData.userActivity.newSignupsDay}
                      {renderTrend(20, "up", true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">New Signups (7d)</p>
                    <p className="text-xl font-semibold">{kpiData.userActivity.newSignupsWeek}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Health */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-slate-500" />
                  Critical Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Payment Failures (24h)</p>
                    <p className="text-xl font-semibold flex items-center">
                      {kpiData.financialHealth.paymentFailuresDay}
                      {renderTrend(50, "up", false)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Organizations in Purgatory</p>
                    <div className="flex items-center">
                      <p className="text-xl font-semibold">{kpiData.financialHealth.organizationsInPurgatory}</p>
                      {kpiData.financialHealth.organizationsInPurgatory > 0 && (
                        <Button variant="outline" size="sm" className="ml-3">
                          <ChevronRight className="h-4 w-4" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">System Health</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-sm">API</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-sm">DB</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-sm">Cache</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-sm">LLM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Queues and System Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Operational Queues & Bottlenecks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-slate-500" />
                  Operational Queues & Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-slate-500">Pending Admin Queue</p>
                        {queuesData.pendingAdmin.trend === "up" ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Increasing
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            Decreasing
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold mt-1">{queuesData.pendingAdmin.count}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-slate-500">Pending Radiology Queue</p>
                        {queuesData.pendingRadiology.trend === "down" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            Decreasing
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Increasing
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold mt-1">{queuesData.pendingRadiology.count}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div>
                      <p className="text-sm text-slate-500">Avg Time in Admin Queue (24h)</p>
                      <p className="text-lg font-medium">{queuesData.avgTimeInStatusAdmin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Avg Time in Radiology Queue (24h)</p>
                      <p className="text-lg font-medium">{queuesData.avgTimeInStatusRadiology}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Health & Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Server className="h-4 w-4 mr-2 text-slate-500" />
                  System Health & Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm text-slate-500">API Error Rate</p>
                      <p className="text-sm font-medium">{systemHealthData.apiPerformance.errorRate}%</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${systemHealthData.apiPerformance.errorRate > 1 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min(systemHealthData.apiPerformance.errorRate * 10, 100)}%` }}>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-sm text-slate-500">Endpoint Latency (p90)</p>
                      <p className="text-lg font-medium">{systemHealthData.apiPerformance.keyEndpointLatencyP90}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Endpoint Latency (p99)</p>
                      <p className="text-lg font-medium">{systemHealthData.apiPerformance.keyEndpointLatencyP99}ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">DB CPU Utilization</p>
                      <p className="text-lg font-medium">{systemHealthData.databaseHealth.cpuUtil}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">DB Connections</p>
                      <p className="text-lg font-medium">{systemHealthData.databaseHealth.connectionCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Cache Hit Rate</p>
                      <p className="text-lg font-medium">{systemHealthData.cacheHealth.hitRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Cache Memory Util</p>
                      <p className="text-lg font-medium">{systemHealthData.cacheHealth.memoryUtil}%</p>
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm text-slate-500 mb-2">LLM Service Status</p>
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full ${systemHealthData.llmServiceStatus.openAiErrorRate < 1 ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></div>
                        <p className="text-sm">OpenAI: {systemHealthData.llmServiceStatus.openAiErrorRate}% errors</p>
                      </div>
                      <div className="flex items-center">
                        <div className={`h-2.5 w-2.5 rounded-full ${systemHealthData.llmServiceStatus.anthropicErrorRate < 1 ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></div>
                        <p className="text-sm">Anthropic: {systemHealthData.llmServiceStatus.anthropicErrorRate}% errors</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="mt-6">
            <h3 className="text-base font-medium mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center" onClick={() => navigateTo && navigateTo("superadmin-organizations")}>
                <Building className="h-5 w-5 mb-2 text-slate-600" />
                <span className="text-sm font-medium">Organization Management</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center" onClick={() => navigateTo && navigateTo("superadmin-users")}>
                <Users className="h-5 w-5 mb-2 text-slate-600" />
                <span className="text-sm font-medium">User Management</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center" onClick={() => navigateTo && navigateTo("superadmin-billing")}>
                <FileText className="h-5 w-5 mb-2 text-slate-600" />
                <span className="text-sm font-medium">Billing Panel</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center" onClick={() => navigateTo && navigateTo("superadmin-logs")}>
                <Database className="h-5 w-5 mb-2 text-slate-600" />
                <span className="text-sm font-medium">System Logs</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>View and manage all organizations in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">This section will be implemented with organization listing and management functionality.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users across organizations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">This section will be implemented with user listing and management functionality.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation">
          <Card>
            <CardHeader>
              <CardTitle>Validation & LLM Analytics</CardTitle>
              <CardDescription>Manage prompts and view validation performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">This section will be implemented with prompt management and validation analytics.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Credits</CardTitle>
              <CardDescription>Manage organization credits and view billing history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">This section will be implemented with billing management functionality.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>View and analyze system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">This section will be implemented with system log viewing functionality.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;