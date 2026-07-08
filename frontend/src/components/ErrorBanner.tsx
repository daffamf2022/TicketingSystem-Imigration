import React from 'react';

interface ErrorBannerProps {
  message: string | null;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div 
      className="p-4 bg-white border-2 border-red-600 rounded-lg text-slate-900 shadow-sm"
      role="alert"
      aria-live="assertive"
    >
      <p className="font-bold text-red-800">Kesalahan:</p>
      <p className="text-slate-800">{message}</p>
    </div>
  );
};

export default ErrorBanner;
