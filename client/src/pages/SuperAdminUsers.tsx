import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  User,
  Users,
  Filter,
  Building,
  ChevronRight,
  Clock,
  Mail,
  Lock,
  UserCog,
  ArrowDownToLine,
  Eye,
  AlertTriangle,
  Download,
  Plus
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Mock users data
const users = [
  {
    id: 1,
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@nwmedical.example.com",
    role: "physician",
    active: true,
    emailVerified: true,
    lastLogin: "2025-05-02T14:32:11Z",
    createdAt: "2024-11-15T09:23:18Z",
    npi: "1234567890",
    specialty: "Internal Medicine",
    phoneNumber: "(555) 123-4567",
    organizationId: 1,
    organizationName: "Northwest Medical Group",
    organizationType: "referring"
  },
  {
    id: 2,
    firstName: "Michael",
    lastName: "Chang",
    email: "michael.chang@nwmedical.example.com",
    role: "admin_staff",
    active: true,
    emailVerified: true,
    lastLogin: "2025-05-01T11:45:33Z",
    createdAt: "2024-12-05T13:27:44Z",
    npi: null,
    specialty: null,
    phoneNumber: "(555) 234-5678",
    organizationId: 1,
    organizationName: "Northwest Medical Group",
    organizationType: "referring"
  },
  {
    id: 3,
    firstName: "Jennifer",
    lastName: "Williams",
    email: "jennifer.williams@nwmedical.example.com",
    role: "admin_referring",
    active: true,
    emailVerified: true,
    lastLogin: "2025-05-03T08:17:22Z",
    createdAt: "2024-11-10T10:15:30Z",
    npi: null,
    specialty: null,
    phoneNumber: "(555) 345-6789",
    organizationId: 1,
    organizationName: "Northwest Medical Group",
    organizationType: "referring"
  },
  {
    id: 4,
    firstName: "David",
    lastName: "Rodriguez",
    email: "david.rodriguez@centralradiology.example.com",
    role: "radiologist",
    active: true,
    emailVerified: true,
    lastLogin: "2025-05-02T16:08:59Z",
    createdAt: "2024-12-20T11:33:27Z",
    npi: "2345678901",
    specialty: "Diagnostic Radiology",
    phoneNumber: "(555) 456-7890",
    organizationId: 2,
    organizationName: "Central Radiology Associates",
    organizationType: "radiology_group"
  },
  {
    id: 5,
    firstName: "Amanda",
    lastName: "Taylor",
    email: "amanda.taylor@centralradiology.example.com",
    role: "admin_radiology",
    active: true,
    emailVerified: true,
    lastLogin: "2025-05-03T09:45:12Z",
    createdAt: "2025-01-05T14:22:56Z",
    npi: null,
    specialty: null,
    phoneNumber: "(555) 567-8901",
    organizationId: 2,
    organizationName: "Central Radiology Associates",
    organizationType: "radiology_group"
  },
  {
    id: 6,
    firstName: "Robert",
    lastName: "Jones",
    email: "robert.jones@eastside.example.com",
    role: "physician",
    active: false,
    emailVerified: true,
    lastLogin: "2025-04-15T10:33:21Z",
    createdAt: "2025-01-10T09:12:45Z",
    npi: "3456789012",
    specialty: "Family Medicine",
    phoneNumber: "(555) 678-9012",
    organizationId: 3,
    organizationName: "Eastside Primary Care",
    organizationType: "referring"
  },
  {
    id: 7,
    firstName: "System",
    lastName: "Administrator",
    email: "admin@radorderpad.example.com",
    role: "super_admin",
    active: true,
    emailVerified: true,
    lastLogin: "2025-05-03T07:55:08Z",
    createdAt: "2024-10-01T08:00:00Z",
    npi: null,
    specialty: null,
    phoneNumber: null,
    organizationId: null,
    organizationName: null,
    organizationType: null
  }
];

// Mock user details for selected user
const userDetailsMock = {
  id: 1,
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@nwmedical.example.com",
  role: "physician",
  active: true,
  emailVerified: true,
  lastLogin: "2025-05-02T14:32:11Z",
  createdAt: "2024-11-15T09:23:18Z",
  npi: "1234567890",
  specialty: "Internal Medicine",
  phoneNumber: "(555) 123-4567",
  organizationId: 1,
  organizationName: "Northwest Medical Group",
  organizationType: "referring",
  // Additional details
  address: "123 Medical Way, Suite 400, Metropolis, CA 90210",
  locationAccess: ["Main Clinic", "North Branch", "South Branch"],
  recentActivity: [
    {
      id: 101,
      type: "order_created",
      timestamp: "2025-05-02T14:30:22Z",
      details: "Created Order #ROP-250502-42"
    },
    {
      id: 102,
      type: "login",
      timestamp: "2025-05-02T14:00:05Z",
      details: "Login from 192.168.1.100"
    },
    {
      id: 103,
      type: "order_created",
      timestamp: "2025-05-01T11:23:45Z",
      details: "Created Order #ROP-250501-37"
    },
    {
      id: 104,
      type: "login",
      timestamp: "2025-05-01T11:15:30Z",
      details: "Login from 192.168.1.100"
    }
  ]
};

const roleDisplayNames: { [key: string]: string } = {
  'physician': 'Physician',
  'admin_staff': 'Admin Staff',
  'admin_referring': 'Referring Admin',
  'scheduler': 'Scheduler',
  'admin_radiology': 'Radiology Admin',
  'radiologist': 'Radiologist',
  'trial_physician': 'Trial User',
  'super_admin': 'Super Admin'
};

const SuperAdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState("profile");

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.active) || 
                         (statusFilter === "inactive" && !user.active);
    const matchesOrganization = organizationFilter === "all" || 
                               (user.organizationId?.toString() === organizationFilter);
    
    return matchesSearch && matchesRole && matchesStatus && matchesOrganization;
  });

  // Get unique organizations for filter dropdown
  const uniqueOrganizations = Array.from(new Set(users
    .filter(user => user.organizationId !== null)
    .map(user => ({ id: user.organizationId, name: user.organizationName }))
  )).filter(org => org.id !== undefined && org.name !== undefined);

  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (active: boolean) => {
    return active ? 
      <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge> : 
      <Badge className="bg-slate-100 text-slate-800 border-slate-300">Inactive</Badge>;
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'physician':
      case 'trial_physician':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'admin_staff':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'admin_referring':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'scheduler':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'admin_radiology':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'radiologist':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Handle selecting a user
  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setDetailTab("profile");
  };

  return (
    <div className="p-6">
      <PageHeader 
        title="User Management" 
        description="Manage all users across the RadOrderPad system"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span>Export List</span>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span>Create User</span>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {/* Users List */}
        <Card className="md:col-span-1 lg:col-span-1 xl:col-span-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription>
              {filteredUsers.length} users found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex-1">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="physician">Physician</SelectItem>
                      <SelectItem value="admin_staff">Admin Staff</SelectItem>
                      <SelectItem value="admin_referring">Referring Admin</SelectItem>
                      <SelectItem value="scheduler">Scheduler</SelectItem>
                      <SelectItem value="admin_radiology">Radiology Admin</SelectItem>
                      <SelectItem value="radiologist">Radiologist</SelectItem>
                      <SelectItem value="trial_physician">Trial User</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by organization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
                        {uniqueOrganizations.map(org => (
                          <SelectItem key={org.id} value={org.id?.toString() || ""}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Users list */}
            <div className="space-y-2 mt-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-slate-50 transition-colors ${selectedUserId === user.id ? 'bg-slate-50 border-primary' : ''}`}
                    onClick={() => handleSelectUser(user.id)}
                    title={user.email} // Email tooltip on hover
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{user.firstName} {user.lastName}</h3>
                          <ChevronRight className="h-4 w-4 ml-1 text-slate-400 shrink-0" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="outline" className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {roleDisplayNames[user.role]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Details */}
        <Card className="md:col-span-1 lg:col-span-2 xl:col-span-3">
          {selectedUserId ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(userDetailsMock.firstName, userDetailsMock.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{userDetailsMock.firstName} {userDetailsMock.lastName}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className={getRoleBadgeColor(userDetailsMock.role)}>
                          {roleDisplayNames[userDetailsMock.role]}
                        </Badge>
                        {getStatusBadge(userDetailsMock.active)}
                        {userDetailsMock.organizationName && (
                          <span className="text-sm">{userDetailsMock.organizationName}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-8">
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      <span className="sm:inline">Send Email</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      <Lock className="h-3.5 w-3.5 mr-1" />
                      <span className="sm:inline">Reset Password</span>
                    </Button>
                    {userDetailsMock.active ? (
                      <Button variant="destructive" size="sm" className="h-8">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        <span className="sm:inline">Deactivate</span>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8 border-green-500 text-green-600 hover:bg-green-50">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        <span className="sm:inline">Activate</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Tabs for different sections of user details */}
                <Tabs value={detailTab} onValueChange={setDetailTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="access">Access</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  
                  {/* Profile Tab */}
                  <TabsContent value="profile" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <div className="flex items-center flex-wrap">
                              <p className="text-sm font-medium break-all">{userDetailsMock.email}</p>
                              {userDetailsMock.emailVerified && (
                                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Phone</p>
                            <p className="text-sm font-medium">{userDetailsMock.phoneNumber || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Address</p>
                            <p className="text-sm font-medium">{userDetailsMock.address || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Professional Information</h3>
                        <div className="space-y-3">
                          {userDetailsMock.role === 'physician' || userDetailsMock.role === 'radiologist' ? (
                            <>
                              <div>
                                <p className="text-xs text-slate-500">NPI Number</p>
                                <p className="text-sm font-medium">{userDetailsMock.npi || "Not provided"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Specialty</p>
                                <p className="text-sm font-medium">{userDetailsMock.specialty || "Not provided"}</p>
                              </div>
                            </>
                          ) : null}
                          <div>
                            <p className="text-xs text-slate-500">Organization</p>
                            <p className="text-sm font-medium">{userDetailsMock.organizationName || "None (System User)"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Organization Type</p>
                            <p className="text-sm font-medium">{userDetailsMock.organizationType ? (
                              userDetailsMock.organizationType === 'referring' ? 'Referring' : 'Radiology Group'
                            ) : "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2">Account Information</h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">User ID</p>
                            <p className="text-sm font-medium">{userDetailsMock.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Role</p>
                            <p className="text-sm font-medium">{roleDisplayNames[userDetailsMock.role]}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Account Created</p>
                            <p className="text-sm font-medium">{formatDate(userDetailsMock.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Last Login</p>
                            <p className="text-sm font-medium">{formatDate(userDetailsMock.lastLogin)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>
                        <UserCog className="h-4 w-4 mr-2" />
                        Edit User Profile
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Access Tab */}
                  <TabsContent value="access">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Location Access</h3>
                        <div className="border rounded-lg p-4">
                          {userDetailsMock.locationAccess && userDetailsMock.locationAccess.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {userDetailsMock.locationAccess.map((location, index) => (
                                <div key={index} className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                  <span className="text-sm">{location}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No location access configured.</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Security Settings</h3>
                        <div className="border rounded-lg divide-y">
                          <div className="flex justify-between items-center p-4">
                            <div>
                              <p className="font-medium">Email Verification</p>
                              <p className="text-sm text-slate-500">User's email verified status</p>
                            </div>
                            {userDetailsMock.emailVerified ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">Verified</Badge>
                            ) : (
                              <Button size="sm">Verify Email</Button>
                            )}
                          </div>
                          <div className="flex justify-between items-center p-4">
                            <div>
                              <p className="font-medium">Password Reset</p>
                              <p className="text-sm text-slate-500">Send a password reset link to the user</p>
                            </div>
                            <Button variant="outline" size="sm">Send Reset Link</Button>
                          </div>
                          <div className="flex justify-between items-center p-4">
                            <div>
                              <p className="font-medium">Account Status</p>
                              <p className="text-sm text-slate-500">Enable or disable user access</p>
                            </div>
                            {userDetailsMock.active ? (
                              <Button variant="destructive" size="sm">Deactivate Account</Button>
                            ) : (
                              <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50">
                                Activate Account
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Administrative Actions</h3>
                        <div className="border rounded-lg divide-y">
                          <div className="flex justify-between items-center p-4">
                            <div>
                              <p className="font-medium">Change User Role</p>
                              <p className="text-sm text-slate-500">Modify user's permissions level</p>
                            </div>
                            <Button variant="outline" size="sm">Change Role</Button>
                          </div>
                          <div className="flex justify-between items-center p-4">
                            <div>
                              <p className="font-medium">Impersonate User</p>
                              <p className="text-sm text-slate-500">Log in as this user for troubleshooting</p>
                            </div>
                            <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50">
                              <Eye className="h-4 w-4 mr-1" />
                              Impersonate
                            </Button>
                          </div>
                          <div className="flex justify-between items-center p-4">
                            <div>
                              <p className="font-medium">Delete User</p>
                              <p className="text-sm text-slate-500">Permanently remove this user</p>
                            </div>
                            <Button variant="destructive" size="sm">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Activity Tab */}
                  <TabsContent value="activity">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Activity</TableHead>
                                <TableHead>Details</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {userDetailsMock.recentActivity.map(activity => (
                                <TableRow key={activity.id}>
                                  <TableCell>{formatDateTime(activity.timestamp)}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-700">
                                      {activity.type === 'login' ? 'Login' : 
                                       activity.type === 'order_created' ? 'Order Created' : 
                                       activity.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{activity.details}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Export Activity Log
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-10 text-center">
              <div>
                <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No User Selected</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Select a user from the list to view detailed information, manage access, and review activity.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminUsers;