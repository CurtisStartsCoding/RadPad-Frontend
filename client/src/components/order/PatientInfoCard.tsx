import { User, Calendar, Info } from "lucide-react";

interface Patient {
  id: number;
  name: string;
  dob: string;
  mrn: string;
  pidn?: string;
  isTemporary?: boolean;
}

interface PatientInfoCardProps {
  patient: Patient;
  onEditPatient?: () => void;
}

export function PatientInfoCard({ patient, onEditPatient }: PatientInfoCardProps) {
  // Check if this is a temporary patient with ID 0 or isTemporary flag
  const isTemporaryPatient = patient.id === 0 || patient.isTemporary;
  
  // Check if patient has real information or is still at the default values
  const isUnknownPatient = patient.name === "Unknown Patient";
  const hasRealInfo = !isUnknownPatient && patient.dob !== "Unknown";

  // Apply yellow background to the entire card when it's a temporary patient
  const cardBgClass = isTemporaryPatient ? "bg-amber-50" : "bg-white";

  return (
    <div className={`${cardBgClass} border border-gray-200 rounded-lg overflow-hidden`}>
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Left side: Patient info */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full flex-shrink-0">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          
          <div>
            <div className="flex items-center">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{patient.name}</h2>
              {isUnknownPatient && (
                <div className="ml-2 flex items-center text-amber-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <path d="M12 9v4"></path>
                    <path d="M12 17h.01"></path>
                  </svg>
                  <span className="text-xs">Temporary</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-600 mt-0.5 space-x-3">
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3 text-gray-500 flex-shrink-0" />
                <span>{patient.dob}</span>
              </div>
              
              <div className="flex items-center">
                <span className="font-medium text-gray-500 mr-1">PIDN:</span>
                <span>{patient.pidn || patient.mrn}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side: Action button (always visible for temporary patients) */}
        {isTemporaryPatient && onEditPatient && (
          <button 
            className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-900 text-xs px-2 py-1 h-7 ml-2 flex-shrink-0 rounded border flex items-center"
            onClick={onEditPatient}
          >
            {hasRealInfo ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                </svg>
                <span className="hidden sm:inline">Edit</span> Patient
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span className="hidden sm:inline">Add</span> Patient
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default PatientInfoCard;