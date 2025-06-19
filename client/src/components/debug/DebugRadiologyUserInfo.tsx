import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleDisplayNames } from "@/lib/roles";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Location {
  id: number;
  organization_id: number;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  npi: string | null;
  specialty: string | null;
  phone_number: string | null;
  organization_id: number;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  email_verified: boolean;
  is_active: boolean;
}

interface OrganizationData {
  id: number;
  name: string;
  type: string;
  npi: string;
  tax_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  fax_number: string | null;
  contact_email: string;
  website: string;
  logo_url: string | null;
  billing_id: string | null;
  credit_balance: number;
  subscription_tier: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  basic_credit_balance: number;
  advanced_credit_balance: number;
}

interface Organization {
  organization: OrganizationData;
  locations: Location[];
  users: User[];
}

interface Connection {
  id: number;
  partnerOrgId: number;
  partnerOrgName: string;
  status: string;
  isInitiator: boolean;
  initiatedBy: string;
  approvedBy: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const DebugRadiologyUserInfo: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  
  // Function to fetch organization and connection data
  const fetchOrgData = async () => {
    if (!user || !user.organizationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch organization data
      const orgResponse = await apiRequest('GET', '/api/organizations/mine', undefined);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData.data);
      }
      
      // Fetch connections data
      try {
        const connectionsResponse = await apiRequest('GET', '/api/connections', undefined);
        if (connectionsResponse.ok) {
          const connectionsData = await connectionsResponse.json();
          // Check if the connections data has the expected structure
          if (connectionsData && connectionsData.connections && Array.isArray(connectionsData.connections)) {
            setConnections(connectionsData.connections);
          } else {
            // Handle legacy or unexpected data format
            setConnections(Array.isArray(connectionsData) ? connectionsData : []);
          }
          setConnectionsError(null);
        } else if (connectionsResponse.status === 403) {
          try {
            const errorData = await connectionsResponse.json();
            console.log('403 error data:', errorData);
            setConnectionsError(errorData.message || 'Access forbidden');
          } catch (parseErr) {
            console.error('Error parsing 403 response:', parseErr);
            setConnectionsError('Access forbidden');
          }
          setConnections([]);
        } else {
          console.log('Non-OK response:', connectionsResponse.status);
          setConnectionsError('Failed to fetch connections');
          setConnections([]);
        }
      } catch (err) {
        console.log('Failed to fetch connections (might be restricted by role):', err);
        setConnectionsError(null);
      }
    } catch (err) {
      setError('Failed to fetch organization data');
      console.error('Error fetching organization data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when component opens
  useEffect(() => {
    if (isOpen && user) {
      fetchOrgData();
    }
  }, [isOpen, user]);

  if (!user) {
    return (
      <Card className="mb-4 bg-yellow-50 border-yellow-200">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger 
              asChild 
              className="w-full text-left cursor-pointer"
            >
              <div className="flex items-center">
                {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                <CardTitle className="text-lg">User Info (Debug)</CardTitle>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <p className="text-yellow-700">No user authenticated</p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger
            asChild
            className="w-full text-left cursor-pointer"
          >
            <div className="flex items-center">
              {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              <CardTitle className="text-lg">Debug Information</CardTitle>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <Tabs defaultValue="user">
              <TabsList className="mb-4">
                <TabsTrigger value="user">User Info</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="connections">Connections</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="user">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium text-yellow-800">Name:</div>
                  <div>{user.name}</div>
                  
                  <div className="font-medium text-yellow-800">Email:</div>
                  <div>{user.email}</div>
                  
                  <div className="font-medium text-yellow-800">Role:</div>
                  <div>{roleDisplayNames[user.role] || user.role}</div>
                  
                  <div className="font-medium text-yellow-800">Organization ID:</div>
                  <div>{user.organizationId || 'None'}</div>
                  
                  <div className="font-medium text-yellow-800">Organization Type:</div>
                  <div>{user.organizationType || 'Not specified'}</div>
                  
                  <div className="font-medium text-yellow-800">User ID:</div>
                  <div>{user.id}</div>
                  
                  <div className="font-medium text-yellow-800">Created:</div>
                  <div>{user.createdAt?.toLocaleDateString()}</div>
                  
                  <div className="font-medium text-yellow-800">Last Updated:</div>
                  <div>{user.updatedAt?.toLocaleDateString()}</div>
                  
                  {user.lastLoginAt && (
                    <>
                      <div className="font-medium text-yellow-800">Last Login:</div>
                      <div>{user.lastLoginAt.toLocaleDateString()}</div>
                    </>
                  )}
                  
                  {user.isDeveloperMode !== undefined && (
                    <>
                      <div className="font-medium text-yellow-800">Developer Mode:</div>
                      <div>{user.isDeveloperMode ? 'Enabled' : 'Disabled'}</div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="organization">
                {loading ? (
                  <div className="text-center py-4">Loading organization data...</div>
                ) : error ? (
                  <div className="text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                ) : organization ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-yellow-800">data.organization.id</div>
                    <div>{organization.organization.id}</div>
                    
                    <div className="font-medium text-yellow-800">Organization Name</div>
                    <div>{organization.organization.name}</div>
                    
                    <div className="font-medium text-yellow-800">Organization Type</div>
                    <div>{organization.organization.type}</div>
                    
                    <div className="font-medium text-yellow-800">Status:</div>
                    <div>{organization.organization.status}</div>
                    
                    <div className="font-medium text-yellow-800">Locations:</div>
                    <div>{organization.locations.length} - [{organization.locations.map(loc => loc.id).join(', ')}]</div>
                    
                    <div className="font-medium text-yellow-800">Users:</div>
                    <div>{organization.users.length} - [{organization.users.map(user => user.id).join(', ')}]</div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No organization data available</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={fetchOrgData}
                    >
                      Refresh Data
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="connections">
                {loading ? (
                  <div className="text-center py-4">Loading connections data...</div>
                ) : connections.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Connections: {connections.length}</h3>
                    {connections.map(connection => (
                      <div key={connection.id} className="border border-yellow-200 rounded p-2 text-sm">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium text-yellow-800">Connection ID:</div>
                          <div>{connection.id}</div>
                          
                          <div className="font-medium text-yellow-800">Partner Organization:</div>
                          <div>{connection.partnerOrgName}</div>
                          
                          <div className="font-medium text-yellow-800">Partner Organization ID:</div>
                          <div>{connection.partnerOrgId}</div>
                          
                          <div className="font-medium text-yellow-800">Status:</div>
                          <div>{connection.status}</div>
                          
                          <div className="font-medium text-yellow-800">Initiator:</div>
                          <div>{connection.isInitiator ? 'Yes' : 'No'}</div>
                          
                          <div className="font-medium text-yellow-800">Initiated By:</div>
                          <div>{connection.initiatedBy}</div>
                          
                          <div className="font-medium text-yellow-800">Approved By:</div>
                          <div>{connection.approvedBy || 'Not approved yet'}</div>
                          
                          <div className="font-medium text-yellow-800">Notes:</div>
                          <div>{connection.notes}</div>
                          
                          <div className="font-medium text-yellow-800">Created:</div>
                          <div>{new Date(connection.createdAt).toLocaleString()}</div>
                          
                          <div className="font-medium text-yellow-800">Updated:</div>
                          <div>{new Date(connection.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : connectionsError ? (
                  <div className="text-center py-4">
                    <p className="text-red-500">{connectionsError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={fetchOrgData}
                    >
                      Refresh Data
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p>No connections found</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      This organization may not have any connections with referring or radiology organizations
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={fetchOrgData}
                    >
                      Refresh Data
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="diagnostics">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">API Diagnostics</h3>
                  
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await apiRequest('GET', '/api/radiology/orders', undefined);
                            console.log('Radiology Orders Test Response:', response);
                            alert(`Radiology Orders Test: ${response.status} ${response.statusText}`);
                          } catch (err) {
                            console.error('Radiology Orders Test Error:', err);
                            alert(`Radiology Orders Test Error: ${err}`);
                          }
                        }}
                      >
                        Test Radiology Orders API
                      </Button>
                    </div>
                    
                    <p className="text-xs text-yellow-700">
                      Check the browser console for detailed response information
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DebugRadiologyUserInfo;