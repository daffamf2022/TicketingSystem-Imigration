import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import type { User } from '../services/authService';

interface AuthFormProps {
  onSuccess: (token: string, user: User) => void;
  onError: (message: string) => void;
  onModeChange: (mode: 'login' | 'register') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onError, onModeChange }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  
  const { register, handleSubmit, reset } = useForm<Record<string, string>>();
  const loginTitle = 'Masuk ke akun Anda';
  const loginSubtitle = 'Gunakan nama pengguna, NIK, atau email dan kata sandi yang terdaftar untuk mengajukan serta memantau permohonan.';

  const changeAuthMode = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    onModeChange(mode);
    setShowPasswordRecovery(false);
    setRecoveryMessage(null);
  };

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
          username: data.username,
          nik: data.nik,
          email: data.email,
          password: data.password,
          role: 'CUSTOMER',
        };
        await authService.register(payload);
        changeAuthMode('login');
        reset();
        alert(`Registrasi berhasil! Nama pengguna Anda: ${data.username}. Silakan masuk menggunakan nama pengguna atau NIK dan kata sandi.`);
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

  const handlePasswordRecovery = async () => {
    setLoading(true);
    setRecoveryMessage(null);
    try {
      const result = await authService.requestPasswordReset(recoveryEmail);
      setRecoveryMessage(result.message);
    } catch (error: unknown) {
      setRecoveryMessage(error instanceof Error ? error.message : 'Gagal meminta tautan atur ulang kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="auth-title" className="w-full">
      <h2 id="auth-title" className="sr-only">Formulir Masuk / Daftar</h2>

      {authMode === 'register' ? (
        <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 sm:p-7">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Buat akun pemohon</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Isi data berikut untuk membuat akun dan mengakses layanan.</p>
          </div>
          <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50" role="tablist">
            <button
              type="button"
              onClick={() => changeAuthMode('login')}
              role="tab"
              aria-selected={false}
              className="flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition-all hover:text-slate-700"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => changeAuthMode('register')}
              className="flex-1 bg-gradient-to-r from-[#0b5fa8] to-[#0d7fc8] px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_18px_rgba(11,95,168,0.18)]"
              aria-current="step"
              role="tab"
              aria-selected={true}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
              Email digunakan untuk informasi akun dan menerima tautan pemulihan kata sandi.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">Nama lengkap</label>
              <input
                id="reg-name"
                required
                {...register('name')}
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0b6eb5] focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reg-username" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">Nama pengguna</label>
              <input
                id="reg-username"
                required
                minLength={4}
                maxLength={30}
                pattern="[A-Za-z][A-Za-z0-9._-]{3,29}"
                autoComplete="username"
                {...register('username')}
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0b6eb5] focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Contoh: budi.pratama"
              />
              <p className="text-xs text-slate-500">4–30 karakter, diawali huruf; gunakan huruf, angka, titik, garis bawah, atau tanda hubung.</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="reg-nik" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">NIK</label>
              <input
                id="reg-nik"
                required
                maxLength={16}
                minLength={16}
                pattern="[0-9]{16}"
                inputMode="numeric"
                {...register('nik')}
                type="text"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0b6eb5] focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Masukkan NIK"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">Email aktif</label>
              <input
                id="reg-email"
                required
                {...register('email')}
                type="email"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0b6eb5] focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Masukkan email aktif"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">Password</label>
              <input
                id="reg-password"
                required
                minLength={8}
                {...register('password')}
                type="password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#0b6eb5] focus:outline-none focus:ring-4 focus:ring-blue-100"
                placeholder="Masukkan password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0d74c8] to-[#0b5ea8] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all hover:brightness-105 disabled:opacity-60"
            >
              {loading ? 'MEMPROSES...' : 'Daftar akun'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-[22px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-[0.2em] text-[#0b6eb5]">Akses Akun</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{loginTitle}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b6eb5] to-[#0d4d8b] shadow-lg shadow-blue-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="auth-identifier" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">Nama pengguna, NIK, atau email</label>
              <div className="relative">
                <input
                  id="auth-identifier"
                  required
                  {...register('identifier')}
                  type="text"
                  autoComplete="username"
                  placeholder="Masukkan nama pengguna, NIK, atau email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-11 text-base text-slate-900 placeholder:text-slate-400 transition-all duration-200 ease-out focus:border-[#0b5fa8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16v16H4z" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="block text-[0.76rem] font-bold uppercase tracking-[0.12em] text-slate-600">Password</label>
              <div className="relative">
                <input
                  id="auth-password"
                  required
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password Anda"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pl-11 pr-12 text-base text-slate-900 placeholder:text-slate-400 transition-all duration-200 ease-out focus:border-[#0b5fa8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
                <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                </svg>
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0b5fa8] focus:ring-offset-2"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {showPassword ? (
                      <>
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A11.7 11.7 0 0 1 12 5c6.5 0 10 7 10 7a16.4 16.4 0 0 1-3 3.8" />
                        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10.5 10.5 0 0 0 4-.8" />
                      </>
                    ) : (
                      <>
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0b5fa8] to-[#0d7fc8] px-4 py-3.5 text-base font-bold text-white shadow-[0_12px_25px_rgba(11,95,168,0.28)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60"
            >
              {loading ? 'MEMPROSES...' : 'Masuk ke akun'}
            </button>
          </form>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-sm text-slate-500">Lupa kata sandi?</span>
            <button
              type="button"
              onClick={() => {
                setShowPasswordRecovery((visible) => !visible);
                setRecoveryMessage(null);
              }}
              className="text-sm font-medium text-[#0b5fa8] hover:text-[#0a4f90] underline-offset-4 hover:underline"
            >
              {showPasswordRecovery ? 'Tutup' : 'Pulihkan melalui email'}
            </button>
          </div>

          {showPasswordRecovery && (
            <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-700">Email yang digunakan saat mendaftar</label>
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#0b5fa8] focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="nama@email.com"
              />
              {recoveryMessage && <p className="text-sm text-slate-700" role="status">{recoveryMessage}</p>}
              <button
                type="button"
                disabled={loading || !recoveryEmail}
                onClick={handlePasswordRecovery}
                className="rounded-lg bg-[#0b5fa8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d7fc8] disabled:opacity-60"
              >
                {loading ? 'MENGIRIM...' : 'Kirim tautan pemulihan'}
              </button>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
            Belum memiliki akun?{' '}
            <button
              type="button"
              onClick={() => changeAuthMode('register')}
              className="font-semibold text-[#0b5fa8] underline-offset-4 hover:text-[#0a4f90] hover:underline"
            >
              Daftar sekarang
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuthForm;
