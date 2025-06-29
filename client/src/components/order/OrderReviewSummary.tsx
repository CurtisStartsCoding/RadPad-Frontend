import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, InfoIcon, Printer } from 'lucide-react';

interface OrderReviewSummaryProps {
  order: {
    id: number;
    modality: string;
    radiologyGroup: string;
  };
  orderDetails: {
    orderNumber: string;
    location: string;
    scheduling: string;
    priority: string;
    primaryIcd10: string;
    primaryDescription: string;
    secondaryIcd10: string;
    secondaryDescription: string;
    cptCode: string;
    cptDescription: string;
    instructions?: string;
  };
  patientInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    email?: string;
    mrn: string;
  };
  insuranceInfo: {
    insurerName: string;
    planName: string;
    policyNumber: string;
    groupNumber?: string;
    policyHolderName: string;
    policyHolderRelationship: string;
    policyHolderDateOfBirth?: string;
    secondaryInsurerName?: string;
    secondaryPlanName?: string;
    secondaryPolicyNumber?: string;
    secondaryGroupNumber?: string;
  };
  hasInsurance: boolean;
  referringPhysician: {
    name: string;
    npi: string;
    clinic: string;
    phone: string;
    signedDate: string;
  };
  clinicalSummary: string;
  onSendToRadiology: () => void;
  onBack: () => void;
  isSending: boolean;
}

export default function OrderReviewSummary({
  order,
  orderDetails,
  patientInfo,
  insuranceInfo,
  hasInsurance,
  referringPhysician,
  clinicalSummary,
  onSendToRadiology,
  onBack,
  isSending
}: OrderReviewSummaryProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Review Order Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Please review all information carefully before sending this order to {order.radiologyGroup}.
        </p>
        
        {/* Compact print-friendly layout */}
        <div className="space-y-3">
          {/* Order Summary - All in one compact card */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Imaging Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Details Row */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Order #: </span>
                    <span className="font-medium">{orderDetails.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Study: </span>
                    <span className="font-medium">
                      {orderDetails.cptDescription || order.modality}
                    </span>
                    {(!orderDetails.cptDescription && order.modality === 'Not specified') && (
                      <span className="text-xs text-amber-600 ml-2">(Backend: modality field missing)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Radiology Group: </span>
                    <span className="font-medium">{order.radiologyGroup || 'Not selected'}</span>
                    {orderDetails.location && (
                      <>
                        <br />
                        <span className="text-muted-foreground">Facility: </span>
                        <span className="font-medium">{orderDetails.location}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">Priority: </span>
                    <Badge variant={orderDetails.priority === 'stat' ? 'destructive' : orderDetails.priority === 'urgent' ? 'default' : 'secondary'} className="ml-1">
                      {orderDetails.priority === 'stat' ? 'STAT' : orderDetails.priority.charAt(0).toUpperCase() + orderDetails.priority.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Scheduling: </span>
                    <span className="font-medium">{orderDetails.scheduling}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Information & Diagnosis - Combined */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Clinical Information & Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Clinical Summary */}
              <div className="bg-muted p-3 rounded text-sm">
                {clinicalSummary}
              </div>
              
              {/* Diagnosis Codes - Inline format */}
              <div className="space-y-2 text-sm">
                <div className="gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Primary ICD-10:</span>
                  <div className="flex items-start gap-3 mt-1">
                    <span className="font-bold font-mono min-w-[80px]">{orderDetails.primaryIcd10}</span>
                    <span className="text-sm flex-1">{orderDetails.primaryDescription}</span>
                  </div>
                </div>
                <div className="gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Secondary ICD-10:</span>
                  {orderDetails.secondaryIcd10 && orderDetails.secondaryIcd10.includes('\n') ? (
                    // Multiple codes - display as clean list
                    <div className="mt-1 space-y-1">
                      {orderDetails.secondaryIcd10.split('\n').map((code, index) => {
                        const descriptions = orderDetails.secondaryDescription?.split('\n') || [];
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <span className="font-bold font-mono min-w-[80px]">{code}</span>
                            <span className="text-sm flex-1">{descriptions[index] || ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Single code - display inline
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold font-mono">{orderDetails.secondaryIcd10}</span>
                      <span>{orderDetails.secondaryDescription}</span>
                    </div>
                  )}
                </div>
                <div className="gap-2">
                  <span className="text-muted-foreground min-w-[100px]">CPT Code:</span>
                  <div className="flex items-start gap-3 mt-1">
                    <span className="font-bold font-mono min-w-[80px]">{orderDetails.cptCode}</span>
                    <span className="text-sm flex-1">{orderDetails.cptDescription}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient & Physician Info - Side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Patient Information */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Name:</span>
                  <span className="font-medium flex-1">{patientInfo.firstName} {patientInfo.lastName}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">DOB:</span>
                  <span className="font-medium flex-1">{patientInfo.dateOfBirth}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Gender:</span>
                  <span className="font-medium flex-1">{patientInfo.gender.charAt(0).toUpperCase() + patientInfo.gender.slice(1)}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">MRN:</span>
                  <span className="font-medium flex-1">{patientInfo.mrn}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Phone:</span>
                  <span className="font-medium flex-1">{patientInfo.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Email:</span>
                  <span className="font-medium flex-1">{patientInfo.email || 'Not provided'}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Address:</span>
                  <span className="font-medium flex-1">
                    {patientInfo.addressLine1}
                    {patientInfo.addressLine2 && `, ${patientInfo.addressLine2}`}, 
                    {' '}{patientInfo.city}, {patientInfo.state} {patientInfo.zipCode}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Referring Physician */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Referring Physician</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {/* Backend Update Notice */}
                {(referringPhysician.name === 'Not available' || referringPhysician.npi === 'Not available') && (
                  <Alert className="mb-3 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                      <strong>Backend Update Needed:</strong> API should populate referring_physician_name and referring_physician_npi fields from the physician who created/signed the order.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Name:</span>
                  <span className="font-medium flex-1">{referringPhysician.name}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">NPI:</span>
                  <span className="font-medium flex-1">{referringPhysician.npi}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Clinic:</span>
                  <span className="font-medium flex-1">{referringPhysician.clinic}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Phone:</span>
                  <span className="font-medium flex-1">{referringPhysician.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-muted-foreground min-w-[60px]">Signed:</span>
                  <span className="font-medium flex-1">{referringPhysician.signedDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Insurance Information - Full details */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Insurance Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {!hasInsurance ? (
                <p className="text-muted-foreground">Patient is uninsured/cash-pay</p>
              ) : (
                <div className="space-y-3">
                  {/* Primary Insurance */}
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Primary Insurance</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3">
                      <div>
                        <span className="text-muted-foreground">Company: </span>
                        <span className="font-medium">{insuranceInfo.insurerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Plan: </span>
                        <span className="font-medium">{insuranceInfo.planName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Policy #: </span>
                        <span className="font-medium">{insuranceInfo.policyNumber}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Group #: </span>
                        <span className="font-medium">{insuranceInfo.groupNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Policy Holder: </span>
                        <span className="font-medium">{insuranceInfo.policyHolderName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Relationship: </span>
                        <span className="font-medium">{insuranceInfo.policyHolderRelationship}</span>
                      </div>
                      {insuranceInfo.policyHolderRelationship !== 'self' && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Policy Holder DOB: </span>
                          <span className="font-medium">{insuranceInfo.policyHolderDateOfBirth}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Secondary Insurance if present */}
                  {insuranceInfo.secondaryInsurerName && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Secondary Insurance</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-3">
                        <div>
                          <span className="text-muted-foreground">Company: </span>
                          <span className="font-medium">{insuranceInfo.secondaryInsurerName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Plan: </span>
                          <span className="font-medium">{insuranceInfo.secondaryPlanName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Policy #: </span>
                          <span className="font-medium">{insuranceInfo.secondaryPolicyNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Group #: </span>
                          <span className="font-medium">{insuranceInfo.secondaryGroupNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Special Instructions - Only if present */}
          {orderDetails.instructions && (
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Special Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{orderDetails.instructions}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Credit Usage Alert - Hide on print */}
          <Alert className="print:hidden">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Sending this order will use 1 credit from your organization's balance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handlePrint}
            className="print:hidden"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Order
          </Button>
          <Button 
            onClick={onSendToRadiology} 
            disabled={isSending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSending ? (
              <>
                <span className="mr-2">Sending...</span>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : "Send to Radiology"}
          </Button>
        </div>
      </div>
    </div>
  );
}