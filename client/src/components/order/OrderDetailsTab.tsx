import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface OrderDetails {
  orderNumber: string;
  location: string;
  schedulingTimeframe: string;
  priority: string;
  primaryIcd10: string;
  primaryDescription: string;
  secondaryIcd10: string;
  secondaryDescription: string;
  cptCode: string;
  cptDescription: string;
  specialInstructions: string;
}

interface OrderDetailsTabProps {
  orderId: string;
  order: any;
  orderDetails: OrderDetails;
  supplementalText: string;
  radiologyGroup: string;
  selectedRadiologyOrgId: number | null;
  selectedFacilityId: number | null;
  availableRadiologyOrgs: any[];
  availableFacilities: any[];
  locationsLoading: boolean;
  onRadiologyGroupChange: (group: string) => void;
  onRadiologyOrgSelect: (orgId: number) => void;
  onFacilitySelect: (facilityId: number, facilityName: string) => void;
  onOrderDetailsChange: (field: string, value: string) => void;
  onSupplementalTextChange: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function OrderDetailsTab({
  orderId,
  order,
  orderDetails,
  supplementalText,
  radiologyGroup,
  selectedRadiologyOrgId,
  selectedFacilityId,
  availableRadiologyOrgs,
  availableFacilities,
  locationsLoading,
  onRadiologyGroupChange,
  onRadiologyOrgSelect,
  onFacilitySelect,
  onOrderDetailsChange,
  onSupplementalTextChange,
  onBack,
  onContinue
}: OrderDetailsTabProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  // Auto-set scheduling timeframe for STAT orders
  useEffect(() => {
    if (orderDetails.priority === 'stat' && orderDetails.schedulingTimeframe !== 'Within 48 hours') {
      onOrderDetailsChange('schedulingTimeframe', 'Within 48 hours');
    }
  }, [orderDetails.priority, orderDetails.schedulingTimeframe, onOrderDetailsChange]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save order details and supplemental text
      const payload = {
        orderDetails: {
          priority: orderDetails.priority,
          schedulingTimeframe: orderDetails.schedulingTimeframe,
          specialInstructions: orderDetails.specialInstructions,
          targetFacilityId: selectedFacilityId
        },
        supplementalText: supplementalText,
        // Include radiology organization info
        radiologyOrganizationId: selectedRadiologyOrgId,
        radiologyOrganizationName: radiologyGroup
      };
      
      console.log('Saving order details:', payload);
      
      const response = await apiRequest('PUT', `/api/admin/orders/${orderId}`, payload);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save order details response:', result);
        toast({
          title: "Success",
          description: "Order details saved successfully",
          variant: "default",
        });
      } else {
        const error = await response.json();
        console.error('Save order details error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save order details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save order details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRadiologyGroupChange = (value: string) => {
    console.log('🎯 Selected radiology group:', value);
    onRadiologyGroupChange(value);
    
    // Find the selected org and update the ID
    const selectedOrg = availableRadiologyOrgs.find((org: any) => org.name === value);
    if (selectedOrg) {
      console.log('🎯 Found org ID:', selectedOrg.id);
      onRadiologyOrgSelect(selectedOrg.id);
    }
  };

  const handleFacilityChange = (value: string) => {
    const facilityId = parseInt(value);
    const facility = availableFacilities.find((f: any) => f.id === facilityId);
    if (facility) {
      onFacilitySelect(facilityId, facility.name);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Order Details</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="radiologyGroup">Radiology Group</Label>
            <Select 
              value={radiologyGroup || ""} 
              onValueChange={handleRadiologyGroupChange}
            >
              <SelectTrigger id="radiologyGroup">
                <SelectValue placeholder="Select radiology group" />
              </SelectTrigger>
              <SelectContent>
                {availableRadiologyOrgs.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No active connections available
                  </div>
                ) : (
                  availableRadiologyOrgs.map((org: any) => (
                    <SelectItem key={org.id} value={org.name}>
                      {org.name} (ID: {org.id})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Facility Location</Label>
            {!selectedRadiologyOrgId ? (
              <div className="text-sm text-muted-foreground mt-2">
                Please select a radiology group first
              </div>
            ) : locationsLoading ? (
              <div className="text-sm text-muted-foreground mt-2">
                Loading facilities...
              </div>
            ) : availableFacilities.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-2">
                No facilities available for this organization
              </div>
            ) : (
              <Select 
                value={selectedFacilityId?.toString() || ""} 
                onValueChange={handleFacilityChange}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select facility location" />
                </SelectTrigger>
                <SelectContent>
                  {availableFacilities.map((facility: any) => (
                    <SelectItem key={facility.id} value={facility.id.toString()}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select 
              value={orderDetails.priority} 
              onValueChange={(value) => onOrderDetailsChange('priority', value)}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="stat">STAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="scheduling">Scheduling Timeframe</Label>
            <Select 
              value={orderDetails.schedulingTimeframe} 
              onValueChange={(value) => onOrderDetailsChange('schedulingTimeframe', value)}
            >
              <SelectTrigger id="scheduling">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Within 48 hours">Within 48 hours</SelectItem>
                <SelectItem 
                  value="Within 7 days" 
                  disabled={orderDetails.priority === 'stat'}
                >
                  Within 7 days
                </SelectItem>
                <SelectItem 
                  value="Within 14 days" 
                  disabled={orderDetails.priority === 'stat'}
                >
                  Within 14 days
                </SelectItem>
                <SelectItem 
                  value="Within 30 days" 
                  disabled={orderDetails.priority === 'stat'}
                >
                  Within 30 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* STAT scheduling notice */}
        {orderDetails.priority === 'stat' && (
          <Alert className="mt-3 bg-red-50 border-red-200">
            <InfoIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              STAT orders automatically default to "Within 48 hours" scheduling minimum for expedited processing.
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <div>
        <div className="flex items-center mb-2">
          <Label htmlFor="supplementalText" className="text-lg font-medium mr-2">
            Supplemental Information from EMR
          </Label>
          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
            HIPAA Protected
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mb-2">
          Add any additional clinical information from the EMR that would be helpful for the radiologist.
        </p>
        <Textarea 
          id="supplementalText" 
          className="min-h-[200px]"
          value={supplementalText}
          onChange={(e) => onSupplementalTextChange(e.target.value)}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Special Instructions</h3>
        <p className="text-sm text-slate-500 mb-2">
          Include any special instructions for the radiology facility (e.g., contrast allergies, claustrophobia, etc.)
        </p>
        <Textarea 
          id="instructions" 
          name="instructions"
          className="min-h-[100px]"
          value={orderDetails.specialInstructions}
          onChange={(e) => onOrderDetailsChange('specialInstructions', e.target.value)}
        />
      </div>
      
      <Alert className="bg-amber-50 border-amber-200">
        <InfoIcon className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Important Note</AlertTitle>
        <AlertDescription className="text-amber-700">
          Only paste information relevant to this imaging order. Do not include sensitive patient 
          information not directly related to this study.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Order Details"}
          </Button>
          <Button onClick={onContinue}>
            Continue to Documents
          </Button>
        </div>
      </div>
    </div>
  );
}