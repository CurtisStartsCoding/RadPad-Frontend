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
  AlertCircle,
  Beaker
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/lib/roles";
import { getUserRoleFromStorage } from "@/lib/navigation";
import { roleDisplayNames } from "@/lib/roles";

interface StoredUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: UserRole;
  organization_id?: string;
  organization_name?: string;
  created_at: string;
  updated_at: string;
  lastLoginAt?: string;
  specialty?: string;
  phone?: string;
  npi?: string;
}

// Function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const MyProfile = () => {
  // Load user data directly from localStorage
  const loadUser = (): StoredUser | null => {
    try {
      const userDataStr = localStorage.getItem('rad_order_pad_user_data');
      console.log("PROFILE - userDataStr:", {userDataStr});
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("PROFILE - userData:", {userData});
        return userData;
      }
      return null;
    } catch (e) {
      console.error("Error loading user data:", e);
      return null;
    }
  };

  const user = loadUser();
  console.log("PROFILE - user:", {user});
  
  // Get user role directly from storage
  const effectiveRole = getUserRoleFromStorage() || UserRole.TrialPhysician;
  console.log("PROFILE - effectiveRole:", {effectiveRole});
  
  // Check if user is a trial user
  const isTrialUser = effectiveRole === UserRole.TrialPhysician;
  
  const [isEditing, setIsEditing] = useState(false);
  
  // Get user data from localStorage if available
  const getUserData = () => {
    try {
      // Get user data from localStorage
      const userDataStr = localStorage.getItem('rad_order_pad_user_data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("PROFILE - userData:", {userData});
        console.log("PROFILE - role:", {role: getUserRoleFromStorage()});
        return userData;
      }
      return null;
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  };
  
  // Get trial info from localStorage if available
  const getTrialInfo = () => {
    try {
      const trialInfoStr = localStorage.getItem('rad_order_pad_trial_info');
      if (trialInfoStr) {
        return JSON.parse(trialInfoStr);
      }
      return null;
    } catch (e) {
      console.error("Error parsing trial info:", e);
      return null;
    }
  };
  
  const userData = getUserData();
  const trialInfo = getTrialInfo();
  
  // Get validation counts for trial users
  const validationsRemaining = trialInfo?.validationsRemaining !== undefined
    ? trialInfo.validationsRemaining
    : (localStorage.getItem('rad_order_pad_trial_validations_remaining')
      ? parseInt(localStorage.getItem('rad_order_pad_trial_validations_remaining') || '0', 10)
      : 0);
  
  const maxValidations = trialInfo?.maxValidations || 10; // Default max validations for trial users
  const validationsUsed = trialInfo?.validationsUsed || (maxValidations - validationsRemaining);
  
  // Format specialty from snake_case to display format
  const formatSpecialty = (specialty: string): string => {
    if (!specialty) return "";
    return specialty.split('_').map(
      (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Initialize form state with user data or defaults
  const [firstName, setFirstName] = useState(() => {
    // First try to get from localStorage
    try {
      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        if (parsedData.first_name) return parsedData.first_name;
      }
    } catch (e) {
      console.error("Error getting first name from localStorage:", e);
    }
    
    // Then try from other sources
    return userData?.first_name || user?.first_name || user?.name?.split(' ')[0] || "";
  });
  
  const [lastName, setLastName] = useState(() => {
    // First try to get from localStorage
    try {
      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        if (parsedData.last_name) return parsedData.last_name;
      }
    } catch (e) {
      console.error("Error getting last name from localStorage:", e);
    }
    
    // Then try from other sources
    return userData?.last_name || user?.last_name || user?.name?.split(' ')[1] || "";
  });
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone || "(555) 123-4567"); // Default as not in JWT
  
  // Get specialty from user data
  const getSpecialtyFromData = (): string => {
    // Try from direct user data
    if (userData?.specialty) {
      return formatSpecialty(userData.specialty);
    }
    
    // Try from auth context
    if (user?.role) {
      // This is a fallback, not ideal but better than nothing
      return user.role.replace(/_/g, ' ');
    }
    
    return "Family Medicine"; // Default
  };
  
  const [specialty, setSpecialty] = useState(getSpecialtyFromData());
  const [npiNumber, setNpiNumber] = useState(userData?.npi || "1234567890"); // Use NPI from user data if available
  
  // User display data from localStorage, auth context, or defaults
  const userDisplayData = {
    email: userData?.email || user?.email || "",
    role: user?.role ? roleDisplayNames[user.role as UserRole] || user.role : "",
    organization: isTrialUser ? "Trial Account" : (userData?.organization_name || "Medical Practice"),
    joinedDate: userData?.created_at || user?.created_at
      ? formatDate(userData?.created_at || user?.created_at)
      : "Today",
    lastLogin: user?.lastLoginAt ? formatDate(user.lastLoginAt) : "Today",
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
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  };

  // Trial user profile is simplified
  if (isTrialUser) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Rad Order Pad</h1>
            <p className="text-sm text-slate-500">Your trial account information</p>
          </div>
            Trial User
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Trial Account Information</CardTitle>
            <CardDescription>
              Access your trial account details and manage your notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-amber-100 text-amber-800">
                  {(() => {
                    // Try to get initials directly from localStorage
                    try {
                      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
                      if (storedUserData) {
                        const userData = JSON.parse(storedUserData);
                        console.log("Avatar - userData:", userData);
                        
                        // Check for different possible field names
                        // 1. Check snake_case (first_name, last_name)
                        if (userData.first_name || userData.last_name) {
                          const first = userData.first_name || '';
                          const last = userData.last_name || '';
                          return getInitials(first, last);
                        }
                        
                        // 2. Check camelCase (firstName, lastName)
                        if (userData.firstName || userData.lastName) {
                          const first = userData.firstName || '';
                          const last = userData.lastName || '';
                          return getInitials(first, last);
                        }
                        
                        // 3. Check for name field that might contain full name
                        if (userData.name && typeof userData.name === 'string') {
                          const nameParts = userData.name.split(' ');
                          if (nameParts.length >= 2) {
                            return getInitials(nameParts[0], nameParts[1]);
                          } else if (nameParts.length === 1 && nameParts[0]) {
                            return nameParts[0].substring(0, 1).toUpperCase();
                          }
                        }
                      }
                    } catch (e) {
                      console.error("Error getting initials from localStorage:", e);
                    }
                    
                    // Fall back to state variables
                    return firstName || lastName ? getInitials(firstName, lastName) : "MJ";
                  })()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-xl font-semibold">
                  {(() => {
                    // Try to get name directly from localStorage
                    try {
                      const storedUserData = localStorage.getItem('rad_order_pad_user_data');
                      if (storedUserData) {
                        const userData = JSON.parse(storedUserData);
                        console.log("Name - userData:", userData);
                        
                        // Check for different possible field names
                        // 1. Check snake_case (first_name, last_name)
                        if (userData.first_name || userData.last_name) {
                          return `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
                        }
                        
                        // 2. Check camelCase (firstName, lastName)
                        if (userData.firstName || userData.lastName) {
                          return `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                        }
                        
                        // 3. Check for name field that might contain full name
                        if (userData.name && typeof userData.name === 'string') {
                          return userData.name;
                        }
                      }
                    } catch (e) {
                      console.error("Error getting name from localStorage:", e);
                    }
                    
                    // Fall back to state variables
                    return `${firstName} ${lastName}`.trim();
                  })()}
                </h2>
                <div className="mt-1 flex items-center">
                  <Badge variant="outline" className="bg-amber-100 border-amber-200 text-amber-800">Trial User</Badge>
                </div>
                
                <div className="mt-3 grid grid-cols-1 gap-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-slate-400" />
                    <span>{userDisplayData.email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Trial Information */}
            <div>
              <h3 className="text-sm font-medium mb-3">Trial Status</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Beaker className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">Trial Account</h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>You have used {validationsUsed} of {maxValidations} order validations in your trial ({validationsRemaining} remaining).</p>
                    </div>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>*** Some text about how to upgrade account ***</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Regular user profile view
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Rad Order Pad</h1>
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
                      <Badge variant="secondary">{userDisplayData.role}</Badge>
                      <span className="text-sm text-slate-500 ml-2">{userDisplayData.organization}</span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{userDisplayData.email}</span>
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
                        value={userDisplayData.email}
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
                    <p className="text-sm">{userDisplayData.organization}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-slate-500">Role</p>
                    <p className="text-sm">{userDisplayData.role}</p>
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
                      value={userDisplayData.organization}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-slate-500">Contact admin to change organization</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={userDisplayData.role}
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
                  <p className="text-sm">{userDisplayData.joinedDate}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500">Last Login</p>
                  <p className="text-sm">{userDisplayData.lastLogin}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t">
            <div className="w-full flex items-center justify-between">
              <p className="text-xs text-slate-500 flex items-center">
                <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Last updated on {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
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
        
        {/* Right Column */}
        <div className="space-y-6">
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
                      <Label className="text-sm">Order Notifications</Label>
                      <div className="h-5 w-10 bg-primary rounded-full relative">
                        <div className="h-4 w-4 bg-white rounded-full absolute top-0.5 right-0.5" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Receive email notifications for order updates
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
                      Receive urgent alerts by email
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
