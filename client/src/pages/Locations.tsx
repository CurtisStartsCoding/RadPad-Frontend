import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import {
  PlusCircle,
  Map,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the Location type based on API response
interface ApiLocation {
  id: number;
  name: string;
  address: string;
  phone?: string;
  hours?: {
    weekdays: string;
    weekends: string;
  };
  status: 'active' | 'inactive';
  is_primary: boolean;
}

const Locations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch locations from the API
  const { data: locations, isLoading, error } = useQuery<ApiLocation[]>({
    queryKey: ['/api/organizations/mine/locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/organizations/mine/locations', undefined);
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
  
  // Set primary location mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const response = await apiRequest('PUT', `/api/organizations/mine/locations/${locationId}`, {
        is_primary: true
      });
      if (!response.ok) {
        throw new Error('Failed to set primary location');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Primary location updated",
        description: "The location has been set as primary",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/mine/locations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to set primary location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Activate/deactivate location mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ locationId, status }: { locationId: number; status: 'active' | 'inactive' }) => {
      const response = await apiRequest('PUT', `/api/organizations/mine/locations/${locationId}`, {
        status
      });
      if (!response.ok) {
        throw new Error(`Failed to ${status === 'active' ? 'activate' : 'deactivate'} location`);
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === 'active' ? "Location activated" : "Location deactivated",
        description: `The location has been ${variables.status === 'active' ? 'activated' : 'deactivated'}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/mine/locations'] });
    },
    onError: (error, variables) => {
      toast({
        title: "Error",
        description: `Failed to ${variables.status === 'active' ? 'activate' : 'deactivate'} location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  return (
    <div className="p-6">
      <PageHeader
        title="Locations"
        description="Manage your organization's locations"
      >
        <Button className="inline-flex items-center">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Add Location
        </Button>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading locations...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>Error loading locations. Please try again later.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations && locations.map((location) => (
            <Card key={location.id} className={location.status === 'inactive' ? 'opacity-70' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-2">
                    <div className={`rounded-full p-1.5 ${location.is_primary ? 'bg-primary-lighter' : 'bg-slate-100'}`}>
                      <Map className={`h-4 w-4 ${location.is_primary ? 'text-primary' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">
                        {location.name}
                        {location.is_primary && (
                          <span className="ml-2 text-xs font-normal px-1.5 py-0.5 bg-primary-lighter text-primary rounded">
                            Primary
                          </span>
                        )}
                      </CardTitle>
                      {location.status === 'inactive' && (
                        <p className="text-xs text-slate-500">Inactive</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex">
                  <MapPin className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                  <p className="text-slate-700">{location.address}</p>
                </div>
                <div className="flex">
                  <Phone className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                  <p className="text-slate-700">{location.phone || "(206) 555-1234"}</p>
                </div>
                <div className="flex">
                  <Clock className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-700">{location.hours?.weekdays || "Mon-Fri: 8:00 AM - 5:00 PM"}</p>
                    <p className="text-slate-700">{location.hours?.weekends || "Sat-Sun: Closed"}</p>
                  </div>
                </div>
                
                <div className="pt-2 flex justify-between">
                  {location.status === 'active' && !location.is_primary ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => setPrimaryMutation.mutate(location.id)}
                      disabled={setPrimaryMutation.isPending}
                    >
                      {setPrimaryMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Set as Primary
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  {location.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => updateStatusMutation.mutate({ locationId: location.id, status: 'inactive' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        "Deactivate"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => updateStatusMutation.mutate({ locationId: location.id, status: 'active' })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        
        {/* Add Location Card */}
        <Card className="border-dashed border-2 border-slate-300 bg-transparent hover:bg-slate-50 cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center h-full py-10">
            <div className="bg-slate-100 rounded-full p-3 mb-3">
              <PlusCircle className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Add New Location</p>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
};

export default Locations;
