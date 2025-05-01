import { useState } from "react";
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
  Trash2 
} from "lucide-react";
import { locations } from "@/lib/mock-data";

const Locations = () => {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Card key={location.id} className={location.status === 'inactive' ? 'opacity-70' : ''}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-2">
                  <div className={`rounded-full p-1.5 ${location.isPrimary ? 'bg-primary-lighter' : 'bg-slate-100'}`}>
                    <Map className={`h-4 w-4 ${location.isPrimary ? 'text-primary' : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">
                      {location.name}
                      {location.isPrimary && (
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
                <p className="text-slate-700">(206) 555-1234</p>
              </div>
              <div className="flex">
                <Clock className="h-4 w-4 text-slate-400 mr-2 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-700">Mon-Fri: 8:00 AM - 5:00 PM</p>
                  <p className="text-slate-700">Sat-Sun: Closed</p>
                </div>
              </div>
              
              <div className="pt-2 flex justify-between">
                {location.status === 'active' && !location.isPrimary ? (
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Set as Primary
                  </Button>
                ) : (
                  <div></div>
                )}
                
                {location.status === 'active' ? (
                  <Button variant="outline" size="sm" className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50">
                    Deactivate
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="text-xs h-8 text-green-600 border-green-200 hover:bg-green-50">
                    Activate
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
    </div>
  );
};

export default Locations;
