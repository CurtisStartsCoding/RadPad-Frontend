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

  // Example variations for testing different EMR formats
  const exampleVariations = {
    classic: {
      name: "Classic Format",
      text: `PATIENT DEMOGRAPHICS:
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
Relationship to Patient: Self`
    },
    stacked: {
      name: "Stacked Fields",
      text: `First Name
john
Last Name
smith
Date of Birth
01/01/1999
Gender
Female
Address Line 1
123 Medical Blvd
City
Fort Myers
State
FL
ZIP Code
33905
Phone Number
(443) 602-6207
Email
test.scheduler@example.com
Medical Record Number (MRN)
MRN123456
Social Security Number
123-45-6789

Insurance Company
UnitedHealthcare
Plan Name
Gold PPO
Policy Number
UHC-123456
Group Number
GRP-98765
Policy Holder Name
john smith
Relationship to Patient
Self`
    },
    horizontal: {
      name: "Horizontal Format",
      text: `First Name:john Last Name:smith DOB:01/01/1999 Gender:Male Email:test.scheduler@example.com
Address: 123 Medical Blvd, Fort Myers, FL 33905 Phone:(443)602-6207
MRN:MRN789012 SSN:987-65-4321
INSURANCE: Primary: UnitedHealthcare Gold PPO Policy#UHC-123456 Group#GRP-98765 
Policy Holder:john smith (Self) DOB:01/01/1999`
    },
    table: {
      name: "Table Format",
      text: `Field               Value
First Name          john
Last Name           smith
Date of Birth       03/15/1980
Gender              Male
Address             789 Healthcare Dr
City                Tampa
State               FL
ZIP                 33606
Phone               (813) 555-0123
Email               patient@email.com
MRN                 MRN-2024-001
SSN                 456-78-9012

Insurance Status    Insured
Primary Insurer     Aetna
Plan                PPO Plus
Policy Number       AET-789456
Group Number        GRP-12345
Policy Holder       john smith
Relationship        Self`
    },
    minimal: {
      name: "Minimal Format",
      text: `john smith 01/01/1999 F 123 Medical Blvd Fort Myers FL 33905 (443)602-6207 test@example.com
MRN: PT-2024-789 SSN: 111-22-3333
INS: UHC GoldPPO UHC-123456 GRP-98765 Self 01/01/1999`
    },
    mixed: {
      name: "Mixed Format",
      text: `Patient: Garcia, Maria
DOB: 05/20/1978  Gender: F
MRN: MRN-GAR-2024

Address:
555 Palm Street
Apt 10B
Miami, FL 33125

Phone: (305) 555-9876
Email: maria.garcia@email.com
SSN: 222-33-4444

Insurance Company:
Blue Cross Blue Shield
Plan Name: Select Health
Policy Number: BCBS-456789
Group Number: GRP-ABCDE
Policy Holder Name
Maria Garcia
(Relationship: Self)`
    },
    webForm: {
      name: "Web Form Artifacts", 
      text: `<div id="patient-info">
First Name: <span class="value">David</span>
Last Name: <span class="value">Johnson</span>
Date of Birth: <span class="value">12/25/1965</span>
Gender: <span class="value">Male</span>
</div>

Address: 321 Oak Avenue, Suite 200, Orlando, FL 32801
Phone: (407) 555-1234 | Email: djohnson@email.com
MRN: ORD-2024-567 | SSN: 333-44-5555

<div class="insurance-section">
<h3>Primary Insurance</h3>
<ul>
<li>Company: Cigna</li>
<li>Plan: HMO Standard</li>
<li>Policy #: CIG-987654</li>
<li>Group #: GRP-XYZ123</li>
</ul>
Policy Holder: David Johnson (Self, DOB 12/25/1965)
</div>`
    },
    allCaps: {
      name: "All Caps Format",
      text: `PATIENT NAME: WILLIAMS, ROBERT
DATE OF BIRTH: 07/04/1960
SEX: MALE
MEDICAL RECORD NUMBER: MRN-WILL-789
SOCIAL SECURITY NUMBER: 444-55-6666

PATIENT ADDRESS:
999 FIRST STREET
JACKSONVILLE, FL 32202

CONTACT INFORMATION:
PHONE: (904) 555-7890
EMAIL: RWILLIAMS@EMAIL.COM

PRIMARY INSURANCE: HUMANA GOLD PLUS
POLICY NUMBER: HUM-135790
GROUP NUMBER: GRP-24680
SUBSCRIBER: WILLIAMS, ROBERT
RELATIONSHIP: SELF`
    },
    sloppy: {
      name: "Sloppy Copy/Paste",
      text: `   First Name    :    Jennifer   
  Last Name:Brown     
DOB   01/30/1985     Gender    Female

   Address Line 1:    456 Elm Court    
City :    Naples       State: FL    ZIP:   34102
  
Phone    :  (239) 555 - 4567       
    Email:    jbrown @ example . com
MRN    :     NAP2024999     SSN:    555-66-7777

Insurance:       Anthem BCBS    
  Plan   :   PPO Gold      
Policy #    :     ANT-246810    Group:    GRP-13579    
   Policy Holder:    Jennifer Brown      Relationship    :    Self`
    },
    partial: {
      name: "Partial/Incomplete",
      text: `Name: Anderson, Thomas
DOB: 11/11/1990
Gender: M

123 Matrix Blvd
Zion City, CA 90210

Insurance: RedPill HMO
Policy: RP-999888`
    }
  };

  const loadExampleText = (variation: keyof typeof exampleVariations) => {
    setEmrText(exampleVariations[variation].text);
  };

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
      const lines = emrText.split('\n');
      const patientInfo: any = {};
      const insuranceInfo: any = {};
      
      // Track which fields we've found to avoid overwriting with less specific patterns
      const foundFields = new Set<string>();
      
      // Common patterns that support both colon and space formats
      const patterns = {
        // Name patterns - handle LastName, FirstName format
        name: [
          /^name:?\s*([^,]+),\s*(.+)/i,  // "Name: LastName, FirstName" or "Name LastName, FirstName"
          /^patient:?\s*([^,]+),\s*(.+)/i,
          /^patient\s+name:?\s*([^,]+),\s*(.+)/i,
        ],
        // Single name patterns (fallback)
        singleName: [
          /^name:?\s*(.+)/i,
          /^patient:?\s*(.+)/i,
          /^patient\s+name:?\s*(.+)/i,
        ],
        dob: [
          /^dob:?\s*(.+)/i,
          /^date\s+of\s+birth:?\s*(.+)/i,
          /^birth\s+date:?\s*(.+)/i,
          /^birthdate:?\s*(.+)/i
        ],
        sex: [
          /^sex:?\s*(.+)/i,
          /^gender:?\s*(.+)/i
        ],
        mrn: [
          /^mrn:?\s*(.+)/i,
          /^medical\s+record\s+number:?\s*(.+)/i,
          /^medical\s+record:?\s*(.+)/i,
          /^record\s+#:?\s*(.+)/i
        ],
        phone: [
          /^phone:?\s*(.+)/i,
          /^telephone:?\s*(.+)/i,
          /^tel:?\s*(.+)/i,
          /^mobile:?\s*(.+)/i
        ],
        email: [
          /^email:?\s*(.+)/i,
          /^e-mail:?\s*(.+)/i
        ],
        ssn: [
          /^ssn:?\s*(.+)/i,
          /^social\s+security\s+number:?\s*(.+)/i,
          /^social\s+security:?\s*(.+)/i
        ],
        // Insurance patterns
        insurance: [
          /^primary\s+insurance:?\s*(.+)/i,
          /^insurance:?\s*(.+)/i,
          /^insurance\s+company:?\s*(.+)/i,
          /^insurer:?\s*(.+)/i
        ],
        policy: [
          /^policy\s+#:?\s*(.+)/i,
          /^policy\s+number:?\s*(.+)/i,
          /^policy:?\s*(.+)/i,
          /^member\s+id:?\s*(.+)/i
        ],
        group: [
          /^group\s+#:?\s*(.+)/i,
          /^group\s+number:?\s*(.+)/i,
          /^group:?\s*(.+)/i
        ],
        policyHolder: [
          /^policy\s+holder:?\s*(.+)/i,
          /^subscriber:?\s*(.+)/i,
          /^subscriber\s+name:?\s*(.+)/i
        ],
        relationship: [
          /^relationship\s+to\s+patient:?\s*(.+)/i,
          /^relationship:?\s*(.+)/i,
          /^relation:?\s*(.+)/i
        ]
      };

      // Special handling for "Field\nValue" format (common in EMR)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Check if this line is a field label, and next line is the value
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        
        // Handle HTML artifacts like <span class="value">David</span>
        const htmlValueMatch = line.match(/<span[^>]*>([^<]+)<\/span>/);
        if (htmlValueMatch) {
          const cleanLine = line.replace(/<[^>]+>/g, '').trim();
          if (cleanLine.toLowerCase().includes('first name') && !foundFields.has('firstName')) {
            patientInfo.firstName = htmlValueMatch[1];
            foundFields.add('firstName');
            continue;
          } else if (cleanLine.toLowerCase().includes('last name') && !foundFields.has('lastName')) {
            patientInfo.lastName = htmlValueMatch[1];
            foundFields.add('lastName');
            continue;
          } else if (cleanLine.toLowerCase().includes('date of birth') && !foundFields.has('dateOfBirth')) {
            patientInfo.dateOfBirth = formatDate(htmlValueMatch[1]);
            foundFields.add('dateOfBirth');
            continue;
          } else if (cleanLine.toLowerCase().includes('gender') && !foundFields.has('gender')) {
            patientInfo.gender = normalizeGender(htmlValueMatch[1]);
            foundFields.add('gender');
            continue;
          }
        }
        
        // Handle <li>Field: Value</li> format
        const liMatch = line.match(/<li>([^:]+):\s*([^<]+)<\/li>/);
        if (liMatch) {
          const field = liMatch[1].toLowerCase();
          const value = liMatch[2].trim();
          if (field.includes('company') && !insuranceInfo.insurerName) {
            insuranceInfo.insurerName = value;
          } else if (field.includes('plan') && !insuranceInfo.planName) {
            insuranceInfo.planName = value;
          } else if (field.includes('policy #') && !insuranceInfo.policyNumber) {
            insuranceInfo.policyNumber = value;
          } else if (field.includes('group #') && !insuranceInfo.groupNumber) {
            insuranceInfo.groupNumber = value;
          }
          continue;
        }
        
        // Handle table format with multiple spaces between field and value
        const tableMatch = line.match(/^([A-Za-z\s]+?)\s{2,}(.+)$/);
        if (tableMatch) {
          const field = tableMatch[1].trim().toLowerCase();
          const value = tableMatch[2].trim();
          
          if (field === 'first name' && !foundFields.has('firstName')) {
            patientInfo.firstName = value;
            foundFields.add('firstName');
            continue;
          } else if (field === 'last name' && !foundFields.has('lastName')) {
            patientInfo.lastName = value;
            foundFields.add('lastName');
            continue;
          } else if ((field === 'date of birth' || field === 'dob') && !foundFields.has('dateOfBirth')) {
            patientInfo.dateOfBirth = formatDate(value);
            foundFields.add('dateOfBirth');
            continue;
          } else if (field === 'gender' && !foundFields.has('gender')) {
            patientInfo.gender = normalizeGender(value);
            foundFields.add('gender');
            continue;
          } else if ((field === 'mrn' || field === 'medical record number') && !foundFields.has('mrn')) {
            patientInfo.mrn = value;
            foundFields.add('mrn');
            continue;
          } else if ((field === 'ssn' || field === 'social security number') && !foundFields.has('ssn')) {
            patientInfo.ssn = formatSSN(value);
            foundFields.add('ssn');
            continue;
          } else if (field === 'phone' && !foundFields.has('phone')) {
            patientInfo.phone = value;
            foundFields.add('phone');
            continue;
          } else if (field === 'email' && !foundFields.has('email')) {
            patientInfo.email = value;
            foundFields.add('email');
            continue;
          } else if (field === 'city' && !foundFields.has('city')) {
            patientInfo.city = value;
            foundFields.add('city');
            continue;
          } else if (field === 'state' && !foundFields.has('state')) {
            patientInfo.state = value;
            foundFields.add('state');
            continue;
          } else if ((field === 'zip' || field === 'zip code') && !foundFields.has('zipCode')) {
            patientInfo.zipCode = value;
            foundFields.add('zipCode');
            continue;
          } else if (field === 'address' && !foundFields.has('address')) {
            patientInfo.address = value;
            foundFields.add('address');
            continue;
          } else if ((field === 'primary insurer' || field === 'insurance company') && !insuranceInfo.insurerName) {
            insuranceInfo.insurerName = value;
            continue;
          } else if (field === 'plan' && !insuranceInfo.planName) {
            insuranceInfo.planName = value;
            continue;
          } else if (field === 'policy number' && !insuranceInfo.policyNumber) {
            insuranceInfo.policyNumber = value;
            continue;
          } else if (field === 'group number' && !insuranceInfo.groupNumber) {
            insuranceInfo.groupNumber = value;
            continue;
          } else if (field === 'policy holder' && !insuranceInfo.policyHolderName) {
            insuranceInfo.policyHolderName = value;
            continue;
          } else if (field === 'relationship' && !insuranceInfo.relationship) {
            insuranceInfo.relationship = value;
            continue;
          }
        }
        
        // First Name (field on one line, value on next)
        if (line.toLowerCase() === 'first name' && nextLine && !foundFields.has('firstName')) {
          patientInfo.firstName = nextLine;
          foundFields.add('firstName');
          i++; // Skip the value line
          continue;
        }
        
        // Last Name (field on one line, value on next)
        if (line.toLowerCase() === 'last name' && nextLine && !foundFields.has('lastName')) {
          patientInfo.lastName = nextLine;
          foundFields.add('lastName');
          i++; // Skip the value line
          continue;
        }
        
        // Date of Birth (field on one line, value on next)
        if ((line.toLowerCase() === 'date of birth' || line.toLowerCase() === 'dob') && nextLine && !patientInfo.dateOfBirth) {
          patientInfo.dateOfBirth = formatDate(nextLine);
          i++; // Skip the value line
          continue;
        }
        
        // Gender (field on one line, value on next)
        if ((line.toLowerCase() === 'gender' || line.toLowerCase() === 'sex') && nextLine && !patientInfo.gender) {
          patientInfo.gender = normalizeGender(nextLine);
          i++; // Skip the value line
          continue;
        }

        // MRN (field on one line, value on next)
        if ((line.toLowerCase().includes('medical record number') || line.toLowerCase() === 'mrn') && nextLine && !patientInfo.mrn) {
          patientInfo.mrn = nextLine;
          i++; // Skip the value line
          continue;
        }

        // SSN (field on one line, value on next)
        if ((line.toLowerCase().includes('social security number') || line.toLowerCase() === 'ssn') && nextLine && !patientInfo.ssn) {
          patientInfo.ssn = formatSSN(nextLine);
          i++; // Skip the value line
          continue;
        }

        // Phone (field on one line, value on next)
        if (line.toLowerCase() === 'phone number' && nextLine && !patientInfo.phone) {
          patientInfo.phone = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Email (field on one line, value on next)
        if (line.toLowerCase() === 'email' && nextLine && !patientInfo.email) {
          patientInfo.email = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Insurance Company (field on one line, value on next)
        if (line.toLowerCase() === 'insurance company' && nextLine && !insuranceInfo.insurerName) {
          insuranceInfo.insurerName = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Plan Name (field on one line, value on next)
        if (line.toLowerCase() === 'plan name' && nextLine && !insuranceInfo.planName) {
          insuranceInfo.planName = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Policy Number (field on one line, value on next)
        if (line.toLowerCase() === 'policy number' && nextLine && !insuranceInfo.policyNumber) {
          insuranceInfo.policyNumber = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Group Number (field on one line, value on next)
        if (line.toLowerCase() === 'group number' && nextLine && !insuranceInfo.groupNumber) {
          insuranceInfo.groupNumber = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Policy Holder Name (field on one line, value on next)
        if (line.toLowerCase() === 'policy holder name' && nextLine && !insuranceInfo.policyHolderName) {
          insuranceInfo.policyHolderName = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Relationship to Patient (field on one line, value on next)
        if (line.toLowerCase() === 'relationship to patient' && nextLine && !insuranceInfo.relationship) {
          insuranceInfo.relationship = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Policy Holder Date of Birth (field on one line, value on next)
        if (line.toLowerCase() === 'policy holder date of birth' && nextLine) {
          insuranceInfo.policyHolderDateOfBirth = formatDate(nextLine);
          i++; // Skip the value line
          continue;
        }

        // Address handling - special case for multi-line
        if (line.toLowerCase() === 'address line 1' && nextLine) {
          patientInfo.address = nextLine;
          // Check for Address Line 2
          if (i + 2 < lines.length && lines[i + 2].toLowerCase() === 'address line 2' && i + 3 < lines.length && lines[i + 3].trim()) {
            patientInfo.address += ', ' + lines[i + 3].trim();
            i += 3; // Skip all address lines
          } else {
            i++; // Just skip Address Line 1 value
          }
          continue;
        }

        // City (field on one line, value on next)
        if (line.toLowerCase() === 'city' && nextLine && !patientInfo.city) {
          patientInfo.city = nextLine;
          i++; // Skip the value line
          continue;
        }

        // State (field on one line, value on next)
        if (line.toLowerCase() === 'state' && nextLine && !patientInfo.state) {
          patientInfo.state = nextLine;
          i++; // Skip the value line
          continue;
        }

        // ZIP Code (field on one line, value on next)
        if ((line.toLowerCase() === 'zip code' || line.toLowerCase() === 'zip') && nextLine && !patientInfo.zipCode) {
          patientInfo.zipCode = nextLine;
          i++; // Skip the value line
          continue;
        }

        // Check for name patterns (LastName, FirstName format) - for other formats
        let matched = false;
        if (!foundFields.has('firstName') || !foundFields.has('lastName')) {
          for (const pattern of patterns.name) {
            const match = line.match(pattern);
            if (match) {
              if (!foundFields.has('lastName')) {
                patientInfo.lastName = match[1].trim();
                foundFields.add('lastName');
              }
              if (!foundFields.has('firstName')) {
                patientInfo.firstName = match[2].trim();
                foundFields.add('firstName');
              }
              matched = true;
              break;
            }
          }

          // If no LastName, FirstName format found, try single name
          if (!matched && (!foundFields.has('firstName') || !foundFields.has('lastName'))) {
            for (const pattern of patterns.singleName) {
              const match = line.match(pattern);
              if (match) {
                const fullName = match[1].trim();
                // Try to split on space if no comma
                if (fullName.includes(',')) {
                  const parts = fullName.split(',');
                  if (!foundFields.has('lastName')) {
                    patientInfo.lastName = parts[0].trim();
                    foundFields.add('lastName');
                  }
                  if (!foundFields.has('firstName')) {
                    patientInfo.firstName = parts[1]?.trim() || '';
                    foundFields.add('firstName');
                  }
                } else {
                  const parts = fullName.split(' ');
                  if (!foundFields.has('firstName')) {
                    patientInfo.firstName = parts[0];
                    foundFields.add('firstName');
                  }
                  if (!foundFields.has('lastName')) {
                    patientInfo.lastName = parts.slice(1).join(' ');
                    foundFields.add('lastName');
                  }
                }
                matched = true;
                break;
              }
            }
          }
        }

        // Check DOB patterns
        for (const pattern of patterns.dob) {
          const match = line.match(pattern);
          if (match) {
            patientInfo.dateOfBirth = formatDate(match[1].trim());
            matched = true;
            break;
          }
        }

        // Check sex/gender patterns
        for (const pattern of patterns.sex) {
          const match = line.match(pattern);
          if (match) {
            patientInfo.gender = normalizeGender(match[1].trim());
            matched = true;
            break;
          }
        }

        // Check MRN patterns
        for (const pattern of patterns.mrn) {
          const match = line.match(pattern);
          if (match) {
            patientInfo.mrn = match[1].trim();
            matched = true;
            break;
          }
        }

        // Check phone patterns
        for (const pattern of patterns.phone) {
          const match = line.match(pattern);
          if (match) {
            patientInfo.phone = match[1].trim();
            matched = true;
            break;
          }
        }

        // Check email patterns
        for (const pattern of patterns.email) {
          const match = line.match(pattern);
          if (match) {
            patientInfo.email = match[1].trim();
            matched = true;
            break;
          }
        }

        // Check SSN patterns
        for (const pattern of patterns.ssn) {
          const match = line.match(pattern);
          if (match) {
            patientInfo.ssn = formatSSN(match[1].trim());
            matched = true;
            break;
          }
        }

        // Check for address line
        if (line.match(/^address:?\s*/i)) {
          const addressMatch = line.match(/^address:?\s*(.+)/i);
          if (addressMatch) {
            const fullAddress = addressMatch[1].trim();
            
            // Try to extract city, state, zip from address
            const cityStateZipMatch = fullAddress.match(/,\s*([^,]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
            if (cityStateZipMatch) {
              patientInfo.city = cityStateZipMatch[1].trim();
              patientInfo.state = cityStateZipMatch[2];
              patientInfo.zipCode = cityStateZipMatch[3];
              
              // Extract just the street address part
              const streetAddress = fullAddress.substring(0, fullAddress.lastIndexOf(cityStateZipMatch[0]));
              patientInfo.address = streetAddress.replace(/,$/, '').trim();
            } else {
              // If we can't parse city/state/zip, just use the whole thing
              patientInfo.address = fullAddress;
            }
            matched = true;
          }
        }

        // Insurance patterns
        for (const pattern of patterns.insurance) {
          const match = line.match(pattern);
          if (match) {
            insuranceInfo.insurerName = match[1].trim();
            matched = true;
            break;
          }
        }

        for (const pattern of patterns.policy) {
          const match = line.match(pattern);
          if (match) {
            insuranceInfo.policyNumber = match[1].trim();
            matched = true;
            break;
          }
        }

        for (const pattern of patterns.group) {
          const match = line.match(pattern);
          if (match) {
            insuranceInfo.groupNumber = match[1].trim();
            matched = true;
            break;
          }
        }

        for (const pattern of patterns.policyHolder) {
          const match = line.match(pattern);
          if (match) {
            insuranceInfo.policyHolderName = match[1].trim();
            matched = true;
            break;
          }
        }

        for (const pattern of patterns.relationship) {
          const match = line.match(pattern);
          if (match) {
            insuranceInfo.relationship = match[1].trim();
            matched = true;
            break;
          }
        }
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
    // Try different date formats
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
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Load example:</span>
            {Object.entries(exampleVariations).map(([key, variation]) => (
              <Button
                key={key}
                variant="link"
                className="h-auto p-0 text-xs text-blue-500"
                onClick={() => loadExampleText(key as keyof typeof exampleVariations)}
              >
                {variation.name}
              </Button>
            ))}
          </div>
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