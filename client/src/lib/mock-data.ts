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

// Mock data for the UI mockup
export const recentOrders: Order[] = [
  {
    id: 1,
    patient: { id: 101, name: 'Sarah Johnson', dob: '05/12/1985', mrn: '5647823', gender: 'female' },
    modality: 'MRI Knee',
    createdAt: 'Today at 10:24 AM',
    status: 'pending_admin',
    radiologyGroup: 'Northwest Imaging'
  },
  {
    id: 2,
    patient: { id: 102, name: 'Michael Chen', dob: '09/03/1978', mrn: '7384955', gender: 'male' },
    modality: 'CT Abdomen',
    createdAt: 'Yesterday at 3:45 PM',
    status: 'pending_radiology',
    radiologyGroup: 'City Medical Imaging'
  },
  {
    id: 3,
    patient: { id: 103, name: 'Emily Williams', dob: '11/22/1990', mrn: '1239873', gender: 'female' },
    modality: 'X-ray Chest',
    createdAt: 'Aug 10, 2023',
    status: 'completed',
    radiologyGroup: 'Northwest Imaging'
  },
  {
    id: 4,
    patient: { id: 104, name: 'Robert Davis', dob: '02/18/1965', mrn: '4561287', gender: 'male' },
    modality: 'Ultrasound Liver',
    createdAt: 'Aug 8, 2023',
    status: 'completed',
    radiologyGroup: 'City Medical Imaging'
  },
  {
    id: 5,
    patient: { id: 105, name: 'James Wilson', dob: '07/29/1982', mrn: '9081726', gender: 'male' },
    modality: 'MRI Brain',
    createdAt: 'Aug 5, 2023',
    status: 'scheduled',
    radiologyGroup: 'Elite Radiology'
  }
];

export const allOrders: Order[] = [
  ...recentOrders,
  {
    id: 6,
    patient: { id: 106, name: 'Jessica Brown', dob: '04/15/1975', mrn: '3451289', gender: 'female' },
    modality: 'CT Head',
    createdAt: 'Aug 2, 2023',
    status: 'completed',
    radiologyGroup: 'Northwest Imaging'
  },
  {
    id: 7,
    patient: { id: 107, name: 'David Garcia', dob: '12/03/1970', mrn: '6784512', gender: 'male' },
    modality: 'X-ray Lumbar Spine',
    createdAt: 'July 28, 2023',
    status: 'cancelled',
    radiologyGroup: 'City Medical Imaging'
  }
];

export const users: User[] = [
  { id: 1, name: 'Dr. John Doe', email: 'john.doe@example.com', role: 'Physician', status: 'active', locations: ['Main Office', 'North Branch'] },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Admin Staff', status: 'active', locations: ['Main Office'] },
  { id: 3, name: 'Dr. Emily Clark', email: 'emily.clark@example.com', role: 'Physician', status: 'active', locations: ['South Branch'] },
  { id: 4, name: 'Michael Johnson', email: 'michael.j@example.com', role: 'Admin Referring', status: 'active', locations: ['Main Office', 'North Branch', 'South Branch'] },
  { id: 5, name: 'Dr. Robert Wilson', email: 'robert.w@example.com', role: 'Physician', status: 'invited' }
];

export const locations: Location[] = [
  { id: 1, name: 'Main Office', address: '123 Medical Dr, Suite 100, Seattle, WA 98101', status: 'active', isPrimary: true },
  { id: 2, name: 'North Branch', address: '456 Health Ave, Bellevue, WA 98004', status: 'active', isPrimary: false },
  { id: 3, name: 'South Branch', address: '789 Care Blvd, Renton, WA 98057', status: 'active', isPrimary: false },
  { id: 4, name: 'East Clinic', address: '321 Wellness Pkwy, Issaquah, WA 98029', status: 'inactive', isPrimary: false }
];

export const connections: Connection[] = [
  { id: 1, name: 'Northwest Imaging', type: 'radiology', status: 'active', connectedAt: '2023-01-15' },
  { id: 2, name: 'City Medical Imaging', type: 'radiology', status: 'active', connectedAt: '2023-02-20' },
  { id: 3, name: 'Elite Radiology', type: 'radiology', status: 'active', connectedAt: '2023-03-10' },
  { id: 4, name: 'Metro Diagnostics', type: 'radiology', status: 'pending' },
  { id: 5, name: 'Valley Medical Center', type: 'referring', status: 'pending' }
];

export const temporaryPatient: Patient = {
  id: 0,
  name: 'Unknown Patient',
  dob: 'Unknown',
  gender: 'unknown',
  mrn: `${Math.floor(1000000000000 + Math.random() * 9000000000000).toString()}`,
  isTemporary: true
};
