import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, InfoIcon, Printer } from 'lucide-react';
// @ts-ignore - html2pdf.js doesn't have official type definitions
import html2pdf from 'html2pdf.js';

interface OrderReviewSummaryProps {
  order: {
    id: number;
    modality: string;
    radiologyGroup: string;
    original_dictation?: string;
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
  authorizationInfo?: {
    authorizationNumber?: string | null;
    authorizationStatus?: string | null;
    authorizationDate?: string | null;
    insuranceAuthorizationNumber?: string | null;
    insuranceAuthorizationDate?: string | null;
    insuranceAuthorizationContact?: string | null;
  };
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
  authorizationInfo,
  onSendToRadiology,
  onBack,
  isSending
}: OrderReviewSummaryProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    
    const filename = `Order_${orderDetails.orderNumber}_${patientInfo.lastName}_${patientInfo.firstName}.pdf`;
    
    // Create a clone of the content to remove elements with print:hidden class
    const element = contentRef.current.cloneNode(true) as HTMLElement;
    const hiddenElements = element.querySelectorAll('.print\\:hidden');
    hiddenElements.forEach(el => el.remove());
    
    // Add a temporary stylesheet to improve PDF page breaks
    const style = document.createElement('style');
    style.innerHTML = `
      @page { margin: 15mm; }
      .page-break { page-break-before: always; }
      .avoid-break { page-break-inside: avoid; }
      .card { page-break-inside: avoid; }
    `;
    element.appendChild(style);
    
    // Apply avoid-break class to all cards
    const cards = element.querySelectorAll('.card');
    cards.forEach(card => {
      card.classList.add('avoid-break');
    });
    
    // Configure PDF options
    const options = {
      margin: [15, 15, 15, 15] as [number, number, number, number], // [top, right, bottom, left] in mm
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as 'portrait',
        compress: true
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(options).from(element).save();
  };

  return (
    <div className="space-y-4 pdf-document" ref={contentRef}>
      <div>
        <h3 className="text-lg font-medium mb-2 print:hidden">Review Order Information</h3>
        <p className="text-sm text-muted-foreground mb-4 print:hidden">
          Please review all information carefully before sending this order to {order.radiologyGroup}.
        </p>
        
        {/* Compact print-friendly layout */}
        <div className="space-y-3 pdf-content">
          {/* 1. Order Summary - Keep as is */}
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
                    <span className="font-medium">{order.modality}</span>
                    {order.modality === 'Not specified' && (
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

          {/* 2. Patient & Physician Info - Side by side */}
          <div className="grid grid-cols-2 gap-3 avoid-break">
            {/* Patient Information */}
            <Card className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{patientInfo.firstName} {patientInfo.lastName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">DOB: </span>
                  <span className="font-medium">{patientInfo.dateOfBirth}</span>
                  <span className="text-muted-foreground ml-3">Gender: </span>
                  <span className="font-medium">{patientInfo.gender.charAt(0).toUpperCase() + patientInfo.gender.slice(1)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">MRN: </span>
                  <span className="font-medium">{patientInfo.mrn}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-medium">{patientInfo.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{patientInfo.email || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Address: </span>
                  <span className="font-medium">
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
              <CardContent className="space-y-2 text-sm">
                {/* Backend Update Notice */}
                {(referringPhysician.name === 'Not available' || referringPhysician.npi === 'Not available') && (
                  <Alert className="mb-3 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                      <strong>Backend Update Needed:</strong> API should populate referring_physician_name and referring_physician_npi fields from the physician who created/signed the order.
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{referringPhysician.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">NPI: </span>
                  <span className="font-medium">{referringPhysician.npi}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Clinic: </span>
                  <span className="font-medium">{referringPhysician.clinic}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-medium">{referringPhysician.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Signed: </span>
                  <span className="font-medium">{referringPhysician.signedDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 3. Insurance Information - Full details */}
          <Card className="print:break-inside-avoid avoid-break">
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
          
          {/* 4. Clinical Information - New section */}
          <Card className="print:break-inside-avoid">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Clinical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Dictation */}
              <div>
                <p className="font-medium text-muted-foreground mb-1">Dictation</p>
                <div className="bg-muted p-3 rounded text-sm">
                  {order.original_dictation || clinicalSummary}
                </div>
              </div>
              
              {/* ICD-10 Codes */}
              <div>
                <p className="font-medium text-muted-foreground mb-1">ICD-10 Codes</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="mr-2">{orderDetails.primaryIcd10}</Badge>
                    <span>{orderDetails.primaryDescription}</span>
                  </div>
                  {orderDetails.secondaryIcd10 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="mr-2">{orderDetails.secondaryIcd10}</Badge>
                      <span>{orderDetails.secondaryDescription}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* CPT Codes */}
              <div>
                <p className="font-medium text-muted-foreground mb-1">CPT Codes</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="mr-2">{orderDetails.cptCode}</Badge>
                  <span>{orderDetails.cptDescription}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 5. Order Details - New section */}
          <Card className="print:break-inside-avoid avoid-break">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <span className="text-muted-foreground">Radiology Group: </span>
                  <span className="font-medium">{order.radiologyGroup || 'Not selected'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Facility: </span>
                  <span className="font-medium">{orderDetails.location || 'Not selected'}</span>
                </div>
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
              
              {/* Special Instructions - if present */}
              {orderDetails.instructions && (
                <div className="mt-3">
                  <p className="font-medium text-muted-foreground mb-1">Special Instructions</p>
                  <p className="whitespace-pre-wrap">{orderDetails.instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 6. Authorization - New section */}
          <Card className="print:break-inside-avoid avoid-break">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Authorization</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <span className="text-muted-foreground">Authorization Number: </span>
                  <span className="font-medium">{authorizationInfo?.authorizationNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Insurance Authorization Number: </span>
                  <span className="font-medium">{authorizationInfo?.insuranceAuthorizationNumber || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Authorization Status: </span>
                  <span className="font-medium">{authorizationInfo?.authorizationStatus || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Insurance Authorization Date: </span>
                  <span className="font-medium">{authorizationInfo?.insuranceAuthorizationDate || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Authorization Date: </span>
                  <span className="font-medium">{authorizationInfo?.authorizationDate || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Insurance Authorization Contact: </span>
                  <span className="font-medium">{authorizationInfo?.insuranceAuthorizationContact || 'Not provided'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 7. Additional - New section (blank for now) */}
          <Card className="print:break-inside-avoid avoid-break">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground italic">No additional information provided</p>
            </CardContent>
          </Card>
          
          {/* 8. Consent/Signatures - New section (blank for now) */}
          <Card className="print:break-inside-avoid avoid-break">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Consent/Signatures</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground italic">No consent/signature information provided</p>
            </CardContent>
          </Card>
          
          {/* Credit Usage Alert - Hide on print */}
          <Alert className="print:hidden">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Sending this order will use 1 credit from your organization's balance.
            </AlertDescription>
          </Alert>
        </div>
      </div>
      
      <div className="flex justify-between mt-6 print:hidden">
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
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="print:hidden"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={onSendToRadiology}
            disabled={isSending}
            className="bg-green-600 hover:bg-green-700 print:hidden"
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