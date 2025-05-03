import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  DollarSign, 
  PlusCircle, 
  Download,
  ChevronDown,
  Calendar,
  CheckCircle2,
  FileText,
  ExternalLink
} from "lucide-react";
import { UserRole } from "@/lib/roles";

// Mock transaction history
const transactions = [
  { 
    id: 1, 
    date: '2023-07-15T10:30:00', 
    description: 'Credit Purchase - 100 Advanced Credits', 
    amount: 700.00, 
    type: 'purchase', 
    invoiceId: 'INV-2023-0124'
  },
  { 
    id: 2, 
    date: '2023-07-01T14:45:00', 
    description: 'Credit Purchase - 200 Standard Credits', 
    amount: 400.00, 
    type: 'purchase', 
    invoiceId: 'INV-2023-0095'
  },
  { 
    id: 3, 
    date: '2023-06-28T09:15:00', 
    description: 'Credit Usage - MRI Order #4592', 
    amount: -7.00, 
    type: 'usage', 
    invoiceId: null
  },
  { 
    id: 4, 
    date: '2023-06-25T11:20:00', 
    description: 'Credit Usage - X-Ray Order #4587', 
    amount: -2.00, 
    type: 'usage', 
    invoiceId: null
  },
  { 
    id: 5, 
    date: '2023-06-20T16:10:00', 
    description: 'Credit Usage - CT Scan Order #4581', 
    amount: -7.00, 
    type: 'usage', 
    invoiceId: null
  },
  { 
    id: 6, 
    date: '2023-06-15T08:30:00', 
    description: 'Credit Purchase - 50 Advanced Credits', 
    amount: 350.00, 
    type: 'purchase', 
    invoiceId: 'INV-2023-0072'
  },
];

interface BillingCreditsProps {
  userRole?: UserRole;
}

const BillingCredits = ({ userRole = UserRole.AdminReferring }: BillingCreditsProps) => {
  const [autoReload, setAutoReload] = useState(false);
  
  // Determine if user is a radiologist or radiology admin
  const isRadiologyUser = userRole === UserRole.AdminRadiology || userRole === UserRole.Radiologist;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Get transaction type badge
  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Purchase</Badge>;
      case 'usage':
        return <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">Usage</Badge>;
      case 'refund':
        return <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">Refund</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Billing & Credits</h1>
          <p className="text-sm text-slate-500">Manage your credit balance and view transaction history</p>
        </div>
        <Button>
          <DollarSign className="h-4 w-4 mr-2" />
          Purchase Credits
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credit Balance Cards */}
        <div className="space-y-6 md:col-span-2">
          <div className={`grid grid-cols-1 ${isRadiologyUser ? 'md:grid-cols-2' : ''} gap-6`}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-amber-800">
                  <div className="bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                    <DollarSign className="h-4 w-4 text-amber-800" />
                  </div>
                  Standard Credits
                </CardTitle>
                <CardDescription>
                  Used for standard X-rays, basic ultrasound
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-3xl font-bold">158</div>
                <p className="text-sm text-slate-500">$2.00 per order</p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Standard Credits
                </Button>
              </CardFooter>
            </Card>
            
            {isRadiologyUser && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-800">
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                      <DollarSign className="h-4 w-4 text-blue-800" />
                    </div>
                    Advanced Credits
                  </CardTitle>
                  <CardDescription>
                    Used for CT scans, MRIs, advanced imaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-3xl font-bold">72</div>
                  <p className="text-sm text-slate-500">$7.00 per order</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Advanced Credits
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          
          {/* Auto-Reload Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Reload Settings</CardTitle>
              <CardDescription>
                Configure automatic credit purchases when your balance is low
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-reload" className="text-base">Enable Auto-Reload</Label>
                  <p className="text-sm text-slate-500">
                    Automatically purchase credits when your balance reaches a threshold
                  </p>
                </div>
                <Switch
                  id="auto-reload"
                  checked={autoReload}
                  onCheckedChange={setAutoReload}
                />
              </div>
              
              {autoReload && (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Standard Credits Threshold</Label>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-10 bg-slate-100 rounded flex items-center justify-center font-medium">
                        20
                      </div>
                      <span className="text-sm text-slate-500">Auto-purchase when balance falls below 20 credits</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Standard Credits Purchase Amount</Label>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-10 bg-slate-100 rounded flex items-center justify-center font-medium">
                        100
                      </div>
                      <span className="text-sm text-slate-500">Purchase 100 credits ($200.00)</span>
                    </div>
                  </div>
                  
                  {isRadiologyUser && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm">Advanced Credits Threshold</Label>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-10 bg-slate-100 rounded flex items-center justify-center font-medium">
                            10
                          </div>
                          <span className="text-sm text-slate-500">Auto-purchase when balance falls below 10 credits</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm">Advanced Credits Purchase Amount</Label>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-10 bg-slate-100 rounded flex items-center justify-center font-medium">
                            100
                          </div>
                          <span className="text-sm text-slate-500">Purchase 100 credits ($700.00)</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="pt-2">
                    <Button size="sm">Save Auto-Reload Settings</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Credit Packages */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>
                Choose the quantity of credits to purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Standard Credits */}
              <div>
                <h3 className="font-medium mb-3">Standard Credits</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">100 Credits</h4>
                        <p className="text-sm text-slate-500">Standard package</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$200.00</p>
                        <p className="text-xs text-slate-500">$2.00 per credit</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Purchase
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">500 Credits</h4>
                        <p className="text-sm text-slate-500">Standard package</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$1,000.00</p>
                        <p className="text-xs text-slate-500">$2.00 per credit</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Purchase
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">1000 Credits</h4>
                        <p className="text-sm text-slate-500">Standard package</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">$2,000.00</p>
                        <p className="text-xs text-slate-500">$2.00 per credit</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Purchase
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Advanced Credits - Only for Radiology Users */}
              {isRadiologyUser && (
                <div>
                  <h3 className="font-medium mb-3">Advanced Credits</h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">100 Credits</h4>
                          <p className="text-sm text-slate-500">Advanced package</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">$700.00</p>
                          <p className="text-xs text-slate-500">$7.00 per credit</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Purchase
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">500 Credits</h4>
                          <p className="text-sm text-slate-500">Advanced package</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">$3,500.00</p>
                          <p className="text-xs text-slate-500">$7.00 per credit</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Purchase
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">1000 Credits</h4>
                          <p className="text-sm text-slate-500">Advanced package</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">$7,000.00</p>
                          <p className="text-xs text-slate-500">$7.00 per credit</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Purchase
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-4 bg-slate-50">
              <div className="w-full text-center">
                <p className="text-sm text-slate-500">Need a custom quantity?</p>
                <Button variant="link" className="p-0 h-auto">
                  Contact our support team
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-slate-100 w-10 h-10 rounded flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/24</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">Default</Badge>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Transaction History */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View your credit purchases and usage history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                        {formatDate(transaction.date)}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.invoiceId ? (
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <FileText className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled className="h-8 px-2 opacity-50">
                          <FileText className="h-4 w-4 mr-1" />
                          N/A
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t py-4">
            <Button variant="outline" size="sm">
              <ChevronDown className="h-4 w-4 mr-1" />
              Load More
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BillingCredits;