import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  HelpCircle,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  MailQuestion,
  Gauge,
  CloudCog,
  Network,
  Shield,
  RefreshCw,
  BarChart3,
  ArrowDownUp
} from "lucide-react";
import { UserRole } from "@/lib/roles";
import PageHeader from "@/components/layout/PageHeader";

// Mock data for System Health
const systemHealthData = {
  // Overall system status
  status: "healthy", // "healthy", "degraded", "unhealthy"
  timestamp: "2025-05-03T09:23:45Z",
  
  // Component statuses
  components: {
    api: { status: "healthy", uptime: "14d 7h 23m" },
    database: { status: "healthy", uptime: "30d 12h 45m" },
    cache: { status: "healthy", uptime: "7d 4h 12m" },
    llm: { status: "healthy", uptime: "21d 8h 15m" },
    storage: { status: "healthy", uptime: "30d 12h 45m" },
    email: { status: "healthy", uptime: "30d 12h 45m" },
    background: { status: "healthy", uptime: "14d 2h 30m" }
  },
  
  // Key system metrics
  metrics: {
    uptime: 1243200, // seconds (14 days)
    responseTime: 235, // milliseconds
    errorRate: 0.3, // percentage
    cpuUsage: 42.5, // percentage
    memoryUsage: 58.3, // percentage
    diskUsage: 34.7 // percentage
  }
};

// Mock data for Performance Metrics
const performanceMetricsData = {
  timeframe: "24h", // 1h, 6h, 24h, 7d, 30d
  
  cpu: {
    current: 42.5,
    average: 38.2,
    peak: 76.8,
    timeline: [/* Time series data would go here */]
  },
  
  memory: {
    current: "8.4 GB / 16 GB",
    currentPercentage: 52.5,
    average: "7.9 GB / 16 GB", 
    averagePercentage: 49.4,
    peak: "12.2 GB / 16 GB",
    peakPercentage: 76.3,
    timeline: [/* Time series data would go here */]
  },
  
  disk: {
    current: "156.4 GB / 500 GB",
    currentPercentage: 31.3,
    available: "343.6 GB",
    timeline: [/* Time series data would go here */]
  },
  
  network: {
    inbound: "4.8 Mbps",
    outbound: "2.3 Mbps",
    timeline: [/* Time series data would go here */]
  },
  
  api: {
    requestCount: 42845,
    averageResponseTime: 235, // ms
    errorRate: 0.3, // percentage
    timeline: [/* Time series data would go here */]
  },
  
  database: {
    queryCount: 185624,
    averageQueryTime: 48, // ms
    connectionCount: 78,
    timeline: [/* Time series data would go here */]
  }
};

// Mock data for API Performance
const apiPerformanceData = {
  timeframe: "24h",
  requestCount: 42845,
  averageResponseTime: 235, // ms
  p95ResponseTime: 520, // ms
  p99ResponseTime: 890, // ms
  errorRate: 0.3, // percentage
  
  statusCodeDistribution: {
    "200": 39875,
    "201": 1249,
    "400": 89,
    "401": 45,
    "403": 18,
    "404": 37,
    "500": 32
  },
  
  methodDistribution: {
    "GET": 28576,
    "POST": 9871,
    "PUT": 3245,
    "DELETE": 1153
  },
  
  endpointPerformance: [
    {
      endpoint: "/api/orders",
      requests: 12453,
      avgResponseTime: 185,
      errorRate: 0.1
    },
    {
      endpoint: "/api/validation",
      requests: 8762,
      avgResponseTime: 420,
      errorRate: 0.8
    },
    {
      endpoint: "/api/users",
      requests: 5340,
      avgResponseTime: 150,
      errorRate: 0.0
    }
  ]
};

// Mock data for LLM Performance
const llmPerformanceData = {
  timeframe: "24h",
  requestCount: 8762,
  averageProcessingTime: 2450, // ms
  
  tokenUsage: {
    promptTokens: 4682500,
    completionTokens: 1234500,
    totalTokens: 5917000
  },
  
  costEstimate: 245.80, // USD
  successRate: 98.7, // percentage
  clarificationRate: 5.4, // percentage
  overrideRate: 2.1, // percentage
  
  providerBreakdown: [
    {
      provider: "OpenAI",
      requestCount: 5845,
      avgProcessingTime: 2250,
      errorRate: 0.1,
      tokenUsage: 3845000
    },
    {
      provider: "Anthropic",
      requestCount: 2917,
      avgProcessingTime: 2850,
      errorRate: 0.0,
      tokenUsage: 2072000
    }
  ],
  
  templatePerformance: [
    {
      templateId: 303,
      templateName: "Validation Template v3",
      requestCount: 7845,
      avgProcessingTime: 2400,
      successRate: 98.5
    },
    {
      templateId: 304,
      templateName: "Validation Template v3.1",
      requestCount: 917,
      avgProcessingTime: 2650,
      successRate: 99.2
    }
  ]
};

// Mock data for Error Logs
const errorLogsData = {
  logs: [
    {
      id: "err-4932",
      timestamp: "2025-05-03T08:23:12Z",
      severity: "error",
      service: "api",
      component: "validation",
      message: "High error rate detected in validation endpoints",
      stackTrace: "Error: Rate limit exceeded\n  at RateLimiter.check (/app/services/validation/rate-limiter.ts:45)\n  at ValidationService.validate (/app/services/validation/index.ts:102)",
      context: { requestId: "req-9834", userId: 101 }
    },
    {
      id: "err-4931",
      timestamp: "2025-05-03T07:45:33Z",
      severity: "warning",
      service: "database",
      component: "connection-pool",
      message: "DB connection count approaching configured limit",
      context: { currentConnections: 78, maxConnections: 100 }
    },
    {
      id: "err-4930",
      timestamp: "2025-05-03T05:12:45Z",
      severity: "error",
      service: "llm",
      component: "openai-client",
      message: "OpenAI API timeout after 10000ms",
      stackTrace: "Error: Request timed out after 10000ms\n  at OpenAIClient.request (/app/services/llm/openai.ts:78)\n  at LLMService.validate (/app/services/llm/index.ts:156)",
      context: { requestId: "req-9812", validationId: "val-3456" }
    }
  ],
  pagination: {
    total: 158,
    page: 1,
    limit: 20,
    totalPages: 8
  }
};

// Mock data for User Activity
const userActivityData = {
  activeSessions: [
    {
      id: "sess-3456",
      userId: 101,
      userName: "Dr. Sarah Johnson",
      organizationId: 202,
      organizationName: "Northwest Medical Group",
      ipAddress: "192.168.1.100",
      location: "Seattle, WA",
      lastActivity: "2025-05-03T09:15:23Z",
      duration: "1h 23m"
    },
    {
      id: "sess-3455",
      userId: 102,
      userName: "Dr. Michael Chang",
      organizationId: 202,
      organizationName: "Northwest Medical Group",
      ipAddress: "192.168.1.101",
      location: "Seattle, WA",
      lastActivity: "2025-05-03T09:10:45Z",
      duration: "45m"
    },
    {
      id: "sess-3454",
      userId: 103,
      userName: "Dr. Jennifer Williams",
      organizationId: 203,
      organizationName: "Eastside Primary Care",
      ipAddress: "192.168.2.50",
      location: "Bellevue, WA",
      lastActivity: "2025-05-03T09:05:12Z",
      duration: "2h 15m"
    }
  ],
  stats: {
    currentActiveSessions: 123,
    activeSessionsLast15m: 98,
    averageSessionDuration: "1h 45m",
    peakConcurrentSessions: 156
  }
};

// Mock data for KPIs
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

// Mock data for queues
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
  const [timeframeFilter, setTimeframeFilter] = useState("24h");
  const [selectedHealthTab, setSelectedHealthTab] = useState("overall");
  const [selectedPerformanceTab, setSelectedPerformanceTab] = useState("system");
  const [selectedLogsTab, setSelectedLogsTab] = useState("error");

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

  // Helper function to get status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-amber-500";
      case "unhealthy":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <TabsTrigger value="health" className="flex-grow max-w-[200px]">System Health</TabsTrigger>
          <TabsTrigger value="performance" className="flex-grow max-w-[200px]">Performance</TabsTrigger>
          <TabsTrigger value="logs" className="flex-grow max-w-[200px]">Logs</TabsTrigger>
          <TabsTrigger value="activity" className="flex-grow max-w-[200px]">User Activity</TabsTrigger>
          <TabsTrigger value="alerts" className="flex-grow max-w-[200px]">Alerts</TabsTrigger>
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
                      <p className="text-xs text-slate-500">{formatDate(alert.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Status Banner */}
          <div className={`rounded-lg p-4 flex items-center justify-between ${
            systemHealthData.status === 'healthy' ? 'bg-green-50 border border-green-200' :
            systemHealthData.status === 'degraded' ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-3 ${getStatusColor(systemHealthData.status)}`}></div>
              <div>
                <p className="font-medium">
                  System Status: <span className="capitalize">{systemHealthData.status}</span>
                </p>
                <p className="text-sm text-slate-500">Last updated: {formatDate(systemHealthData.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center">
              <p className="text-sm mr-3">System Uptime: <span className="font-medium">{Math.floor(systemHealthData.metrics.uptime / 86400)}d {Math.floor((systemHealthData.metrics.uptime % 86400) / 3600)}h</span></p>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedOverviewTab("health")}>
                View Details
              </Button>
            </div>
          </div>

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

            {/* Critical Metrics */}
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
                        <Button variant="outline" size="sm" className="ml-3" onClick={() => navigateTo && navigateTo("superadmin-organizations")}>
                          <ChevronRight className="h-4 w-4" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Component Status</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-2 mt-1">
                      {Object.entries(systemHealthData.components).map(([key, value]) => (
                        <div key={key} className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(value.status)} mr-1`}></div>
                          <span className="text-sm capitalize">{key}</span>
                        </div>
                      ))}
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
                      <p className="text-sm font-medium">{systemHealthData.metrics.errorRate}%</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${systemHealthData.metrics.errorRate > 1 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${Math.min(systemHealthData.metrics.errorRate * 10, 100)}%` }}>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-sm text-slate-500">Avg Response Time</p>
                      <p className="text-lg font-medium">{systemHealthData.metrics.responseTime} ms</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">API Requests (24h)</p>
                      <p className="text-lg font-medium">{apiPerformanceData.requestCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">CPU Usage</p>
                      <p className="text-lg font-medium">{systemHealthData.metrics.cpuUsage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Memory Usage</p>
                      <p className="text-lg font-medium">{systemHealthData.metrics.memoryUsage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Disk Usage</p>
                      <p className="text-lg font-medium">{systemHealthData.metrics.diskUsage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">DB Connections</p>
                      <p className="text-lg font-medium">{performanceMetricsData.database.connectionCount}</p>
                    </div>
                  </div>
                  
                  <div className="mt-1">
                    <p className="text-sm text-slate-500 mb-2">LLM Service Status</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {llmPerformanceData.providerBreakdown.map(provider => (
                        <div key={provider.provider} className="flex items-center">
                          <div className={`h-2.5 w-2.5 rounded-full ${provider.errorRate < 1 ? 'bg-green-500' : 'bg-red-500'} mr-1.5`}></div>
                          <p className="text-sm">{provider.provider}: {provider.errorRate}% errors</p>
                        </div>
                      ))}
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

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full ${
                systemHealthData.status === 'healthy' ? 'bg-green-100 text-green-800' :
                systemHealthData.status === 'degraded' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              } flex items-center`}>
                <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(systemHealthData.status)}`}></div>
                <span className="font-medium capitalize">{systemHealthData.status}</span>
              </div>
              <p className="text-sm text-slate-500">Last updated: {formatDate(systemHealthData.timestamp)}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs value={selectedHealthTab} onValueChange={setSelectedHealthTab}>
            <TabsList className="w-full grid grid-cols-7">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="cache">Cache</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overall" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Gauge className="h-4 w-4 mr-2 text-slate-500" />
                      System Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">System Uptime</p>
                        <p className="text-lg font-medium">
                          {Math.floor(systemHealthData.metrics.uptime / 86400)}d {Math.floor((systemHealthData.metrics.uptime % 86400) / 3600)}h {Math.floor((systemHealthData.metrics.uptime % 3600) / 60)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Average Response Time</p>
                        <p className="text-lg font-medium">{systemHealthData.metrics.responseTime} ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Error Rate</p>
                        <div className="flex items-center">
                          <p className="text-lg font-medium">{systemHealthData.metrics.errorRate}%</p>
                          <div className="ml-auto flex items-center text-amber-500">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">0.1%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Cpu className="h-4 w-4 mr-2 text-slate-500" />
                      Resource Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-slate-500">CPU Usage</p>
                          <p className="text-sm font-medium">{systemHealthData.metrics.cpuUsage}%</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${systemHealthData.metrics.cpuUsage > 80 ? 'bg-red-500' : systemHealthData.metrics.cpuUsage > 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                            style={{ width: `${systemHealthData.metrics.cpuUsage}%` }}>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-slate-500">Memory Usage</p>
                          <p className="text-sm font-medium">{systemHealthData.metrics.memoryUsage}%</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${systemHealthData.metrics.memoryUsage > 80 ? 'bg-red-500' : systemHealthData.metrics.memoryUsage > 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                            style={{ width: `${systemHealthData.metrics.memoryUsage}%` }}>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-slate-500">Disk Usage</p>
                          <p className="text-sm font-medium">{systemHealthData.metrics.diskUsage}%</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${systemHealthData.metrics.diskUsage > 80 ? 'bg-red-500' : systemHealthData.metrics.diskUsage > 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                            style={{ width: `${systemHealthData.metrics.diskUsage}%` }}>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <CloudCog className="h-4 w-4 mr-2 text-slate-500" />
                      Component Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(systemHealthData.components).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(value.status)} mr-2`}></div>
                            <p className="text-sm capitalize">{key}</p>
                          </div>
                          <div className="flex items-center">
                            <p className="text-sm text-slate-500">Uptime: {value.uptime}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Health Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Error Rate</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(systemHealthData.components).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium capitalize">{key}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className={`h-2 w-2 rounded-full ${getStatusColor(value.status)} mr-2`}></div>
                              <span className="capitalize">{value.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>{value.uptime}</TableCell>
                          <TableCell>
                            {key === 'api' ? `${systemHealthData.metrics.responseTime} ms` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {key === 'api' ? `${systemHealthData.metrics.errorRate}%` : 
                             key === 'llm' ? '0.1%' : 
                             '0.0%'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedHealthTab(key)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2 text-slate-500" />
                    API Service Health
                  </CardTitle>
                  <CardDescription>
                    Detailed status and metrics for the API service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full ${
                        systemHealthData.components.api.status === 'healthy' ? 'bg-green-100 text-green-800' :
                        systemHealthData.components.api.status === 'degraded' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      } flex items-center`}>
                        <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(systemHealthData.components.api.status)}`}></div>
                        <span className="font-medium capitalize">{systemHealthData.components.api.status}</span>
                      </div>
                      <p className="text-sm">Uptime: <span className="font-medium">{systemHealthData.components.api.uptime}</span></p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Request Count (24h)</p>
                        <p className="text-2xl font-bold">{apiPerformanceData.requestCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Avg Response Time</p>
                        <p className="text-2xl font-bold">{apiPerformanceData.averageResponseTime} ms</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Error Rate</p>
                        <p className="text-2xl font-bold">{apiPerformanceData.errorRate}%</p>
                      </div>
                    </div>
                    
                    {/* API Endpoint Performance */}
                    <div>
                      <h3 className="text-base font-medium mb-3">Endpoint Performance</h3>
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Endpoint</TableHead>
                              <TableHead>Requests</TableHead>
                              <TableHead>Avg Response Time</TableHead>
                              <TableHead>Error Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apiPerformanceData.endpointPerformance.map(endpoint => (
                              <TableRow key={endpoint.endpoint}>
                                <TableCell className="font-medium">{endpoint.endpoint}</TableCell>
                                <TableCell>{endpoint.requests.toLocaleString()}</TableCell>
                                <TableCell>{endpoint.avgResponseTime} ms</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`
                                    ${endpoint.errorRate > 1 ? 'bg-red-50 text-red-700 border-red-200' :
                                      endpoint.errorRate > 0.5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-green-50 text-green-700 border-green-200'}
                                  `}>
                                    {endpoint.errorRate}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    {/* Status Code Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-base font-medium mb-3">Status Code Distribution</h3>
                        <div className="space-y-2">
                          {Object.entries(apiPerformanceData.statusCodeDistribution).map(([code, count]) => (
                            <div key={code} className="flex items-center">
                              <div className={`w-12 text-sm font-medium ${
                                code.startsWith('2') ? 'text-green-600' :
                                code.startsWith('4') ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                                {code}
                              </div>
                              <div className="flex-1 ml-2">
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      code.startsWith('2') ? 'bg-green-500' :
                                      code.startsWith('4') ? 'bg-amber-500' :
                                      'bg-red-500'
                                    }`} 
                                    style={{ width: `${(count / apiPerformanceData.requestCount) * 100}%` }}>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 text-sm text-slate-500 w-16 text-right">
                                {((count / apiPerformanceData.requestCount) * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-medium mb-3">Method Distribution</h3>
                        <div className="space-y-2">
                          {Object.entries(apiPerformanceData.methodDistribution).map(([method, count]) => (
                            <div key={method} className="flex items-center">
                              <div className="w-16 text-sm font-medium">
                                {method}
                              </div>
                              <div className="flex-1 ml-2">
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                  <div 
                                    className="h-2 rounded-full bg-blue-500" 
                                    style={{ width: `${(count / apiPerformanceData.requestCount) * 100}%` }}>
                                  </div>
                                </div>
                              </div>
                              <div className="ml-2 text-sm text-slate-500 w-16 text-right">
                                {((count / apiPerformanceData.requestCount) * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Add content for other tabs (database, cache, llm, storage, background) here */}
            <TabsContent value="database" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Database Service Health</CardTitle>
                  <CardDescription>
                    Detailed status and metrics for the Database service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">This section contains database health metrics.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cache" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Service Health</CardTitle>
                  <CardDescription>
                    Detailed status and metrics for the Cache service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">This section contains cache health metrics.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="llm" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>LLM Service Health</CardTitle>
                  <CardDescription>
                    Detailed status and metrics for the LLM service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">This section contains LLM health metrics.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="storage" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Service Health</CardTitle>
                  <CardDescription>
                    Detailed status and metrics for the Storage service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">This section contains storage health metrics.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="background" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Background Jobs Health</CardTitle>
                  <CardDescription>
                    Detailed status and metrics for Background job processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">This section contains background jobs health metrics.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Performance Metrics</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="6h">Last 6 Hours</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Tabs value={selectedPerformanceTab} onValueChange={setSelectedPerformanceTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="llm">LLM</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Cpu className="h-4 w-4 mr-2 text-slate-500" />
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Current</p>
                        <div className="flex items-center">
                          <p className="text-lg font-medium">{performanceMetricsData.cpu.current}%</p>
                          <div className="ml-auto flex items-center text-amber-500">
                            <ArrowUp className="h-4 w-4 mr-1" />
                            <span className="text-sm">4.3%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Average</p>
                        <p className="text-lg font-medium">{performanceMetricsData.cpu.average}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Peak</p>
                        <p className="text-lg font-medium">{performanceMetricsData.cpu.peak}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-slate-500" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Current</p>
                        <div className="flex items-center">
                          <p className="text-lg font-medium">{performanceMetricsData.memory.current}</p>
                          <div className="ml-auto flex items-center text-green-500">
                            <ArrowDown className="h-4 w-4 mr-1" />
                            <span className="text-sm">3.1%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Average</p>
                        <p className="text-lg font-medium">{performanceMetricsData.memory.average}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Peak</p>
                        <p className="text-lg font-medium">{performanceMetricsData.memory.peak}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <HardDrive className="h-4 w-4 mr-2 text-slate-500" />
                      Disk Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-500">Current</p>
                        <p className="text-lg font-medium">{performanceMetricsData.disk.current}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Available</p>
                        <p className="text-lg font-medium">{performanceMetricsData.disk.available}</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <p className="text-sm text-slate-500">Usage</p>
                          <p className="text-sm font-medium">{performanceMetricsData.disk.currentPercentage}%</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${performanceMetricsData.disk.currentPercentage > 80 ? 'bg-red-500' : performanceMetricsData.disk.currentPercentage > 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                            style={{ width: `${performanceMetricsData.disk.currentPercentage}%` }}>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Network className="h-4 w-4 mr-2 text-slate-500" />
                      Network Traffic
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Inbound Traffic</p>
                        <p className="text-2xl font-bold">{performanceMetricsData.network.inbound}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Outbound Traffic</p>
                        <p className="text-2xl font-bold">{performanceMetricsData.network.outbound}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-2">Network Timeline</p>
                      <div className="h-32 flex items-end">
                        <div className="text-center text-xs text-slate-500">Network timeline visualization would be shown here</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <Database className="h-4 w-4 mr-2 text-slate-500" />
                      Database Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Query Count (24h)</p>
                        <p className="text-2xl font-bold">{performanceMetricsData.database.queryCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm text-slate-500 mb-1">Avg Query Time</p>
                        <p className="text-2xl font-bold">{performanceMetricsData.database.averageQueryTime} ms</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <p className="text-sm text-slate-500">Connections</p>
                        <p className="text-sm">{performanceMetricsData.database.connectionCount} <span className="text-slate-500">/ 100</span></p>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${performanceMetricsData.database.connectionCount > 80 ? 'bg-red-500' : performanceMetricsData.database.connectionCount > 60 ? 'bg-amber-500' : 'bg-green-500'}`} 
                          style={{ width: `${performanceMetricsData.database.connectionCount}%` }}>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="api" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Performance Metrics</CardTitle>
                  <CardDescription>
                    Request rates, response times, and error rates for API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">API performance metrics content would be shown here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="llm" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <ArrowDownUp className="h-4 w-4 mr-2 text-slate-500" />
                        LLM Request Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500">Total Requests (24h)</p>
                          <p className="text-2xl font-bold">{llmPerformanceData.requestCount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Avg Processing Time</p>
                          <p className="text-lg font-medium">{llmPerformanceData.averageProcessingTime} ms</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Success Rate</p>
                          <div className="flex items-center">
                            <p className="text-lg font-medium">{llmPerformanceData.successRate}%</p>
                            <div className="ml-auto flex items-center text-green-500">
                              <ArrowUp className="h-4 w-4 mr-1" />
                              <span className="text-sm">0.3%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Server className="h-4 w-4 mr-2 text-slate-500" />
                        Token Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500">Total Tokens</p>
                          <p className="text-2xl font-bold">{(llmPerformanceData.tokenUsage.totalTokens / 1000000).toFixed(2)}M</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Prompt Tokens</p>
                          <p className="text-lg font-medium">{(llmPerformanceData.tokenUsage.promptTokens / 1000000).toFixed(2)}M <span className="text-slate-500 text-sm">({Math.round(llmPerformanceData.tokenUsage.promptTokens / llmPerformanceData.tokenUsage.totalTokens * 100)}%)</span></p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Completion Tokens</p>
                          <p className="text-lg font-medium">{(llmPerformanceData.tokenUsage.completionTokens / 1000000).toFixed(2)}M <span className="text-slate-500 text-sm">({Math.round(llmPerformanceData.tokenUsage.completionTokens / llmPerformanceData.tokenUsage.totalTokens * 100)}%)</span></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2 text-slate-500" />
                        Validation Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-500">Cost Estimate (24h)</p>
                          <p className="text-2xl font-bold">${llmPerformanceData.costEstimate.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Clarification Rate</p>
                          <p className="text-lg font-medium">{llmPerformanceData.clarificationRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Override Rate</p>
                          <p className="text-lg font-medium">{llmPerformanceData.overrideRate}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Provider Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Provider</TableHead>
                            <TableHead>Requests</TableHead>
                            <TableHead>Avg Time</TableHead>
                            <TableHead>Error Rate</TableHead>
                            <TableHead>Token Usage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {llmPerformanceData.providerBreakdown.map(provider => (
                            <TableRow key={provider.provider}>
                              <TableCell className="font-medium">{provider.provider}</TableCell>
                              <TableCell>{provider.requestCount.toLocaleString()}</TableCell>
                              <TableCell>{provider.avgProcessingTime} ms</TableCell>
                              <TableCell>{provider.errorRate}%</TableCell>
                              <TableCell>{(provider.tokenUsage / 1000000).toFixed(2)}M</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Template Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Template</TableHead>
                            <TableHead>Requests</TableHead>
                            <TableHead>Avg Time</TableHead>
                            <TableHead>Success Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {llmPerformanceData.templatePerformance.map(template => (
                            <TableRow key={template.templateId}>
                              <TableCell className="font-medium">{template.templateName}</TableCell>
                              <TableCell>{template.requestCount.toLocaleString()}</TableCell>
                              <TableCell>{template.avgProcessingTime} ms</TableCell>
                              <TableCell>{template.successRate}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">System Logs</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          <Tabs value={selectedLogsTab} onValueChange={setSelectedLogsTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="error">Error Logs</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="security">Security Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="error" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-slate-500" />
                    System Error Logs
                  </CardTitle>
                  <CardDescription>
                    View and analyze system errors and exceptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorLogsData.logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(log.timestamp)}</TableCell>
                          <TableCell className="capitalize">{log.service}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`
                              ${log.severity === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                log.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                log.severity === 'critical' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'}
                            `}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">{log.message}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <div className="text-sm text-slate-500">
                      Showing 1-{errorLogsData.logs.length} of {errorLogsData.pagination.total} logs
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="audit" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    View and analyze system audit logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Audit logs would be shown here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Logs</CardTitle>
                  <CardDescription>
                    View and analyze security-related logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500">Security logs would be shown here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User Activity</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 mr-2 text-slate-500" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-3xl font-bold">{userActivityData.stats.currentActiveSessions}</p>
                  <div className="ml-auto flex items-center text-green-500">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">25%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-slate-500" />
                  Active (15m)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-3xl font-bold">{userActivityData.stats.activeSessionsLast15m}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-slate-500" />
                  Avg Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-3xl font-bold">{userActivityData.stats.averageSessionDuration}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-slate-500" />
                  Peak Concurrent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-3xl font-bold">{userActivityData.stats.peakConcurrentSessions}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-slate-500" />
                Active User Sessions
              </CardTitle>
              <CardDescription>
                Users currently logged into the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActivityData.activeSessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.userName}</TableCell>
                      <TableCell>{session.organizationName}</TableCell>
                      <TableCell>{session.ipAddress}</TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(session.lastActivity)}</TableCell>
                      <TableCell>{session.duration}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4 mr-1" />
                          View User
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 mt-4">
                <div className="text-sm text-slate-500">
                  Showing 1-{userActivityData.activeSessions.length} of {userActivityData.stats.currentActiveSessions} sessions
                </div>
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Critical and warning alerts for the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500">System alerts would be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;