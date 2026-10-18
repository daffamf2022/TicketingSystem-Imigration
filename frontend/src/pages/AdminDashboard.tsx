import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import reservationService from '../services/reservationService';
import type { SingleReservationData } from '../services/reservationService';
import type { User } from '../services/authService';
import { ErrorBanner } from '../components/ErrorBanner';

const toCutoffMinutes = (startTime: string, cutoffTime: string) => {
  const [slotHour, slotMinute] = startTime.split(':').map(Number);
  const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
  const slotTotal = slotHour * 60 + slotMinute;
  const cutoffTotal = cutoffHour * 60 + cutoffMinute;

  if (cutoffTotal >= slotTotal) {
    return 0;
  }

  return slotTotal - cutoffTotal;
};

const formatCutoffTime = (startTime: string, cutoffMinutes?: number | null) => {
  if (!cutoffMinutes || cutoffMinutes <= 0) {
    return 'Tidak aktif';
  }

  const [slotHour, slotMinute] = startTime.split(':').map(Number);
  const total = slotHour * 60 + slotMinute - cutoffMinutes;
  const hour = Math.floor(total / 60);
  const minute = total % 60;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const maskNik = (nik: string) => {
  if (nik.length <= 8) return '*'.repeat(nik.length);
  return `${nik.slice(0, 4)}${'*'.repeat(nik.length - 8)}${nik.slice(-4)}`;
};

const maskEmail = (email: string) => {
  const separator = email.lastIndexOf('@');
  if (separator <= 0) return '***';
  const localPart = email.slice(0, separator);
  return `${localPart.slice(0, 1)}${'*'.repeat(Math.max(localPart.length - 1, 2))}${email.slice(separator)}`;
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentMenu = pathname === '/admin'
    ? 'dashboard'
    : pathname.startsWith('/admin/reservations')
      ? 'reservations'
      : pathname.startsWith('/admin/quotas')
        ? 'quotas'
        : pathname.startsWith('/admin/users')
          ? 'users'
          : 'dashboard';
  const pageTitle = {
    dashboard: 'Dashboard Petugas Layanan Prioritas',
    reservations: 'Manajemen Antrean',
    quotas: 'Manajemen Kuota Prioritas',
    users: 'Data Pemohon dan Petugas',
  }[currentMenu];
  const [reservations, setReservations] = useState<SingleReservationData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [quotaOverview, setQuotaOverview] = useState<Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    max_quota: number;
    remaining_quota: number;
    cutoff_minutes?: number | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [timeSetting, setTimeSetting] = useState<{ id: string; startTime: string; value: string } | null>(null);

  const token = authService.getToken();

  const loadReservations = async () => {
    if (!token) {
      navigate('/login', {
        state: { message: 'Harap masuk log (login) terlebih dahulu untuk membuka Dashboard Petugas.' }
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await reservationService.getAllReservations(token);
      setReservations(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat seluruh tiket antrean.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!token) return;

    setUserLoading(true);
    try {
      const res = await authService.getUsers(token);
      setUsers(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat daftar akun pengguna.');
      }
    } finally {
      setUserLoading(false);
    }
  };

  const handleSendPasswordResetLink = async (userId: string, name: string) => {
    if (!token) return;

    if (!window.confirm(`Kirim tautan atur ulang kata sandi ke email terdaftar milik ${name}?`)) return;

    setActionLoadingId(userId);
    try {
      const response = await authService.sendPasswordResetLink(userId, token);
      alert(response.message);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Gagal mengirim tautan atur ulang kata sandi.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const loadQuotaOverview = async () => {
    if (!token) return;

    setQuotaLoading(true);
    try {
      const response = await reservationService.getAllQuotaOverview(token);
      setQuotaOverview(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal memuat data kuota layanan.');
      }
    } finally {
      setQuotaLoading(false);
    }
  };

  const handleAdjustQuota = async (id: string, adjustment: number) => {
    if (!token) return;

    setActionLoadingId(id);
    try {
      const updatedQuota = await reservationService.updateQuotaSlot(id, adjustment, token);
      setQuotaOverview(prev => prev.map(q => q.id === updatedQuota.id ? {
        ...q,
        remaining_quota: updatedQuota.remaining_quota,
        cutoff_minutes: updatedQuota.cutoff_minutes ?? 0,
      } : q));
      window.dispatchEvent(new CustomEvent('quota-updated', { detail: { id } }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Gagal memperbarui kuota.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSetCutoff = async (id: string, startTime: string) => {
    if (!token) return;

    const quota = quotaOverview.find((item) => item.id === id);
    const defaultValue = quota && quota.cutoff_minutes ? formatCutoffTime(startTime, quota.cutoff_minutes) : '';
    setTimeSetting({ id, startTime, value: defaultValue });
  };

  const saveTimeSetting = async () => {
    if (!token || !timeSetting) return;

    const value = timeSetting.value;
    if (!value) {
      setTimeSetting(null);
      return;
    }

    const cutoffMinutes = toCutoffMinutes(timeSetting.startTime, value);
    setActionLoadingId(timeSetting.id);
    try {
      const updatedQuota = await reservationService.updateQuotaSlot(timeSetting.id, 0, token, cutoffMinutes, value);
      setQuotaOverview(prev => prev.map(q => q.id === updatedQuota.id ? {
        ...q,
        remaining_quota: updatedQuota.remaining_quota,
        cutoff_minutes: updatedQuota.cutoff_minutes ?? 0,
      } : q));
      alert(`Atur waktu slot berhasil disimpan: ${formatCutoffTime(timeSetting.startTime, updatedQuota.cutoff_minutes ?? 0)}.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Gagal menyimpan waktu slot.');
      }
    } finally {
      setActionLoadingId(null);
      setTimeSetting(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      loadReservations();
      loadUsers();
      loadQuotaOverview();
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    setActionLoadingId(id);
    try {
      await reservationService.updateReservationStatus(id, newStatus, token);

      setReservations(prev => 
        prev.map(res => res.id === id ? { ...res, status: newStatus } : res)
      );

      window.dispatchEvent(new CustomEvent('reservation-status-change', {
        detail: { id, status: newStatus },
      }));
      if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
        await loadQuotaOverview();
        window.dispatchEvent(new Event('quota-updated'));
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Gagal memperbarui status antrean.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!token) return;

    const confirmed = window.confirm('Hapus tiket yang sudah selesai ini dari daftar antrean?');
    if (!confirmed) return;

    setActionLoadingId(id);
    try {
      await reservationService.deleteReservation(id, token);
      setReservations(prev => prev.filter(res => res.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Gagal menghapus tiket antrean.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusLabel = (status: string) => ({
    PENDING: 'Menunggu Verifikasi',
    VERIFIED: 'Disetujui',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REJECTED: 'Ditolak',
    DITOLAK: 'Ditolak',
  }[status] ?? status);

  // Helper parser for customized serialized metadata
  const parseMetadata = (rawDisability: string) => {
    let category = 'nonprioritas';
    let assistance = 'Tidak ada';
    let passportType = 'Paspor Baru';
    
    if (rawDisability) {
      const [categoryPart, rest] = rawDisability.split(' | Bantuan: ');
      
      if (rest) {
        const [assistancePart, passportPart] = rest.split(' | Jenis: ');
        category = categoryPart;
        assistance = assistancePart;
        if (passportPart) {
          passportType = passportPart === 'baru' ? 'Paspor Baru' : passportPart === 'perpanjang' ? 'Perpanjangan' : 'Hilang/Rusak';
        }
      } else {
        const [categoryPartOnly, passportPartOnly] = rawDisability.split(' | Jenis: ');
        category = categoryPartOnly;
        if (passportPartOnly) {
          passportType = passportPartOnly === 'baru' ? 'Paspor Baru' : passportPartOnly === 'perpanjang' ? 'Perpanjangan' : 'Hilang/Rusak';
        }
      }
    }
    
    const displayCategory = category.toUpperCase() === 'LANSIA' 
      ? 'LANSIA' 
      : category.toUpperCase() === 'DISABILITAS' 
        ? 'DISABILITAS' 
        : category.toUpperCase() === 'HAMIL' 
          ? 'IBU HAMIL' 
          : category.toUpperCase() === 'BALITA' 
            ? 'BALITA' 
            : 'DATA LAMA: NONPRIORITAS';

    return { displayCategory, assistance, passportType };
  };

  if (loading) {
    return (
      <div className="w-full py-24 text-center space-y-4 bg-brand-bg px-8">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full" role="status">
          <span className="sr-only">Memuat...</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">MEMUAT DATA DASHBOARD PETUGAS...</p>
      </div>
    );
  }

  // Stats calculation
  const totalPending = reservations.filter(r => r.status === 'PENDING').length;
  const totalVerified = reservations.filter(r => r.status === 'VERIFIED').length;
  const totalRejected = reservations.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="w-full px-8 md:px-12 py-12 space-y-8 bg-brand-bg focus-visible:outline-none" id="main-content">
      
      {/* Header section */}
      <header className="space-y-4 border-b pb-6 border-blue-100">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0b5fa8] font-bold block">LAYANAN PETUGAS</span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">
              {pageTitle}
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="px-4 py-2 border border-blue-200 bg-white hover:bg-blue-50 text-[#0b5fa8] font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              INFORMASI
            </button>
            <button
              onClick={currentMenu === 'quotas' ? loadQuotaOverview : currentMenu === 'users' ? loadUsers : loadReservations}
              className="px-4 py-2 border border-blue-200 bg-white hover:bg-blue-50 text-[#0b5fa8] font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              {currentMenu === 'quotas' ? 'PERBARUI KUOTA' : currentMenu === 'users' ? 'PERBARUI AKUN' : 'PERBARUI DATA'}
            </button>
            <button
              onClick={() => {
                authService.clearSession();
                navigate('/login', { replace: true });
              }}
              className="px-4 py-2 border border-red-300 bg-white hover:bg-red-50 text-red-700 font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer font-bold"
            >
              KELUAR SESI (LOGOUT)
            </button>
          </div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[#0b5fa8] text-xs font-mono uppercase tracking-wider">
          Prototipe akademik untuk keperluan penelitian dan demonstrasi; sistem ini belum terhubung ke layanan produksi Imigrasi.
        </div>
      </header>

      <nav aria-label="Menu admin" className="grid gap-3 rounded-2xl bg-slate-900 p-3 shadow-lg sm:grid-cols-2 xl:grid-cols-4">
        {[
          { path: '/admin', key: 'dashboard', label: 'Permohonan', detail: 'Ringkasan layanan' },
          { path: '/admin/reservations', key: 'reservations', label: 'Antrean', detail: 'Verifikasi permohonan' },
          { path: '/admin/quotas', key: 'quotas', label: 'Kuota', detail: 'Atur slot layanan' },
          { path: '/admin/users', key: 'users', label: 'Pengguna', detail: 'Kelola akun terdaftar' },
        ].map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            end={item.key === 'dashboard'}
            aria-current={currentMenu === item.key ? 'page' : undefined}
            className={`rounded-xl border p-4 transition-colors ${
              currentMenu === item.key
                ? 'border-cyan-300 bg-[#0b5fa8] text-white shadow-md'
                : 'border-slate-700 bg-slate-800 text-white hover:border-slate-500 hover:bg-slate-700'
            }`}
          >
            <span className="block font-mono text-xs font-bold uppercase tracking-widest">{item.label}</span>
            <span className={`mt-1 block text-sm ${currentMenu === item.key ? 'text-blue-100' : 'text-slate-300'}`}>{item.detail}</span>
          </NavLink>
        ))}
      </nav>

      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0b5fa8] font-bold">INFORMASI LAYANAN</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Paspor Hilang & Rusak</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                <div className="mb-4 inline-flex rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">
                  Paspor Hilang
                </div>
                <h3 className="text-2xl font-black text-slate-900">Paspor Hilang</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Paspor hilang adalah dokumen perjalanan yang tidak berada dalam penguasaan pemohon karena tertinggal, hilang saat perjalanan, atau dicuri. Kondisi ini memerlukan pelaporan segera agar proses pelayanan dapat dilakukan sesuai prosedur yang berlaku.
                </p>
                <ul className="mt-4 space-y-2 pl-5 text-sm text-slate-700">
                  <li className="list-disc">Pemohon wajib melaporkan kehilangan sesuai mekanisme yang berlaku.</li>
                  <li className="list-disc">Dokumen identitas dan bukti pendukung harus disiapkan dengan lengkap.</li>
                  <li className="list-disc">Proses dilanjutkan setelah verifikasi awal dilakukan oleh petugas.</li>
                </ul>
              </article>

              <article className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
                <div className="mb-4 inline-flex rounded-full bg-orange-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-orange-800">
                  Paspor Rusak
                </div>
                <h3 className="text-2xl font-black text-slate-900">Paspor Rusak</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Paspor rusak adalah dokumen yang mengalami kerusakan fisik atau data identitas tidak terbaca secara jelas. Kondisi seperti halaman sobek, basah, aus, terlipat berlebihan, atau data tidak terbaca dapat dikategorikan sebagai paspor rusak.
                </p>
                <ul className="mt-4 space-y-2 pl-5 text-sm text-slate-700">
                  <li className="list-disc">Paspor lama biasanya diserahkan untuk proses verifikasi dan pencatatan.</li>
                  <li className="list-disc">Berkas pendukung harus lengkap sebelum pengajuan dilanjutkan.</li>
                  <li className="list-disc">Proses pelayanan dapat dilanjutkan setelah BAP dan pemeriksaan awal selesai.</li>
                </ul>
              </article>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b5fa8]">
                Prosedur Umum
              </div>
              <p className="text-sm leading-7 text-slate-700">
                Untuk layanan <span className="font-bold text-slate-900">paspor rusak dan hilang</span>, proses diawali dengan <span className="font-bold text-slate-900">Berita Acara Pemeriksaan (BAP)</span> sebagai tahap awal verifikasi. Setelah itu, pemohon akan melanjutkan ke pengisian formulir, pemeriksaan dokumen, pembayaran, dan penerbitan paspor baru sesuai ketentuan yang berlaku.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Tahap 1</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">BAP</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Tahap 2</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">Verifikasi Dokumen</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Tahap 3</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">Pembayaran & Penerbitan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {timeSetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0b5fa8] font-bold">ATUR WAKTU</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Tutup pemesanan slot</h3>
              <p className="text-sm text-slate-600">
                Pilih waktu penutupan pemesanan sebelum slot dimulai. Contoh: jika slot mulai pukul {timeSetting.startTime}, pilih {formatCutoffTime(timeSetting.startTime, 30)} untuk menutup 30 menit sebelum jam layanan.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Waktu penutupan
                <input
                  type="time"
                  value={timeSetting.value}
                  onChange={(event) => setTimeSetting((current) => current ? { ...current, value: event.target.value } : current)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base text-slate-900 outline-none ring-0 focus:border-slate-900"
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTimeSetting(null)}
                  className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveTimeSetting}
                  className="px-4 py-2 bg-[#0b5fa8] text-white rounded-lg font-semibold cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ErrorBanner message={error} />

      {currentMenu === 'quotas' && (
      <section className="glass-panel rounded-lg overflow-hidden" aria-label="Manajemen kuota layanan">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-[#f4f9ff]">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0b5fa8] font-bold block">MONITOR KUOTA</span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Manajemen Kuota Prioritas</h2>
          </div>
          <button
            type="button"
            onClick={loadQuotaOverview}
            disabled={quotaLoading}
            className="px-4 py-2 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 text-[#0b5fa8] font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
          >
            {quotaLoading ? 'MEMUAT...' : 'PERBARUI KUOTA'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">Tanggal</th>
                <th className="p-4 font-bold">Jadwal</th>
                <th className="p-4 font-bold">Maksimal</th>
                <th className="p-4 font-bold">Tersisa</th>
                <th className="p-4 font-bold">Atur Waktu</th>
                <th className="p-4 font-bold text-right">Opsi Kuota</th>
              </tr>
            </thead>
            <tbody>
              {quotaOverview.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-mono text-sm uppercase tracking-widest">
                    Belum ada data kuota untuk hari ini.
                  </td>
                </tr>
              ) : (
                quotaOverview.map((quota) => (
                  <tr key={quota.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-sm font-semibold text-slate-950">
                    <td className="p-4 font-bold">{new Date(quota.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="p-4 font-mono text-xs">{quota.start_time} - {quota.end_time} WIB</td>
                    <td className="p-4 font-mono text-xs">{Math.min(quota.max_quota, 5)}</td>
                      <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-mono font-bold border ${
                        quota.remaining_quota === 0
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : quota.remaining_quota <= 2
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {quota.remaining_quota}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {formatCutoffTime(quota.start_time, quota.cutoff_minutes)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={actionLoadingId === quota.id || quota.remaining_quota <= 0}
                          onClick={() => handleAdjustQuota(quota.id, -1)}
                          className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-800 font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === quota.id || quota.remaining_quota >= Math.min(quota.max_quota, 5)}
                          onClick={() => handleAdjustQuota(quota.id, 1)}
                          className="px-2.5 py-1.5 bg-[#0b5fa8] hover:bg-[#0d7fc8] disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === quota.id}
                          onClick={() => handleSetCutoff(quota.id, quota.start_time)}
                          className="px-2.5 py-1.5 border border-amber-300 hover:bg-amber-50 disabled:opacity-50 text-amber-800 font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                        >
                          ATUR WAKTU
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {currentMenu === 'dashboard' && (
      <>
      <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-4" aria-label="Ringkasan permohonan hari ini">
        <div className="bg-gradient-to-br from-[#f7fbff] to-white p-6 border border-blue-100 rounded-lg shadow-[0_12px_30px_rgba(11,95,168,0.05)] space-y-2">
          <span className="font-mono text-xs text-[#0b5fa8] uppercase tracking-widest block font-bold">TOTAL PERMOHONAN</span>
          <span className="text-4xl font-black text-slate-900 font-mono block">{reservations.length}</span>
          <span className="text-xs text-slate-600 font-bold">Kategori layanan prioritas</span>
        </div>
        <div className="premium-card p-6 rounded-lg space-y-2">
          <span className="font-mono text-xs text-[#0b5fa8] uppercase tracking-widest block font-bold">MENUNGGU VERIFIKASI</span>
          <span className="text-4xl font-black text-slate-900 font-mono block text-yellow-600">{totalPending}</span>
          <span className="text-xs text-slate-600 font-bold">Perlu pemeriksaan berkas</span>
        </div>
        <div className="premium-card p-6 rounded-lg space-y-2">
          <span className="font-mono text-xs text-[#0b5fa8] uppercase tracking-widest block font-bold">DISETUJUI</span>
          <span className="text-4xl font-black text-slate-900 font-mono block text-green-600">{totalVerified}</span>
          <span className="text-xs text-slate-600 font-bold">Nomor antrean telah diberikan</span>
        </div>
        <div className="premium-card p-6 rounded-lg space-y-2">
          <span className="font-mono text-xs text-[#0b5fa8] uppercase tracking-widest block font-bold">DITOLAK</span>
          <span className="text-4xl font-black text-slate-900 font-mono block text-red-600">{totalRejected}</span>
          <span className="text-xs text-slate-600 font-bold">Kuota dikembalikan</span>
        </div>
      </section>

      <section aria-label="Pilih fitur admin" className="grid gap-4 md:grid-cols-3">
        <NavLink to="/admin/reservations" className="premium-card rounded-xl p-6 transition-colors hover:border-blue-400">
          <h2 className="text-lg font-black text-slate-900">Antrean Permohonan</h2>
          <p className="mt-2 text-sm text-slate-600">Periksa berkas, setujui atau tolak permohonan, dan kelola status antrean.</p>
          <span className="mt-4 inline-block font-mono text-xs font-bold uppercase tracking-widest text-[#0b5fa8]">Buka menu →</span>
        </NavLink>
        <NavLink to="/admin/quotas" className="premium-card rounded-xl p-6 transition-colors hover:border-blue-400">
          <h2 className="text-lg font-black text-slate-900">Kuota Layanan</h2>
          <p className="mt-2 text-sm text-slate-600">Atur jumlah kuota dan waktu penutupan pemesanan slot.</p>
          <span className="mt-4 inline-block font-mono text-xs font-bold uppercase tracking-widest text-[#0b5fa8]">Buka menu →</span>
        </NavLink>
        <NavLink to="/admin/users" className="premium-card rounded-xl p-6 transition-colors hover:border-blue-400">
          <h2 className="text-lg font-black text-slate-900">Data Pengguna</h2>
          <p className="mt-2 text-sm text-slate-600">Lihat daftar pemohon dan petugas serta kirim tautan atur ulang sandi.</p>
          <span className="mt-4 inline-block font-mono text-xs font-bold uppercase tracking-widest text-[#0b5fa8]">Buka menu →</span>
        </NavLink>
      </section>
      </>
      )}

      {currentMenu === 'users' && (
      <section className="glass-panel rounded-lg overflow-hidden" aria-label="Manajemen akun pengguna">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-[#f4f9ff]">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0b5fa8] font-bold block">AKUN TERDAFTAR</span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Data Pemohon dan Petugas</h2>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            disabled={userLoading}
            className="px-4 py-2 border border-blue-200 hover:bg-blue-50 disabled:opacity-50 text-[#0b5fa8] font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
          >
            {userLoading ? 'MEMUAT...' : 'PERBARUI AKUN'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">Nama</th>
                <th className="p-4 font-bold">Nama Pengguna</th>
                <th className="p-4 font-bold">NIK</th>
                <th className="p-4 font-bold">Email</th>
                <th className="p-4 font-bold">Peran</th>
                <th className="p-4 font-bold">NIP</th>
                <th className="p-4 font-bold">Daftar</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 font-mono text-sm uppercase tracking-widest">
                    Belum ada akun yang terdaftar di database.
                  </td>
                </tr>
              ) : (
                users.map((account) => (
                  <tr key={account.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-sm font-semibold text-slate-950">
                    <td className="p-4 font-bold">{account.name}</td>
                    <td className="p-4 font-mono text-xs">{account.username || '-'}</td>
                    <td className="p-4 font-mono text-xs">{maskNik(account.nik)}</td>
                    <td className="p-4 font-mono text-xs">{maskEmail(account.email)}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 text-[10px] font-mono font-bold rounded uppercase tracking-wider border ${
                        account.role === 'OFFICER'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {account.role === 'OFFICER' ? 'PETUGAS' : 'PEMOHON'}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs">{account.role === 'OFFICER' ? account.nip || 'Perlu dilengkapi' : '-'}</td>
                    <td className="p-4 font-mono text-xs">{account.createdAt ? new Date(account.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="p-4 text-right">
                      {account.role === 'OFFICER' ? (
                        <button
                          type="button"
                          disabled={actionLoadingId === account.id}
                          onClick={() => handleSendPasswordResetLink(account.id, account.name)}
                          className="px-3 py-2 bg-[#0b5fa8] hover:bg-[#0d7fc8] disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                        >
                          {actionLoadingId === account.id ? 'MENGIRIM...' : 'Kirim Tautan Atur Ulang'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Tidak tersedia</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

      {/* Main Table section */}
      {currentMenu === 'reservations' && (
      <section className="glass-panel rounded-lg overflow-hidden" aria-label="Tabel Pemohon Antrean">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">Kode Pengajuan / Nomor Antrean</th>
                <th className="p-4 font-bold">Nama Pemohon / NIK</th>
                <th className="p-4 font-bold">Jadwal Kedatangan</th>
                <th className="p-4 font-bold">Kategori</th>
                <th className="p-4 font-bold">Kebutuhan Bantuan</th>
                <th className="p-4 font-bold">Lampiran Berkas</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-right">Tindakan Petugas</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 font-mono text-sm uppercase tracking-widest">
                    Belum ada antrean terdaftar di database.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => {
                  const { displayCategory, assistance, passportType } = parseMetadata(res.companion?.disabilityType || '');
                  const formattedDate = new Date(res.quota.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50/50 text-sm font-semibold text-slate-950">
                      
                      {/* Application code and final queue number */}
                      <td className="p-4 space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Kode Pengajuan</div>
                        <div className="font-mono font-bold text-sm text-slate-900">{res.applicationCode}</div>
                        <div className="pt-1 text-[10px] uppercase tracking-wider text-slate-500 font-mono">Nomor Antrean</div>
                        <div className="font-mono font-bold text-sm text-slate-900">{res.queueNumber || 'Belum diberikan'}</div>
                      </td>

                      {/* Name & NIK */}
                      <td className="p-4 space-y-0.5">
                        <span className="block font-bold">{res.user.name.toUpperCase()}</span>
                        <span className="block text-xs font-mono text-slate-500">NIK: {maskNik(res.user.nik)}</span>
                      </td>

                      {/* Date & Time */}
                      <td className="p-4 space-y-0.5">
                        <span className="block font-bold">{formattedDate.toUpperCase()}</span>
                        <span className="block font-mono text-xs text-slate-500">{res.quota.startTime} - {res.quota.endTime} WIB</span>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded uppercase tracking-wider ${
                            res.companion?.needsDisabilityFacility 
                              ? 'bg-yellow-100 text-yellow-900 border border-yellow-200' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {res.companion?.needsDisabilityFacility ? displayCategory : 'DATA LAMA: NONPRIORITAS'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">{passportType}</span>
                        </div>
                      </td>

                      {/* Assistance */}
                      <td className="p-4 text-xs font-mono text-slate-700">
                        {assistance}
                      </td>

                      {/* Documents links */}
                      <td className="p-4">
                        {res.documents.length === 0 ? (
                          <span className="text-slate-400 font-mono text-xs">TIDAK ADA BERKAS</span>
                        ) : (
                          <div className="flex flex-col gap-1 text-xs font-mono font-bold">
                            {res.documents.map((doc) => (
                              <a
                                key={doc.id}
                                href={`http://localhost:5000/uploads/${doc.filePath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 uppercase"
                              >
                                📎 {doc.documentType}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded text-xs font-mono font-bold border uppercase tracking-wider ${
                          res.status === 'PENDING' 
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-200' 
                            : res.status === 'VERIFIED' || res.status === 'COMPLETED'
                              ? 'bg-green-50 text-green-800 border-green-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {getStatusLabel(res.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {res.status === 'PENDING' && (
                            <button
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleUpdateStatus(res.id, 'VERIFIED')}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                            >
                              Setujui
                            </button>
                          )}
                          {res.status === 'PENDING' && (
                            <button
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleUpdateStatus(res.id, 'REJECTED')}
                              className="px-2.5 py-1.5 border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-700 font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                            >
                              Tolak
                            </button>
                          )}
                          {res.status === 'VERIFIED' && (
                            <button
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleUpdateStatus(res.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 bg-green-800 hover:bg-green-700 disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                            >
                              Selesai Dilayani
                            </button>
                          )}
                          {(res.status === 'PENDING' || res.status === 'VERIFIED') && (
                            <button
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                              className="px-2.5 py-1.5 border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-700 font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                            >
                              Batalkan
                            </button>
                          )}
                          {res.status === 'COMPLETED' && (
                            <button
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleDeleteReservation(res.id)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}

    </div>
  );
};

export default AdminDashboard;
