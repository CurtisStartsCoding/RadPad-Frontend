import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface InsuranceInfo {
  insurerName: string;
  planName: string;
  policyNumber: string;
  groupNumber: string;
  policyHolderName: string;
  policyHolderRelationship: string;
  policyHolderDateOfBirth: string;
  secondaryInsurerName: string;
  secondaryPlanName: string;
  secondaryPolicyNumber: string;
  secondaryGroupNumber: string;
}

interface InsuranceInfoTabProps {
  orderId: string;
  hasInsurance: boolean;
  insuranceInfo: InsuranceInfo;
  onHasInsuranceChange: (hasInsurance: boolean) => void;
  onInsuranceInfoChange: (field: string, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function InsuranceInfoTab({
  orderId,
  hasInsurance,
  insuranceInfo,
  onHasInsuranceChange,
  onInsuranceInfoChange,
  onBack,
  onContinue
}: InsuranceInfoTabProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onInsuranceInfoChange(name, value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use the unified endpoint
      const payload = {
        insurance: hasInsurance ? {
          hasInsurance: true,
          insurerName: insuranceInfo.insurerName,
          planName: insuranceInfo.planName,
          policyNumber: insuranceInfo.policyNumber,
          groupNumber: insuranceInfo.groupNumber,
          policyHolderName: insuranceInfo.policyHolderName,
          policyHolderRelationship: insuranceInfo.policyHolderRelationship,
          policyHolderDateOfBirth: insuranceInfo.policyHolderDateOfBirth,
          secondaryInsurerName: insuranceInfo.secondaryInsurerName,
          secondaryPlanName: insuranceInfo.secondaryPlanName,
          secondaryPolicyNumber: insuranceInfo.secondaryPolicyNumber,
          secondaryGroupNumber: insuranceInfo.secondaryGroupNumber
        } : {
          hasInsurance: false
        }
      };
      
      console.log('Sending insurance data to unified endpoint:', payload);
      
      const response = await apiRequest('PUT', `/api/admin/orders/${orderId}`, payload);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save insurance response:', result);
        toast({
          title: "Success",
          description: "Insurance information saved successfully",
          variant: "default",
        });
      } else {
        const error = await response.json();
        console.error('Save insurance error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save insurance information",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save insurance information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSecondaryInsurance = () => {
    onInsuranceInfoChange('secondaryInsurerName', 'Medicare');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Insurance Information</h3>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hasInsurance" 
            checked={hasInsurance}
            onCheckedChange={(checked) => onHasInsuranceChange(checked as boolean)}
          />
          <Label htmlFor="hasInsurance" className="cursor-pointer">
            Patient has insurance
          </Label>
        </div>
      </div>
      
      {!hasInsurance ? (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>No Insurance</AlertTitle>
          <AlertDescription>
            This patient is uninsured/cash-pay. No insurance information will be saved.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <h3 className="text-lg font-medium">Primary Insurance</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurerName">Insurance Company</Label>
              <Input 
                id="insurerName" 
                name="insurerName" 
                value={insuranceInfo.insurerName} 
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input 
                id="planName" 
                name="planName" 
                value={insuranceInfo.planName} 
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input 
                id="policyNumber" 
                name="policyNumber" 
                value={insuranceInfo.policyNumber} 
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="groupNumber">Group Number</Label>
              <Input 
                id="groupNumber" 
                name="groupNumber" 
                value={insuranceInfo.groupNumber} 
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="policyHolderName">Policy Holder Name</Label>
            <Input 
              id="policyHolderName" 
              name="policyHolderName" 
              value={insuranceInfo.policyHolderName} 
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="policyHolderRelationship">Relationship to Patient</Label>
              <Select 
                value={insuranceInfo.policyHolderRelationship} 
                onValueChange={(value) => onInsuranceInfoChange('policyHolderRelationship', value)}
              >
                <SelectTrigger id="policyHolderRelationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="policyHolderDateOfBirth">Policy Holder Date of Birth</Label>
              <Input 
                id="policyHolderDateOfBirth" 
                name="policyHolderDateOfBirth" 
                value={insuranceInfo.policyHolderDateOfBirth} 
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Secondary Insurance (Optional)</h3>
              {!insuranceInfo.secondaryInsurerName && (
                <Button 
                  variant="ghost" 
                  onClick={addSecondaryInsurance}
                >
                  + Add Secondary Insurance
                </Button>
              )}
            </div>
            
            {insuranceInfo.secondaryInsurerName && (
              <>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="secondaryInsurerName">Insurance Company</Label>
                    <Input 
                      id="secondaryInsurerName" 
                      name="secondaryInsurerName" 
                      value={insuranceInfo.secondaryInsurerName} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryPlanName">Plan Name</Label>
                    <Input 
                      id="secondaryPlanName" 
                      name="secondaryPlanName" 
                      value={insuranceInfo.secondaryPlanName} 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="secondaryPolicyNumber">Policy Number</Label>
                    <Input 
                      id="secondaryPolicyNumber" 
                      name="secondaryPolicyNumber" 
                      value={insuranceInfo.secondaryPolicyNumber} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryGroupNumber">Group Number</Label>
                    <Input 
                      id="secondaryGroupNumber" 
                      name="secondaryGroupNumber" 
                      value={insuranceInfo.secondaryGroupNumber} 
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
      
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
            {isSaving ? "Saving..." : "Save Insurance Info"}
          </Button>
          <Button onClick={onContinue}>
            Continue to Order Details
          </Button>
        </div>
      </div>
    </div>
  );
}