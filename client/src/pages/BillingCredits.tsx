import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/layout/PageHeader";
import { CreditCard, PlusCircle, RefreshCw, ShoppingCart, TrendingDown, History, Settings } from "lucide-react";

const BillingCredits = () => {
  return (
    <div className="p-6">
      <PageHeader 
        title="Billing & Credits" 
        description="Manage your credits and view billing history"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Credit Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Credit Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">125</p>
                <p className="text-sm text-slate-500">Available Credits</p>
              </div>
              <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-amber-600" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Basic Imaging Credits Used</span>
                <span className="text-xs font-medium text-slate-700">35 orders ($70)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Advanced Imaging Credits Used</span>
                <span className="text-xs font-medium text-slate-700">12 orders ($84)</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-slate-500">Monthly usage</span>
                <span className="text-xs font-medium text-slate-700">47/150 orders</span>
              </div>
              <Progress value={31.3} className="h-2" />
            </div>
            
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500 font-medium">Low balance warning:</span>
              <span className="text-slate-600 ml-1">Your credits will run out in approximately 15 days</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Auto-Reload Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Auto-Reload Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start space-x-3">
                <div className="rounded-full p-2 bg-green-100">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Auto-reload is active</p>
                  <p className="text-xs text-slate-500 mt-1">100 imaging order credits ($200) will be purchased when your balance falls below 25 credits</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure Auto-Reload
            </Button>
          </CardContent>
        </Card>
        
        {/* Quick Purchase */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Purchase Credits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-3">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Physician Group Plans</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-slate-200 rounded-lg p-3 text-center hover:border-primary hover:bg-primary-lighter/20 cursor-pointer">
                  <p className="text-lg font-bold text-slate-900">100 Credits</p>
                  <p className="text-xs text-slate-500">$200 ($2/order)</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 text-center hover:border-primary hover:bg-primary-lighter/20 cursor-pointer">
                  <p className="text-lg font-bold text-slate-900">500 Credits</p>
                  <p className="text-xs text-slate-500">$1,000 ($2/order)</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Radiology Group Plans</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-slate-200 rounded-lg p-3 text-center hover:border-primary hover:bg-primary-lighter/20 cursor-pointer">
                  <div className="font-bold text-slate-900">Basic Imaging</div>
                  <p className="text-xs text-slate-500">$2 per order</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 text-center hover:border-primary hover:bg-primary-lighter/20 cursor-pointer">
                  <div className="font-bold text-slate-900">Advanced Imaging</div>
                  <p className="text-xs text-slate-500">$7 per order</p>
                </div>
              </div>
            </div>
            
            <Button className="w-full">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Credits
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <Tabs defaultValue="history">
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Billing & Transaction History</CardTitle>
              <TabsList>
                <TabsTrigger value="history">Credit History</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          
          <TabsContent value="history" className="p-0 m-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Credits</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Balance After</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Aug 15, 2023</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <PlusCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">Credit Purchase</div>
                          <div className="text-xs text-slate-500">Invoice #INV-2023-08-15</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">+500</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">625</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Aug 10, 2023</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">Basic Imaging Order</div>
                          <div className="text-xs text-slate-500">Order #ORD-78945 ($2)</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">-1</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">125</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Aug 8, 2023</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-slate-900">Advanced Imaging Order</div>
                          <div className="text-xs text-slate-500">Order #ORD-78942 ($7)</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">-1</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">126</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="invoices">
            <div className="p-6 text-center text-slate-500">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p>Your invoice history will appear here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="payment-methods">
            <div className="p-6 text-center text-slate-500">
              <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p>Your payment methods will appear here</p>
              <Button variant="outline" className="mt-3">
                Add Payment Method
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default BillingCredits;
