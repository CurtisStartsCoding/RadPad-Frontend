import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/lib/types";

interface PatientInfoCardProps {
  patient: Patient;
}

const PatientInfoCard = ({ patient }: PatientInfoCardProps) => {
  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
            <span className="text-xs text-gray-500">Name:</span>
            <span className="ml-2 font-medium text-gray-900">{patient.name}</span>
          </div>
          
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
            <span className="text-xs text-gray-500">DOB:</span>
            <span className="ml-2 font-medium text-gray-900">{patient.dob}</span>
          </div>
          
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
            <span className="text-xs text-gray-500">Age:</span>
            <span className="ml-2 font-medium text-gray-900">{calculateAge(patient.dob)}</span>
          </div>
          
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
            <span className="text-xs text-gray-500">MRN:</span>
            <span className="ml-2 font-medium text-gray-900">{patient.mrn}</span>
          </div>
          
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md">
            <span className="text-xs text-gray-500">Gender:</span>
            <span className="ml-2 font-medium text-gray-900">{patient.gender}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
