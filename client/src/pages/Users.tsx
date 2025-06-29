import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { PlusCircle, Search, User, Mail, MapPin, Shield, Edit, UserX, Key, Loader2, Phone, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

// Define the User type based on API response
interface ApiUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  organization_id: number;
  created_at: string;
  updated_at: string;
  phone_number?: string;
  specialty?: string;
  npi?: string;
  locations?: {
    id: number;
    name: string;
  }[];
  invited_at?: string;
}

interface InviteFormData {
  email: string;
  role: string;
}

interface EditFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  specialty: string;
  npi: string;
  role: string;
  isActive: boolean;
}

interface Location {
  id: number;
  name: string;
  city: string;
  state: string;
  is_active: boolean;
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({ email: '', role: '' });
  const [editForm, setEditForm] = useState<EditFormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    specialty: '',
    npi: '',
    role: '',
    isActive: true
  });
  const [userLocations, setUserLocations] = useState<number[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [npiValidation, setNpiValidation] = useState<{
    loading: boolean;
    valid: boolean | null;
    providerName: string | null;
    specialty: string | null;
    phoneNumber: string | null;
    error: string | null;
    fullData?: any;
  }>({
    loading: false,
    valid: null,
    providerName: null,
    specialty: null,
    phoneNumber: null,
    error: null
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Get current user from localStorage
  const currentUserData = localStorage.getItem('rad_order_pad_user_data');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const pageSize = 20;
  
  // Fetch users from the API
  const { data: users, isLoading, error } = useQuery<ApiUser[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users', undefined);
      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error - redirect to login
          window.location.href = '/login';
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      // Extract users array from the nested response structure
      if (data.success && data.data && Array.isArray(data.data.users)) {
        return data.data.users;
      }
      return [];
    },
    staleTime: 60000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error.message === 'Authentication required') {
        return false;
      }
      return failureCount < 3;
    },
  });
  
  // Check if we have a valid auth token
  const authToken = localStorage.getItem('rad_order_pad_access_token');
  if (!authToken && !isLoading) {
    // No token, redirect to login
    window.location.href = '/login';
  }
  
  // Fetch organization locations
  const { data: orgLocations, error: locationsError, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ['/api/organizations/mine/locations'],
    queryFn: async () => {
      console.log('Fetching organization locations...');
      const response = await apiRequest('GET', '/api/organizations/mine/locations', undefined);
      console.log('Location API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch locations:', response.status, errorData);
        throw new Error(`Failed to fetch locations: ${response.status} ${errorData.message || ''}`);
      }
      const data = await response.json();
      console.log('Organization locations response:', data);
      console.log('Response type:', typeof data);
      console.log('Response keys:', Object.keys(data || {}));
      
      // Handle different response formats
      let locations;
      if (data.success && data.data) {
        locations = data.data;
        console.log('Using data.data format, found:', locations?.length, 'locations');
      } else if (data.locations) {
        locations = data.locations;
        console.log('Using data.locations format, found:', locations?.length, 'locations');
      } else if (Array.isArray(data)) {
        locations = data;
        console.log('Using direct array format, found:', locations?.length, 'locations');
      } else {
        locations = [];
        console.log('No locations found in response, using empty array');
      }
      
      // Ensure we always return an array
      const finalLocations = Array.isArray(locations) ? locations : [];
      console.log('Final locations to return:', finalLocations);
      return finalLocations;
    },
    staleTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      console.log('Location query retry attempt:', failureCount, error?.message);
      return failureCount < 3;
    },
  });
  
  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deactivated",
        description: "The user has been successfully deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Invite user mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const response = await apiRequest('POST', '/api/user-invites/invite', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The invitation has been successfully sent",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowInviteDialog(false);
      setInviteForm({ email: '', role: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: "destructive",
      });
    },
  });
  
  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: EditFormData }) => {
      const response = await apiRequest('PUT', `/api/users/${userId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowEditDialog(false);
      setEditingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: "destructive",
      });
    },
  });
  
  // Helper function to determine available roles based on current user
  const getAvailableRoles = () => {
    if (currentUser?.role === 'admin_referring') {
      return ['physician', 'admin_staff'];
    } else if (currentUser?.role === 'admin_radiology') {
      return ['scheduler', 'radiologist'];
    }
    return [];
  };
  
  // Fetch user locations when editing
  const fetchUserLocations = async (userId: number) => {
    setLoadingLocations(true);
    try {
      const response = await apiRequest('GET', `/api/user-locations/${userId}/locations`, undefined);
      if (response.ok) {
        const data = await response.json();
        console.log('User locations response:', data);
        // Handle different response formats
        const locations = data.locations || data.data || data || [];
        const locationIds = Array.isArray(locations) 
          ? locations.map((loc: any) => loc.id)
          : [];
        setUserLocations(locationIds);
      } else if (response.status === 404) {
        // User-location endpoint might not be implemented yet
        console.log('User locations endpoint not found - feature may not be implemented');
        setUserLocations([]);
      }
    } catch (error) {
      console.log('User locations feature not available:', error);
      // Don't show error to user, just continue without locations
      setUserLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };
  
  // Lookup NPI in the CMS registry
  const lookupNPI = async (npi: string) => {
    if (!npi || npi.length !== 10) {
      setNpiValidation({
        loading: false,
        valid: null,
        providerName: null,
        specialty: null,
        phoneNumber: null,
        error: null
      });
      return;
    }

    setNpiValidation(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiRequest('GET', `/api/utilities/npi-lookup?number=${npi}`, undefined);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'NPI lookup failed');
      }
      const result = await response.json();

      if (!result.success) {
        setNpiValidation({
          loading: false,
          valid: false,
          providerName: null,
          specialty: null,
          phoneNumber: null,
          error: result.error || 'NPI not found in registry'
        });
        return;
      }

      const data = result.data;
      const basic = data.basic;
      
      // Extract provider name
      let providerName = '';
      if (basic.firstName && basic.lastName) {
        providerName = `${basic.firstName} ${basic.lastName}`;
        if (basic.middleName) {
          providerName = `${basic.firstName} ${basic.middleName} ${basic.lastName}`;
        }
        if (basic.credential) {
          providerName += `, ${basic.credential}`;
        }
      } else if (basic.organizationName) {
        providerName = basic.organizationName;
      }

      // Use the primary taxonomy from the backend
      const specialty = data.primaryTaxonomy || '';
      
      // Extract phone number from location address
      let phoneNumber = '';
      if (data.addresses && data.addresses.length > 0) {
        // Find the location address (not mailing)
        const locationAddress = data.addresses.find((addr: any) => addr.addressPurpose === 'LOCATION') || data.addresses[0];
        if (locationAddress && locationAddress.telephoneNumber) {
          // Format the phone number
          const digits = locationAddress.telephoneNumber.replace(/\D/g, '');
          if (digits.length === 10) {
            phoneNumber = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
          } else {
            phoneNumber = locationAddress.telephoneNumber;
          }
        }
      }

      setNpiValidation({
        loading: false,
        valid: true,
        providerName,
        specialty,
        error: null,
        phoneNumber,
        // Store the full data for potential use
        fullData: data
      });

      // Auto-populate specialty if found and field is empty
      if (specialty && !editForm.specialty) {
        setEditForm(prev => ({ ...prev, specialty }));
      }

    } catch (error) {
      console.error('NPI lookup error:', error);
      setNpiValidation({
        loading: false,
        valid: null,
        providerName: null,
        specialty: null,
        phoneNumber: null,
        error: 'Failed to verify NPI',
        fullData: undefined
      });
    }
  };

  // Update user location assignments
  const updateUserLocations = async (userId: number, newLocationIds: number[]) => {
    const currentLocationIds = userLocations;
    
    // Find locations to add and remove
    const locationsToAdd = newLocationIds.filter(id => !currentLocationIds.includes(id));
    const locationsToRemove = currentLocationIds.filter(id => !newLocationIds.includes(id));
    
    const promises = [];
    
    // Add new locations
    for (const locationId of locationsToAdd) {
      promises.push(
        apiRequest('POST', `/api/user-locations/${userId}/locations/${locationId}`, {})
      );
    }
    
    // Remove unassigned locations
    for (const locationId of locationsToRemove) {
      promises.push(
        apiRequest('DELETE', `/api/user-locations/${userId}/locations/${locationId}`, undefined)
      );
    }
    
    try {
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to update locations:', error);
      return { success: false, error };
    }
  };
  
  // Helper function to open edit dialog
  const handleEdit = (user: ApiUser) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number || '',
      specialty: user.specialty || '',
      npi: user.npi || '',
      role: user.role,
      isActive: user.is_active
    });
    // Reset NPI validation
    setNpiValidation({
      loading: false,
      valid: null,
      providerName: null,
      specialty: null,
      phoneNumber: null,
      error: null
    });
    // Fetch user's current locations
    fetchUserLocations(user.id);
    
    // If user has an NPI, validate it
    if (user.npi && user.npi.length === 10) {
      lookupNPI(user.npi);
    }
    
    setShowEditDialog(true);
  };
  
  // Handle phone number formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '');
    
    if (digits.length <= 10) {
      let formatted = '';
      if (digits.length > 0) {
        if (digits.length <= 3) {
          formatted = `(${digits}`;
        } else if (digits.length <= 6) {
          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else {
          formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
      }
      setEditForm({ ...editForm, phoneNumber: formatted });
    }
  };
  
  // Filter users based on active status
  const activeUsers = users?.filter(user => user.is_active === true && user.email_verified === true) || [];
  // Pending invitations are users that are not active or not email verified
  const invitedUsers = users?.filter(user => user.is_active === false || user.email_verified === false) || [];
  
  // Filter users based on search query
  const filteredActiveUsers = searchQuery
    ? activeUsers.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeUsers;
    
  const filteredInvitedUsers = searchQuery
    ? invitedUsers.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : invitedUsers;
    
  // Pagination calculations
  const paginateUsers = (userList: ApiUser[]) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      paginatedUsers: userList.slice(startIndex, endIndex),
      totalPages: Math.ceil(userList.length / pageSize),
      showing: {
        start: userList.length > 0 ? startIndex + 1 : 0,
        end: Math.min(endIndex, userList.length),
        total: userList.length
      }
    };
  };
  
  const activePagination = paginateUsers(filteredActiveUsers);
  const invitedPagination = paginateUsers(filteredInvitedUsers);
    
  // Helper function to get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };
  
  // Debounced NPI lookup
  useEffect(() => {
    if (editForm.npi.length === 10) {
      const timer = setTimeout(() => {
        lookupNPI(editForm.npi);
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timer);
    } else if (editForm.npi.length > 0) {
      setNpiValidation({
        loading: false,
        valid: false,
        providerName: null,
        specialty: null,
        phoneNumber: null,
        error: 'NPI must be 10 digits',
        fullData: undefined
      });
    }
  }, [editForm.npi]);
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Users" 
        description="Manage users in your organization"
      >
        <Button className="inline-flex items-center" onClick={() => setShowInviteDialog(true)}>
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Invite User
        </Button>
      </PageHeader>
      
      {/* Debug Information */}
      {users && users.length > 0 && (
        <Card className="mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Users:</span>
                <span className="ml-2 font-medium">{users.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Active Users:</span>
                <span className="ml-2 font-medium text-green-600">{activeUsers.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Pending/Inactive:</span>
                <span className="ml-2 font-medium text-yellow-600">{invitedUsers.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Your Role:</span>
                <span className="ml-2 font-medium">{currentUser?.role || 'Unknown'}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <span className="text-gray-600 text-xs">Organization ID:</span>
                <span className="ml-2 font-mono text-xs">{currentUser?.organization_id || 'N/A'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                {showDebugInfo ? 'Hide' : 'Show'} Raw Data
              </Button>
            </div>
            {showDebugInfo && (
              <pre className="mt-3 p-3 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
                {JSON.stringify(users, null, 2)}
              </pre>
            )}
          </div>
        </Card>
      )}
      
      <Card className="mb-6">
        <Tabs defaultValue="active" className="p-0" onValueChange={() => setCurrentPage(1)}>
          <div className="border-b border-slate-200 p-4 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="active">Active Users ({activeUsers.length})</TabsTrigger>
              <TabsTrigger value="invited">Pending Invitations ({invitedUsers.length})</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
          
          <TabsContent value="active" className="p-0 m-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading users...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error.message === 'Authentication required' 
                  ? 'Your session has expired. Redirecting to login...' 
                  : 'Error loading users. Please try again later.'}</p>
                {error.message !== 'Authentication required' && (
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Locations</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredActiveUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                          No active users found
                        </td>
                      </tr>
                    ) : (
                      activePagination.paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary-lighter flex items-center justify-center text-primary font-medium">
                                {getUserInitials(user.first_name, user.last_name)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{`${user.first_name} ${user.last_name}`}</div>
                                <div className="space-y-0.5">
                                  <div className="text-xs text-slate-500 flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {user.email}
                                  </div>
                                  {user.phone_number && (
                                    <div className="text-xs text-slate-500 flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {user.phone_number}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-slate-900">
                                <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                              </div>
                              {user.specialty && (
                                <p className="text-xs text-slate-500">{user.specialty}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.locations && user.locations.length > 0 ? (
                              <div className="flex items-start text-sm">
                                <MapPin className="h-4 w-4 text-slate-400 mr-1.5 mt-0.5" />
                                <span className="text-slate-900">{user.locations.map(loc => loc.name).join(', ')}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">No locations assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8"
                                onClick={() => handleEdit(user)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => deactivateMutation.mutate(user.id)}
                                disabled={deactivateMutation.isPending}
                              >
                                {deactivateMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Deactivate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {activePagination.totalPages > 1 && (
                  <div className="px-6 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {activePagination.showing.start} to {activePagination.showing.end} of{' '}
                      {activePagination.showing.total} users
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center px-3 text-sm">
                        Page {currentPage} of {activePagination.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(activePagination.totalPages, prev + 1))}
                        disabled={currentPage === activePagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="invited" className="p-0 m-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading invitations...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error.message === 'Authentication required' 
                  ? 'Your session has expired. Redirecting to login...' 
                  : 'Error loading invitations. Please try again later.'}</p>
                {error.message !== 'Authentication required' && (
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr className="bg-slate-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invited On</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredInvitedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                            No pending invitations found
                          </td>
                        </tr>
                      ) : (
                      invitedPagination.paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="h-5 w-5" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{`${user.first_name} ${user.last_name}`}</div>
                                <div className="space-y-0.5">
                                  <div className="text-xs text-slate-500 flex items-center">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {user.email}
                                  </div>
                                  {user.phone_number && (
                                    <div className="text-xs text-slate-500 flex items-center">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {user.phone_number}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-slate-900">
                                <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                              </div>
                              {user.specialty && (
                                <p className="text-xs text-slate-500">{user.specialty}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.invited_at ? formatDate(user.invited_at) :
                             user.created_at ? formatDate(user.created_at) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <span className="text-sm text-slate-500">Pending activation</span>
                            </div>
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              
              {/* Pagination Controls */}
              {invitedPagination.totalPages > 1 && (
                <div className="px-6 py-3 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {invitedPagination.showing.start} to {invitedPagination.showing.end} of{' '}
                    {invitedPagination.showing.total} pending users
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center px-3 text-sm">
                      Page {currentPage} of {invitedPagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(invitedPagination.totalPages, prev + 1))}
                      disabled={currentPage === invitedPagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={(e) => {
            e.preventDefault();
            inviteMutation.mutate(inviteForm);
          }}>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={inviteForm.role} 
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
                  required
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map(role => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <p className="text-sm text-slate-500">
                  <strong>Note:</strong> Location access can be assigned after the user accepts the invitation.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowInviteDialog(false);
                  setInviteForm({ email: '', role: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={inviteMutation.isPending || !inviteForm.email || !inviteForm.role}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditingUser(null);
          setUserLocations([]);
          setNpiValidation({
            loading: false,
            valid: null,
            providerName: null,
            specialty: null,
            phoneNumber: null,
            error: null
          });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (editingUser) {
              // Update user info first - filter role if not allowed
              const allowedRoles = getAvailableRoles();
              let updateData: any = { ...editForm };
              
              // If the role is not in allowed roles, don't send it (keep existing role)
              if (!allowedRoles.includes(editForm.role)) {
                console.log(`Role '${editForm.role}' not allowed for ${currentUser?.role}, removing from update`);
                const { role, ...dataWithoutRole } = updateData;
                updateData = dataWithoutRole;
              }
              
              await updateMutation.mutateAsync({ userId: editingUser.id, data: updateData });
              
              // Then update location assignments
              const locationResult = await updateUserLocations(editingUser.id, userLocations);
              
              if (!locationResult.success) {
                toast({
                  title: "Warning",
                  description: "User updated but location assignments failed",
                  variant: "destructive",
                });
              } else {
                // Refresh the user list to show updated locations
                queryClient.invalidateQueries({ queryKey: ['/api/users'] });
              }
            }
          }}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={editForm.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  placeholder="e.g., Cardiology"
                />
              </div>
              
              {(editForm.role === 'physician' || editForm.role === 'radiologist') && (
                <div className="grid gap-2">
                  <Label htmlFor="npi">NPI</Label>
                  <div className="relative">
                    <Input
                      id="npi"
                      value={editForm.npi}
                      onChange={(e) => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '');
                        setEditForm({ ...editForm, npi: value });
                      }}
                      placeholder="10-digit NPI"
                      maxLength={10}
                      className={npiValidation.valid === false ? 'pr-10 border-red-500' : 'pr-10'}
                    />
                    {/* Validation icon */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {npiValidation.loading && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      )}
                      {npiValidation.valid === true && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {npiValidation.valid === false && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                  {/* Validation message */}
                  {npiValidation.providerName && (
                    <p className="text-sm text-green-600">
                      ✓ Verified: {npiValidation.providerName}
                    </p>
                  )}
                  {npiValidation.error && (
                    <p className="text-sm text-red-600">
                      {npiValidation.error}
                    </p>
                  )}
                  
                  {/* Name mismatch warning */}
                  {npiValidation.fullData && npiValidation.valid && (
                    <>
                      {(npiValidation.fullData.basic.firstName !== editForm.firstName || 
                        npiValidation.fullData.basic.lastName !== editForm.lastName) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
                          <p className="text-sm text-yellow-800 font-medium">Name Mismatch Detected</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            The NPI is registered to {npiValidation.providerName} but the form shows {editForm.firstName} {editForm.lastName}.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => {
                              const data = npiValidation.fullData.basic;
                              setEditForm(prev => ({
                                ...prev,
                                firstName: data.firstName || '',
                                lastName: data.lastName || '',
                                specialty: npiValidation.specialty || prev.specialty,
                                phoneNumber: npiValidation.phoneNumber || prev.phoneNumber
                              }));
                              toast({
                                title: "Fields Updated",
                                description: "Name, phone, and specialty updated from NPI registry",
                              });
                            }}
                          >
                            Update to NPI Registry Data
                          </Button>
                        </div>
                      )}
                      
                      {/* Additional data from registry */}
                      <div className="space-y-2 mt-2">
                        {/* Phone number suggestion */}
                        {npiValidation.phoneNumber && editForm.phoneNumber !== npiValidation.phoneNumber && (
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-blue-600">
                              Registry phone: {npiValidation.phoneNumber}
                            </p>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="text-xs"
                              onClick={() => setEditForm({ ...editForm, phoneNumber: npiValidation.phoneNumber || '' })}
                            >
                              Use this phone
                            </Button>
                          </div>
                        )}
                        
                        {/* Specialty suggestion */}
                        {npiValidation.specialty && editForm.specialty !== npiValidation.specialty && (
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-blue-600">
                              Registry specialty: {npiValidation.specialty}
                            </p>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="text-xs"
                              onClick={() => setEditForm({ ...editForm, specialty: npiValidation.specialty || '' })}
                            >
                              Use this specialty
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="editRole">Role</Label>
                {(() => {
                  const allowedRoles = getAvailableRoles();
                  const canChangeRole = allowedRoles.includes(editForm.role);
                  
                  if (!canChangeRole) {
                    // Show read-only role display when role cannot be changed
                    return (
                      <div className="p-3 bg-gray-50 border rounded-md">
                        <span className="text-sm text-gray-700">
                          {editForm.role.charAt(0).toUpperCase() + editForm.role.slice(1).replace('_', ' ')}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          You cannot change this user's role
                        </p>
                      </div>
                    );
                  }
                  
                  // Show editable select when role can be changed
                  return (
                    <Select 
                      value={editForm.role} 
                      onValueChange={(value) => setEditForm({ ...editForm, role: value })}
                    >
                      <SelectTrigger id="editRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedRoles.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Account Status</Label>
                <Button
                  type="button"
                  variant={editForm.isActive ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                >
                  {editForm.isActive ? 'Active' : 'Inactive'}
                </Button>
              </div>
              
              {/* Location Assignments */}
              <div className="grid gap-2">
                <Label>Assigned Locations</Label>
                {(() => {
                  console.log('Location assignment debug:', {
                    orgLocations: orgLocations,
                    orgLocationsLength: orgLocations?.length,
                    loadingLocations: loadingLocations,
                    locationsError: locationsError,
                    userLocations: userLocations
                  });
                  
                  if (locationsError) {
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">Error loading locations: {locationsError.message}</p>
                      </div>
                    );
                  }
                  
                  if (loadingLocations) {
                    return (
                      <div className="flex items-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-slate-500">Loading locations...</span>
                      </div>
                    );
                  }
                  
                  if (!orgLocations) {
                    return (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-600">No locations data available</p>
                      </div>
                    );
                  }
                  
                  // Ensure orgLocations is an array
                  const locationsArray = Array.isArray(orgLocations) ? orgLocations : [];
                  console.log('Locations array:', locationsArray);
                  
                  if (locationsArray.length === 0) {
                    return (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-600">No locations found for your organization</p>
                      </div>
                    );
                  }
                  
                  const activeLocations = locationsArray.filter((loc: any) => loc.is_active);
                  console.log('Active locations:', activeLocations);
                  
                  if (activeLocations.length === 0) {
                    return (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-600">No active locations available</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {activeLocations.map((location: any) => (
                        <div key={location.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location.id}`}
                            checked={userLocations.includes(location.id)}
                            onCheckedChange={(checked) => {
                              console.log('Checkbox changed:', { locationId: location.id, checked, currentUserLocations: userLocations });
                              if (checked) {
                                const newLocations = [...userLocations, location.id];
                                console.log('Adding location, new array:', newLocations);
                                setUserLocations(newLocations);
                              } else {
                                const newLocations = userLocations.filter(id => id !== location.id);
                                console.log('Removing location, new array:', newLocations);
                                setUserLocations(newLocations);
                              }
                            }}
                          />
                          <label
                            htmlFor={`location-${location.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {location.name}
                            <span className="text-xs text-slate-500 ml-2">
                              {location.city}, {location.state}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingUser(null);
                  setUserLocations([]);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
