import { Button } from "@/components/ui/button";
import { User, Plus, AlertTriangle, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    // Use the patient MRN or ID to generate a consistent PIDN
    const base = patient.mrn || patient.id.toString().padStart(5, '0');
    return `${base.slice(0, 5)}3903${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

  // Check if this has real patient info or is still "Unknown Patient"
  const isUnknownPatient = patient.name === "Unknown Patient";
  
  // Determine if patient has real information or is still at the default values
  const hasRealInfo = !isUnknownPatient && patient.dob !== "Unknown";

  return (
    <div className={`flex items-center justify-between py-3 px-4 ${patient.isTemporary ? 'bg-amber-50' : 'bg-white'} border ${patient.isTemporary ? 'border-amber-100' : 'border-gray-200'} rounded-md`}>
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full flex-shrink-0 mr-3">
          <User className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <div className="flex items-center">
            <h2 className="text-sm font-semibold text-gray-900">{patient.name}</h2>
            {patient.isTemporary && (
              <div className="ml-2 flex items-center text-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">Temporary</span>
              </div>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-600 mt-0.5 space-x-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3 w-3 text-gray-500 flex-shrink-0">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                <line x1="16" x2="16" y1="2" y2="6"></line>
                <line x1="8" x2="8" y1="2" y2="6"></line>
                <line x1="3" x2="21" y1="10" y2="10"></line>
              </svg>
              <span>{patient.dob}</span>
            </div>
            
            <div className="flex items-center">
              <span className="font-medium text-gray-500 mr-1">PIDN:</span>
              <span>{generatePIDN()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {patient.isTemporary && onEditPatient && (
        <Button 
          variant="outline" 
          size="sm"
          className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-900 text-xs px-2 py-1 h-7 flex-shrink-0"
          onClick={onEditPatient}
        >
          {hasRealInfo ? (
            <>
              <Edit className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Edit</span> Patient
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Add</span> Patient
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default PatientInfoCard;