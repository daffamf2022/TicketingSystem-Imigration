import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import type { User } from '../services/authService';

interface AuthFormProps {
  onSuccess: (token: string, user: User) => void;
  onError: (message: string) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onError }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [roleSelection, setRoleSelection] = useState<'CUSTOMER' | 'OFFICER'>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();

  const onSubmit = async (data: Record<string, string>) => {
    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await authService.login(data.identifier, data.password);
        authService.setSession(res.data.token, res.data.user);
        onSuccess(res.data.token, res.data.user);
        reset();
      } else {
        const payload = {
          name: data.name,
          nik: data.nik,
          email: data.email,
          password: data.password,
          role: roleSelection,
          nip: roleSelection === 'OFFICER' ? data.nip : undefined
        };
        await authService.register(payload);
        setAuthMode('login');
        reset();
        alert('Registrasi berhasil! Silakan masuk menggunakan kredensial Anda.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        onError(err.message);
      } else {
        onError('Terjadi kesalahan otentikasi yang tidak diketahui.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section 
      className="bg-white p-8 border border-slate-300 rounded-lg shadow-sm space-y-6"
      aria-labelledby="auth-title"
    >
      <div className="flex border-b border-slate-200" role="tablist">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`flex-1 pb-3 text-sm font-mono uppercase tracking-[0.15em] transition-all cursor-pointer border-b-2 text-center ${
            authMode === 'login' 
              ? 'border-slate-900 text-slate-900 font-bold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          aria-current={authMode === 'login' ? 'step' : undefined}
          role="tab"
          aria-selected={authMode === 'login'}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className={`flex-1 pb-3 text-sm font-mono uppercase tracking-[0.15em] transition-all cursor-pointer border-b-2 text-center ${
            authMode === 'register' 
              ? 'border-slate-900 text-slate-900 font-bold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
          aria-current={authMode === 'register' ? 'step' : undefined}
          role="tab"
          aria-selected={authMode === 'register'}
        >
          Daftar Baru
        </button>
      </div>

      <h2 id="auth-title" className="sr-only">Formulir Masuk / Daftar</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {authMode === 'register' && (
          <>
            {/* Role Selection Option */}
            <div className="space-y-2">
              <span className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Daftar Sebagai:</span>
              <div className="flex gap-4">
                <label className={`flex-1 p-3 border-2 rounded text-center cursor-pointer transition-colors text-sm font-semibold ${
                  roleSelection === 'CUSTOMER' ? 'border-slate-900 bg-slate-50 text-slate-950 font-bold' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="role-select"
                    checked={roleSelection === 'CUSTOMER'}
                    onChange={() => setRoleSelection('CUSTOMER')}
                    className="sr-only"
                  />
                  Pemohon Paspor
                </label>
                <label className={`flex-1 p-3 border-2 rounded text-center cursor-pointer transition-colors text-sm font-semibold ${
                  roleSelection === 'OFFICER' ? 'border-slate-900 bg-slate-50 text-slate-950 font-bold' : 'border-slate-200 text-slate-500 hover:border-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="role-select"
                    checked={roleSelection === 'OFFICER'}
                    onChange={() => setRoleSelection('OFFICER')}
                    className="sr-only"
                  />
                  Petugas Imigrasi
                </label>
              </div>
            </div>

            {/* Conditionally render NIP for officers */}
            {roleSelection === 'OFFICER' && (
              <div className="space-y-1.5 animate-fadeIn" aria-live="polite">
                <label htmlFor="reg-nip" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Nomor Induk Pegawai (NIP):</label>
                <input
                  id="reg-nip"
                  required
                  {...register('nip')}
                  type="text"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                  placeholder="Masukkan NIP Pegawai Anda"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Nama Lengkap (sesuai KTP):</label>
              <input
                id="reg-name"
                required
                {...register('name')}
                type="text"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reg-nik" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Nomor Induk Kependudukan (NIK):</label>
              <input
                id="reg-nik"
                required
                maxLength={16}
                minLength={16}
                {...register('nik')}
                type="text"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label htmlFor="auth-identifier" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">
            {authMode === 'login' ? 'Email atau NIK:' : 'Email Aktif:'}
          </label>
          <input
            id="auth-identifier"
            required
            {...register(authMode === 'login' ? 'identifier' : 'email')}
            type={authMode === 'login' ? 'text' : 'email'}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="auth-password" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Password:</label>
          <input
            id="auth-password"
            required
            {...register('password')}
            type="password"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 text-white font-mono text-sm uppercase tracking-[0.2em] font-bold py-4 px-4 rounded border-2 border-slate-950 transition-all cursor-pointer"
        >
          {loading ? 'MEMPROSES...' : authMode === 'login' ? 'MASUK SEKARANG' : 'DAFTAR AKUN'}
        </button>
      </form>
    </section>
  );
};

export default AuthForm;
