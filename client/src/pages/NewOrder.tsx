import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import PatientInfoCard from "@/components/order/PatientInfoCard";
import DictationForm from "@/components/order/DictationForm";
import { temporaryPatient } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";

const NewOrder = () => {
  // Current order step (purely for visual purposes)
  const [orderStep, setOrderStep] = useState(1);

  // The patient information (default to temporary patient)
  const [patient] = useState(temporaryPatient);

  return (
    <div className="p-6">
      <PageHeader 
        title="New Imaging Order" 
        description="Create and validate a new radiology order" 
      />
      
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center mb-2 sm:mb-0">
            <h1 className="text-lg font-semibold text-gray-900">
              Radiology Order - {patient.name}
            </h1>
            <div className="mt-1 sm:mt-0 sm:ml-4 px-2 py-1 bg-blue-50 rounded-md text-xs text-blue-700 font-medium">
              Step {orderStep} of 3: {orderStep === 1 ? 'Dictation' : orderStep === 2 ? 'Validation' : 'Signature'}
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
            {/* Progress indicators */}
            <div className="flex items-center space-x-1">
              <div className="w-8 h-1.5 rounded-full bg-primary"></div>
              <div className="w-8 h-1.5 rounded-full bg-slate-200"></div>
              <div className="w-8 h-1.5 rounded-full bg-slate-200"></div>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-4">
          {/* Patient information card */}
          <div className="mb-4">
            <PatientInfoCard 
              patient={patient} 
              onEditPatient={() => {}} 
            />
          </div>
          
          {/* Dictation Form */}
          <DictationForm 
            onDictationSubmit={() => {}} 
            onCancel={() => {}}
          />
        </div>
      </Card>
    </div>
  );
};

export default NewOrder;
