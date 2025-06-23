import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  Building,
  Building2,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  MoreHorizontal,
  Pencil,
  AlertTriangle,
  User,
  CreditCard,
  Link as LinkIcon,
  Plus,
  Download,
  Loader2
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateShort } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  listOrganizations,
  getOrganizationDetails,
  updateOrganizationStatus,
  adjustOrganizationCredits,
  SuperAdminOrganization,
  OrganizationDetails,
  OrganizationStatus,
  CreditAdjustmentRequest,
  StatusUpdateRequest
} from "@/lib/superadmin-api";

// Create a simple toast function since we don't have the component
const toast = ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
  console.log(`${title}: ${description}`);
  alert(`${title}: ${description}`);
};

const SuperAdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState("info");
  const [isEditingCredits, setIsEditingCredits] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState<string>("");
  const [creditAdjustmentReason, setCreditAdjustmentReason] = useState<string>("");
  
  // API data states
  const [organizations, setOrganizations] = useState<SuperAdminOrganization[]>([]);
  const [organizationDetails, setOrganizationDetails] = useState<OrganizationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAdjustingCredits, setIsAdjustingCredits] = useState(false);
  // Separate current page and limit from pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  // Fetch organizations on component mount and when filters change
  useEffect(() => {
    const fetchOrganizations = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: pageLimit
        };
        
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        
        if (typeFilter !== "all") {
          params.type = typeFilter;
        }
        
        if (searchTerm) {
          params.name = searchTerm;
        }
        
        const result = await listOrganizations(params);
        setOrganizations(result.organizations);
        setPagination(result.pagination);
        
        // Update current page and limit if they're different from what we got back
        if (result.pagination.page !== currentPage) {
          setCurrentPage(result.pagination.page);
        }
        if (result.pagination.limit !== pageLimit) {
          setPageLimit(result.pagination.limit);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
        toast({
          title: "Error",
          description: "Failed to load organizations. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrganizations();
  }, [searchTerm, statusFilter, typeFilter, currentPage, pageLimit]);

  // Fetch organization details when an organization is selected
  useEffect(() => {
    if (selectedOrgId) {
      const fetchOrganizationDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const details = await getOrganizationDetails(selectedOrgId);
          setOrganizationDetails(details);
        } catch (error) {
          console.error(`Error fetching details for organization ${selectedOrgId}:`, error);
          toast({
            title: "Error",
            description: "Failed to load organization details. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoadingDetails(false);
        }
      };
      
      fetchOrganizationDetails();
    } else {
      setOrganizationDetails(null);
    }
  }, [selectedOrgId]);

  // Filter organizations based on search term and filters
  const filteredOrgs = organizations ? organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.npi.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    const matchesType = typeFilter === "all" || org.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) : [];

  // Select an organization to view details
  const handleSelectOrg = (orgId: number) => {
    setSelectedOrgId(orgId);
    setDetailTab("info");
    setIsEditingCredits(false);
    setCreditAdjustment("");
    setCreditAdjustmentReason("");
  };

  // Handle updating organization status
  const handleUpdateStatus = async (orgId: number, newStatus: OrganizationStatus) => {
    if (!orgId) return;
    
    setIsUpdatingStatus(true);
    try {
      const statusUpdate: StatusUpdateRequest = {
        status: newStatus,
        reason: `Status changed to ${newStatus} by super admin`
      };
      
      const result = await updateOrganizationStatus(orgId, statusUpdate);
      
      if (result.success) {
        toast({
          title: "Status Updated",
          description: `Organization status has been updated to ${newStatus}`,
        });
        
        // Refresh organization details
        const details = await getOrganizationDetails(orgId);
        setOrganizationDetails(details);
        
        // Update organization in the list
        setOrganizations(orgs =>
          orgs.map(org =>
            org.id === orgId ? { ...org, status: newStatus } : org
          )
        );
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update organization status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error updating status for organization ${orgId}:`, error);
      toast({
        title: "Error",
        description: "Failed to update organization status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">On Hold</Badge>;
      case "purgatory":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Purgatory</Badge>;
      case "terminated":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Terminated</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handle credit adjustment
  const handleCreditAdjustment = async () => {
    if (!selectedOrgId || !creditAdjustment || !creditAdjustmentReason) {
      toast({
        title: "Error",
        description: "Please enter both credit amount and reason",
        variant: "destructive"
      });
      return;
    }
    
    const creditAmount = parseInt(creditAdjustment);
    if (isNaN(creditAmount)) {
      toast({
        title: "Error",
        description: "Please enter a valid number for credit adjustment",
        variant: "destructive"
      });
      return;
    }
    
    setIsAdjustingCredits(true);
    try {
      const adjustment: CreditAdjustmentRequest = {
        amount: creditAmount,
        reason: creditAdjustmentReason
      };
      
      const result = await adjustOrganizationCredits(selectedOrgId, adjustment);
      
      if (result.success) {
        toast({
          title: "Credits Adjusted",
          description: `Organization credits have been adjusted. New balance: ${result.newBalance}`,
        });
        
        // Refresh organization details
        const details = await getOrganizationDetails(selectedOrgId);
        setOrganizationDetails(details);
        
        // Update organization in the list
        setOrganizations(orgs =>
          orgs.map(org =>
            org.id === selectedOrgId ? { ...org, creditBalance: result.newBalance } : org
          )
        );
        
        setIsEditingCredits(false);
        setCreditAdjustment("");
        setCreditAdjustmentReason("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to adjust credits",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Error adjusting credits for organization ${selectedOrgId}:`, error);
      toast({
        title: "Error",
        description: "Failed to adjust organization credits. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAdjustingCredits(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="Organization Management" 
        description="Manage all organizations in the RadOrderPad system"
      >
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export List
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Organizations List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Organizations</CardTitle>
            <CardDescription>
              {filteredOrgs.length} organizations found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search by name or NPI..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="purgatory">Purgatory</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="referring">Referring</SelectItem>
                      <SelectItem value="radiology_group">Radiology Group</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Organizations list */}
            <div className="space-y-2 mt-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-slate-500">Loading organizations...</p>
                </div>
              ) : filteredOrgs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No organizations found</p>
                </div>
              ) : (
                filteredOrgs.map(org => (
                  <div 
                    key={org.id} 
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedOrgId === org.id ? 'bg-slate-50 border-primary' : ''}`}
                    onClick={() => handleSelectOrg(org.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            org.status === 'active' ? 'bg-green-500' : 
                            org.status === 'on_hold' ? 'bg-amber-500' : 
                            org.status === 'purgatory' ? 'bg-red-500' : 
                            'bg-slate-500'
                          }`} />
                          <h3 className="font-medium">{org.name}</h3>
                        </div>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2 text-xs">
                            {org.type === 'referring' ? 'Referring' : 'Radiology Group'}
                          </Badge>
                          {getStatusBadge(org.status)}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-slate-500">NPI</p>
                        <p className="text-sm">{org.npi}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Credits</p>
                        <p className="text-sm">{org.creditBalance}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Users</p>
                        <p className="text-sm">{org.userCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="text-sm">{formatDateShort(org.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination controls */}
            {!isLoading && pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-slate-500">
                  Showing page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= (pagination?.totalPages || 1)}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination?.totalPages || 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Details */}
        <Card className="lg:col-span-2">
          {selectedOrgId ? (
            isLoadingDetails ? (
              <div className="h-full flex items-center justify-center p-10 text-center">
                <div>
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">Loading Organization Details</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Please wait while we fetch the organization details...
                  </p>
                </div>
              </div>
            ) : organizationDetails ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{organizationDetails.organization.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <span>{organizationDetails.organization.type === 'referring' ? 'Referring Organization' : 'Radiology Group'}</span>
                        <span className="mx-2">•</span>
                        <span>{getStatusBadge(organizationDetails.organization.status)}</span>
                      </CardDescription>
                    </div>
                    <div className="flex">
                      <Button variant="outline" size="sm" className="h-8 mr-2">
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      {isUpdatingStatus ? (
                        <Button variant="destructive" size="sm" className="h-8" disabled>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          Updating...
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8"
                          onClick={() => handleUpdateStatus(
                            selectedOrgId,
                            organizationDetails.organization.status === 'purgatory' ? 'active' : 'purgatory'
                          )}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          {organizationDetails.organization.status === 'purgatory' ? 'Remove from Purgatory' : 'Send to Purgatory'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              
              <CardContent>
                {/* Tabs for different sections of organization details */}
                <Tabs value={detailTab} onValueChange={setDetailTab}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="users">Users ({organizationDetails.users.length})</TabsTrigger>
                    <TabsTrigger value="connections">Connections ({organizationDetails.connections.length})</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                  </TabsList>
                  
                  {/* Organization Info Tab */}
                  <TabsContent value="info" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Organization Details</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500">NPI Number</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.npi}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Tax ID</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.tax_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Subscription Tier</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.subscription_tier}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Created On</p>
                            <p className="text-sm font-medium">{formatDateShort(organizationDetails.organization.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500">Address</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.address_line1}</p>
                            {organizationDetails.organization.address_line2 && (
                              <p className="text-sm font-medium">{organizationDetails.organization.address_line2}</p>
                            )}
                            <p className="text-sm font-medium">
                              {organizationDetails.organization.city}, {organizationDetails.organization.state} {organizationDetails.organization.zip_code}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.phone_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.contact_email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Website</p>
                            <p className="text-sm font-medium">{organizationDetails.organization.website}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Credits Management</h3>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-slate-500">Current Credit Balance</p>
                            <p className="text-2xl font-bold">{organizationDetails.organization.credit_balance}</p>
                          </div>
                          {!isEditingCredits ? (
                            <Button onClick={() => setIsEditingCredits(true)}>
                              Adjust Credits
                            </Button>
                          ) : (
                            <div className="flex space-x-2">
                              <Button variant="outline" onClick={() => setIsEditingCredits(false)}>
                                Cancel
                              </Button>
                              {isAdjustingCredits ? (
                                <Button disabled>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  Processing...
                                </Button>
                              ) : (
                                <Button onClick={handleCreditAdjustment}>
                                  Apply Adjustment
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {isEditingCredits && (
                          <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="credit-adjustment">Credit Adjustment</Label>
                                <div className="relative">
                                  <Input
                                    id="credit-adjustment"
                                    type="number"
                                    placeholder="Enter credit amount..."
                                    value={creditAdjustment}
                                    onChange={(e) => setCreditAdjustment(e.target.value)}
                                    className="pl-8"
                                  />
                                  <span className="absolute left-3 top-2.5">±</span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Enter a positive number to add credits or a negative number to remove credits.
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="adjustment-reason">Reason for Adjustment</Label>
                                <Input
                                  id="adjustment-reason"
                                  placeholder="Enter reason..."
                                  value={creditAdjustmentReason}
                                  onChange={(e) => setCreditAdjustmentReason(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">
                                  This will be recorded in the billing history.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Users Tab */}
                  <TabsContent value="users">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {organizationDetails.users.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {user.role === 'physician' ? 'Physician' : 
                                   user.role === 'admin_staff' ? 'Admin Staff' : 
                                   user.role === 'admin_referring' ? 'Referring Admin' : 
                                   user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.active ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-800 border-slate-300">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <User className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  {/* Connections Tab */}
                  <TabsContent value="connections">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Connected Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {organizationDetails.connections.map(connection => (
                            <TableRow key={connection.id}>
                              <TableCell className="font-medium">{connection.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {connection.type === 'radiology_group' ? 'Radiology Group' : 'Referring'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {connection.status === 'active' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-800 border-slate-300">{connection.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell>{formatDateShort(connection.connected_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm">
                                  <LinkIcon className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  
                  {/* Billing Tab */}
                  <TabsContent value="billing">
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {organizationDetails.billingHistory.map(event => (
                            <TableRow key={event.id}>
                              <TableCell>{formatDateShort(event.date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {event.type === 'credit_purchase' ? 'Purchase' : 
                                   event.type === 'credit_adjustment' ? 'Adjustment' : 
                                   event.type}
                                </Badge>
                              </TableCell>
                              <TableCell className={event.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatCurrency(event.amount)}
                              </TableCell>
                              <TableCell className={event.credits < 0 ? 'text-red-600' : ''}>
                                {event.credits > 0 && '+'}
                                {event.credits}
                              </TableCell>
                              <TableCell>
                                {event.status === 'successful' || event.status === 'completed' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300">
                                    {event.status}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-800 border-slate-300">
                                    {event.status}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {event.invoice_id && (
                                  <Button variant="ghost" size="sm">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Invoice
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-10 text-center">
                <div>
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">Error Loading Details</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    There was a problem loading the organization details. Please try again.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center p-10 text-center">
              <div>
                <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No Organization Selected</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Select an organization from the list to view detailed information, manage users, connections, and billing.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminOrganizations;