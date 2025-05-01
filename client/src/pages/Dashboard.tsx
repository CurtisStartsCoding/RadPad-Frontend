import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import PageHeader from "@/components/layout/PageHeader";
import { AppPage } from "@/App";
import { recentOrders } from "@/lib/mock-data";
import { 
  LayoutDashboard, 
  Clock, 
  CheckCircle, 
  CreditCard, 
  TrendingUp, 
  PlusCircle, 
  CheckSquare, 
  Link, 
  CreditCard as CreditCardIcon
} from "lucide-react";

const Dashboard = () => {
  return (
    <div className="p-6">
      <PageHeader 
        title="Dashboard" 
        description="View and manage your imaging orders" 
      />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Orders</p>
                <p className="text-2xl font-bold text-slate-900">7</p>
              </div>
              <div className="p-3 bg-primary-lighter rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                12% increase
              </span>
              <span className="text-slate-500 ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed Orders</p>
                <p className="text-2xl font-bold text-slate-900">42</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                8% increase
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Available Credits</p>
                <p className="text-2xl font-bold text-slate-900">125</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-warning font-medium">Low balance warning</span>
              <a className="text-primary ml-2 underline cursor-pointer">Purchase more</a>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders */}
      <Card className="mb-6">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            <p className="text-sm text-slate-500">Your most recent imaging orders</p>
          </div>
          <Button 
            variant="link" 
            className="text-sm font-medium"
          >
            View all
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modality</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{order.patient.name}</div>
                    <div className="text-xs text-slate-500">MRN: {order.patient.mrn}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-900">{order.modality}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">{order.createdAt}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    <a className="text-primary hover:underline cursor-pointer">View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Quick Links */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <PlusCircle className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">New Order</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <CheckSquare className="h-8 w-8 text-primary-light mb-2" />
              <span className="text-sm font-medium">Admin Queue</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <Link className="h-8 w-8 text-primary-light mb-2" />
              <span className="text-sm font-medium">Connections</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <CreditCardIcon className="h-8 w-8 text-primary-light mb-2" />
              <span className="text-sm font-medium">Buy Credits</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
