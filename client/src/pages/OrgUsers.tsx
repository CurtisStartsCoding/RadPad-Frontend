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

// CSV template structure - based on USER_ONBOARDING_PROCESS.md
const physicianCsvTemplate = `first_name,last_name,email,npi,specialty,role
John,Smith,jsmith@groupname.com,1234567890,Cardiology,physician
Sarah,Johnson,sjohnson@groupname.com,0987654321,Neurology,physician
Michael,Williams,mwilliams@groupname.com,5678901234,Internal Medicine,admin_staff`;

const radiologyCsvTemplate = `first_name,last_name,email,role
Robert,Jones,rjones@radiology.com,radiologist
Jennifer,Davis,jdavis@radiology.com,technologist
Thomas,Wilson,twilson@radiology.com,admin`;

// Use the appropriate template based on organization type
const csvTemplate = physicianCsvTemplate; // Change this for radiology groups

export default function OrgUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'validating' | 'preview' | 'success' | 'error'>('idle');
  const [previewData, setPreviewData] = useState<{
    total: number;
    valid: number;
    invalid: number;
    records: Array<{
      row: number;
      isValid: boolean;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      npi?: string;
      specialty?: string;
      errorMessage?: string;
    }>;
  }>({
    total: 0,
    valid: 0,
    invalid: 0,
    records: []
  });
  
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
  
  // Validate a single user record
  const validateUserRecord = (record: any, rowIndex: number) => {
    const errors = [];
    // Required fields validation
    if (!record.first_name) errors.push("First name is required");
    if (!record.last_name) errors.push("Last name is required");
    if (!record.email) errors.push("Email is required");
    
    // Email format validation
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push("Invalid email format");
    }
    
    // NPI validation for physicians
    if (record.role === 'physician' && record.npi) {
      if (!/^\d{10}$/.test(record.npi)) {
        errors.push("NPI must be 10 digits");
      }
    }
    
    return {
      row: rowIndex,
      isValid: errors.length === 0,
      firstName: record.first_name || "",
      lastName: record.last_name || "",
      email: record.email || "",
      role: record.role || "physician",
      npi: record.npi || "",
      specialty: record.specialty || "",
      errorMessage: errors.length > 0 ? errors.join(", ") : undefined
    };
  };
  
  // Process CSV data
  const processCsvData = (csvText: string) => {
    // Simple CSV parsing - in a real app, use a proper CSV parser
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const records = [];
    let validCount = 0;
    let invalidCount = 0;
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = lines[i].split(',').map(v => v.trim());
      const record: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        if (index < values.length) {
          record[header] = values[index];
        } else {
          record[header] = '';
        }
      });
      
      const validatedRecord = validateUserRecord(record, i);
      if (validatedRecord.isValid) {
        validCount++;
      } else {
        invalidCount++;
      }
      
      records.push(validatedRecord);
    }
    
    return {
      total: records.length,
      valid: validCount,
      invalid: invalidCount,
      records
    };
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
          setUploadStatus('validating');
          
          // Simulate processing delay
          setTimeout(() => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                const csvText = e.target.result as string;
                const processedData = processCsvData(csvText);
                setPreviewData(processedData);
                setUploadStatus('preview');
              }
            };
            reader.readAsText(csvFile);
          }, 500);
          
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };
  
  const handleConfirmImport = () => {
    // Only import valid records
    const validRecords = previewData.records.filter(record => record.isValid);
    const newUsersList = validRecords.map((record, index) => {
      return {
        id: users.length + index + 1,
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        role: record.role as UserRole,
        invitationStatus: "pending",
        primaryLocation: "Main Office",
        lastLogin: null
      };
    });
    
    setUsers([...users, ...newUsersList]);
    setUploadStatus('success');
    setCsvFile(null);
    
    // Reset after success message displays for a few seconds
    setTimeout(() => {
      setUploadStatus('idle');
    }, 3000);
  };
  
  const handleCancelImport = () => {
    setUploadStatus('idle');
    setCsvFile(null);
    setPreviewData({
      total: 0,
      valid: 0,
      invalid: 0,
      records: []
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
      // Reset states when a new file is selected
      setUploadStatus('idle');
      setUploadProgress(0);
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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Users Management</h1>
          <p className="text-sm text-slate-500">Invite and manage your organization's users</p>
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
                    
                    <div className="mb-3 border border-blue-100 rounded bg-white overflow-hidden">
                      <div className="text-xs p-2 font-mono text-blue-800">
                        <div className="grid grid-cols-6 gap-2 text-blue-700 font-semibold border-b border-blue-50 pb-1 mb-1">
                          <div>first_name</div>
                          <div>last_name</div>
                          <div>email</div>
                          <div>npi</div>
                          <div>specialty</div>
                          <div>role</div>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          <div>John</div>
                          <div>Smith</div>
                          <div>jsmith@group.com</div>
                          <div>1234567890</div>
                          <div>Cardiology</div>
                          <div>physician</div>
                        </div>
                      </div>
                    </div>
                    
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
                  
                  {uploadStatus === 'preview' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Preview Import Results</h3>
                        <Badge variant={previewData.invalid > 0 ? "destructive" : "outline"} className="ml-2">
                          {previewData.valid} valid, {previewData.invalid} invalid records
                        </Badge>
                      </div>
                      
                      <div className="border rounded overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>First Name</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              {/* Show NPI column for physician practices */}
                              <TableHead>NPI</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.records.slice(0, 10).map((record) => (
                              <TableRow key={record.row} className={record.isValid ? "" : "bg-red-50"}>
                                <TableCell>
                                  {record.isValid ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </TableCell>
                                <TableCell>{record.firstName}</TableCell>
                                <TableCell>{record.lastName}</TableCell>
                                <TableCell>{record.email}</TableCell>
                                <TableCell>{record.role}</TableCell>
                                <TableCell>{record.npi}</TableCell>
                              </TableRow>
                            ))}
                            {previewData.records.length > 10 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-sm text-slate-500">
                                  ... {previewData.records.length - 10} more records
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {previewData.invalid > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-red-700">Errors</h4>
                          <div className="border border-red-200 rounded p-3 bg-red-50 max-h-40 overflow-y-auto">
                            <ul className="text-sm space-y-1 text-red-700">
                              {previewData.records
                                .filter(r => !r.isValid)
                                .map((record) => (
                                  <li key={record.row}>
                                    <strong>Row {record.row}:</strong> {record.errorMessage}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={handleCancelImport}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleConfirmImport} 
                          disabled={previewData.valid === 0}
                        >
                          Import {previewData.valid} Users
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {uploadStatus === 'success' && (
                    <Alert className="bg-green-50 border-green-100 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle>Upload successful</AlertTitle>
                      <AlertDescription>
                        {previewData.valid} users have been added to your organization.
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