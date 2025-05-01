import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { PlusCircle, Search, Building2, Link2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { connections } from "@/lib/mock-data";

const Connections = () => {
  const activeConnections = connections.filter(conn => conn.status === 'active');
  const pendingConnections = connections.filter(conn => conn.status === 'pending');
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Connections" 
        description="Manage connections with other organizations"
      >
        <Button className="inline-flex items-center">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Request Connection
        </Button>
      </PageHeader>
      
      <Card className="mb-6">
        <Tabs defaultValue="active" className="p-0">
          <div className="border-b border-slate-200 p-4 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="active">Active Connections ({activeConnections.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending Requests ({pendingConnections.length})</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search connections..."
                className="pl-10 w-64"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
          
          <TabsContent value="active" className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Connected Since</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {activeConnections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary-lighter flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{connection.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                          {connection.type === 'radiology' ? 'Radiology Group' : 'Referring Practice'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {connection.connectedAt ? new Date(connection.connectedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Button variant="secondary" size="sm" className="h-8">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Terminate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Direction</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Requested On</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {pendingConnections.map((connection) => (
                    <tr key={connection.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-slate-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{connection.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                          {connection.type === 'radiology' ? 'Radiology Group' : 'Referring Practice'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center text-sm">
                          <Link2 className="h-4 w-4 text-slate-400 mr-1.5" />
                          {connection.type === 'radiology' ? 'Outgoing Request' : 'Incoming Request'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        Aug 12, 2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {connection.type === 'referring' ? (
                            <>
                              <Button variant="outline" size="sm" className="h-8 text-green-600 border-green-200 hover:bg-green-50">
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                Approve
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="secondary" size="sm" className="h-8">
                                <Clock className="h-3.5 w-3.5 mr-1.5" />
                                Pending Approval
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Connections;
