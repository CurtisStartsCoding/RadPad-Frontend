import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/layout/PageHeader";
import { PlusCircle, Search, User, Mail, MapPin, Shield, Edit, UserX, Key } from "lucide-react";
import { users } from "@/lib/mock-data";

const Users = () => {
  const activeUsers = users.filter(user => user.status === 'active');
  const invitedUsers = users.filter(user => user.status === 'invited');
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Users" 
        description="Manage users in your organization"
      >
        <Button className="inline-flex items-center">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Invite User
        </Button>
      </PageHeader>
      
      <Card className="mb-6">
        <Tabs defaultValue="active" className="p-0">
          <div className="border-b border-slate-200 p-4 flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="active">Active Users ({activeUsers.length})</TabsTrigger>
              <TabsTrigger value="invited">Pending Invitations ({invitedUsers.length})</TabsTrigger>
            </TabsList>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search users..."
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Locations</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {activeUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary-lighter flex items-center justify-center text-primary font-medium">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-900">
                          <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.locations ? (
                          <div className="flex items-start text-sm">
                            <MapPin className="h-4 w-4 text-slate-400 mr-1.5 mt-0.5" />
                            <span className="text-slate-900">{user.locations.join(', ')}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">No locations assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="h-8">
                            <Key className="h-3.5 w-3.5 mr-1.5" />
                            Reset Password
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                            <UserX className="h-3.5 w-3.5 mr-1.5" />
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="invited" className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invited On</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {invitedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-900">
                          <Shield className="h-4 w-4 text-slate-400 mr-1.5" />
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        Aug 10, 2023
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8">
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            Resend Invitation
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50">
                            <UserX className="h-3.5 w-3.5 mr-1.5" />
                            Cancel Invitation
                          </Button>
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

export default Users;
