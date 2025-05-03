import { useState } from "react";
import BillingCredits from "./BillingCredits";
import { UserRole } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BillingTest = () => {
  const [role, setRole] = useState<UserRole>(UserRole.AdminReferring);

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Billing Page Role Tester</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button 
            variant={role === UserRole.AdminReferring ? "default" : "outline"}
            onClick={() => setRole(UserRole.AdminReferring)}
          >
            Show Referring Admin View
          </Button>
          <Button 
            variant={role === UserRole.AdminRadiology ? "default" : "outline"}
            onClick={() => setRole(UserRole.AdminRadiology)}
          >
            Show Radiology Admin View
          </Button>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-slate-100 rounded-lg mb-6">
        <p className="text-sm font-medium">Current role: {role}</p>
      </div>
      
      <BillingCredits userRole={role} />
    </div>
  );
};

export default BillingTest;