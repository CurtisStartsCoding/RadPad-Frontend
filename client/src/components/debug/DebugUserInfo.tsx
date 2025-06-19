import React, { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleDisplayNames } from "@/lib/roles";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

const DebugUserInfo: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <Card className="mb-4 bg-yellow-50 border-yellow-200">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-2">
            <CollapsibleTrigger 
              asChild 
              className="w-full text-left cursor-pointer"
            >
              <div className="flex items-center">
                {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                <CardTitle className="text-lg">User Info (Debug)</CardTitle>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <p className="text-yellow-700">No user authenticated</p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger 
            asChild 
            className="w-full text-left cursor-pointer"
          >
            <div className="flex items-center">
              {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              <CardTitle className="text-lg">User Info (Debug)</CardTitle>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium text-yellow-800">Name:</div>
              <div>{user.name}</div>
              
              <div className="font-medium text-yellow-800">Email:</div>
              <div>{user.email}</div>
              
              <div className="font-medium text-yellow-800">Role:</div>
              <div>{roleDisplayNames[user.role] || user.role}</div>
              
              <div className="font-medium text-yellow-800">Organization ID:</div>
              <div>{user.organizationId || 'None'}</div>
              
              <div className="font-medium text-yellow-800">Organization Type:</div>
              <div>{user.organizationType || 'Not specified'}</div>
              
              <div className="font-medium text-yellow-800">User ID:</div>
              <div>{user.id}</div>
              
              <div className="font-medium text-yellow-800">Created:</div>
              <div>{user.createdAt?.toLocaleDateString()}</div>
              
              <div className="font-medium text-yellow-800">Last Updated:</div>
              <div>{user.updatedAt?.toLocaleDateString()}</div>
              
              {user.lastLoginAt && (
                <>
                  <div className="font-medium text-yellow-800">Last Login:</div>
                  <div>{user.lastLoginAt.toLocaleDateString()}</div>
                </>
              )}
              
              {user.isDeveloperMode !== undefined && (
                <>
                  <div className="font-medium text-yellow-800">Developer Mode:</div>
                  <div>{user.isDeveloperMode ? 'Enabled' : 'Disabled'}</div>
                </>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DebugUserInfo;