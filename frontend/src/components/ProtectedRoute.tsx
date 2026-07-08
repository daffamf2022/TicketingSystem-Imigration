import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = authService.getToken();
  const user = authService.getUser();
  const location = useLocation();

  if (!token) {
    // Redirect to login page and store the source location path for later redirect
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location, 
          message: 'Harap masuk log (login) terlebih dahulu untuk mengakses halaman ini.' 
        }} 
        replace 
      />
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to guide page with a warning notice
    return (
      <Navigate 
        to="/guide" 
        state={{ 
          message: 'Akses Ditolak: Halaman tersebut hanya dapat diakses oleh Petugas Kantor Imigrasi.' 
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
