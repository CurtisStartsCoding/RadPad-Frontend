import { Button } from "@/components/ui/button";
import { User, Plus } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  dob: string;
  mrn: string;
  isTemporary?: boolean;
}

interface PatientInfoCardProps {
  patient: Patient;
  onEditPatient?: () => void;
}

export function PatientInfoCard({ patient, onEditPatient }: PatientInfoCardProps) {
  // Generate a consistent PIDN for demo purposes
  const generatePIDN = () => {
    // Use the patient ID to generate a consistent PIDN
    const base = patient.id.toString().padStart(5, '0');
    return `${base}3903${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-amber-50 border border-amber-100 rounded-md">
      <div className="flex items-center">
        <div className="text-gray-600 mr-2">
          <User className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center">
            <span className="font-medium text-gray-900">{patient.name}</span>
            {patient.isTemporary && (
              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                Temporary
              </span>
            )}
          </div>
          <div className="flex items-center mt-0.5 text-sm text-gray-500">
            <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Unknown</span>
            <span className="ml-4">PIDN: {generatePIDN()}</span>
          </div>
        </div>
      </div>
      
      {onEditPatient && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-2 bg-white hover:bg-amber-50 border-amber-200 text-amber-800" 
          onClick={onEditPatient}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          AddPatient
        </Button>
      )}
    </div>
  );
}

export default PatientInfoCard;