import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, CreditCard, Mail, Phone, MapPin, User } from "lucide-react";

export default function OrgSignUp() {
  const [orgType, setOrgType] = useState<string>("referring");
  const [activeTab, setActiveTab] = useState("organization");
  const [agreeTerms, setAgreeTerms] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Organization Registration</h1>
        <p className="text-sm text-slate-500">Complete the following steps to register your organization with RadOrderPad</p>
      </div>

      <Tabs defaultValue="organization" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="organization">Organization Information</TabsTrigger>
          <TabsTrigger value="admin">Admin Account</TabsTrigger>
          <TabsTrigger value="billing">Billing Information</TabsTrigger>
        </TabsList>

        {/* Organization Information Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Provide information about your medical organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Organization Type</Label>
                  <RadioGroup 
                    value={orgType} 
                    onValueChange={setOrgType} 
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="referring" id="referring" />
                      <Label htmlFor="referring" className="font-normal">Referring Practice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="radiology" id="radiology" />
                      <Label htmlFor="radiology" className="font-normal">Radiology Group</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <Input id="orgName" placeholder="ABC Family Medicine" className="pl-9" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="npi">Group NPI (Optional)</Label>
                    <Input id="npi" placeholder="1234567890" />
                    <p className="text-xs text-slate-500">The group NPI helps with order validation</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address1">Primary Address</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <Input id="address1" placeholder="123 Main Street" className="pl-9" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="New York" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select defaultValue="NY">
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                          {/* Add more states as needed */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input id="zipCode" placeholder="10001" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Contact Email</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <Input id="orgEmail" type="email" placeholder="contact@abcfamilymedicine.com" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone">Contact Phone</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Phone className="h-4 w-4" />
                      </span>
                      <Input id="orgPhone" placeholder="(555) 123-4567" className="pl-9" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("admin")}>
                  Continue to Admin Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Account Tab */}
        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Account Setup</CardTitle>
              <CardDescription>
                Create an administrative account for managing your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <User className="h-4 w-4" />
                      </span>
                      <Input id="firstName" placeholder="Jane" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Smith" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input id="adminEmail" type="email" placeholder="jane.smith@abcfamilymedicine.com" className="pl-9" />
                  </div>
                  <p className="text-xs text-slate-500">This email will be used for login and account verification</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input id="adminPassword" type="password" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("organization")}>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("billing")}>
                  Continue to Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Information Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                {orgType === "referring" 
                  ? "Set up billing for your subscription" 
                  : "Set up billing for per-order charges"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium flex items-center mb-2">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Information
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    {orgType === "referring"
                      ? "Referring practices are charged a subscription fee based on usage."
                      : "Radiology groups are charged a small per-order processing fee."}
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input id="cardName" placeholder="Jane Smith" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" placeholder="4242 4242 4242 4242" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiration">Expiration Date</Label>
                        <Input id="expiration" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)} 
                  />
                  <Label htmlFor="terms" className="font-normal text-sm leading-tight mt-0.5">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </Label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("admin")}>
                  Back
                </Button>
                <Button disabled={!agreeTerms}>
                  Complete Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}