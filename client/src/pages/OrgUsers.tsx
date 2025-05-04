import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Download, Upload, RefreshCw, Mail, User, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, roleDisplayNames } from "@/lib/roles";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample users with invitation status
const initialUsers = [
  {
    id: 1,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice.johnson@example.com",
    role: UserRole.AdminStaff,
    invitationStatus: "accepted",
    primaryLocation: "Main Office",
    lastLogin: "2025-05-01T14:32:00Z"
  },
  {
    id: 2,
    firstName: "Robert",
    lastName: "Smith",
    email: "robert.smith@example.com",
    role: UserRole.Physician,
    invitationStatus: "pending",
    primaryLocation: "Main Office",
    lastLogin: null
  },
  {
    id: 3,
    firstName: "Emily",
    lastName: "Williams",
    email: "emily.williams@example.com",
    role: UserRole.AdminStaff,
    invitationStatus: "accepted",
    primaryLocation: "Main Office",
    lastLogin: "2025-05-02T09:15:00Z"
  }
];

// CSV template structure
const csvTemplate = `first_name,last_name,email,role,npi,phone_number,specialty,primary_location_name
John,Doe,john.doe@example.com,physician,1234567890,555-123-4567,Family Medicine,Main Office
Jane,Smith,jane.smith@example.com,admin_staff,,555-987-6543,,Main Office`;

export default function OrgUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // New user form state
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.Physician,
    primaryLocation: "Main Office"
  });
  
  const handleAddUser = () => {
    // Add validation logic here
    const id = users.length + 1;
    setUsers([...users, { 
      ...newUser, 
      id, 
      invitationStatus: "pending", 
      lastLogin: null 
    }]);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      role: UserRole.Physician,
      primaryLocation: "Main Office"
    });
    setOpenInviteDialog(false);
  };
  
  const handleCsvUpload = () => {
    if (!csvFile) return;
    
    // Simulate file upload process
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setUploadStatus('success');
          return 100;
        }
        return prev + 20;
      });
    }, 500);
    
    // Simulate adding new users after upload
    setTimeout(() => {
      setUsers([
        ...users,
        {
          id: users.length + 1,
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          role: UserRole.Physician,
          invitationStatus: "pending",
          primaryLocation: "Main Office",
          lastLogin: null
        },
        {
          id: users.length + 2,
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          role: UserRole.AdminStaff,
          invitationStatus: "pending",
          primaryLocation: "Main Office",
          lastLogin: null
        }
      ]);
    }, 3000);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };
  
  const downloadCsvTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const resendInvitation = (userId: number) => {
    // In a real app, this would send a new invitation
    alert(`Invitation resent to user ID: ${userId}`);
  };
  
  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-slate-500 mt-1">Invite and manage your organization's users</p>
        </div>
        
        <div className="flex space-x-3">
          <Dialog open={openInviteDialog} onOpenChange={setOpenInviteDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Invite a New User</DialogTitle>
                <DialogDescription>
                  Send an invitation email to add a new team member
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    className="col-span-3"
                    placeholder="John"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    className="col-span-3"
                    placeholder="Doe"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="col-span-3"
                    placeholder="john.doe@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.Physician}>{roleDisplayNames[UserRole.Physician]}</SelectItem>
                        <SelectItem value={UserRole.AdminStaff}>{roleDisplayNames[UserRole.AdminStaff]}</SelectItem>
                        <SelectItem value={UserRole.Scheduler}>{roleDisplayNames[UserRole.Scheduler]}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Primary Location
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={newUser.primaryLocation}
                      onValueChange={(value) => setNewUser({...newUser, primaryLocation: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Main Office">Main Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="users" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User List</TabsTrigger>
          <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage user accounts and invitations for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Primary Location</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{roleDisplayNames[user.role]}</TableCell>
                        <TableCell>{user.primaryLocation}</TableCell>
                        <TableCell>
                          {user.invitationStatus === "accepted" ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.invitationStatus === "pending" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => resendInvitation(user.id)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Resend invitation</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <p className="text-sm text-slate-500">
                <User className="h-4 w-4 inline-block mr-1" />
                {users.length} user{users.length !== 1 ? 's' : ''} 
                {users.filter(u => u.invitationStatus === "pending").length > 0 && 
                  ` (${users.filter(u => u.invitationStatus === "pending").length} pending)`}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="bulk-import">
          <Card>
            <CardHeader>
              <CardTitle>Bulk User Import</CardTitle>
              <CardDescription>
                Import multiple users at once using a CSV file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium flex items-center mb-2 text-blue-800">
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600" />
                      CSV Template
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Download our CSV template to get started. Fill it with your user details.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white text-blue-700 border-blue-200 hover:bg-blue-100"
                      onClick={downloadCsvTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="csvUpload">Upload User CSV</Label>
                    <div className="grid gap-2">
                      <Input 
                        id="csvUpload" 
                        type="file" 
                        accept=".csv"
                        onChange={handleFileChange}
                      />
                      <Button 
                        onClick={handleCsvUpload} 
                        disabled={!csvFile || uploadStatus === 'uploading'}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Users
                      </Button>
                    </div>
                  </div>
                  
                  {uploadStatus === 'uploading' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  
                  {uploadStatus === 'success' && (
                    <Alert className="bg-green-50 border-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle>Upload successful</AlertTitle>
                      <AlertDescription>
                        2 users have been added to your organization.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {uploadStatus === 'error' && (
                    <Alert className="bg-red-50 border-red-100 text-red-800">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle>Upload failed</AlertTitle>
                      <AlertDescription>
                        There was an error processing your CSV file. Please check the format and try again.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="flex-1 border rounded-lg p-4 bg-slate-50">
                  <h3 className="font-medium mb-2">CSV Format</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Your CSV file should include the following columns:
                  </p>
                  <div className="text-xs font-mono bg-white p-3 rounded border overflow-x-auto">
                    <pre>{csvTemplate}</pre>
                  </div>
                  <div className="mt-4 text-sm text-slate-500">
                    <p className="mb-2"><strong>Note:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>NPI is optional but recommended for physicians</li>
                      <li>Available roles: physician, admin_staff, scheduler</li>
                      <li>Primary location must match an existing location name</li>
                      <li>All users will receive email invitations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <Button>
          Save and Continue
        </Button>
      </div>
    </div>
  );
}