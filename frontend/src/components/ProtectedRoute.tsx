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
  const normalizedRole = user?.role === 'ADMIN' ? 'OFFICER' : user?.role;

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

  if (allowedRoles && (!normalizedRole || !allowedRoles.includes(normalizedRole))) {
    const redirectTo = normalizedRole === 'OFFICER' ? '/admin' : '/guide';
    return (
      <Navigate 
        to={redirectTo}
        state={{ 
          message: 'Akses ditolak. Halaman ini tidak tersedia untuk peran akun Anda.'
        }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
