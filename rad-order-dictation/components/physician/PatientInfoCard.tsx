import { AlertCircle, Calendar, User, UserCog, Edit, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Patient } from "@/lib/types";

interface PatientInfoCardProps {
  patient: Patient;
  onEditPatient?: () => void;
}

/**
 * A compact card showing patient information with a mobile-friendly layout
 */
const PatientInfoCard = ({ patient, onEditPatient }: PatientInfoCardProps) => {
  // Check if this is a temporary patient
  const isTemporaryPatient = patient.id === 0;
  
  // Check if patient has real information (not the default "Unknown Patient")
  const hasRealInfo = patient.name !== "Unknown Patient" && patient.dob !== "Unknown";
  
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
              {!hasRealInfo && (
                <div className="ml-2 flex items-center text-amber-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
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
                <span>{patient.pidn || patient.mrn || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side: Action button (always visible for temporary patients) */}
        {isTemporaryPatient && onEditPatient && (
          <Button 
            size="sm" 
            variant="outline"
            className="border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-900 text-xs px-2 py-1 h-7 ml-2 flex-shrink-0"
            onClick={onEditPatient}
          >
            {hasRealInfo ? (
              <>
                <Edit className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Edit</span> Patient
              </>
            ) : (
              <>
                <UserCog className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Add</span> Patient
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PatientInfoCard;