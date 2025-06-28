import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  // Simpler approach - look for field:value pairs anywhere in the text
  const parseEmrText = () => {
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
      const text = emrText;
      const patientInfo: any = {};
      const insuranceInfo: any = {};
      
      // Extract field values using flexible patterns
      // These patterns look for the field name followed by various separators and capture the value
      
      // Names - try multiple patterns
      const namePatterns = [
        /(?:patient\s*)?name\s*[:=]?\s*([A-Za-z\-'_]+),\s*([A-Za-z\-'_]+)/i,  // LastName, FirstName
        /first\s*name\s*[:=]?\s*([A-Za-z\-'_\s]+?)(?:\s*last|\s*date|\s*dob|\s*gender|\s*sex|\s*address|\s*city|\s*state|\s*phone|\s*email|\s*mrn|\s*ssn|\s*insurance|$)/i,
        /last\s*name\s*[:=]?\s*([A-Za-z\-'_\s]+?)(?:\s*first|\s*date|\s*dob|\s*gender|\s*sex|\s*address|\s*city|\s*state|\s*phone|\s*email|\s*mrn|\s*ssn|\s*insurance|$)/i,
      ];
      
      // Try LastName, FirstName format first
      const nameMatch = text.match(namePatterns[0]);
      if (nameMatch) {
        patientInfo.lastName = nameMatch[1].trim();
        patientInfo.firstName = nameMatch[2].trim();
      } else {
        // Try separate first/last name patterns
        const firstNameMatch = text.match(namePatterns[1]);
        if (firstNameMatch) {
          patientInfo.firstName = firstNameMatch[1].trim();
        }
        
        const lastNameMatch = text.match(namePatterns[2]);
        if (lastNameMatch) {
          patientInfo.lastName = lastNameMatch[1].trim();
        }
      }
      
      // Date of Birth
      const dobMatch = text.match(/(?:date\s*of\s*birth|dob|birth\s*date)\s*[:=]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
      if (dobMatch) {
        patientInfo.dateOfBirth = formatDate(dobMatch[1]);
      }
      
      // Gender
      const genderMatch = text.match(/(?:gender|sex)\s*[:=]?\s*(male|female|m|f|other)/i);
      if (genderMatch) {
        patientInfo.gender = normalizeGender(genderMatch[1]);
      }
      
      // MRN
      const mrnMatch = text.match(/(?:medical\s*record\s*number|mrn|record\s*#)\s*[:=]?\s*([A-Za-z0-9\-]+)/i);
      if (mrnMatch) {
        patientInfo.mrn = mrnMatch[1].trim();
      }
      
      // SSN
      const ssnMatch = text.match(/(?:social\s*security\s*number|ssn)\s*[:=]?\s*(\d{3}[-\s]?\d{2}[-\s]?\d{4})/i);
      if (ssnMatch) {
        patientInfo.ssn = formatSSN(ssnMatch[1]);
      }
      
      // Phone
      const phoneMatch = text.match(/(?:phone|telephone|tel|mobile)\s*(?:number)?\s*[:=]?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i);
      if (phoneMatch) {
        patientInfo.phone = phoneMatch[0].replace(/.*[:=]\s*/, '').trim();
      }
      
      // Email
      const emailMatch = text.match(/(?:email|e-mail)\s*[:=]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      if (emailMatch) {
        patientInfo.email = emailMatch[1].trim();
      }
      
      // Address - try complete address first
      const addressMatch = text.match(/address\s*(?:line\s*1)?\s*[:=]?\s*(.+?)(?:,\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?))/i);
      if (addressMatch) {
        patientInfo.address = addressMatch[1].trim();
        patientInfo.city = addressMatch[2].trim();
        patientInfo.state = addressMatch[3];
        patientInfo.zipCode = addressMatch[4];
      } else {
        // Try individual fields
        const streetMatch = text.match(/address\s*(?:line\s*1)?\s*[:=]?\s*([^,\n]+)/i);
        if (streetMatch) {
          patientInfo.address = streetMatch[1].trim();
        }
        
        const cityMatch = text.match(/city\s*[:=]?\s*([A-Za-z\s]+?)(?:\s*state|\s*zip|\s*phone|\s*email|$)/i);
        if (cityMatch) {
          patientInfo.city = cityMatch[1].trim();
        }
        
        const stateMatch = text.match(/state\s*[:=]?\s*([A-Z]{2})/i);
        if (stateMatch) {
          patientInfo.state = stateMatch[1];
        }
        
        const zipMatch = text.match(/(?:zip\s*code|zip)\s*[:=]?\s*(\d{5}(?:-\d{4})?)/i);
        if (zipMatch) {
          patientInfo.zipCode = zipMatch[1];
        }
      }
      
      // Insurance Company/Insurer
      const insurerMatch = text.match(/(?:insurance\s*company|primary\s*insurance|insurer)\s*[:=]?\s*([^,\n]+)/i);
      if (insurerMatch) {
        insuranceInfo.insurerName = insurerMatch[1].trim();
      }
      
      // Plan Name
      const planMatch = text.match(/plan\s*(?:name)?\s*[:=]?\s*([^,\n]+)/i);
      if (planMatch) {
        insuranceInfo.planName = planMatch[1].trim();
      }
      
      // Policy Number
      const policyMatch = text.match(/policy\s*(?:number|#)\s*[:=]?\s*([A-Za-z0-9\-]+)/i);
      if (policyMatch) {
        insuranceInfo.policyNumber = policyMatch[1].trim();
      }
      
      // Group Number
      const groupMatch = text.match(/group\s*(?:number|#)\s*[:=]?\s*([A-Za-z0-9\-]+)/i);
      if (groupMatch) {
        insuranceInfo.groupNumber = groupMatch[1].trim();
      }
      
      // Policy Holder
      const holderMatch = text.match(/(?:policy\s*holder|subscriber)\s*(?:name)?\s*[:=]?\s*([^,\n]+)/i);
      if (holderMatch) {
        insuranceInfo.policyHolderName = holderMatch[1].trim();
      }
      
      // Relationship
      const relationMatch = text.match(/relationship\s*(?:to\s*patient)?\s*[:=]?\s*(self|spouse|child|parent|other)/i);
      if (relationMatch) {
        insuranceInfo.relationship = relationMatch[1].trim();
      }
      
      // Debug logging
      console.log('=== EMR PARSER RESULTS ===');
      console.log('Patient Info:', patientInfo);
      console.log('Insurance Info:', insuranceInfo);
      console.log('========================');

      // Call the parent component's callback with parsed data
      onParseComplete(patientInfo, insuranceInfo);

      // Update parsing status
      setParsingStatus({
        patient: Object.keys(patientInfo).length > 0,
        insurance: Object.keys(insuranceInfo).length > 0,
        message: "Information extracted. Please review and fill in any missing information in the next tabs."
      });
      setParsingComplete(true);

      toast({
        title: "Success",
        description: "EMR text parsed successfully. Review extracted information in the next tabs.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('EMR parsing error:', error);
      toast({
        title: "Error",
        description: "An error occurred while parsing the EMR text",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateStr: string): string => {
    const cleaned = dateStr.trim();
    
    // MM/DD/YYYY or MM-DD-YYYY
    const mmddyyyy = cleaned.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (mmddyyyy) {
      const month = mmddyyyy[1].padStart(2, '0');
      const day = mmddyyyy[2].padStart(2, '0');
      const year = mmddyyyy[3];
      return `${year}-${month}-${day}`;
    }
    
    // Return as-is if we can't parse it
    return cleaned;
  };

  // Helper function to normalize gender
  const normalizeGender = (gender: string): string => {
    const g = gender.toLowerCase();
    if (g.startsWith('m')) return 'Male';
    if (g.startsWith('f')) return 'Female';
    if (g === 'other' || g === 'o') return 'Other';
    return 'Unknown';
  };

  // Helper function to format SSN
  const formatSSN = (ssn: string): string => {
    const digits = ssn.replace(/\D/g, '');
    if (digits.length === 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }
    return ssn;
  };

  const loadExampleText = () => {
    setEmrText(`PATIENT DEMOGRAPHICS:
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
Relationship to Patient: Self`);
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
          onClick={parseEmrText}
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