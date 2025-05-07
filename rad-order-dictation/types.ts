// Types for the dictation functionality

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
  feedback: string; // Always provide feedback (not optional)
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
  orderId?: number; // Added to support remote API response
}

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'physician' | 'medical_assistant' | 'scheduler' | 'radiologist';
  organizationId: number | null;
  organizationType?: string; // Added to support remote API
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  photoUrl?: string;
  isDeveloperMode?: boolean;
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
  patientMrn?: string; // Database field alias
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
  cpt_code_description?: string;  // Direct database column
  icd10_code_descriptions?: string;  // Direct database column
  signatureDate?: Date;  // Direct database column from orders table
  authorizationNumber?: string;  // Direct database column from orders table
  
  // UI display fields
  patientName?: string;
  patientMRN?: string; // UI field for display
  patientDob?: string; // Original field from database
  patientDOB?: string; // UI field for display (capitalized)
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
  completedDate?: Date; // Alias for completedAt
  
  // Client-side convenience properties
  cptDescription?: string; // Camel-case alias for cpt_code_description
  
  // Relations (populated by backend/join queries)
  patient?: Patient;  // Related patient object
  referringPhysician?: User;  // Related physician
  referringOrganization?: Organization;  // Related organization
}

// Define the expected shape of the session response
export interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

// Define login response type
export interface LoginResponse {
  success?: boolean;
  user?: User;
  // New API response format
  token?: string;
}

// Define the API user response format
export interface ApiUserResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: number;
  npi: string | null;
  specialty: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Patient suggestion interface
export interface PatientSuggestion {
  name: string;
  dob: string;
  confidence: number;
}