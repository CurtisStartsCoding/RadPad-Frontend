import { useState, useEffect } from "react";
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
  Plus,
  Loader2
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { formatDateShort } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  listUsers, 
  getUserDetails, 
  updateUserStatus, 
  SuperAdminUser, 
  UserDetails,
  UserStatusUpdateRequest 
} from "@/lib/superadmin-api";
import { useToast } from "@/hooks/use-toast";

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
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetails | null>(null);
  const [detailTab, setDetailTab] = useState("profile");
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load users function
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await listUsers();
      setUsers(response.users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load user details when a user is selected
  const loadUserDetails = async (userId: number) => {
    try {
      setLoadingUserDetails(true);
      const userDetails = await getUserDetails(userId);
      setSelectedUserDetails(userDetails);
    } catch (error) {
      console.error('Error loading user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Handle user status update
  const handleStatusUpdate = async (userId: number, isActive: boolean) => {
    try {
      setUpdatingStatus(true);
      const statusUpdate: UserStatusUpdateRequest = { isActive };
      await updateUserStatus(userId, statusUpdate);
      
      // Refresh users list and user details
      await loadUsers();
      if (selectedUserId === userId) {
        await loadUserDetails(userId);
      }
      
      toast({
        title: "Success",
        description: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.is_active) || 
                         (statusFilter === "inactive" && !user.is_active);
    const matchesOrganization = organizationFilter === "all" || 
                               (user.organization_id?.toString() === organizationFilter);
    
    return matchesSearch && matchesRole && matchesStatus && matchesOrganization;
  });

  // Get unique organizations for filter dropdown
  const uniqueOrganizations = Array.from(new Set(users
    .filter(user => user.organization_id !== null && user.organization_name)
    .map(user => ({ id: user.organization_id, name: user.organization_name }))
  )).filter(org => org.id !== undefined && org.name !== undefined);

  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`;
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
    loadUserDetails(userId);
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
              {loading ? "Loading..." : `${filteredUsers.length} users found`}
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
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-slate-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
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
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{user.first_name} {user.last_name}</h3>
                          <ChevronRight className="h-4 w-4 ml-1 text-slate-400 shrink-0" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="outline" className={`${getRoleBadgeColor(user.role)} text-xs`}>
                            {roleDisplayNames[user.role]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.is_active ? 'Active' : 'Inactive'}
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
          {selectedUserId && selectedUserDetails ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedUserDetails.first_name, selectedUserDetails.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedUserDetails.first_name} {selectedUserDetails.last_name}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className={getRoleBadgeColor(selectedUserDetails.role)}>
                          {roleDisplayNames[selectedUserDetails.role]}
                        </Badge>
                        {getStatusBadge(selectedUserDetails.is_active)}
                        {selectedUserDetails.organization_name && (
                          <span className="text-sm">{selectedUserDetails.organization_name}</span>
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
                    {selectedUserDetails.is_active ? (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-8"
                        onClick={() => handleStatusUpdate(selectedUserDetails.id, false)}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span className="sm:inline">Deactivate</span>
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => handleStatusUpdate(selectedUserDetails.id, true)}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span className="sm:inline">Activate</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {loadingUserDetails ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-slate-500">Loading user details...</p>
                  </div>
                ) : (
                  <Tabs value={detailTab} onValueChange={setDetailTab}>
                    <TabsList className="grid grid-cols-2 mb-4">
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="access">Access</TabsTrigger>
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
                                <p className="text-sm font-medium break-all">{selectedUserDetails.email}</p>
                                {selectedUserDetails.email_verified && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Phone</p>
                              <p className="text-sm font-medium">{selectedUserDetails.phone_number || "Not provided"}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Professional Information</h3>
                          <div className="space-y-3">
                            {(selectedUserDetails.role === 'physician' || selectedUserDetails.role === 'radiologist') && (
                              <>
                                <div>
                                  <p className="text-xs text-slate-500">NPI Number</p>
                                  <p className="text-sm font-medium">{selectedUserDetails.npi || "Not provided"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Specialty</p>
                                  <p className="text-sm font-medium">{selectedUserDetails.specialty || "Not provided"}</p>
                                </div>
                              </>
                            )}
                            <div>
                              <p className="text-xs text-slate-500">Organization</p>
                              <p className="text-sm font-medium">{selectedUserDetails.organization_name || "None (System User)"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Organization Type</p>
                              <p className="text-sm font-medium">{selectedUserDetails.organization_type ? (
                                selectedUserDetails.organization_type === 'referring' ? 'Referring' : 
                                selectedUserDetails.organization_type === 'radiology_group' ? 'Radiology Group' :
                                selectedUserDetails.organization_type === 'health_system' ? 'Health System' : 
                                selectedUserDetails.organization_type
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
                              <p className="text-sm font-medium">{selectedUserDetails.id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Role</p>
                              <p className="text-sm font-medium">{roleDisplayNames[selectedUserDetails.role]}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Account Created</p>
                              <p className="text-sm font-medium">{formatDateShort(selectedUserDetails.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">Last Login</p>
                              <p className="text-sm font-medium">{selectedUserDetails.last_login ? formatDateShort(selectedUserDetails.last_login) : "Never"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Access Tab */}
                    <TabsContent value="access">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Location Access</h3>
                          <div className="border rounded-lg p-4">
                            {selectedUserDetails.locations && selectedUserDetails.locations.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedUserDetails.locations.map((location) => (
                                  <div key={location.id} className="flex items-center">
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm">{location.name}</span>
                                    {!location.is_active && (
                                      <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-700 border-red-200">
                                        Inactive
                                      </Badge>
                                    )}
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
                              {selectedUserDetails.email_verified ? (
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
                              {selectedUserDetails.is_active ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(selectedUserDetails.id, false)}
                                  disabled={updatingStatus}
                                >
                                  {updatingStatus ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : null}
                                  Deactivate Account
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-green-500 text-green-600 hover:bg-green-50"
                                  onClick={() => handleStatusUpdate(selectedUserDetails.id, true)}
                                  disabled={updatingStatus}
                                >
                                  {updatingStatus ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : null}
                                  Activate Account
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
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