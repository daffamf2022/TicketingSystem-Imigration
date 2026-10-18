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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Read router location state for redirect parameters
  const state = location.state as { from?: { pathname: string }; message?: string } | null;
  const from = state?.from?.pathname || '/reservation';
  const redirectNotice = state?.message || null;

  useEffect(() => {
    if (authService.getToken()) {
      const user = authService.getUser();
      const normalizedRole = user?.role === 'ADMIN' ? 'OFFICER' : user?.role;
      if (normalizedRole === 'OFFICER') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/admin' ? '/reservation' : from, { replace: true });
      }
    }
  }, [navigate, from]);

  const handleAuthSuccess = (_token: string, user: User) => {
    setErrorMessage(null);
    const normalizedRole = user.role === 'ADMIN' ? 'OFFICER' : user.role;
    // Officers go straight to dashboard; customers go to the original requested page
    if (normalizedRole === 'OFFICER') {
      navigate('/admin', { replace: true });
    } else {
      navigate(from === '/admin' ? '/reservation' : from, { replace: true });
    }
  };

  const handleAuthError = (msg: string) => {
    setErrorMessage(msg);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7fbff_0%,_#eef3fb_40%,_#edf1f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0b5fa8] via-[#0d7fc8] to-[#0b4f90] p-8 text-white lg:p-10">
            <div className="absolute -right-14 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-[#9ad9ff]/15 blur-3xl" aria-hidden="true" />

            <div className="relative z-10">
              <div className="mb-8 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-50 backdrop-blur-sm">
                Sistem Layanan
              </div>

              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                <svg viewBox="0 0 64 64" className="h-10 w-10 text-white" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M32 8C18.745 8 8 18.745 8 32C8 45.255 18.745 56 32 56C45.255 56 56 45.255 56 32C56 18.745 45.255 8 32 8Z" stroke="currentColor" strokeWidth="2.8" opacity="0.95"/>
                  <path d="M22 32L28.5 38.5L42 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h2 className="text-3xl font-bold leading-tight tracking-[-0.04em] md:text-4xl">Portal Layanan Imigrasi</h2>
              <p className="mt-4 max-w-sm text-base leading-relaxed text-blue-50/90">
                Akses cepat untuk pemohon dan petugas dalam proses pelayanan prioritas dan administrasi imigrasi.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-blue-50/95 backdrop-blur-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold">01</span>
                  <span>Proses masuk aman dan cepat</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-blue-50/95 backdrop-blur-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold">02</span>
                  <span>Kontrol akses untuk petugas dan pemohon</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-blue-50/95 backdrop-blur-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base font-bold">03</span>
                  <span>Monitoring layanan prioritas lebih terstruktur</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-[-0.04em] text-[#0b5fa8]">{authMode === 'login' ? 'Log In' : 'Daftar'}</span>
              </div>
            </div>

            {redirectNotice && (
              <div 
                className="mb-6 p-3 bg-yellow-50 border-l-2 border-yellow-500 text-yellow-950 text-xs font-mono tracking-wide rounded-r border border-y-slate-200 border-r-slate-200" 
                role="alert"
              >
                {redirectNotice}
              </div>
            )}

            <ErrorBanner message={errorMessage} />

            <div className="pt-2">
              <h1 className="text-3xl md:text-[2.3rem] font-bold tracking-[-0.05em] text-slate-900 leading-none">
                {authMode === 'login' ? 'Masuk ke akun Anda' : 'Daftar akun pemohon'}
              </h1>
              <p className="mt-3 text-base text-slate-500">
                {authMode === 'login'
                  ? 'Masukkan nama pengguna, NIK, atau email beserta kata sandi untuk melanjutkan.'
                  : 'Buat akun untuk mengajukan dan memantau permohonan layanan.'}
              </p>

              <div className="mt-8">
                <AuthForm
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  onModeChange={(mode) => {
                    setAuthMode(mode);
                    setErrorMessage(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;