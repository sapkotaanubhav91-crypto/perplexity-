import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Thinking..." }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-base">{message}</p>
    </div>
  );
};

export default LoadingSpinner;