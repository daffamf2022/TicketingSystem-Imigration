import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { ErrorBanner } from '../components/ErrorBanner';
import authService from '../services/authService';
import type { User } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read router location state for redirect parameters
  const state = location.state as { from?: { pathname: string }; message?: string } | null;
  const from = state?.from?.pathname || '/reservation';
  const redirectNotice = state?.message || null;

  useEffect(() => {
    if (authService.getToken()) {
      const user = authService.getUser();
      if (user?.role === 'OFFICER') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/admin' ? '/reservation' : from, { replace: true });
      }
    }
  }, [navigate, from]);

  const handleAuthSuccess = (_token: string, user: User) => {
    setErrorMessage(null);
    // Officers go straight to dashboard; customers go to the original requested page
    if (user.role === 'OFFICER') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from === '/admin' ? '/reservation' : from, { replace: true });
    }
  };

  const handleAuthError = (msg: string) => {
    setErrorMessage(msg);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 space-y-8 focus-visible:outline-none">
      <div className="space-y-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 block">AKSES GERBANG / LOG</span>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Otentikasi Pengguna</h1>
        <p className="text-sm text-slate-600">Masuk atau daftarkan akun baru Anda untuk melakukan reservasi pelayanan.</p>
      </div>

      {redirectNotice && (
        <div 
          className="p-3 bg-yellow-50 border-l-2 border-yellow-500 text-yellow-950 text-xs font-mono tracking-wide rounded-r border border-y-slate-200 border-r-slate-200" 
          role="alert"
        >
          {redirectNotice}
        </div>
      )}

      <ErrorBanner message={errorMessage} />

      <AuthForm onSuccess={handleAuthSuccess} onError={handleAuthError} />
    </div>
  );
};

export default LoginPage;
