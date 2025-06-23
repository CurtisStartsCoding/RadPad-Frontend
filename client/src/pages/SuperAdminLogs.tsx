import { useState, useEffect } from "react";
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
  Clock,
  Loader2
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateShort } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  getValidationLogs,
  getEnhancedValidationLogs,
  getCreditUsageLogs,
  getPurgatoryEvents,
  ValidationLog,
  CreditUsageLog,
  PurgatoryEvent,
  LogsPagination
} from "@/lib/superadmin-api";

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
  
  // Data state
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [creditUsageLogs, setCreditUsageLogs] = useState<CreditUsageLog[]>([]);
  const [purgatoryEvents, setPurgatoryEvents] = useState<PurgatoryEvent[]>([]);
  
  // Pagination state
  const [validationPagination, setValidationPagination] = useState<LogsPagination>({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });
  const [creditPagination, setCreditPagination] = useState<LogsPagination>({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });
  const [purgatoryPagination, setPurgatoryPagination] = useState<LogsPagination>({
    total: 0,
    limit: 50,
    offset: 0,
    has_more: false
  });
  
  // Loading state
  const [validationLoading, setValidationLoading] = useState<boolean>(false);
  const [creditLoading, setCreditLoading] = useState<boolean>(false);
  const [purgatoryLoading, setPurgatoryLoading] = useState<boolean>(false);
  
  // Load validation logs
  const loadValidationLogs = async (offset: number = 0) => {
    setValidationLoading(true);
    try {
      const params: any = {
        limit: 50,
        offset: offset
      };
      
      // Add filters
      if (validationOrgFilter !== "all") {
        params.organization_id = parseInt(validationOrgFilter);
      }
      
      if (validationStatusFilter !== "all") {
        params.status = validationStatusFilter;
      }
      
      if (validationProviderFilter !== "all") {
        params.llm_provider = validationProviderFilter;
      }
      
      if (validationDatePreset !== "all") {
        params.date_preset = validationDatePreset;
      }
      
      if (validationSearchTerm) {
        params.search_text = validationSearchTerm;
      }
      
      if (validationSortBy) {
        params.sort_by = validationSortBy;
        params.sort_direction = validationSortDir;
      }
      
      const response = validationTab === "enhanced" 
        ? await getEnhancedValidationLogs(params)
        : await getValidationLogs(params);
      
      setValidationLogs(response.logs);
      setValidationPagination(response.pagination);
    } catch (error) {
      console.error('Error loading validation logs:', error);
      setValidationLogs([]);
    } finally {
      setValidationLoading(false);
    }
  };
  
  // Load credit usage logs
  const loadCreditUsageLogs = async (offset: number = 0) => {
    setCreditLoading(true);
    try {
      const params: any = {
        limit: 50,
        offset: offset
      };
      
      // Add filters
      if (creditOrgFilter !== "all") {
        params.organization_id = parseInt(creditOrgFilter);
      }
      
      if (creditActionFilter !== "all") {
        params.action_type = creditActionFilter;
      }
      
      if (creditDateRange !== "all") {
        params.date_preset = creditDateRange;
      }
      
      if (creditSearchTerm) {
        params.search_text = creditSearchTerm;
      }
      
      const response = await getCreditUsageLogs(params);
      setCreditUsageLogs(response.logs);
      setCreditPagination(response.pagination);
    } catch (error) {
      console.error('Error loading credit usage logs:', error);
      setCreditUsageLogs([]);
    } finally {
      setCreditLoading(false);
    }
  };
  
  // Load purgatory events
  const loadPurgatoryEvents = async (offset: number = 0) => {
    setPurgatoryLoading(true);
    try {
      const params: any = {
        limit: 50,
        offset: offset
      };
      
      // Add filters
      if (purgatoryStatusFilter !== "all") {
        params.status = purgatoryStatusFilter;
      }
      
      if (purgatoryDateRange !== "all") {
        params.date_preset = purgatoryDateRange;
      }
      
      if (purgatorySearchTerm) {
        params.search_text = purgatorySearchTerm;
      }
      
      const response = await getPurgatoryEvents(params);
      setPurgatoryEvents(response.events);
      setPurgatoryPagination(response.pagination);
    } catch (error) {
      console.error('Error loading purgatory events:', error);
      setPurgatoryEvents([]);
    } finally {
      setPurgatoryLoading(false);
    }
  };
  
  // Load data when tab changes or filters change
  useEffect(() => {
    if (currentTab === "validation") {
      loadValidationLogs();
    } else if (currentTab === "credits") {
      loadCreditUsageLogs();
    } else if (currentTab === "purgatory") {
      loadPurgatoryEvents();
    }
  }, [
    currentTab,
    validationTab,
    validationOrgFilter,
    validationStatusFilter,
    validationProviderFilter,
    validationDatePreset,
    validationSortBy,
    validationSortDir,
    creditOrgFilter,
    creditActionFilter,
    creditDateRange,
    purgatoryStatusFilter,
    purgatoryDateRange
  ]);
  
  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentTab === "validation") {
        loadValidationLogs();
      } else if (currentTab === "credits") {
        loadCreditUsageLogs();
      } else if (currentTab === "purgatory") {
        loadPurgatoryEvents();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [validationSearchTerm, creditSearchTerm, purgatorySearchTerm]);
  
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
      case "order_submitted":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Order Submitted</Badge>;
      case "order_received":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Order Received</Badge>;
      case "manual_adjustment":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Manual Adjustment</Badge>;
      case "subscription_renewal":
        return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-300">Subscription Renewal</Badge>;
      case "credit_purchase":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Credit Purchase</Badge>;
      // Legacy support for old action types
      case "order_submission":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Order Submission</Badge>;
      case "credit_adjustment":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Credit Adjustment</Badge>;
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
                            <SelectItem value="Anthropic">Anthropic</SelectItem>
                            <SelectItem value="OpenAI">OpenAI</SelectItem>
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
                            <SelectItem value="all">All Time</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select value={validationOrgFilter} onValueChange={setValidationOrgFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Organization" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Organizations</SelectItem>
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
                          {validationLoading ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                <p className="mt-2 text-slate-500">Loading validation logs...</p>
                              </TableCell>
                            </TableRow>
                          ) : validationLogs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <p className="text-slate-500">No validation logs found</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            validationLogs.map(log => (
                              <TableRow key={log.id}>
                                <TableCell className="font-medium">
                                  {formatDateTime(log.created_at)}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div>{log.user_name}</div>
                                    <Badge variant="outline" className="bg-slate-50">
                                      {log.organization_name}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getValidationStatusBadge(log.status)}
                                  {log.error_message && (
                                    <div className="mt-1 text-xs text-red-600">{log.error_message}</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div>{log.llm_provider}</div>
                                    <div className="text-xs text-slate-500">{log.model_name}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`font-medium ${log.latency_ms > 3000 ? 'text-amber-600' : log.latency_ms > 5000 ? 'text-red-600' : ''}`}>
                                    {formatLatency(log.latency_ms)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div>{log.total_tokens.toLocaleString()}</div>
                                    <div className="text-xs text-slate-500">
                                      {log.prompt_tokens.toLocaleString()} in / {log.completion_tokens.toLocaleString()} out
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
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        Showing {validationPagination.offset + 1}-{Math.min(validationPagination.offset + validationPagination.limit, validationPagination.total)} of {validationPagination.total} logs
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={validationPagination.offset === 0}
                          onClick={() => loadValidationLogs(Math.max(0, validationPagination.offset - validationPagination.limit))}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={!validationPagination.has_more}
                          onClick={() => loadValidationLogs(validationPagination.offset + validationPagination.limit)}
                        >
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
                    <p className="text-slate-500">Basic view uses the same data as enhanced view but with fewer filtering options.</p>
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
                        <SelectItem value="order_submitted">Order Submitted</SelectItem>
                        <SelectItem value="order_received">Order Received</SelectItem>
                        <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                        <SelectItem value="subscription_renewal">Subscription Renewal</SelectItem>
                        <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={creditOrgFilter} onValueChange={setCreditOrgFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
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
                      {creditLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2 text-slate-500">Loading credit usage logs...</p>
                          </TableCell>
                        </TableRow>
                      ) : creditUsageLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-slate-500">No credit usage logs found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        creditUsageLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {formatDateTime(log.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-50">
                                {log.organization_name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {log.user_name || "System"}
                            </TableCell>
                            <TableCell>
                              {getCreditActionBadge(log.action_type)}
                            </TableCell>
                            <TableCell className={(log.tokens_burned * -1) < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                              {(log.tokens_burned * -1) < 0 ? '' : '+'}
                              {log.tokens_burned * -1}
                            </TableCell>
                            <TableCell>
                              {log.order_id ? `#${log.order_id}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                <FileJson className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Showing {creditPagination.offset + 1}-{Math.min(creditPagination.offset + creditPagination.limit, creditPagination.total)} of {creditPagination.total} logs
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={creditPagination.offset === 0}
                      onClick={() => loadCreditUsageLogs(Math.max(0, creditPagination.offset - creditPagination.limit))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!creditPagination.has_more}
                      onClick={() => loadCreditUsageLogs(creditPagination.offset + creditPagination.limit)}
                    >
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
                      {purgatoryLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            <p className="mt-2 text-slate-500">Loading purgatory events...</p>
                          </TableCell>
                        </TableRow>
                      ) : purgatoryEvents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-slate-500">No purgatory events found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        purgatoryEvents.map(event => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              {formatDateTime(event.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-slate-50">
                                {event.organization_name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getPurgatoryStatusBadge(event.status)}
                            </TableCell>
                            <TableCell>
                              {event.reason}
                            </TableCell>
                            <TableCell>
                              {event.triggered_by_name}
                            </TableCell>
                            <TableCell>
                              {event.resolved_at ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDateShort(event.resolved_at)}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!event.resolved_at && (
                                <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                                  <Check className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                              )}
                              {event.resolved_at && (
                                <Button variant="ghost" size="sm">
                                  <FileJson className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Showing {purgatoryPagination.offset + 1}-{Math.min(purgatoryPagination.offset + purgatoryPagination.limit, purgatoryPagination.total)} of {purgatoryPagination.total} events
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={purgatoryPagination.offset === 0}
                      onClick={() => loadPurgatoryEvents(Math.max(0, purgatoryPagination.offset - purgatoryPagination.limit))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!purgatoryPagination.has_more}
                      onClick={() => loadPurgatoryEvents(purgatoryPagination.offset + purgatoryPagination.limit)}
                    >
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