// Custom types for the application

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'physician' | 'medical_assistant' | 'scheduler' | 'radiologist';
  organizationId: number | null;
  organizationType?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  photoUrl?: string;
  isDeveloperMode?: boolean;
}

// Patient types
export interface Patient {
  id: number;
  name: string;
  dob: string;
  mrn?: string;
  pidn?: string;  // Patient Identification Number
  radiologyGroupId: number | null;
  referringPracticeId: number | null;
  externalPatientId: string | null;
  demographics?: string;
  encryptedData: string;
  createdAt: Date;
  updatedAt: Date;
  gender: string;
}

// Medical code interfaces
export interface MedicalCode {
  code: string;
  description: string;
}

// Processed dictation result
export interface ProcessedDictation {
  validationStatus: 'valid' | 'invalid' | 'warning';
  feedback: string;
  patientContext?: any;
  cptCode?: string;
  icd10Code?: string;
  clinicalInformation?: string;
  orderNotes?: string;
  procedureDescription?: string;
  clinicalHistory?: string;
  overridden?: boolean;
  overrideJustification?: string;
  confidence?: number;
  modality?: string;
  procedureType?: string;
  priority?: string;
  bodyPart?: string;
  complianceScore?: number;
  diagnosisCodes?: MedicalCode[];
  procedureCodes?: MedicalCode[];
  keywords?: string[];
  orderId?: number;
}

// Organization types
export interface Organization {
  id: number;
  name: string;
  type: 'referringPractice' | 'radiologyGroup' | 'healthSystem';
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface Order {
  id: number;
  orderNumber: string;
  patientId: number;
  patientPidn?: string;
  patientMrn?: string;
  referringPhysicianId: number;
  referringOrganizationId?: number;
  radiologyOrganizationId?: number;
  radiologyGroupId: number | null;
  createdByUserId?: number;
  updatedByUserId?: number;
  signedByUserId?: number;
  status: 'draft' | 'submitted' | 'approved' | 'completed' | 'cancelled' | 'pending_patient_info' | 'complete' | 'scheduled' | 'performed' | 'delivered' | 'rejected';
  priority: 'routine' | 'urgent' | 'stat' | 'expedited';
  icd10Code: string | null;
  icd10Codes?: string;
  cptCode: string | null;
  clinicalInformation: string | null;
  orderNotes: string | null;
  procedureDescription: string | null;
  scheduledDate: Date | null;
  submittedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isContrastIndicated?: boolean;
  
  // Database fields from schema
  cpt_code_description?: string;
  icd10_code_descriptions?: string;
  signatureDate?: Date;
  authorizationNumber?: string;
  
  // UI display fields
  patientName?: string;
  patientMRN?: string;
  patientDob?: string;
  patientDOB?: string;
  patientGender?: string;
  modality?: string;
  bodyPart?: string;
  anatomy?: string;
  laterality?: string;
  procedureCode?: string;
  diagnosisCodes?: string[];
  originalDictation?: string;
  dictation?: string;
  clinicalIndication?: string;
  
  // Fields for display purposes - populated by the client
  referringPhysicianName?: string;
  referringOrganizationName?: string;
  referringPhysicianContact?: string;
  radiologyOrganizationName?: string;
  createdByUserName?: string;
  completedDate?: Date;
  
  // Client-side convenience properties
  cptDescription?: string;
  
  // Relations (populated by backend/join queries)
  patient?: Patient;
  referringPhysician?: User;
  referringOrganization?: Organization;
}