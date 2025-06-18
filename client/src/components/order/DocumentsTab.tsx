import React from 'react';
import { Button } from '@/components/ui/button';
import DocumentManager from '@/components/upload/DocumentManager';

interface DocumentsTabProps {
  orderId: number;
  patientId: number;
  onBack: () => void;
  onContinue: () => void;
}

export default function DocumentsTab({
  orderId,
  patientId,
  onBack,
  onContinue
}: DocumentsTabProps) {
  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Document Management</h3>
          <p className="text-sm text-slate-600 mb-4">
            Upload and manage patient documents for this order. You can upload insurance cards, 
            referrals, and other relevant documents using drag-and-drop or copy-paste.
          </p>
          
          <DocumentManager 
            orderId={orderId} 
            patientId={patientId} 
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>
          Continue to Review
        </Button>
      </div>
    </>
  );
}