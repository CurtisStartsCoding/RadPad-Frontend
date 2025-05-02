import { Button } from "@/components/ui/button";
import { User, Plus, Clock, Edit } from "lucide-react";

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
  // Check if this has real patient info or is still "Unknown Patient"
  const isUnknownPatient = patient.name === "Unknown Patient";
  
  // Determine if patient has real information or is still at the default values
  const hasRealInfo = !isUnknownPatient && patient.dob !== "Unknown";

  return (
    <div className="flex items-center justify-between pb-4">
      <div className="flex items-center">
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3">
          <User className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900">{patient.name}</span>
            {patient.isTemporary && (
              <div className="ml-2 flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600">Created {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (M/D)</span>
              </div>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-0.5">
            {isUnknownPatient ? (
              <span>MRN: {patient.mrn.substring(0, 8)}...</span>
            ) : (
              <>
                <span>MRN: {patient.mrn.substring(0, 8)}...</span>
                <span className="mx-2">Patient ID: #8</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {patient.isTemporary && onEditPatient && (
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 text-xs bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
          onClick={onEditPatient}
        >
          {hasRealInfo ? (
            <>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </>
          ) : (
            <>
              {isUnknownPatient && (
                <>
                  <span className="text-amber-500 mr-1">⚠</span>
                  <span>Temporary Reset</span>
                </>
              )}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export default PatientInfoCard;