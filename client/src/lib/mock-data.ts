// Types
export interface Patient {
  id: number;
  name: string;
  dob: string; // Format: MM/DD/YYYY (age)
  gender?: string; // Making gender optional for backward compatibility with existing data
  mrn: string;
  isTemporary?: boolean;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  policyHolder?: string;
  policyHolderRelation?: string;
  policyHolderDob?: string;
  secondaryProvider?: string;
  secondaryPolicyNumber?: string;
  secondaryGroupNumber?: string;
  authorizationNumber?: string;
}

export interface Diagnosis {
  primaryIcd10?: string;
  primaryDescription?: string;
  secondaryIcd10?: string;
  secondaryDescription?: string;
  cptCode?: string;
  cptDescription?: string;
}

export interface ReferringPhysician {
  name: string;
  npi?: string;
  clinic?: string;
  phone?: string;
  signedDate?: string;
}

export interface Order {
  id: number;
  orderNumber?: string; // Format: ROP-YYMMDD-NN
  patient: Patient;
  modality: string;
  location?: string;
  scheduling?: string;
  priority?: 'Routine' | 'Urgent' | 'STAT';
  clinicalSummary?: string;
  diagnosis?: Diagnosis;
  referringPhysician?: ReferringPhysician;
  instructions?: string;
  insurance?: Insurance;
  createdAt: string;
  status: 'pending_admin' | 'pending_radiology' | 'scheduled' | 'completed' | 'cancelled';
  radiologyGroup: string; // The radiology group receiving the order
  radiologyLocation?: string; // Specific facility/location within the radiology group
  signedAt?: string;
  aucScore?: number;
  validatedOn?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'invited';
  locations?: string[];
}

export interface Location {
  id: number;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  isPrimary: boolean;
}

export interface Connection {
  id: number;
  name: string;
  type: 'radiology' | 'referring';
  status: 'active' | 'pending' | 'rejected';
  connectedAt?: string;
}

// Mock data for the UI mockup - FICTIONAL DATA FOR TESTING ONLY
export const recentOrders: Order[] = [
  {
    id: 1,
    patient: { id: 101, name: 'MOCK_Patient_1', dob: '01/01/1980 (43)', mrn: 'TEST-MRN-00001', gender: 'female' },
    modality: 'MRI Knee',
    createdAt: 'Today at 10:24 AM',
    status: 'pending_admin',
    radiologyGroup: 'MOCK Radiology Group A'
  },
  {
    id: 2,
    patient: { id: 102, name: 'MOCK_Patient_2', dob: '02/02/1982 (41)', mrn: 'TEST-MRN-00002', gender: 'male' },
    modality: 'CT Abdomen',
    createdAt: 'Yesterday at 3:45 PM',
    status: 'pending_radiology',
    radiologyGroup: 'MOCK Radiology Group B'
  },
  {
    id: 3,
    patient: { id: 103, name: 'MOCK_Patient_3', dob: '03/03/1983 (40)', mrn: 'TEST-MRN-00003', gender: 'female' },
    modality: 'X-ray Chest',
    createdAt: 'Jan 10, 2025',
    status: 'completed',
    radiologyGroup: 'MOCK Radiology Group A'
  },
  {
    id: 4,
    patient: { id: 104, name: 'MOCK_Patient_4', dob: '04/04/1984 (39)', mrn: 'TEST-MRN-00004', gender: 'male' },
    modality: 'Ultrasound Liver',
    createdAt: 'Jan 8, 2025',
    status: 'completed',
    radiologyGroup: 'MOCK Radiology Group B'
  },
  {
    id: 5,
    patient: { id: 105, name: 'MOCK_Patient_5', dob: '05/05/1985 (38)', mrn: 'TEST-MRN-00005', gender: 'male' },
    modality: 'MRI Brain',
    createdAt: 'Jan 5, 2025',
    status: 'scheduled',
    radiologyGroup: 'MOCK Radiology Group C'
  }
];

export const allOrders: Order[] = [
  ...recentOrders,
  {
    id: 6,
    patient: { id: 106, name: 'MOCK_Patient_6', dob: '06/06/1986 (37)', mrn: 'TEST-MRN-00006', gender: 'female' },
    modality: 'CT Head',
    createdAt: 'Jan 2, 2025',
    status: 'completed',
    radiologyGroup: 'MOCK Radiology Group A'
  },
  {
    id: 7,
    patient: { id: 107, name: 'MOCK_Patient_7', dob: '07/07/1987 (36)', mrn: 'TEST-MRN-00007', gender: 'male' },
    modality: 'X-ray Lumbar Spine',
    createdAt: 'Dec 28, 2024',
    status: 'cancelled',
    radiologyGroup: 'MOCK Radiology Group B'
  }
];

export const users: User[] = [
  { id: 1, name: 'TEST Dr. Alpha', email: 'test.doctor.1@example.test', role: 'Physician', status: 'active', locations: ['TEST Location A', 'TEST Location B'] },
  { id: 2, name: 'TEST Admin Beta', email: 'test.admin.1@example.test', role: 'Admin Staff', status: 'active', locations: ['TEST Location A'] },
  { id: 3, name: 'TEST Dr. Gamma', email: 'test.doctor.2@example.test', role: 'Physician', status: 'active', locations: ['TEST Location C'] },
  { id: 4, name: 'TEST Admin Delta', email: 'test.admin.2@example.test', role: 'Admin Referring', status: 'active', locations: ['TEST Location A', 'TEST Location B', 'TEST Location C'] },
  { id: 5, name: 'TEST Dr. Epsilon', email: 'test.doctor.3@example.test', role: 'Physician', status: 'invited' }
];

export const locations: Location[] = [
  { id: 1, name: 'TEST Location A', address: '123 Test Street, Suite 100, Testville, TS 12345', status: 'active', isPrimary: true },
  { id: 2, name: 'TEST Location B', address: '456 Mock Avenue, Mocktown, TS 12346', status: 'active', isPrimary: false },
  { id: 3, name: 'TEST Location C', address: '789 Sample Boulevard, Sampleburg, TS 12347', status: 'active', isPrimary: false },
  { id: 4, name: 'TEST Location D', address: '321 Dummy Drive, Dummyville, TS 12348', status: 'inactive', isPrimary: false }
];

export const connections: Connection[] = [
  { id: 1, name: 'MOCK Radiology Group A', type: 'radiology', status: 'active', connectedAt: '2025-01-15' },
  { id: 2, name: 'MOCK Radiology Group B', type: 'radiology', status: 'active', connectedAt: '2025-02-20' },
  { id: 3, name: 'MOCK Radiology Group C', type: 'radiology', status: 'active', connectedAt: '2025-03-10' },
  { id: 4, name: 'MOCK Radiology Group D', type: 'radiology', status: 'pending' },
  { id: 5, name: 'MOCK Referring Center', type: 'referring', status: 'pending' }
];

