import { useState } from "react";
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
  FileText,
  MoreHorizontal,
  Pencil,
  AlertTriangle,
  User,
  CreditCard,
  Link as LinkIcon,
  Plus,
  Download
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateShort } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

// Mock organizations data
const organizations = [
  {
    id: 1,
    name: "Northwest Medical Group",
    type: "referring",
    npi: "9876543210",
    status: "active",
    creditBalance: 458,
    subscriptionTier: "tier_1",
    userCount: 12,
    createdAt: "2025-01-15T14:23:11Z"
  },
  {
    id: 2,
    name: "Central Radiology Associates",
    type: "radiology_group",
    npi: "1234567890",
    status: "active",
    creditBalance: 2500,
    subscriptionTier: "tier_2",
    userCount: 25,
    createdAt: "2025-01-08T09:15:40Z"
  },
  {
    id: 3,
    name: "Eastside Primary Care",
    type: "referring",
    npi: "4567890123",
    status: "on_hold",
    creditBalance: 23,
    subscriptionTier: "tier_1",
    userCount: 5,
    createdAt: "2025-02-21T11:42:33Z"
  },
  {
    id: 4,
    name: "Advanced Diagnostic Imaging",
    type: "radiology_group",
    npi: "7890123456",
    status: "active",
    creditBalance: 1895,
    subscriptionTier: "tier_3",
    userCount: 34,
    createdAt: "2024-12-03T16:08:27Z"
  },
  {
    id: 5,
    name: "City Medical Center",
    type: "referring",
    npi: "3210987654",
    status: "purgatory",
    creditBalance: 0,
    subscriptionTier: "tier_1",
    userCount: 7,
    createdAt: "2025-03-12T08:56:19Z"
  }
];

// Organization details mock data for selected organization
const orgDetailsMock = {
  organization: {
    id: 1,
    name: "Northwest Medical Group",
    type: "referring",
    npi: "9876543210",
    tax_id: "12-3456789",
    address_line1: "123 Medical Way",
    address_line2: "Suite 400",
    city: "Metropolis",
    state: "CA",
    zip_code: "90210",
    phone_number: "(555) 123-4567",
    fax_number: "(555) 123-4568",
    contact_email: "admin@nwmedical.example.com",
    website: "https://nwmedical.example.com",
    logo_url: null,
    billing_id: "cus_TEST123456",
    credit_balance: 458,
    subscription_tier: "tier_1",
    status: "active",
    assigned_account_manager_id: null,
    created_at: "2025-01-15T14:23:11Z",
    updated_at: "2025-04-21T04:25:09.592Z"
  },
  users: [
    {
      id: 101,
      name: "Dr. John Smith",
      email: "john.smith@nwmedical.example.com",
      role: "physician",
      active: true
    },
    {
      id: 102,
      name: "Sarah Johnson",
      email: "sarah.johnson@nwmedical.example.com",
      role: "admin_staff",
      active: true
    },
    {
      id: 103,
      name: "Mark Williams",
      email: "mark.williams@nwmedical.example.com",
      role: "admin_referring",
      active: true
    }
  ],
  connections: [
    {
      id: 201,
      name: "Central Radiology Associates",
      type: "radiology_group",
      status: "active",
      connected_at: "2025-01-20T10:15:22Z"
    },
    {
      id: 202,
      name: "Advanced Diagnostic Imaging",
      type: "radiology_group",
      status: "active",
      connected_at: "2025-02-05T14:30:45Z"
    }
  ],
  billingHistory: [
    {
      id: 301,
      type: "credit_purchase",
      amount: 500.00,
      credits: 250,
      date: "2025-04-12T09:23:45Z",
      status: "successful",
      invoice_id: "in_TEST123456"
    },
    {
      id: 302,
      type: "credit_purchase",
      amount: 1000.00,
      credits: 500,
      date: "2025-03-15T11:42:18Z",
      status: "successful",
      invoice_id: "in_TEST123457"
    },
    {
      id: 303,
      type: "credit_adjustment",
      amount: -100.00,
      credits: -50,
      date: "2025-03-20T15:10:33Z",
      status: "completed",
      invoice_id: null,
      reason: "Billing issue resolution"
    }
  ]
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

  // Filter organizations based on search term and filters
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         org.npi.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    const matchesType = typeFilter === "all" || org.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Select an organization to view details
  const handleSelectOrg = (orgId: number) => {
    setSelectedOrgId(orgId);
    setDetailTab("info");
    setIsEditingCredits(false);
    setCreditAdjustment("");
    setCreditAdjustmentReason("");
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
  const handleCreditAdjustment = () => {
    console.log(`Adjusting credits: ${creditAdjustment} for reason: ${creditAdjustmentReason}`);
    setIsEditingCredits(false);
    setCreditAdjustment("");
    setCreditAdjustmentReason("");
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
              {filteredOrgs.length === 0 ? (
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
          </CardContent>
        </Card>

        {/* Organization Details */}
        <Card className="lg:col-span-2">
          {selectedOrgId ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{orgDetailsMock.organization.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <span>{orgDetailsMock.organization.type === 'referring' ? 'Referring Organization' : 'Radiology Group'}</span>
                      <span className="mx-2">•</span>
                      <span>{getStatusBadge(orgDetailsMock.organization.status)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex">
                    <Button variant="outline" size="sm" className="h-8 mr-2">
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="h-8">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      {orgDetailsMock.organization.status === 'purgatory' ? 'Remove from Purgatory' : 'Send to Purgatory'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Tabs for different sections of organization details */}
                <Tabs value={detailTab} onValueChange={setDetailTab}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="users">Users ({orgDetailsMock.users.length})</TabsTrigger>
                    <TabsTrigger value="connections">Connections ({orgDetailsMock.connections.length})</TabsTrigger>
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
                            <p className="text-sm font-medium">{orgDetailsMock.organization.npi}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Tax ID</p>
                            <p className="text-sm font-medium">{orgDetailsMock.organization.tax_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Subscription Tier</p>
                            <p className="text-sm font-medium">{orgDetailsMock.organization.subscription_tier}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Created On</p>
                            <p className="text-sm font-medium">{formatDateShort(orgDetailsMock.organization.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500">Address</p>
                            <p className="text-sm font-medium">{orgDetailsMock.organization.address_line1}</p>
                            {orgDetailsMock.organization.address_line2 && (
                              <p className="text-sm font-medium">{orgDetailsMock.organization.address_line2}</p>
                            )}
                            <p className="text-sm font-medium">
                              {orgDetailsMock.organization.city}, {orgDetailsMock.organization.state} {orgDetailsMock.organization.zip_code}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-sm font-medium">{orgDetailsMock.organization.phone_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm font-medium">{orgDetailsMock.organization.contact_email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Website</p>
                            <p className="text-sm font-medium">{orgDetailsMock.organization.website}</p>
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
                            <p className="text-2xl font-bold">{orgDetailsMock.organization.credit_balance}</p>
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
                              <Button onClick={handleCreditAdjustment}>
                                Apply Adjustment
                              </Button>
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
                          {orgDetailsMock.users.map(user => (
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
                          {orgDetailsMock.connections.map(connection => (
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
                          {orgDetailsMock.billingHistory.map(event => (
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