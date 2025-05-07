interface OrderProgressIndicatorProps {
  currentStep: number;
}

const OrderProgressIndicator = ({ currentStep }: OrderProgressIndicatorProps) => {
  return (
    <div className="flex items-center space-x-1">
      <div 
        className={`h-2 w-2 rounded-full transition-colors duration-200 ${
          currentStep >= 1 ? "bg-gray-900" : "bg-gray-200"
        }`}
      />
      <div 
        className={`h-2 w-2 rounded-full transition-colors duration-200 ${
          currentStep >= 2 ? "bg-gray-900" : "bg-gray-200"
        }`}
      />
      <div 
        className={`h-2 w-2 rounded-full transition-colors duration-200 ${
          currentStep >= 3 ? "bg-gray-900" : "bg-gray-200"
        }`}
      />
    </div>
  );
};

export default OrderProgressIndicator;