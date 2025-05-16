import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { PlusCircle, Search, User, Mail, MapPin, Shield, Edit, UserX, Key, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  locations?: {
    id: number;
    name: string;
  }[];
  invited_at?: string;
}

const Users = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users from the API
  const { data: users, isLoading, error } = useQuery<ApiUser[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users', undefined);
      if (!response.ok) {
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
  
  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/users/${userId}/resend-invitation`, undefined);
      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "The invitation has been successfully resent",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/users/${userId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been successfully cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel invitation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter users based on active status
  const activeUsers = users?.filter(user => user.is_active === true) || [];
  // For now, consider all non-active users as invited (this may need refinement)
  const invitedUsers = users?.filter(user => user.is_active === false) || [];
  
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
    
  // Helper function to get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Users" 
        description="Manage users in your organization"
      >
        <Button className="inline-flex items-center">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Invite User
        </Button>
      </PageHeader>
      
      <Card className="mb-6">
        <Tabs defaultValue="active" className="p-0">
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <p>Error loading users. Please try again later.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
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
                      filteredActiveUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary-lighter flex items-center justify-center text-primary font-medium">
                                {getUserInitials(user.first_name, user.last_name)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{`${user.first_name} ${user.last_name}`}</div>
                                <div className="text-xs text-slate-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-slate-900">
                              <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                              {user.role}
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
                              <Button variant="outline" size="sm" className="h-8">
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" className="h-8">
                                <Key className="h-3.5 w-3.5 mr-1.5" />
                                Reset Password
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
                <p>Error loading invitations. Please try again later.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
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
                      filteredInvitedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                <User className="h-5 w-5" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{`${user.first_name} ${user.last_name}`}</div>
                                <div className="text-xs text-slate-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-slate-900">
                              <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                              {user.role}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.invited_at ? new Date(user.invited_at).toLocaleDateString() :
                             user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => resendInvitationMutation.mutate(user.id)}
                                disabled={resendInvitationMutation.isPending || cancelInvitationMutation.isPending}
                              >
                                {resendInvitationMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Resend Invitation
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => cancelInvitationMutation.mutate(user.id)}
                                disabled={resendInvitationMutation.isPending || cancelInvitationMutation.isPending}
                              >
                                {cancelInvitationMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Cancel Invitation
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Users;
