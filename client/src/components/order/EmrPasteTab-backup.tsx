import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EmrPasteTabProps {
  orderId: string;
  onParseComplete: (patientData: any, insuranceData: any) => void;
  onContinue: () => void;
}

export default function EmrPasteTab({ orderId, onParseComplete, onContinue }: EmrPasteTabProps) {
  const { toast } = useToast();
  const [emrText, setEmrText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsingComplete, setParsingComplete] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<{
    patient: boolean;
    insurance: boolean;
    message: string;
  }>({
    patient: false,
    insurance: false,
    message: ""
  });

  const handleEmrTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmrText(e.target.value);
  };

  const loadExampleText = () => {
    setEmrText(`*** MOCK DATA - FOR TESTING ONLY ***

PATIENT DEMOGRAPHICS:
Name: TEST_Thompson, MOCK_Margaret
DOB: 08/15/1975
Sex: Female
MRN: MOCK-PT789012-TEST
Address: 456 FAKE Park Avenue, TEST Apt 7B, MOCK New York, ZZ 00000
Phone: (555) MOCK-TEST
Email: fake.patient@mockdata.test

INSURANCE INFORMATION:
Primary Insurance: MOCK Aetna Health Insurance (TEST)
Policy #: TEST-AET12345678-MOCK
Group #: MOCK-GRP-98765-TEST
Policy Holder: TEST_Thompson, MOCK_Margaret
Relationship to Patient: Self
Policy Holder DOB: 08/15/1975

Secondary Insurance: MOCK Medicare Part B (TEST)
Policy #: TEST-MED87654321-MOCK
Group #: MOCK-MEDGRP-54321-TEST

HEALTHCARE PROVIDER:
PCP: Dr. TEST_James MOCK_Wilson
PCP Phone: (555) FAKE-TEST
Referring Provider: Dr. TEST_Sarah MOCK_Johnson

*** THIS IS FAKE DATA FOR TESTING PURPOSES ONLY ***`);
  };

  const handleParseEmr = async () => {
    if (!emrText.trim()) {
      toast({
        title: "Error",
        description: "Please paste EMR text first",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    try {
      console.log('=== EMR PARSING START ===');
      console.log('EMR Text being sent (first 500 chars):', emrText.substring(0, 500));
      console.log('Full EMR text length:', emrText.length);
      
      // Call the real API to parse EMR text
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/paste-summary`, {
        pastedText: emrText
      });

      if (response.ok) {
        const result = await response.json();
        
        // Detailed logging of response
        console.log('=== EMR PARSER RESPONSE ===');
        console.log('Full response:', JSON.stringify(result, null, 2));
        console.log('Success:', result.success);
        console.log('Message:', result.message);
        console.log('Parsed Data exists:', !!result.parsedData);
        
        if (result.parsedData) {
          console.log('=== PATIENT INFO DETAILS ===');
          const patientInfo = result.parsedData.patientInfo || {};
          console.log('Patient Info keys:', Object.keys(patientInfo));
          console.log('Patient Info values:', patientInfo);
          console.log('Has firstName:', 'firstName' in patientInfo);
          console.log('Has lastName:', 'lastName' in patientInfo);
          console.log('Has city:', 'city' in patientInfo);
          console.log('Has state:', 'state' in patientInfo);
          
          console.log('=== INSURANCE INFO DETAILS ===');
          const insuranceInfo = result.parsedData.insuranceInfo || {};
          console.log('Insurance Info exists:', !!result.parsedData.insuranceInfo);
          console.log('Insurance Info keys:', Object.keys(insuranceInfo));
          console.log('Insurance Info values:', insuranceInfo);
        }
        
        // Pass parsed data back to parent component
        if (result.parsedData) {
          console.log('=== CALLING onParseComplete ===');
          onParseComplete(
            result.parsedData.patientInfo || {},
            result.parsedData.insuranceInfo || {}
          );
        }

        // Update parsing status
        setParsingStatus({
          patient: !!result.parsedData?.patientInfo,
          insurance: !!result.parsedData?.insuranceInfo,
          message: "Information extracted. Please review and fill in any missing information in the next tabs."
        });
        setParsingComplete(true);

        toast({
          title: "Success",
          description: "EMR text parsed successfully. Review extracted information in the next tabs.",
          variant: "default",
        });
      } else {
        const errorData = await response.json();
        console.error('=== EMR PARSING ERROR RESPONSE ===');
        console.error('Status:', response.status);
        console.error('Error data:', errorData);
        toast({
          title: "Parsing Error",
          description: errorData.message || "Failed to parse EMR text. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('=== EMR PARSING EXCEPTION ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Full error:', error);
      toast({
        title: "Error",
        description: "An error occurred while parsing the EMR text",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
      console.log('=== EMR PARSING END ===');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
        <h3 className="text-lg font-medium flex items-center mb-2">
          <InfoIcon className="h-5 w-5 mr-2 text-blue-500" />
          EMR Patient Summary Parser
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Copy and paste text from your EMR patient summary or face sheet below. The system will automatically
          extract patient demographics and insurance information, saving you time on manual data entry.
        </p>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <Label htmlFor="emrText">EMR Patient Summary Text</Label>
          <Button 
            variant="link" 
            className="h-auto p-0 text-xs text-blue-500"
            onClick={loadExampleText}
          >
            Load example text
          </Button>
        </div>
        <Textarea
          id="emrText"
          placeholder="Copy and paste text from EMR patient summary here..."
          className="min-h-[200px] font-mono text-sm"
          value={emrText}
          onChange={handleEmrTextChange}
        />
      </div>

      <div className="flex justify-between items-center">
        <div>
          {parsingComplete && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              {parsingStatus.message}
            </div>
          )}
        </div>
        <Button 
          onClick={handleParseEmr}
          disabled={isParsing || !emrText.trim()}
        >
          {isParsing ? (
            <>
              <span className="mr-2">Parsing...</span>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : "Extract Patient Information"}
        </Button>
      </div>

      {parsingComplete && (
        <Alert className="mt-4 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Information extracted successfully</AlertTitle>
          <AlertDescription>
            Patient and insurance information has been automatically extracted. You can review and edit the details in the next tabs.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={onContinue}>
          Continue to Patient Info
        </Button>
      </div>
    </div>
  );
}