import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Define the Location type based on API response
interface ApiLocation {
  id: number;
  organization_id: number;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Locations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ApiLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    phone_number: ''
  });
  const [showRawData, setShowRawData] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  
  // Fetch locations from the API
  const { data, isLoading, error } = useQuery({
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
  
  // Extract locations array from the response
  const allLocations: ApiLocation[] = data?.locations || [];
  
  // Filter locations based on status filter
  const locations = allLocations.filter(location => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return location.is_active;
    if (statusFilter === 'inactive') return !location.is_active;
    return true;
  });
  
  // Deactivate location mutation
  const deactivateMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const response = await apiRequest('DELETE', `/api/organizations/mine/locations/${locationId}`, undefined);
      if (!response.ok) {
        throw new Error('Failed to deactivate location');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location deactivated",
        description: "The location has been deactivated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/mine/locations'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to deactivate location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });
  
  // Create location mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/organizations/mine/locations', data);
      if (!response.ok) {
        throw new Error('Failed to create location');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location created",
        description: "The location has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/mine/locations'] });
      setShowDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Update location mutation
  const updateMutation = useMutation({
    mutationFn: async ({ locationId, updates }: { locationId: number; updates: Partial<ApiLocation> }) => {
      const response = await apiRequest('PUT', `/api/organizations/mine/locations/${locationId}`, updates);
      if (!response.ok) {
        throw new Error('Failed to update location');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Location updated",
        description: "The location has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations/mine/locations'] });
      setShowDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update location: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // Return original if not 10 digits
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (digits.length <= 10) {
      // Format as user types
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
      setFormData({ ...formData, phone_number: formatted });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip_code: '',
      phone_number: ''
    });
    setEditingLocation(null);
  };

  const handleOpenDialog = (location?: ApiLocation) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address_line1: location.address_line1,
        address_line2: location.address_line2 || '',
        city: location.city,
        state: location.state,
        zip_code: location.zip_code,
        phone_number: location.phone_number ? formatPhoneNumber(location.phone_number) : ''
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      updateMutation.mutate({ locationId: editingLocation.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  return (
    <div className="p-6">
      <PageHeader
        title="Locations"
        description="Manage your organization's locations"
      >
        <Button className="inline-flex items-center" onClick={() => handleOpenDialog()}>
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Add Location
        </Button>
      </PageHeader>
      
      {/* Debug Information */}
      {allLocations.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Locations:</span>
              <span className="ml-2 font-medium">{allLocations.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Active Locations:</span>
              <span className="ml-2 font-medium text-green-600">
                {allLocations.filter(loc => loc.is_active).length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Inactive Locations:</span>
              <span className="ml-2 font-medium text-red-600">
                {allLocations.filter(loc => !loc.is_active).length}
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="text-gray-600 text-xs">Organization ID:</span>
              <span className="ml-2 font-mono text-xs">{allLocations[0]?.organization_id || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-xs text-gray-600">Filter:</Label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger id="status-filter" className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                  <SelectItem value="all">All Locations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowRawData(!showRawData)}
          >
            {showRawData ? 'Hide' : 'Show'} Raw Data
          </Button>
          {showRawData && (
            <pre className="mt-3 p-3 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
              {JSON.stringify(allLocations, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      {/* Filter Status */}
      {statusFilter !== 'active' && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center justify-between">
          <span className="text-sm text-yellow-800">
            Showing {statusFilter === 'all' ? 'all' : 'only inactive'} locations
            {statusFilter === 'inactive' && ' (these locations are hidden from normal operations)'}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter('active')}
            className="text-xs"
          >
            Show Active Only
          </Button>
        </div>
      )}
      
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
          {locations.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                No {statusFilter === 'all' ? '' : statusFilter} locations found.
              </p>
              {statusFilter !== 'all' && (
                <Button
                  variant="link"
                  onClick={() => setStatusFilter('all')}
                  className="mt-2"
                >
                  Show all locations
                </Button>
              )}
            </div>
          )}
          {locations.map((location) => (
            <Card key={location.id} className={`h-full flex flex-col ${!location.is_active ? 'border-red-200 bg-red-50/30' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium flex items-center">
                      {location.name}
                      <span className="ml-2 text-xs font-normal text-gray-400">(ID: {location.id})</span>
                    </CardTitle>
                    {!location.is_active && (
                      <p className="text-xs text-slate-500 mt-1">Inactive</p>
                    )}
                  </div>
                  {location.is_active && (
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenDialog(location)}
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {/* Address Section */}
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                    <div className="text-slate-700">
                      <p>{location.address_line1}</p>
                      {location.address_line2 && <p>{location.address_line2}</p>}
                      <p>{location.city}, {location.state} {location.zip_code}</p>
                    </div>
                  </div>
                  
                  {/* Phone Section */}
                  <div className="flex items-start">
                    <Phone className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                    <p className="text-slate-700">
                      {location.phone_number ? formatPhoneNumber(location.phone_number) : '—'}
                    </p>
                  </div>
                </div>
                
                {/* Footer Section */}
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      <div>Created: {formatDate(location.created_at)}</div>
                      <div>Updated: {formatDate(location.updated_at)}</div>
                    </div>
                    {location.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 px-3 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deactivateMutation.mutate(location.id)}
                        disabled={deactivateMutation.isPending}
                      >
                        {deactivateMutation.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          "Deactivate"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        
        {/* Add Location Card - Only show when viewing active locations */}
        {statusFilter !== 'inactive' && (
          <Card 
            className="border-dashed border-2 border-slate-300 bg-transparent hover:bg-slate-50 cursor-pointer h-full"
            onClick={() => handleOpenDialog()}
          >
            <CardContent className="flex flex-col items-center justify-center h-full py-8">
              <div className="bg-slate-100 rounded-full p-3 mb-3">
                <PlusCircle className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Add New Location</p>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Location Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation 
                  ? 'Update the location information below.' 
                  : 'Enter the details for the new location.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Main Office"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input
                  id="address_line1"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line2"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  placeholder="Suite 100"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Seattle"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    placeholder="WA"
                    maxLength={2}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setFormData({ ...formData, zip_code: value });
                    }}
                    placeholder="98101"
                    maxLength={5}
                    pattern="[0-9]{5}"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Phone Number (Optional)</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={handlePhoneChange}
                    placeholder="(206) 555-1234"
                    maxLength={14}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingLocation ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingLocation ? 'Update Location' : 'Create Location'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Locations;
