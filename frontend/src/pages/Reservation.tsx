import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import reservationService from '../services/reservationService';
import type { User } from '../services/authService';
import type { Quota, SingleReservationData } from '../services/reservationService';
import { AuthForm } from '../components/AuthForm';
import { QuotaSelector } from '../components/QuotaSelector';
import type { ReservationFormInputs } from '../components/QuotaSelector';
import { PriorityFields } from '../components/PriorityFields';
import { ErrorBanner } from '../components/ErrorBanner';

export const Reservation: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loadingQuotas, setLoadingQuotas] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyReservations, setHistoryReservations] = useState<SingleReservationData[]>([]);

  const loadHistory = async () => {
    if (!token) return;
    try {
      const res = await reservationService.getAllReservations(token);
      setHistoryReservations(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ReservationFormInputs>({
    defaultValues: {
      needs_companion: false,
      disabilityType: '',
      companionName: '',
      companionNik: '',
    }
  });

  const needsCompanion = watch('needs_companion');
  const selectedQuotaId = watch('quota_id');
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);

  const loadQuotas = async () => {
    setLoadingQuotas(true);
    setApiError(null);
    try {
      const response = await reservationService.getQuotas();
      setQuotas(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('Gagal memuat daftar kuota pelayanan.');
      }
    } finally {
      setLoadingQuotas(false);
    }
  };

  useEffect(() => {
    loadQuotas();
    if (token) {
      loadHistory();
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setApiError(null);
  };

  const handleAuthError = (message: string) => {
    setApiError(message);
  };

  const handleLogout = () => {
    authService.clearSession();
    setToken(null);
    setUser(null);
  };

  const onBookingSubmit = async (data: ReservationFormInputs) => {
    setApiError(null);

    if (!token) {
      setApiError('Anda harus masuk log terlebih dahulu.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('quota_id', data.quota_id);
      formData.append('needs_companion', String(data.needs_companion));
      
      let disabilityTypeFormatted = '';
      if (data.needs_companion) {
        disabilityTypeFormatted = data.disabilityType || 'lansia';
        
        const assistanceList: string[] = [];
        if (data.assistance_wheelchair) assistanceList.push('Kursi Roda');
        if (data.assistance_guiding) assistanceList.push('Pendampingan Petugas');
        if (data.assistance_counter) assistanceList.push('Loket Prioritas');
        if (data.assistance_comm) assistanceList.push('Bantuan Komunikasi');

        if (assistanceList.length > 0) {
          disabilityTypeFormatted += ` | Bantuan: ${assistanceList.join(', ')}`;
        }
      } else {
        disabilityTypeFormatted = 'reguler';
      }
      disabilityTypeFormatted += ` | Jenis: ${data.passport_type || 'baru'}`;

      formData.append('disabilityType', disabilityTypeFormatted);
      
      if (data.needs_companion) {
        formData.append('companionName', data.companionName || '');
        formData.append('companionNik', data.companionNik || '');
      }

      if (uploadedFiles && uploadedFiles.length > 0) {
        for (let i = 0; i < uploadedFiles.length; i++) {
          formData.append('documents', uploadedFiles[i]);
        }
      }

      const res = await reservationService.createReservation(formData, token);
      reset();
      setUploadedFiles(null);
      navigate(`/ticket/${res.data.reservation_id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('Gagal membuat reservasi antrean.');
      }
    }
  };

  return (
    <div className="w-full px-8 md:px-12 py-12 focus-visible:outline-none bg-brand-bg">
      
      {!token ? (
        <div className="max-w-md mx-auto py-12">
          <ErrorBanner message={apiError} />
          <AuthForm onSuccess={handleAuthSuccess} onError={handleAuthError} />
        </div>
      ) : (
        <div className="grid gap-10 md:grid-cols-12 items-start">
          
          {/* Left Column: Profile Info & Steps (Sticky Sidebar) */}
          <aside className="md:col-span-4 space-y-6 md:sticky md:top-6">
            
            {/* User Profile Card */}
            <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">PEMOHON AKTIF / LOG</span>
              <div className="space-y-1">
                <span className="block text-xl font-bold text-slate-900 leading-tight">{user?.name.toUpperCase()}</span>
                <span className="block font-mono text-sm text-slate-600">NIK: {user?.nik}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 border border-red-300 text-red-700 hover:bg-red-50 active:bg-red-100 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer text-center"
                aria-label="Keluar dari akun Anda"
              >
                Keluar Sesi (Logout)
              </button>
            </div>

            {/* Instruction Steps Map */}
            <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">PETUNJUK PENGISIAN</span>
              <ul className="space-y-4 text-sm text-slate-700 font-medium">
                <li className="flex gap-3">
                  <span className="font-mono font-bold text-slate-950">1.</span>
                  <p>Pilih salah satu jadwal kedatangan yang masih memiliki kuota sisa.</p>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono font-bold text-slate-950">2.</span>
                  <p>Aktifkan jalur prioritas jika Anda difabel/lansia dan isi nama pendamping Anda.</p>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono font-bold text-slate-950">3.</span>
                  <p>Unggah lampiran dokumen identitas (KTP/KK) dalam format PDF/JPG.</p>
                </li>
              </ul>
            </div>

            {/* User Reservation History Card */}
            <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">RIWAYAT ANTREAN ANDA</span>
              {historyReservations.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium">Belum ada riwayat antrean terdaftar.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {historyReservations.map((res) => {
                    const appDate = new Date(res.quota.date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    });
                    
                    return (
                      <div key={res.id} className="p-4 border border-slate-200 rounded bg-slate-50/50 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-sm text-slate-900">{res.queueNumber}</span>
                          <span className={`px-2 py-0.5 rounded-[3px] font-mono text-[9px] font-bold uppercase tracking-wider border ${
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
                        </div>
                        <div className="text-[11px] text-slate-700 font-semibold">
                          <span>Jadwal: {appDate.toUpperCase()} ({res.quota.startTime} - {res.quota.endTime} WIB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/ticket/${res.id}`)}
                          className="w-full py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-colors text-center block cursor-pointer"
                        >
                          Lihat / Cetak
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </aside>

          {/* Right Column: Interactive Form Fields */}
          <div className="md:col-span-8 space-y-8">
            
            <ErrorBanner message={apiError} />

            <form onSubmit={handleSubmit(onBookingSubmit)} className="space-y-8">
              
              <QuotaSelector 
                quotas={quotas} 
                loading={loadingQuotas} 
                onRefresh={loadQuotas} 
                register={register} 
                errors={errors} 
                selectedQuotaId={selectedQuotaId}
              />

              <PriorityFields 
                register={register} 
                needsCompanion={needsCompanion} 
                watch={watch}
              />

              {/* Premium Custom File Dropzone Uploader */}
              <fieldset className="p-8 bg-white border border-slate-200 rounded-lg shadow-sm space-y-6">
                <div className="space-y-1">
                  <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 font-bold block">BERKAS PENDUKUNG / UPLOADS</span>
                  <legend className="text-2xl font-black tracking-tight text-slate-900">3. Unggah Berkas Dokumen Pendukung</legend>
                </div>
                <p className="text-base text-slate-600">
                  Unggah foto KTP, Kartu Keluarga, atau surat pendukung. Maksimal ukuran berkas adalah 2MB per berkas. Hanya menerima format PDF, JPEG, dan PNG.
                </p>

                <div className="space-y-4">
                  <label 
                    htmlFor="document-upload"
                    className="border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-lg p-10 text-center bg-slate-50/50 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-slate-900"
                  >
                    <input
                      id="document-upload"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setUploadedFiles(e.target.files)}
                      className="sr-only"
                    />
                    
                    {/* SVG Upload Cloud Icon */}
                    <svg className="w-10 h-10 text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="font-bold text-lg text-slate-900">Pilih atau Seret Berkas ke Sini</span>
                    <span className="text-sm text-slate-600">Mendukung file PDF, PNG, atau JPG (Maks. 2MB per file)</span>
                  </label>
                  
                  {uploadedFiles && uploadedFiles.length > 0 && (
                    <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg space-y-2" aria-live="polite">
                      <p className="font-bold text-xs text-slate-600 uppercase tracking-widest font-mono">Berkas Terpilih ({uploadedFiles.length}):</p>
                      <ul className="space-y-2">
                        {Array.from(uploadedFiles).map((file, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm font-semibold text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded shadow-sm">
                            <span>{file.name}</span>
                            <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </fieldset>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-mono text-xs uppercase tracking-[0.2em] font-bold py-4.5 px-6 rounded focus:ring-2 focus:ring-slate-900 focus:outline-none transition-colors text-lg cursor-pointer"
              >
                Kirim Reservasi Antrean
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
};

export default Reservation;
