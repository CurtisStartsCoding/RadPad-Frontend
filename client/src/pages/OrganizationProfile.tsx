import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { Building2, MapPin, Phone, Mail, Briefcase, Edit, Upload } from "lucide-react";

const OrganizationProfile = () => {
  return (
    <div className="p-6">
      <PageHeader 
        title="Organization Profile" 
        description="View and manage your organization details"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Organization Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Logo Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organization Logo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-primary-lighter h-32 w-32 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="h-16 w-16 text-primary" />
              </div>
              <Button variant="outline" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Change Logo
              </Button>
            </CardContent>
          </Card>
          
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Contact Information</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-900">123 Medical Center Drive</p>
                  <p className="text-sm text-slate-900">Suite 200</p>
                  <p className="text-sm text-slate-900">Seattle, WA 98101</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-slate-400 mr-3" />
                <p className="text-sm text-slate-900">(206) 555-1234</p>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-slate-400 mr-3" />
                <p className="text-sm text-slate-900">info@northwestmedical.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Details Tabs */}
        <div className="lg:col-span-2">
          <Card>
            <Tabs defaultValue="general">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Organization Details</CardTitle>
                  <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                    <TabsTrigger value="specialties">Specialties</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">Organization Name</h3>
                      <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-base font-medium text-slate-900">Northwest Medical Associates</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">Organization Type</h3>
                      <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-base font-medium text-slate-900">Referring Practice</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">NPI Number</h3>
                      <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-base font-medium text-slate-900">1234567890</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">Account Status</h3>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-base font-medium text-slate-900">Active</p>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">Billing Address</h3>
                      <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-base font-medium text-slate-900">Same as primary address</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">Billing Contact</h3>
                      <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-base font-medium text-slate-900">Jane Smith</p>
                    <p className="text-sm text-slate-500">finance@northwestmedical.com</p>
                  </div>
                </TabsContent>
                
                {/* Specialties Tab */}
                <TabsContent value="specialties" className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-slate-500">Practice Specialties</h3>
                      <Button variant="ghost" size="sm" className="h-7 p-0 w-7">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-0.5 bg-primary-lighter text-primary text-xs rounded-full">Family Medicine</span>
                      <span className="px-2.5 py-0.5 bg-primary-lighter text-primary text-xs rounded-full">Internal Medicine</span>
                      <span className="px-2.5 py-0.5 bg-primary-lighter text-primary text-xs rounded-full">Pediatrics</span>
                      <span className="px-2.5 py-0.5 bg-primary-lighter text-primary text-xs rounded-full">Orthopedics</span>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;
