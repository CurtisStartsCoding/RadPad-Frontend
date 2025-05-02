import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, FileText, Edit, AlertTriangle } from "lucide-react";

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
  // Format date of birth to display in a more readable format
  const formatDOB = (dob: string) => {
    const date = new Date(dob);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="border border-gray-100">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 h-10 w-10 rounded-full flex items-center justify-center text-slate-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">{patient.name}</h3>
              <div className="flex items-center text-sm text-slate-500 mt-0.5">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{formatDOB(patient.dob)} ({calculateAge(patient.dob)} y.o.)</span>
              </div>
            </div>
          </div>
          
          {onEditPatient && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2" 
              onClick={onEditPatient}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <p className="text-xs font-medium text-slate-500">MRN</p>
              <p className="text-sm font-mono">{patient.mrn}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Patient ID</p>
              <p className="text-sm font-mono">#{patient.id}</p>
            </div>
          </div>
          
          {patient.isTemporary && (
            <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Temporary Record
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PatientInfoCard;