import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import { allOrders } from "@/lib/mock-data";

const AdminQueue = () => {
  // Filter to only show pending_admin orders
  const pendingAdminOrders = allOrders.filter(order => order.status === 'pending_admin');
  
  return (
    <div className="p-6">
      <PageHeader 
        title="Admin Queue" 
        description="Manage orders awaiting administrative review"
      />
      
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search by patient name or MRN..."
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            <Select>
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="All Physicians" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Physicians</SelectItem>
                <SelectItem value="doe">Dr. John Doe</SelectItem>
                <SelectItem value="clark">Dr. Emily Clark</SelectItem>
                <SelectItem value="wilson">Dr. Robert Wilson</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Input
                type="text"
                placeholder="Date range"
                className="w-full md:w-auto pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Orders Queue Table */}
      <Card className="overflow-hidden">
        {pendingAdminOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="bg-primary-lighter p-3 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">Queue is empty</h3>
            <p className="text-sm text-slate-500 mb-4">There are no orders awaiting administrative review</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr className="bg-slate-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modality</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ordering Physician</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Signed</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingAdminOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{order.patient.name}</div>
                      <div className="text-xs text-slate-500">MRN: {order.patient.mrn}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{order.modality}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">Dr. John Doe</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{order.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button variant="secondary" size="sm" className="mr-2">Review</Button>
                      <Button variant="outline" size="sm">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminQueue;
