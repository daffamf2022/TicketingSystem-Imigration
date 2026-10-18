import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { ErrorBanner } from '../components/ErrorBanner';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Tautan atur ulang tidak memiliki token yang valid.');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi baru harus terdiri dari minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      setSuccess(response.message);
      setPassword('');
      setConfirmPassword('');
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal mengatur ulang kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_#f7fbff_0%,_#eef3fb_40%,_#edf1f7_100%)] px-4 py-16 text-slate-900">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#0b5fa8]">Keamanan Akun</p>
        <h1 className="mt-2 text-3xl font-black">Atur Ulang Kata Sandi</h1>
        <p className="mt-3 text-sm text-slate-600">Tautan ini hanya dapat digunakan satu kali dan berlaku selama satu jam.</p>

        <div className="mt-6">
          <ErrorBanner message={error} />
        </div>
        {success ? (
          <div className="mt-5 space-y-4" role="status">
            <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">{success}</p>
            <Link to="/login" className="inline-flex rounded-lg bg-[#0b5fa8] px-5 py-3 font-bold text-white hover:bg-[#0d7fc8]">
              Kembali ke halaman masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block space-y-2 text-sm font-semibold">
              Kata sandi baru
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-[#0b5fa8] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold">
              Konfirmasi kata sandi baru
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-[#0b5fa8] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-lg bg-[#0b5fa8] px-5 py-3 font-bold text-white hover:bg-[#0d7fc8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'MENYIMPAN...' : 'SIMPAN KATA SANDI BARU'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default ResetPasswordPage;
