import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import reservationService from '../services/reservationService';
import type { SingleReservationData } from '../services/reservationService';
import { ErrorBanner } from '../components/ErrorBanner';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<SingleReservationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.resolve();
      if (!isMounted) return;
      loadReservations();
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
      
      // Update local state statefully
      setReservations(prev => 
        prev.map(res => res.id === id ? { ...res, status: newStatus } : res)
      );
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

  // Helper parser for customized serialized metadata
  const parseMetadata = (rawDisability: string) => {
    let category = 'reguler';
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
            : 'REGULER';

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
  const totalPriority = reservations.filter(r => r.companion?.needsDisabilityFacility).length;
  const totalReguler = reservations.length - totalPriority;
  const totalPending = reservations.filter(r => r.status === 'PENDING').length;
  const totalVerified = reservations.filter(r => r.status === 'VERIFIED').length;

  return (
    <div className="w-full px-8 md:px-12 py-12 space-y-8 bg-brand-bg focus-visible:outline-none" id="main-content">
      
      {/* Header section */}
      <header className="space-y-4 border-b pb-6 border-slate-200">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 font-bold block">OFFICER COMMAND CENTER</span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">
              Dashboard Petugas Pengawas Antrean
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={loadReservations}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer"
            >
              REFRESH DATA
            </button>
            <button
              onClick={() => {
                authService.clearSession();
                navigate('/login');
              }}
              className="px-4 py-2 border border-red-300 bg-white hover:bg-red-50 text-red-700 font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer font-bold"
            >
              KELUAR SESI (LOGOUT)
            </button>
          </div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 text-xs font-mono uppercase tracking-wider">
          💡 Mode Demonstrasi — Sesi Akses Operator Pelayanan Kantor Imigrasi Aktif.
        </div>
      </header>

      <ErrorBanner message={error} />

      {/* Real-time stats widgets */}
      <section className="grid gap-6 sm:grid-cols-2 md:grid-cols-4" aria-label="Statistik Antrean Hari Ini">
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-2">
          <span className="font-mono text-xs text-slate-500 uppercase tracking-widest block font-bold">TOTAL ANTRIAN PRIORITAS</span>
          <span className="text-4xl font-black text-slate-900 font-mono block">{totalPriority}</span>
          <span className="text-xs text-slate-600 font-bold">Kode Antrean D-</span>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-2">
          <span className="font-mono text-xs text-slate-500 uppercase tracking-widest block font-bold">TOTAL ANTRIAN REGULER</span>
          <span className="text-4xl font-black text-slate-900 font-mono block">{totalReguler}</span>
          <span className="text-xs text-slate-600 font-bold">Kode Antrean P-</span>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-2">
          <span className="font-mono text-xs text-slate-500 uppercase tracking-widest block font-bold">PENDING VERIFIKASI</span>
          <span className="text-4xl font-black text-slate-900 font-mono block text-yellow-600">{totalPending}</span>
          <span className="text-xs text-slate-600 font-bold">Perlu review berkas</span>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-2">
          <span className="font-mono text-xs text-slate-500 uppercase tracking-widest block font-bold">TERVERIFIKASI (SIAP FOTO)</span>
          <span className="text-4xl font-black text-slate-900 font-mono block text-green-600">{totalVerified}</span>
          <span className="text-xs text-slate-600 font-bold">Menunggu panggilan biometrik</span>
        </div>
      </section>

      {/* Main Table section */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden" aria-label="Tabel Pemohon Antrean">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-mono text-xs uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">No. Tiket</th>
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
                      
                      {/* Queue Number */}
                      <td className="p-4 font-mono font-bold text-base text-slate-900">
                        {res.queueNumber}
                      </td>

                      {/* Name & NIK */}
                      <td className="p-4 space-y-0.5">
                        <span className="block font-bold">{res.user.name.toUpperCase()}</span>
                        <span className="block text-xs font-mono text-slate-500">NIK: {res.user.nik}</span>
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
                            {displayCategory}
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
                            : res.status === 'VERIFIED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : res.status === 'COMPLETED'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {res.status}
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
                              Verifikasi Berkas
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
                          {res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                            <button
                              disabled={actionLoadingId === res.id}
                              onClick={() => handleUpdateStatus(res.id, 'CANCELLED')}
                              className="px-2.5 py-1.5 border border-red-300 hover:bg-red-50 disabled:opacity-50 text-red-700 font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer"
                            >
                              Batalkan
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

    </div>
  );
};

export default AdminDashboard;
