import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/layout/PageHeader";
import { User, Mail, Phone, Stethoscope, Edit, Upload, MapPin } from "lucide-react";

const MyProfile = () => {
  return (
    <div className="p-6">
      <PageHeader 
        title="My Profile" 
        description="View and manage your profile information"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-primary-lighter h-32 w-32 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl font-semibold text-primary">JD</span>
              </div>
              <Button variant="outline" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <Label htmlFor="first-name" className="text-sm font-medium text-slate-500 mb-1.5 block">
                    First Name
                  </Label>
                  <Input id="first-name" value="John" readOnly className="bg-slate-50" />
                </div>
                <div>
                  <Label htmlFor="last-name" className="text-sm font-medium text-slate-500 mb-1.5 block">
                    Last Name
                  </Label>
                  <Input id="last-name" value="Doe" readOnly className="bg-slate-50" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-slate-500 mb-1.5 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Input id="email" value="john.doe@example.com" readOnly className="bg-slate-50 pl-10" />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-500 mb-1.5 block">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Input id="phone" value="(206) 555-1234" readOnly className="bg-slate-50 pl-10" />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Professional Info */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-slate-500 mb-1.5 block">
                      Role
                    </Label>
                    <div className="relative">
                      <Input id="role" value="Referring Physician" readOnly className="bg-slate-50 pl-10" />
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="specialty" className="text-sm font-medium text-slate-500 mb-1.5 block">
                      Specialty
                    </Label>
                    <div className="relative">
                      <Input id="specialty" value="Family Medicine" readOnly className="bg-slate-50 pl-10" />
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="npi" className="text-sm font-medium text-slate-500 mb-1.5 block">
                      NPI Number
                    </Label>
                    <Input id="npi" value="1234567890" readOnly className="bg-slate-50" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Locations */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-4">Assigned Locations</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 bg-primary-lighter text-primary text-sm rounded-md flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5" />
                    Main Office
                  </div>
                  <div className="px-3 py-1.5 bg-primary-lighter text-primary text-sm rounded-md flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5" />
                    North Branch
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
