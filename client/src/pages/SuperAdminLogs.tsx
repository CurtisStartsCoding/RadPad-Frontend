import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Calendar,
  Download,
  Filter,
  Check,
  X,
  AlertTriangle,
  Info,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Database,
  Bot,
  CreditCard,
  AlertCircle,
  ArrowDownToLine,
  FileJson,
  Zap,
  Clock
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Separator } from "@/components/ui/separator";

// Mock validation logs data
const validationLogs = [
  {
    id: 123,
    orderId: 456,
    validationAttemptId: 789,
    userId: 101,
    userName: "Dr. Sarah Johnson",
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    llmProvider: "Anthropic",
    modelName: "claude-3.7",
    promptTemplateId: 303,
    promptTemplateName: "Validation Template v3",
    promptTokens: 1500,
    completionTokens: 500,
    totalTokens: 2000,
    latencyMs: 2500,
    status: "appropriate",
    errorMessage: null,
    createdAt: "2025-05-03T14:30:00.000Z"
  },
  {
    id: 124,
    orderId: 457,
    validationAttemptId: 790,
    userId: 102,
    userName: "Dr. Michael Chang",
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    llmProvider: "OpenAI",
    modelName: "gpt-4.5-turbo",
    promptTemplateId: 303,
    promptTemplateName: "Validation Template v3",
    promptTokens: 1200,
    completionTokens: 450,
    totalTokens: 1650,
    latencyMs: 1800,
    status: "appropriate",
    errorMessage: null,
    createdAt: "2025-05-03T13:45:00.000Z"
  },
  {
    id: 125,
    orderId: 458,
    validationAttemptId: 791,
    userId: 103,
    userName: "Dr. Jennifer Williams",
    organizationId: 203,
    organizationName: "Eastside Primary Care",
    llmProvider: "Anthropic",
    modelName: "claude-3.7",
    promptTemplateId: 303,
    promptTemplateName: "Validation Template v3",
    promptTokens: 1600,
    completionTokens: 550,
    totalTokens: 2150,
    latencyMs: 2700,
    status: "inappropriate",
    errorMessage: null,
    createdAt: "2025-05-03T12:15:00.000Z"
  },
  {
    id: 126,
    orderId: 459,
    validationAttemptId: 792,
    userId: 104,
    userName: "Dr. David Rodriguez",
    organizationId: 204,
    organizationName: "Central Radiology Associates",
    llmProvider: "OpenAI",
    modelName: "gpt-4.5-turbo",
    promptTemplateId: 303,
    promptTemplateName: "Validation Template v3",
    promptTokens: 1300,
    completionTokens: 0,
    totalTokens: 1300,
    latencyMs: 5000,
    status: "error",
    errorMessage: "LLM service timeout after 5000ms",
    createdAt: "2025-05-03T11:30:00.000Z"
  },
  {
    id: 127,
    orderId: 460,
    validationAttemptId: 793,
    userId: 105,
    userName: "Dr. Amanda Taylor",
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    llmProvider: "Anthropic",
    modelName: "claude-3.7",
    promptTemplateId: 304,
    promptTemplateName: "Validation Template v3.1",
    promptTokens: 1550,
    completionTokens: 520,
    totalTokens: 2070,
    latencyMs: 2600,
    status: "needs_clarification",
    errorMessage: null,
    createdAt: "2025-05-03T10:45:00.000Z"
  }
];

// Mock credit usage logs data
const creditUsageLogs = [
  {
    id: 123,
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    userId: 101,
    userName: "Dr. Sarah Johnson",
    orderId: 456,
    validationAttemptId: 789,
    tokensBurned: 1,
    actionType: "order_submission",
    createdAt: "2025-05-03T14:30:00.000Z"
  },
  {
    id: 124,
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    userId: 102,
    userName: "Dr. Michael Chang",
    orderId: 457,
    validationAttemptId: 790,
    tokensBurned: 1,
    actionType: "order_submission",
    createdAt: "2025-05-03T13:45:00.000Z"
  },
  {
    id: 125,
    organizationId: 203,
    organizationName: "Eastside Primary Care",
    userId: 103,
    userName: "Dr. Jennifer Williams",
    orderId: 458,
    validationAttemptId: 791,
    tokensBurned: 1,
    actionType: "order_submission",
    createdAt: "2025-05-03T12:15:00.000Z"
  },
  {
    id: 126,
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    userId: null,
    userName: "System",
    orderId: null,
    validationAttemptId: null,
    tokensBurned: 500,
    actionType: "credit_purchase",
    createdAt: "2025-05-03T09:30:00.000Z"
  },
  {
    id: 127,
    organizationId: 203,
    organizationName: "Eastside Primary Care",
    userId: null,
    userName: "System",
    orderId: null,
    validationAttemptId: null,
    tokensBurned: 200,
    actionType: "credit_purchase",
    createdAt: "2025-05-03T08:15:00.000Z"
  }
];

// Mock purgatory events data
const purgatoryEvents = [
  {
    id: 123,
    organizationId: 202,
    organizationName: "Northwest Medical Group",
    reason: "Suspicious activity detected",
    triggeredBy: "super_admin",
    triggeredById: 101,
    triggeredByName: "System Administrator",
    status: "to_purgatory",
    createdAt: "2025-05-03T14:30:00.000Z",
    resolvedAt: null
  },
  {
    id: 124,
    organizationId: 203,
    organizationName: "Eastside Primary Care",
    reason: "Payment failure",
    triggeredBy: "system",
    triggeredById: null,
    triggeredByName: "Automated System",
    status: "to_purgatory",
    createdAt: "2025-05-02T09:15:00.000Z",
    resolvedAt: "2025-05-03T11:30:00.000Z"
  },
  {
    id: 125,
    organizationId: 204,
    organizationName: "Central Radiology Associates",
    reason: "Compliance review",
    triggeredBy: "super_admin",
    triggeredById: 101,
    triggeredByName: "System Administrator",
    status: "to_purgatory",
    createdAt: "2025-05-01T16:45:00.000Z",
    resolvedAt: "2025-05-02T14:20:00.000Z"
  }
];

const SuperAdminLogs = () => {
  // State for validation logs
  const [validationTab, setValidationTab] = useState<string>("enhanced");
  const [validationSearchTerm, setValidationSearchTerm] = useState<string>("");
  const [validationOrgFilter, setValidationOrgFilter] = useState<string>("all");
  const [validationStatusFilter, setValidationStatusFilter] = useState<string>("all");
  const [validationProviderFilter, setValidationProviderFilter] = useState<string>("all");
  const [validationDatePreset, setValidationDatePreset] = useState<string>("today");
  const [validationSortBy, setValidationSortBy] = useState<string>("created_at");
  const [validationSortDir, setValidationSortDir] = useState<string>("desc");
  
  // State for credit usage logs
  const [creditSearchTerm, setCreditSearchTerm] = useState<string>("");
  const [creditOrgFilter, setCreditOrgFilter] = useState<string>("all");
  const [creditActionFilter, setCreditActionFilter] = useState<string>("all");
  const [creditDateRange, setCreditDateRange] = useState<string>("all");
  
  // State for purgatory events
  const [purgatorySearchTerm, setPurgatorySearchTerm] = useState<string>("");
  const [purgatoryStatusFilter, setPurgatoryStatusFilter] = useState<string>("all");
  const [purgatoryDateRange, setPurgatoryDateRange] = useState<string>("all");
  
  // State for current tab
  const [currentTab, setCurrentTab] = useState<string>("validation");
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format milliseconds to a readable format
  const formatLatency = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  };
  
  // Get status badge for validation logs
  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case "appropriate":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Appropriate</Badge>;
      case "inappropriate":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Inappropriate</Badge>;
      case "needs_clarification":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Needs Clarification</Badge>;
      case "error":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Error</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">{status}</Badge>;
    }
  };
  
  // Get badge for credit usage action type
  const getCreditActionBadge = (actionType: string) => {
    switch (actionType) {
      case "order_submission":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Order Submission</Badge>;
      case "credit_purchase":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Purchase</Badge>;
      case "credit_adjustment":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Adjustment</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">{actionType}</Badge>;
    }
  };
  
  // Get badge for purgatory status
  const getPurgatoryStatusBadge = (status: string) => {
    switch (status) {
      case "to_purgatory":
        return <Badge className="bg-red-100 text-red-800 border-red-300">To Purgatory</Badge>;
      case "from_purgatory":
        return <Badge className="bg-green-100 text-green-800 border-green-300">From Purgatory</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">{status}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="System Logs" 
        description="View and analyze system logs across RadOrderPad"
      >
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </PageHeader>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-6">
        <TabsList className="w-full flex justify-start mb-6 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="validation" className="flex-grow max-w-[200px]">
            <Bot className="h-4 w-4 mr-2" />
            Validation Logs
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex-grow max-w-[200px]">
            <CreditCard className="h-4 w-4 mr-2" />
            Credit Usage
          </TabsTrigger>
          <TabsTrigger value="purgatory" className="flex-grow max-w-[200px]">
            <AlertCircle className="h-4 w-4 mr-2" />
            Purgatory Events
          </TabsTrigger>
        </TabsList>

        {/* Validation Logs Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LLM Validation Logs</CardTitle>
              <CardDescription>
                View validation requests, responses, and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={validationTab} onValueChange={setValidationTab} className="w-full">
                <TabsList className="w-full mb-4 grid grid-cols-2">
                  <TabsTrigger value="basic">Basic View</TabsTrigger>
                  <TabsTrigger value="enhanced">Enhanced View</TabsTrigger>
                </TabsList>
                
                {/* Enhanced Validation Logs View */}
                <TabsContent value="enhanced">
                  <div className="space-y-4">
                    {/* Search and filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                          type="search"
                          placeholder="Search logs..."
                          className="pl-9"
                          value={validationSearchTerm}
                          onChange={(e) => setValidationSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={validationStatusFilter} onValueChange={setValidationStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="appropriate">Appropriate</SelectItem>
                            <SelectItem value="inappropriate">Inappropriate</SelectItem>
                            <SelectItem value="needs_clarification">Needs Clarification</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={validationProviderFilter} onValueChange={setValidationProviderFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Providers</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={validationDatePreset} onValueChange={setValidationDatePreset}>
                          <SelectTrigger>
                            <SelectValue placeholder="Time Range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                            <SelectItem value="last_month">Last Month</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={validationOrgFilter} onValueChange={setValidationOrgFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Organization" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Organizations</SelectItem>
                            <SelectItem value="202">Northwest Medical Group</SelectItem>
                            <SelectItem value="203">Eastside Primary Care</SelectItem>
                            <SelectItem value="204">Central Radiology Associates</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Validation Logs Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[180px]">
                              <Button 
                                variant="ghost" 
                                className="h-8 p-0 font-medium"
                                onClick={() => {
                                  setValidationSortBy("created_at");
                                  setValidationSortDir(validationSortDir === "asc" ? "desc" : "asc");
                                }}
                              >
                                Timestamp
                                {validationSortBy === "created_at" && (
                                  validationSortDir === "asc" ? 
                                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead>User / Organization</TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="h-8 p-0 font-medium"
                                onClick={() => {
                                  setValidationSortBy("status");
                                  setValidationSortDir(validationSortDir === "asc" ? "desc" : "asc");
                                }}
                              >
                                Status
                                {validationSortBy === "status" && (
                                  validationSortDir === "asc" ? 
                                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead>Provider / Model</TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="h-8 p-0 font-medium"
                                onClick={() => {
                                  setValidationSortBy("latency_ms");
                                  setValidationSortDir(validationSortDir === "asc" ? "desc" : "asc");
                                }}
                              >
                                Latency
                                {validationSortBy === "latency_ms" && (
                                  validationSortDir === "asc" ? 
                                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button 
                                variant="ghost" 
                                className="h-8 p-0 font-medium"
                                onClick={() => {
                                  setValidationSortBy("total_tokens");
                                  setValidationSortDir(validationSortDir === "asc" ? "desc" : "asc");
                                }}
                              >
                                Tokens
                                {validationSortBy === "total_tokens" && (
                                  validationSortDir === "asc" ? 
                                    <ArrowUp className="ml-2 h-4 w-4" /> : 
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                )}
                              </Button>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationLogs.map(log => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">
                                {formatDateTime(log.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div>{log.userName}</div>
                                  <Badge variant="outline" className="bg-slate-50">
                                    {log.organizationName}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getValidationStatusBadge(log.status)}
                                {log.errorMessage && (
                                  <div className="mt-1 text-xs text-red-600">{log.errorMessage}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div>{log.llmProvider}</div>
                                  <div className="text-xs text-slate-500">{log.modelName}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`font-medium ${log.latencyMs > 3000 ? 'text-amber-600' : log.latencyMs > 5000 ? 'text-red-600' : ''}`}>
                                  {formatLatency(log.latencyMs)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div>{log.totalTokens.toLocaleString()}</div>
                                  <div className="text-xs text-slate-500">
                                    {log.promptTokens.toLocaleString()} in / {log.completionTokens.toLocaleString()} out
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <FileJson className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        Showing 1-5 of 127 logs
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" disabled>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button variant="outline" size="sm">
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Basic Validation Logs View */}
                <TabsContent value="basic">
                  <div className="text-center py-8">
                    <p className="text-slate-500">Basic view is similar to enhanced view but with fewer filtering options and details.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Usage Tab */}
        <TabsContent value="credits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Usage Logs</CardTitle>
              <CardDescription>
                Track credit consumption and purchases across organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="search"
                      placeholder="Search by user or organization..."
                      className="pl-9"
                      value={creditSearchTerm}
                      onChange={(e) => setCreditSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={creditActionFilter} onValueChange={setCreditActionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Action Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="order_submission">Order Submission</SelectItem>
                        <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                        <SelectItem value="credit_adjustment">Credit Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={creditOrgFilter} onValueChange={setCreditOrgFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
                        <SelectItem value="202">Northwest Medical Group</SelectItem>
                        <SelectItem value="203">Eastside Primary Care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={creditDateRange} onValueChange={setCreditDateRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Time Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                        <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Credit Usage Logs Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditUsageLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50">
                              {log.organizationName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.userName || "System"}
                          </TableCell>
                          <TableCell>
                            {getCreditActionBadge(log.actionType)}
                          </TableCell>
                          <TableCell className={log.actionType === 'order_submission' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                            {log.actionType === 'order_submission' ? '-' : '+'}
                            {log.tokensBurned}
                          </TableCell>
                          <TableCell>
                            {log.orderId ? `#${log.orderId}` : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <FileJson className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Showing 1-5 of 89 logs
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purgatory Events Tab */}
        <TabsContent value="purgatory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purgatory Events</CardTitle>
              <CardDescription>
                Track organizations placed in or removed from purgatory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      type="search"
                      placeholder="Search by organization or reason..."
                      className="pl-9"
                      value={purgatorySearchTerm}
                      onChange={(e) => setPurgatorySearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Select value={purgatoryStatusFilter} onValueChange={setPurgatoryStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="to_purgatory">To Purgatory</SelectItem>
                      <SelectItem value="from_purgatory">From Purgatory</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={purgatoryDateRange} onValueChange={setPurgatoryDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Purgatory Events Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Triggered By</TableHead>
                        <TableHead>Resolved</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purgatoryEvents.map(event => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {formatDateTime(event.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50">
                              {event.organizationName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getPurgatoryStatusBadge(event.status)}
                          </TableCell>
                          <TableCell>
                            {event.reason}
                          </TableCell>
                          <TableCell>
                            {event.triggeredByName}
                          </TableCell>
                          <TableCell>
                            {event.resolvedAt ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDate(event.resolvedAt)}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!event.resolvedAt && (
                              <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                                <Check className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                            {event.resolvedAt && (
                              <Button variant="ghost" size="sm">
                                <FileJson className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Showing 1-3 of 3 events
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminLogs;