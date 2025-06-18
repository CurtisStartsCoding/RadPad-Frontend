import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PatientInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  mrn: string;
}

interface PatientInfoTabProps {
  orderId: string;
  patientInfo: PatientInfo;
  onPatientInfoChange: (field: string, value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function PatientInfoTab({
  orderId,
  patientInfo,
  onPatientInfoChange,
  onBack,
  onContinue
}: PatientInfoTabProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Use the unified endpoint with camelCase fields
      const payload = {
        patient: {
          firstName: patientInfo.firstName,
          lastName: patientInfo.lastName,
          middleName: '',
          dateOfBirth: patientInfo.dateOfBirth,
          gender: patientInfo.gender,
          addressLine1: patientInfo.addressLine1,
          addressLine2: patientInfo.addressLine2,
          city: patientInfo.city,
          state: patientInfo.state,
          zipCode: patientInfo.zipCode,
          phoneNumber: patientInfo.phoneNumber,
          email: patientInfo.email,
          mrn: patientInfo.mrn
        }
      };
      
      console.log('Sending patient data to unified endpoint:', payload);
      console.log('Date of birth value:', patientInfo.dateOfBirth);
      
      const response = await apiRequest('PUT', `/api/admin/orders/${orderId}`, payload);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Save patient response:', result);
        toast({
          title: "Success",
          description: "Patient information saved successfully",
          variant: "default",
        });
      } else {
        const error = await response.json();
        console.error('Save patient error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save patient information",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save patient information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            name="firstName" 
            value={patientInfo.firstName} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            name="lastName" 
            value={patientInfo.lastName} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input 
            id="dateOfBirth" 
            name="dateOfBirth" 
            type="date"
            value={patientInfo.dateOfBirth} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select 
            value={patientInfo.gender} 
            onValueChange={(value) => onPatientInfoChange('gender', value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="addressLine1">Address Line 1</Label>
        <Input 
          id="addressLine1" 
          name="addressLine1" 
          value={patientInfo.addressLine1} 
          onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input 
          id="addressLine2" 
          name="addressLine2" 
          value={patientInfo.addressLine2} 
          onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input 
            id="city" 
            name="city" 
            value={patientInfo.city} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input 
            id="state" 
            name="state" 
            value={patientInfo.state} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input 
            id="zipCode" 
            name="zipCode" 
            value={patientInfo.zipCode} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input 
            id="phoneNumber" 
            name="phoneNumber" 
            value={patientInfo.phoneNumber} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            value={patientInfo.email} 
            onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="mrn">Medical Record Number (MRN)</Label>
        <Input 
          id="mrn" 
          name="mrn" 
          value={patientInfo.mrn} 
          onChange={(e) => onPatientInfoChange(e.target.name, e.target.value)}
        />
      </div>
      
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
            {isSaving ? "Saving..." : "Save Patient Info"}
          </Button>
          <Button onClick={onContinue}>
            Continue to Insurance
          </Button>
        </div>
      </div>
    </div>
  );
}