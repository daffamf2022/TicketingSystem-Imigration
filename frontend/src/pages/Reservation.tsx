import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import reservationService from '../services/reservationService';
import type { User } from '../services/authService';
import type { Quota, SingleReservationData } from '../services/reservationService';
import { QuotaSelector } from '../components/QuotaSelector';
import type { ReservationFormInputs } from '../components/QuotaSelector';
import { PriorityFields } from '../components/PriorityFields';
import { ErrorBanner } from '../components/ErrorBanner';

const documentSlots = [
  { type: 'KTP', label: 'e-KTP Pemohon', description: 'Opsional' },
  { type: 'KK', label: 'Kartu Keluarga (KK)', description: 'Opsional' },
  {
    type: 'DOKUMEN_PENDUKUNG',
    label: 'Dokumen Pendukung',
    description: 'Opsional, semua jenis berkas dapat diunggah',
  },
] as const;

type DocumentType = typeof documentSlots[number]['type'];
type SelectedDocuments = Partial<Record<DocumentType, File>>;

export const Reservation: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const normalizedRole = user?.role === 'ADMIN' ? 'OFFICER' : user?.role;
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [loadingQuotas, setLoadingQuotas] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyReservations, setHistoryReservations] = useState<SingleReservationData[]>([]);

  const loadHistory = async () => {
    if (!token || normalizedRole === 'OFFICER') return;
    try {
      const res = await reservationService.getAllReservations(token);
      setHistoryReservations(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ReservationFormInputs>({
    defaultValues: {
      name: user?.name || '',
      nik: user?.nik || '',
      email: user?.email || '',
      applicant_type: 'pemohon',
      representative_name: '',
      representative_nik: '',
      needs_companion: false,
      disabilityType: '',
      companionName: '',
      companionNik: '',
    }
  });

  const needsCompanion = watch('needs_companion');
  const selectedPassportType = watch('passport_type');
  const selectedQuotaId = watch('quota_id');
  const [uploadedFiles, setUploadedFiles] = useState<SelectedDocuments>({});
  const [documentErrors, setDocumentErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const [documentPreviewUrls, setDocumentPreviewUrls] = useState<Partial<Record<DocumentType, string>>>({});
  const activePreviewUrls = useRef(new Set<string>());

  useEffect(() => {
    const previewUrls = activePreviewUrls.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const handleDocumentChange = (type: DocumentType, file: File | undefined) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setDocumentErrors((current) => ({
        ...current,
        [type]: 'Ukuran berkas melebihi batas 2MB.',
      }));
      return;
    }

    const previousUrl = documentPreviewUrls[type];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      activePreviewUrls.current.delete(previousUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    activePreviewUrls.current.add(previewUrl);
    setDocumentPreviewUrls((current) => ({ ...current, [type]: previewUrl }));
    setDocumentErrors((current) => ({ ...current, [type]: undefined }));
    setUploadedFiles((current) => ({ ...current, [type]: file }));
  };

  const removeDocument = (type: DocumentType) => {
    const previewUrl = documentPreviewUrls[type];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      activePreviewUrls.current.delete(previewUrl);
    }
    setDocumentPreviewUrls((current) => {
      const next = { ...current };
      delete next[type];
      return next;
    });
    setUploadedFiles((current) => {
      const next = { ...current };
      delete next[type];
      return next;
    });
    setDocumentErrors((current) => ({ ...current, [type]: undefined }));
  };

  useEffect(() => {
    if (!needsCompanion) {
      reset((currentValues) => ({
        ...currentValues,
        disabilityType: '',
        companionName: '',
        companionNik: '',
        assistance_wheelchair: false,
        assistance_guiding: false,
        assistance_counter: false,
        assistance_comm: false,
      }));
    }
  }, [needsCompanion, reset]);
  const [activeStep, setActiveStep] = useState(1);
  const totalSteps = 7;
  const wizardSteps = [
    'Pilih Kategori Prioritas',
    'Pilih Jenis Permohonan',
    'Isi Data Diri',
    'Unggah Persyaratan',
    'Pilih Jadwal',
    'Review Permohonan',
    'Kirim Permohonan',
  ];

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
    if (token && normalizedRole === 'OFFICER') {
      navigate('/admin', { replace: true });
      return;
    }

    loadQuotas();

    const handleQuotaRefresh = () => {
      loadQuotas();
    };

    window.addEventListener('quota-updated', handleQuotaRefresh);

    if (token && normalizedRole !== 'OFFICER') {
      loadHistory();
      const intervalId = window.setInterval(() => {
        loadHistory();
      }, 15000);

      const handleReservationStatusChange = () => {
        loadHistory();
      };

      window.addEventListener('reservation-status-change', handleReservationStatusChange);

      return () => {
        window.clearInterval(intervalId);
        window.removeEventListener('reservation-status-change', handleReservationStatusChange);
        window.removeEventListener('quota-updated', handleQuotaRefresh);
      };
    }

    return () => {
      window.removeEventListener('quota-updated', handleQuotaRefresh);
    };
  }, [token, normalizedRole, navigate]);

  const handleLogout = () => {
    authService.clearSession();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  const roleLabel = 'PEMOHON AKTIF / LOGIN';
  const applicantDisplayName = user?.name?.toUpperCase() || 'PEMOHON';
  const applicantDisplayNik = user?.nik || '-';
  const getStatusLabel = (status: string) => ({
    PENDING: 'Menunggu Verifikasi',
    VERIFIED: 'Disetujui',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REJECTED: 'Ditolak',
    DITOLAK: 'Ditolak',
  }[status] ?? status);

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  const handleWizardSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeStep === 1 && !needsCompanion) {
      setApiError('Sistem ini hanya melayani pemohon dari kategori prioritas. Pilih kategori yang sesuai untuk melanjutkan.');
      return;
    }
    if (activeStep === 1) {
      setApiError(null);
    }
    if (activeStep < totalSteps) {
      nextStep();
      return;
    }
    handleSubmit(onBookingSubmit)(event);
  };

  const onBookingSubmit = async (data: ReservationFormInputs) => {
    setApiError(null);

    if (!token || !user || normalizedRole !== 'CUSTOMER') {
      setApiError('Silakan masuk menggunakan akun pemohon sebelum mengajukan permohonan.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('quota_id', data.quota_id);
      formData.append('needs_companion', String(data.needs_companion));
      formData.append('passport_type', data.passport_type || 'baru');

      let disabilityTypeFormatted = '';
      const companionName = data.needs_companion ? (data.companionName || '').trim() : '';
      const companionNik = data.needs_companion ? (data.companionNik || '').trim() : '';

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
        disabilityTypeFormatted = 'nonprioritas';
      }
      disabilityTypeFormatted += ` | Jenis: ${data.passport_type || 'baru'}`;

      formData.append('disabilityType', disabilityTypeFormatted);

      if (data.needs_companion) {
        formData.append('companionName', companionName);
        formData.append('companionNik', companionNik);
      } else {
        formData.append('companionName', '');
        formData.append('companionNik', '');
      }

      documentSlots.forEach(({ type }) => {
        const file = uploadedFiles[type];
        if (file) {
          formData.append('documents', file);
          formData.append('document_types', type);
        }
      });

      const res = await reservationService.createReservation(formData, token || undefined);
      reset();
      setUploadedFiles({});
      setDocumentPreviewUrls({});
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
      
      <div className="grid gap-10 md:grid-cols-12 items-start">
          
          {/* Left Column: Profile Info & Steps (Sticky Sidebar) */}
          <aside className="md:col-span-4 space-y-6 md:sticky md:top-6">
            
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-[#f7fbff] to-white p-6 border border-blue-100 rounded-lg shadow-[0_12px_30px_rgba(11,95,168,0.05)] space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-[#0b5fa8] font-bold block">
                {roleLabel}
              </span>
              <div className="space-y-1">
                <span className="block text-xl font-bold text-slate-900 leading-tight">{applicantDisplayName}</span>
                {user?.username && <span className="block text-sm text-slate-600">Nama pengguna: {user.username}</span>}
                <span className="block font-mono text-sm text-slate-600">NIK: {applicantDisplayNik}</span>
              </div>
              {token ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2 border border-red-300 text-red-700 hover:bg-red-50 active:bg-red-100 font-mono text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer text-center"
                  aria-label="Keluar dari akun Anda"
                >
                  Keluar Sesi (Logout)
                </button>
              ) : (
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  Identitas permohonan akan terikat pada akun pemohon yang sedang masuk.
                </p>
              )}
            </div>

            {/* Instruction Steps Map */}
            <div className="premium-card p-6 rounded-lg space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-[#0b5fa8] font-bold block">ALUR PENGAJUAN</span>
              <ol className="space-y-3 text-sm text-slate-700 font-medium">
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">1.</span><p>Pilih Kategori Prioritas.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">2.</span><p>Pilih Jenis Permohonan.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">3.</span><p>Isi Data Diri.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">4.</span><p>Unggah Persyaratan.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">5.</span><p>Pilih Jadwal.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">6.</span><p>Review Permohonan.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">7.</span><p>Kirim Permohonan.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">8.</span><p>Ambil Kode/Bukti Permohonan.</p></li>
                <li className="flex gap-3"><span className="font-mono font-bold text-slate-950">9.</span><p>Datang Sesuai Jadwal.</p></li>
              </ol>
            </div>

            {/* User Reservation History Card */}
            <div className="premium-card p-6 rounded-lg space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-[#0b5fa8] font-bold block">RIWAYAT ANTREAN ANDA</span>
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
                        <div className="flex justify-between items-start gap-2">
                          <span className="min-w-0">
                            <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500">Kode Pengajuan</span>
                            <span className="block font-mono font-bold text-sm text-slate-900 break-all">{res.applicationCode}</span>
                            <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-slate-500">Nomor Antrean</span>
                            <span className="block font-mono font-bold text-sm text-slate-900">{res.queueNumber || 'Belum diberikan'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-[3px] font-mono text-[9px] font-bold uppercase tracking-wider border ${
                            res.status === 'PENDING' 
                              ? 'bg-yellow-50 text-yellow-800 border-yellow-200' 
                              : res.status === 'VERIFIED' || res.status === 'COMPLETED'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                          }`}>
                            {getStatusLabel(res.status)}
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

            <div className="premium-card p-6 rounded-lg">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#0b5fa8] font-bold">Alur Permohonan</p>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Proses Pengajuan Paspor Prioritas</h2>
                  </div>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] font-bold text-[#0b5fa8]">
                    Tahap {activeStep}/{totalSteps}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                  {wizardSteps.map((step, index) => (
                    <div
                      key={step}
                      className={`relative rounded-xl border p-3 transition-all ${
                        index + 1 === activeStep
                          ? 'border-[#0b5fa8] bg-[#edf6ff] text-[#0b5fa8] shadow-[0_8px_24px_rgba(11,95,168,0.08)]'
                          : index + 1 < activeStep
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black border ${
                          index + 1 === activeStep ? 'bg-white border-[#0b5fa8] text-[#0b5fa8]' : 'bg-white border-current'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-[0.62rem] font-mono font-bold uppercase tracking-[0.16em]">Step</span>
                      </div>
                      <p className="mt-2 text-[11px] font-extrabold leading-snug">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleWizardSubmit} className="space-y-8">
              {activeStep === 1 && (
                <PriorityFields register={register} needsCompanion={needsCompanion} watch={watch} mode="category" />
              )}

              {activeStep === 2 && (
                <fieldset className="p-8 bg-white border border-slate-200 rounded-lg shadow-sm space-y-6">
                  <div className="space-y-1">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 font-bold block">Jenis Permohonan</span>
                    <legend className="text-2xl font-black tracking-tight text-slate-900">2. Pilih Jenis Permohonan</legend>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="passport-type" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Jenis Pengajuan Paspor</label>
                    <select
                      id="passport-type"
                      {...register('passport_type', { required: 'Jenis pengajuan paspor wajib dipilih.' })}
                      className="px-3 py-3 border border-slate-300 rounded w-full bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="baru">Paspor Baru (Pertama kali membuat paspor)</option>
                      <option value="perpanjang">Perpanjangan Paspor (Habis masa berlaku)</option>
                      <option value="hilang_rusak">Penggantian Paspor Hilang atau Rusak</option>
                    </select>
                  </div>
                </fieldset>
              )}

              {activeStep === 3 && (
                <PriorityFields register={register} needsCompanion={needsCompanion} watch={watch} mode="identity" readOnlyIdentity />
              )}

              {activeStep === 4 && (
                <fieldset className="premium-card p-8 rounded-lg space-y-6">
                  <div className="space-y-1">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0b5fa8] font-bold block">Berkas pendukung / Upload</span>
                    <legend className="text-2xl font-black tracking-tight text-slate-900">4. Unggah Persyaratan</legend>
                  </div>
                  <p className="text-base text-slate-600">
                    Dokumen bersifat opsional. Unggah berkas dalam format apa pun dengan ukuran maksimal 2MB per berkas.
                  </p>

                  <ul className="space-y-3">
                    {documentSlots.map(({ type, label, description }) => {
                      const file = uploadedFiles[type];
                      const inputId = `document-upload-${type.toLowerCase()}`;

                      return (
                        <li key={type} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">{label}</p>
                              <p className="mt-1 text-sm text-slate-600">{description}</p>
                              <p className={`mt-2 text-sm font-semibold ${file ? 'text-green-700' : 'text-slate-500'}`} aria-live="polite">
                                {file ? `Siap diunggah: ${file.name}` : 'Belum diunggah'}
                              </p>
                              {documentErrors[type] && (
                                <p className="mt-1 text-sm font-semibold text-red-700" role="alert">{documentErrors[type]}</p>
                              )}
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <input
                                id={inputId}
                                type="file"
                                onChange={(event) => {
                                  handleDocumentChange(type, event.currentTarget.files?.[0]);
                                  event.currentTarget.value = '';
                                }}
                                className="peer sr-only"
                              />
                              <label
                                htmlFor={inputId}
                                className="inline-flex min-h-11 cursor-pointer items-center rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600"
                              >
                                {file ? 'Ganti' : 'Unggah Berkas'}
                              </label>
                              {file && (
                                <>
                                  <a
                                    href={documentPreviewUrls[type]}
                                    download={file.name}
                                    className="inline-flex min-h-11 items-center rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
                                  >
                                    Unduh
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => removeDocument(type)}
                                    className="inline-flex min-h-11 items-center rounded border border-red-300 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                                  >
                                    Hapus
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              )}

              {activeStep === 5 && (
                <QuotaSelector 
                  quotas={quotas} 
                  loading={loadingQuotas} 
                  onRefresh={loadQuotas} 
                  register={register} 
                  errors={errors} 
                  selectedQuotaId={selectedQuotaId}
                />
              )}

              {activeStep === 6 && (
                <fieldset className="premium-card p-8 rounded-lg space-y-6">
                  <div className="space-y-1">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0b5fa8] font-bold block">Review Permohonan</span>
                    <legend className="text-2xl font-black tracking-tight text-slate-900">6. Review Permohonan</legend>
                  </div>

                  <div className="space-y-4 text-sm text-slate-700">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold">Data Diri</p>
                        <button type="button" onClick={() => setActiveStep(3)} className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-mono text-[10px] uppercase tracking-[0.14em] font-bold rounded cursor-pointer">
                          Ubah
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Nama</p>
                          <p className="mt-1 font-bold text-slate-900">{user?.name || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">NIK</p>
                          <p className="mt-1 font-bold text-slate-900">{user?.nik || 'Belum diisi'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Email</p>
                          <p className="mt-1 font-bold text-slate-900 break-all">{user?.email || 'Belum diisi'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold">Kategori & Permohonan</p>
                        <button type="button" onClick={() => setActiveStep(1)} className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-mono text-[10px] uppercase tracking-[0.14em] font-bold rounded cursor-pointer">
                          Ubah
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Kategori</p>
                          <p className="mt-1 font-bold text-slate-900">{needsCompanion ? 'Prioritas' : 'Kategori prioritas wajib dipilih'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Jenis Permohonan</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {selectedPassportType === 'baru'
                              ? 'Paspor Baru'
                              : selectedPassportType === 'perpanjang'
                                ? 'Perpanjangan Paspor'
                                : watch('passport_type') === 'hilang_rusak'
                                  ? 'Paspor Hilang / Rusak'
                                  : 'Belum dipilih'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Pengisi Formulir</p>
                          <p className="mt-1 font-bold text-slate-900">{watch('applicant_type') === 'pendamping' ? 'Pendamping / Perwakilan' : 'Pemohon Sendiri'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Kategori Prioritas</p>
                          <p className="mt-1 font-bold text-slate-900">{needsCompanion ? (watch('disabilityType') || 'Prioritas') : 'Tidak ada'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold">Pendamping & Kebutuhan Bantuan</p>
                        <button type="button" onClick={() => setActiveStep(1)} className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-mono text-[10px] uppercase tracking-[0.14em] font-bold rounded cursor-pointer">
                          Ubah
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Pendamping</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {watch('companionName') || (needsCompanion ? 'Tidak ada data pendamping' : 'Tidak diperlukan')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">NIK Pendamping</p>
                          <p className="mt-1 font-bold text-slate-900">{watch('companionNik') || '-'}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Kebutuhan Bantuan</p>
                        <ul className="mt-2 space-y-1 text-slate-900">
                          {watch('assistance_wheelchair') && <li>• Kursi Roda</li>}
                          {watch('assistance_guiding') && <li>• Pendampingan Petugas</li>}
                          {watch('assistance_counter') && <li>• Akses Loket Prioritas</li>}
                          {watch('assistance_comm') && <li>• Bantuan Komunikasi</li>}
                          {!watch('assistance_wheelchair') && !watch('assistance_guiding') && !watch('assistance_counter') && !watch('assistance_comm') && <li>• Tidak ada kebutuhan bantuan khusus</li>}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold">Dokumen yang Diunggah</p>
                        <button type="button" onClick={() => setActiveStep(4)} className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-mono text-[10px] uppercase tracking-[0.14em] font-bold rounded cursor-pointer">
                          Ubah
                        </button>
                      </div>
                      <div className="mt-3">
                        <ul className="space-y-2 text-slate-900">
                          {documentSlots.map(({ type, label }) => {
                            const file = uploadedFiles[type];
                            return (
                              <li key={type} className="flex items-center justify-between gap-3 border border-slate-200 bg-white rounded px-3 py-2">
                                <span className="min-w-0">
                                  <span className="block font-bold">{label}</span>
                                  <span className="block truncate text-sm text-slate-600">{file?.name || 'Belum diunggah'}</span>
                                </span>
                                <span className={`shrink-0 text-[10px] font-mono uppercase tracking-[0.12em] ${file ? 'text-green-700' : 'text-slate-500'}`}>
                                  {file ? 'Siap diunggah' : 'Belum diunggah'}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-slate-500 font-bold">Jadwal</p>
                        <button type="button" onClick={() => setActiveStep(5)} className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-900 font-mono text-[10px] uppercase tracking-[0.14em] font-bold rounded cursor-pointer">
                          Ubah
                        </button>
                      </div>
                      <p className="mt-3 font-bold text-slate-900">
                        {(() => {
                          const selected = quotas.find((quota) => quota.id === selectedQuotaId);
                          if (!selected) return 'Belum memilih jadwal';
                          return `${selected.date.split('T')[0]} • ${selected.start_time} - ${selected.end_time} WIB`;
                        })()}
                      </p>
                    </div>
                  </div>
                </fieldset>
              )}

              {activeStep === 7 && (
                <fieldset className="premium-card p-8 rounded-lg space-y-5">
                  <div className="space-y-1">
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#0b5fa8] font-bold block">Konfirmasi Akhir</span>
                    <legend className="text-2xl font-black tracking-tight text-slate-900">7. Kirim Permohonan</legend>
                  </div>
                  <p className="text-base text-slate-600">
                    Pastikan semua data, jadwal, dan berkas sudah benar. Setelah dikirim, Anda akan menerima bukti antrean dan dapat datang sesuai jadwal yang dipilih.
                  </p>
                </fieldset>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-mono text-xs uppercase tracking-[0.2em] font-bold py-3.5 px-6 rounded transition-colors cursor-pointer"
                  >
                    Kembali
                  </button>
                )}

                <button
                  type="submit"
                  className={`${activeStep === 1 ? 'w-full' : 'flex-1'} bg-gradient-to-r from-[#0b5fa8] to-[#0d7fc8] hover:brightness-105 active:brightness-95 text-white font-mono text-xs uppercase tracking-[0.2em] font-bold py-4 px-6 rounded focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors cursor-pointer shadow-[0_12px_25px_rgba(11,95,168,0.22)]`}
                >
                  {activeStep < totalSteps ? 'Lanjut Ke Langkah Berikutnya' : 'Kirim Permohonan'}
                </button>
              </div>

            </form>
          </div>

        </div>
    </div>
  );
};

export default Reservation;
