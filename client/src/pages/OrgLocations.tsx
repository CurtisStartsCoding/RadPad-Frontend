import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Building, Phone, Plus, Trash2, Check, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrgLocations() {
  // Define a type for location status
  type LocationStatus = "active" | "inactive";
  
  // Define a type for location
  type Location = {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    status: LocationStatus;
    isPrimary: boolean;
  };
  
  const [locations, setLocations] = useState<Location[]>([
    {
      id: 1,
      name: "Main Office",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      phone: "(555) 123-4567",
      status: "active",
      isPrimary: true
    }
  ]);
  
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    city: "",
    state: "NY",
    zipCode: "",
    phone: "",
    isPrimary: false
  });
  
  const handleAddLocation = async () => {
    // Basic validation
    if (!newLocation.name || !newLocation.address || !newLocation.city || !newLocation.state || !newLocation.zipCode) {
      toast({
        title: "Missing required fields",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Map frontend location data to API expected format
      const locationData = {
        name: newLocation.name,
        address_line1: newLocation.address,
        city: newLocation.city,
        state: newLocation.state,
        zip_code: newLocation.zipCode,
        phone_number: newLocation.phone
      };
      
      // Make API call to create location
      const response = await apiRequest('POST', '/api/organizations/mine/locations', locationData);
      const result = await response.json();
      
      // Map API response to frontend location format
      const createdLocation: Location = {
        id: result.location.id,
        name: result.location.name,
        address: result.location.address_line1,
        city: result.location.city,
        state: result.location.state,
        zipCode: result.location.zip_code,
        phone: result.location.phone_number || "",
        status: result.location.is_active ? "active" : "inactive",
        isPrimary: newLocation.isPrimary
      };
      
      // Update locations state with the new location
      if (newLocation.isPrimary) {
        // If this is the primary location, update all other locations
        setLocations(
          [...locations.map(loc => ({ ...loc, isPrimary: false })), createdLocation]
        );
      } else {
        setLocations([...locations, createdLocation]);
      }
      
      // Reset form
      setNewLocation({
        name: "",
        address: "",
        city: "",
        state: "NY",
        zipCode: "",
        phone: "",
        isPrimary: false
      });
      
      // Close dialog
      setOpenAddDialog(false);
      
      // Show success toast
      toast({
        title: "Location added",
        description: "The location has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "Error adding location",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleStatus = (id: number) => {
    setLocations(
      locations.map(location => 
        location.id === id
          ? { ...location, status: location.status === "active" ? "inactive" : "active" }
          : location
      )
    );
  };
  
  const setPrimaryLocation = (id: number) => {
    setLocations(
      locations.map(location => ({
        ...location,
        isPrimary: location.id === id
      }))
    );
  };
  
  const deleteLocation = (id: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter(location => location.id !== id));
    }
  };
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Locations Management</h1>
          <p className="text-sm text-slate-500">Add and manage your practice locations</p>
        </div>
        
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
              <DialogDescription>
                Add details for a new physical location or facility
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Location Name
                </Label>
                <Input
                  id="name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Main Office"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Street Address
                </Label>
                <Input
                  id="address"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                  className="col-span-3"
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City
                </Label>
                <Input
                  id="city"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                  className="col-span-3"
                  placeholder="New York"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stateZip" className="text-right">
                  State & Zip
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Select 
                    value={newLocation.state}
                    onValueChange={(value) => setNewLocation({...newLocation, state: value})}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NY">NY</SelectItem>
                      <SelectItem value="CA">CA</SelectItem>
                      <SelectItem value="TX">TX</SelectItem>
                      <SelectItem value="FL">FL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    id="zipCode"
                    value={newLocation.zipCode}
                    onChange={(e) => setNewLocation({...newLocation, zipCode: e.target.value})}
                    placeholder="10001"
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newLocation.phone}
                  onChange={(e) => setNewLocation({...newLocation, phone: e.target.value})}
                  className="col-span-3"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right col-span-1">
                  <Label htmlFor="primary">Primary</Label>
                </div>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox 
                    id="primary" 
                    checked={newLocation.isPrimary}
                    onCheckedChange={(checked) => setNewLocation({...newLocation, isPrimary: !!checked})}
                  />
                  <Label htmlFor="primary" className="font-normal">
                    Set as primary location
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAddDialog(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddLocation} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Location"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Locations</CardTitle>
          <CardDescription>
            Manage the physical locations of your practice. The primary location will be used as the default for all orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Primary</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell>
                      {location.address}, {location.city}, {location.state} {location.zipCode}
                    </TableCell>
                    <TableCell>{location.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={location.status === "active"}
                          onCheckedChange={() => toggleStatus(location.id)}
                        />
                        <Badge
                          variant="outline"
                          className={`${
                            location.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {location.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Checkbox 
                          checked={location.isPrimary}
                          onCheckedChange={() => setPrimaryLocation(location.id)} 
                          disabled={location.isPrimary}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLocation(location.id)}
                        disabled={location.isPrimary || locations.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <p className="text-sm text-slate-500">
            <MapPin className="h-4 w-4 inline-block mr-1" />
            Showing {locations.length} location{locations.length !== 1 ? 's' : ''}
          </p>
        </CardFooter>
      </Card>
      
      <div className="mt-8">
        <Button>
          Save and Continue
        </Button>
      </div>
    </div>
  );
}