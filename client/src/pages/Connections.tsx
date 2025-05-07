import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { PlusCircle, Search, Building2, Link2, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the Connection type based on API response
interface ApiConnection {
  id: number;
  name: string;
  type: 'radiology' | 'referring';
  status: 'active' | 'pending' | 'rejected';
  connected_at?: string;
  requested_at?: string;
  direction?: 'incoming' | 'outgoing';
}

const Connections = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch connections from the API
  const { data: connections, isLoading, error } = useQuery<ApiConnection[]>({
    queryKey: ['/api/connections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/connections', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Approve connection mutation
  const approveMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await apiRequest('POST', `/api/connections/${connectionId}/approve`, undefined);
      if (!response.ok) {
        throw new Error('Failed to approve connection');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection approved",
        description: "The connection has been successfully approved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Reject connection mutation
  const rejectMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await apiRequest('POST', `/api/connections/${connectionId}/reject`, undefined);
      if (!response.ok) {
        throw new Error('Failed to reject connection');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection rejected",
        description: "The connection has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Terminate connection mutation
  const terminateMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await apiRequest('DELETE', `/api/connections/${connectionId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to terminate connection');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection terminated",
        description: "The connection has been terminated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to terminate connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter connections based on status
  const activeConnections = connections?.filter(conn => conn.status === 'active') || [];
  const pendingConnections = connections?.filter(conn => conn.status === 'pending') || [];
  
  // Filter connections based on search query
  const filteredActiveConnections = searchQuery
    ? activeConnections.filter(conn => conn.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeConnections;
    
  const filteredPendingConnections = searchQuery
    ? pendingConnections.filter(conn => conn.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : pendingConnections;
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Connections" 
        description="Manage connections with other organizations"
      >
        <Button className="inline-flex items-center">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Request Connection
        </Button>
      </PageHeader>
      
      <Card className="mb-6">
        <Tabs defaultValue="active" className="p-0">
          <div className="border-b border-slate-200 p-4 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="active">Active Connections ({activeConnections.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Requests ({pendingConnections.length})</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search connections..."
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
                <span className="ml-2 text-lg">Loading connections...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>Error loading connections. Please try again later.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Connected Since</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredActiveConnections.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                          No active connections found
                        </td>
                      </tr>
                    ) : (
                      filteredActiveConnections.map((connection) => (
                        <tr key={connection.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary-lighter flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{connection.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                              {connection.type === 'radiology' ? 'Radiology Group' : 'Referring Practice'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {connection.connected_at ? new Date(connection.connected_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <Button variant="secondary" size="sm" className="h-8">
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => terminateMutation.mutate(connection.id)}
                                disabled={terminateMutation.isPending}
                              >
                                {terminateMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Terminate
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
          
          <TabsContent value="pending" className="p-0 m-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading connections...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>Error loading connections. Please try again later.</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Direction</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Requested On</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredPendingConnections.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                          No pending connection requests found
                        </td>
                      </tr>
                    ) : (
                      filteredPendingConnections.map((connection) => (
                        <tr key={connection.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-slate-500" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-slate-900">{connection.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                              {connection.type === 'radiology' ? 'Radiology Group' : 'Referring Practice'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center text-sm">
                              <Link2 className="h-4 w-4 text-slate-400 mr-1.5" />
                              {connection.direction === 'incoming' ? 'Incoming Request' : 'Outgoing Request'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {connection.requested_at ? new Date(connection.requested_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              {connection.direction === 'incoming' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => approveMutation.mutate(connection.id)}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                  >
                                    {approveMutation.isPending ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => rejectMutation.mutate(connection.id)}
                                    disabled={approveMutation.isPending || rejectMutation.isPending}
                                  >
                                    {rejectMutation.isPending ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Decline
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="secondary" size="sm" className="h-8">
                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                    Pending Approval
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => terminateMutation.mutate(connection.id)}
                                    disabled={terminateMutation.isPending}
                                  >
                                    {terminateMutation.isPending ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                    )}
                                    Cancel
                                  </Button>
                                </>
                              )}
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

export default Connections;
