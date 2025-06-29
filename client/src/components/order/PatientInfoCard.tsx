import { User, Calendar, Info } from "lucide-react";
import { Patient } from "@/lib/types";

interface PatientInfoCardProps {
  patient: Patient;
  onEditPatient?: () => void;
}

export function PatientInfoCard({ patient, onEditPatient }: PatientInfoCardProps) {
  // Check if this is a temporary patient with ID 0
  const isTemporaryPatient = patient.id === 0;
  
  // Check if patient has real information or is still at the default values
  const isNoPatientIdentified = patient.name === "No Patient Identified";
  const hasRealInfo = !isNoPatientIdentified && patient.dob !== "";

  // Apply yellow background to the entire card when it's a temporary patient
  const cardBgClass = isTemporaryPatient ? "bg-amber-50" : "bg-white";

  return (
    <div className={`${cardBgClass} border border-gray-200 rounded-lg overflow-hidden`}>
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        {/* Left side: Patient info */}
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full flex-shrink-0">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{patient.name}</h2>
              {isNoPatientIdentified && (
                <>
                  <div className="ml-2 flex items-center text-amber-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                      <path d="M12 9v4"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </div>
                  <span className="ml-2 text-xs font-medium text-amber-600">Required</span>
                </>
              )}
            </div>
            
            {isNoPatientIdentified ? (
              <div className="text-xs text-gray-600 mt-0.5">
                Please identify patient
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-600 mt-0.5 sm:space-x-3 space-y-1 sm:space-y-0">
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span>{patient.dob}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium text-gray-500 mr-1">PIDN:</span>
                  <span className="truncate">{patient.pidn || patient.mrn}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side: Action button (always visible for temporary patients) */}
        {isTemporaryPatient && onEditPatient && (
          <button 
            className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-900 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 h-8 sm:h-auto ml-2 flex-shrink-0 rounded border flex items-center min-w-[100px] sm:min-w-0"
            onClick={onEditPatient}
          >
            {hasRealInfo ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1 hidden sm:block">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                </svg>
                <span className="whitespace-nowrap">Edit Patient</span> 
              </>
            ) : (
              <span className="whitespace-nowrap">Identify Patient</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default PatientInfoCard;