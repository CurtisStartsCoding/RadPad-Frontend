import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  User,
  Mail,
  Building,
  Phone,
  Stethoscope,
  CheckCircle,
  Edit,
  Camera,
  Upload,
  AtSign,
  AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("Sarah");
  const [lastName, setLastName] = useState("Johnson");
  const [phoneNumber, setPhoneNumber] = useState("(555) 123-4567");
  const [specialty, setSpecialty] = useState("Internal Medicine");
  const [npiNumber, setNpiNumber] = useState("1234567890");
  
  // Mock user data
  const userData = {
    email: "sarah.johnson@example.com",
    role: "Physician",
    organization: "Northwest Medical Group",
    joinedDate: "January 15, 2023",
    lastLogin: "August 1, 2023",
  };
  
  // Function to handle profile edit
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  // Function to handle save
  const handleSave = () => {
    // In a real app, this would call an API to update the profile
    setIsEditing(false);
    console.log("Profile saved:", { firstName, lastName, phoneNumber, specialty, npiNumber });
  };
  
  // Function to get initials from name
  const getInitials = (first: string, last: string) => {
    return `${first[0]}${last[0]}`;
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-sm text-slate-500">View and edit your profile information</p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEditToggle}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleEditToggle}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your personal and professional details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt={`${firstName} ${lastName}`} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                {!isEditing ? (
                  <div>
                    <h2 className="text-xl font-semibold">{firstName} {lastName}</h2>
                    <div className="mt-1 flex items-center">
                      <Badge variant="secondary">{userData.role}</Badge>
                      <span className="text-sm text-slate-500 ml-2">{userData.organization}</span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{userData.email}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{phoneNumber}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Stethoscope className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{specialty}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <AtSign className="h-4 w-4 mr-2 text-slate-400" />
                        <span>NPI: {npiNumber}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={userData.email}
                        disabled
                        className="opacity-60"
                      />
                      <p className="text-xs text-slate-500">Contact admin to change email</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Professional Info */}
            <div>
              <h3 className="text-sm font-medium mb-3">Professional Information</h3>
              
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-xs text-slate-500">Specialty</p>
                    <p className="text-sm">{specialty}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500">NPI Number</p>
                    <p className="text-sm">{npiNumber}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500">Organization</p>
                    <p className="text-sm">{userData.organization}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500">Role</p>
                    <p className="text-sm">{userData.role}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select
                      value={specialty}
                      onValueChange={setSpecialty}
                    >
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                        <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="npi">NPI Number</Label>
                    <Input
                      id="npi"
                      value={npiNumber}
                      onChange={(e) => setNpiNumber(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={userData.organization}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-slate-500">Contact admin to change organization</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={userData.role}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-slate-500">Contact admin to change role</p>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Account Info */}
            <div>
              <h3 className="text-sm font-medium mb-3">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                <div>
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="text-sm">{userData.joinedDate}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500">Last Login</p>
                  <p className="text-sm">{userData.lastLogin}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t">
            <div className="w-full flex items-center justify-between">
              <p className="text-xs text-slate-500 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Last updated on August 1, 2023
              </p>
              
              {isEditing && (
                <Button onClick={handleSave}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        {/* Connected Accounts & Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your connected accounts and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="bg-white rounded-full p-1.5 mr-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm5.82 8.52v2.16h-4.1c-.094 0-.21.086-.21.19v1.83H15c.29 0 .53.255.53.57v1.8H12.6c-.094 0-.194.087-.194.194v3.14c0 .107-.09.196-.2.196h-1.97c-.11 0-.2-.09-.2-.196v-3.138c0-.107-.09-.194-.2-.194H7.76v-1.8c0-.298.21-.57.5-.57h2.147c.07 0 .19-.086.19-.19V8.513h3.03c.1 0 .193-.086.193-.19V6.7h-3.03c-.11 0-.193-.086-.193-.192v-2c0-.106.083-.193.193-.193h4.1v2c0 .106.105.192.21.192h1.31V8.52h-1.31c-.105 0-.21.087-.21.19z" fill="#27AE60"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Epic</p>
                    <p className="text-xs text-green-600">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8">Disconnect</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center">
                  <div className="bg-slate-100 rounded-full p-1.5 mr-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" fill="#E2E8F0"/>
                      <path d="M9 11.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5S9 12.328 9 11.5zm4.5 0c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5z" fill="#718096"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cerner</p>
                    <p className="text-xs text-slate-500">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8">Connect</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center">
                  <div className="bg-slate-100 rounded-full p-1.5 mr-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" rx="12" fill="#E2E8F0"/>
                      <path d="M16.949 17.218H7.051c-.435 0-.808-.373-.808-.808V7.59c0-.435.373-.808.808-.808h9.898c.435 0 .808.373.808.808v8.82c0 .435-.373.808-.808.808zm-3.346-5.756l-.756-.756.756-.756-1.603-1.604-.756.756-.756-.756-1.603 1.604.756.756-.756.756 1.603 1.603.756-.756.756.756 1.603-1.603z" fill="#718096"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Athena Health</p>
                    <p className="text-xs text-slate-500">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8">Connect</Button>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Connect New Integration
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="email">
                <TabsList className="w-full">
                  <TabsTrigger value="email" className="flex-1">Email</TabsTrigger>
                  <TabsTrigger value="app" className="flex-1">In-App</TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Order Status Updates</Label>
                      <div className="h-5 w-10 bg-primary rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Receive updates when your orders change status
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Billing Notifications</Label>
                      <div className="h-5 w-10 bg-primary rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Receive updates about your billing and credits
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Marketing & News</Label>
                      <div className="h-5 w-10 bg-slate-200 rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 left-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Receive updates about new features and improvements
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="app" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Order Notifications</Label>
                      <div className="h-5 w-10 bg-primary rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Show in-app notifications for order updates
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Urgent Alerts</Label>
                      <div className="h-5 w-10 bg-primary rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Show alerts for urgent matters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Sound Notifications</Label>
                      <div className="h-5 w-10 bg-slate-200 rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 left-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Play sounds for new notifications
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;