import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-slate-900">{patient.name}</h3>
            {patient.isTemporary && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                Temporary
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">DOB: {patient.dob} | MRN: {patient.mrn}</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEditPatient}
          className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-light h-8"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit Patient
        </Button>
      </div>
    </div>
  );
}

export default PatientInfoCard;
