import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-200 mx-auto"></div>
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-indigo-600 mx-auto absolute top-0 left-0 right-0"></div>
        </div>
        <p className="mt-5 text-base font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
