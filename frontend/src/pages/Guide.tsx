import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import reservationService, { type Quota } from '../services/reservationService';
import prambananImage from '../assets/prambanan.jpg';

export const Guide: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [liveQuotas, setLiveQuotas] = useState<Quota[]>([]);
  const [liveQuotaLoading, setLiveQuotaLoading] = useState(false);
  const [liveQuotaError, setLiveQuotaError] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        window.requestAnimationFrame(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    const loadLiveQuotas = async () => {
      try {
        setLiveQuotaLoading(true);
        const response = await reservationService.getQuotas();
        const activeQuotaData = (response.data || []).filter((quota) => quota.remaining_quota > 0);
        const totalRemainingQuota = activeQuotaData.reduce((sum, quota) => sum + quota.remaining_quota, 0);
        const normalizedTotal = Math.min(Math.max(totalRemainingQuota, 0), 15);

        if (activeQuotaData.length === 0) {
          setLiveQuotas([]);
        } else {
          const summaryDate = activeQuotaData[0].date;
          setLiveQuotas([
            {
              id: 'priority-summary-today',
              date: summaryDate,
              start_time: 'Hari Ini',
              end_time: 'Prioritas',
              max_quota: 15,
              remaining_quota: normalizedTotal,
            },
          ]);
        }
        setLiveQuotaError(null);
      } catch (error) {
        setLiveQuotaError(error instanceof Error ? error.message : 'Kuota tidak dapat dipantau saat ini.');
      } finally {
        setLiveQuotaLoading(false);
      }
    };

    loadLiveQuotas();

    const handleQuotaUpdate = () => {
      loadLiveQuotas();
    };

    window.addEventListener('quota-updated', handleQuotaUpdate);
    const intervalId = window.setInterval(loadLiveQuotas, 30000);

    return () => {
      window.removeEventListener('quota-updated', handleQuotaUpdate);
      window.clearInterval(intervalId);
    };
  }, []);

  // Dynamic Checker state variables
  const [selectedCategory, setSelectedCategory] = useState<string>('lansia');
  const [selectedPassportType, setSelectedPassportType] = useState<string>('baru');
  const [disabilityType, setDisabilityType] = useState<string>('');
  
  // Custom document checkboxes state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const handleDocToggle = (docName: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  // All categories on this page are priority services
  const isPriority = true;

  // Generate dynamic checklists based on selected filters
  const getDocuments = () => {
    const list: string[] = [];

    // 1. Base documents based on category
    if (selectedCategory === 'balita') {
      list.push('Akta Kelahiran Anak (Asli & Fotokopi)');
      list.push('Kartu Keluarga (KK) asli anak');
      list.push('KTP Elektronik kedua Orang Tua (Asli & Fotokopi)');
      list.push('Buku Nikah / Akta Cerai Orang Tua (Asli & Fotokopi)');
    } else if (selectedCategory === 'lansia') {
      list.push('KTP Elektronik asli Pemohon');
      list.push('Kartu Keluarga (KK) asli Pemohon');
      list.push('Dokumen penunjang identitas alternatif (Surat Baptis / Ijazah / Surat Nikah tua jika Akta Kelahiran tidak ada)');
    } else if (selectedCategory === 'disabilitas') {
      list.push('KTP Elektronik asli Pemohon');
      list.push('Kartu Keluarga (KK) asli Pemohon');
      list.push('Akta Kelahiran / Ijazah / Surat Nikah asli Pemohon');
      list.push('KTP Pendamping asli (jika didampingi kerabat)');
      list.push('Surat Keterangan Disabilitas / Bantuan Medis (opsional)');
    } else if (selectedCategory === 'hamil') {
      list.push('KTP Elektronik asli Pemohon');
      list.push('Kartu Keluarga (KK) asli Pemohon');
      list.push('Akta Kelahiran / Ijazah / Surat Nikah asli Pemohon');
      list.push('Buku KIA / Surat Keterangan Dokter Kandungan (opsional, mempermudah akses kursi roda)');
    } else {
      // Default document set for non-priority visitors viewing the public checklist.
      list.push('KTP Elektronik asli Pemohon');
      list.push('Kartu Keluarga (KK) asli Pemohon');
      list.push('Akta Kelahiran / Ijazah / Surat Nikah asli Pemohon (yang memuat nama, tanggal lahir, dan nama orang tua)');
    }

    // 2. Extra documents based on passport type
    if (selectedPassportType === 'perpanjang') {
      list.push('Paspor lama asli');
      list.push('Fotokopi halaman identitas paspor lama');
    } else if (selectedPassportType === 'hilang_rusak') {
      list.push('Surat Laporan Kehilangan dari Kepolisian (wajib dilampirkan jika paspor hilang)');
      list.push('Paspor lama yang rusak (wajib dilampirkan jika paspor rusak)');
      list.push('KTP asli pemohon yang masih berlaku');
    }

    return list;
  };

  const activeDocumentsList = getDocuments();

  return (
    <div className="w-full pt-0 pb-16 space-y-20 focus-visible:outline-none bg-brand-bg px-0 md:px-0">
      
      {/* Hero Section */}
      <div className="-mx-0 md:-mx-0">
        <section
          className="relative w-full overflow-hidden min-h-[600px]"
          aria-label="Pengenalan Layanan"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(6, 38, 74, 0.84), rgba(11, 95, 168, 0.7) 55%, rgba(9, 45, 83, 0.86)), url(${prambananImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 55%',
          }}
        >
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/50" />
            <div className="absolute -right-12 -top-12 h-72 w-72 rounded-full border border-white/40" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 py-24 px-6 text-center text-white sm:px-10 md:px-14" style={{ margin: '0 auto' }}>
            <div className="space-y-4">
              <span className="font-mono text-xs md:text-sm uppercase tracking-[0.25em] text-slate-200 font-bold block">
                KANTOR IMIGRASI KELAS I TPI YOGYAKARTA
              </span>
              <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-tight">
                SISTEM INFORMASI LAYANAN PRIORITAS PASPOR
              </h1>
              <p className="text-base md:text-xl text-slate-200/90 leading-relaxed max-w-4xl mx-auto font-medium">
                Layanan pengurusan antrean paspor online yang dirancang ramah untuk semua kalangan, memudahkan lansia dan penyandang disabilitas mendapatkan prioritas pelayanan langsung di lokasi.
              </p>
            </div>

            <div className="mx-auto flex flex-wrap gap-4 justify-center pt-2">
              <button
                onClick={() => navigate('/reservation')}
                className="px-10 py-5 bg-gradient-to-r from-[#0b5fa8] to-[#0d7fc8] hover:brightness-105 text-white font-bold rounded text-lg transition-all focus:ring-2 focus:ring-blue-200 cursor-pointer shadow-[0_12px_25px_rgba(11,95,168,0.28)]"
              >
                Mulai Buat Antrean
              </button>
              <a
                href="#checker-widget"
                className="px-10 py-5 bg-white/90 border border-blue-100 hover:bg-blue-50 text-slate-900 font-bold rounded text-lg transition-all text-center focus:ring-2 focus:ring-blue-200"
              >
                Cek Syarat Prioritas
              </a>
            </div>
          </div>
        </section>
      </div>

      <section className="w-full px-6 md:px-10">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(13,94,168,0.05)] md:p-8">
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            {['Beranda', 'Informasi Layanan', 'Persyaratan', 'FAQ', 'AJUKAN PERMOHONAN'].map((item, index) => (
              <React.Fragment key={item}>
                <span
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-mono font-black uppercase tracking-[0.16em] ${
                    item === 'AJUKAN PERMOHONAN'
                      ? 'border-[#0b5fa8] bg-[#0b5fa8] text-white shadow-[0_8px_20px_rgba(11,95,168,0.18)]'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  {item}
                </span>
                {index < 4 && <span className="hidden text-slate-400 md:inline">→</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="glass-panel mt-8 overflow-hidden rounded-[28px] bg-gradient-to-r from-[#edf6ff] via-white to-[#eef7ff] p-6 shadow-[0_18px_45px_rgba(13,94,168,0.08)] md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0d5ea8]">Ketersediaan Kuota Saat Ini</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Kuota Prioritas Hari Ini</h2>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                {liveQuotaLoading ? 'Memperbarui...' : 'Tersedia Hari Ini'}
              </div>
            </div>

            {liveQuotaError ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {liveQuotaError}
              </div>
            ) : (
              <div className="mt-6">
                {liveQuotas.length > 0 ? (
                  liveQuotas.map((quota) => {
                    const quotaDate = new Date(quota.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={quota.id}
                        className="premium-card rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(13,94,168,0.08)]"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                          <div>
                            <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">Kuota tersedia hari ini</span>
                            <p className="mt-2 text-xl font-black text-slate-900">{quotaDate}</p>
                          </div>
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                            Ketersediaan kuota saat ini
                          </span>
                        </div>

                        <div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white">
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-300">Total kuota tersedia</p>
                              <p className="mt-2 text-5xl font-black leading-none">{Math.min(quota.remaining_quota, 15)}</p>
                            </div>
                            <div className="text-right text-sm text-slate-300">
                              <p className="font-semibold">Layanan prioritas</p>
                              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em]">Sesuai jadwal hari ini</p>
                            </div>
                          </div>
                          <p className="mt-4 text-sm text-slate-300">
                            Kuota pelayanan prioritas hanya dibuka untuk hari ini. Perbarui halaman ini untuk melihat perubahan kuota terbaru.
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                    Saat ini belum ada kuota yang tersedia untuk hari ini.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500 font-bold">Alur proses</p>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                'Pilih Kategori Prioritas',
                'Pilih Jenis Permohonan',
                'Isi Data Diri',
                'Unggah Persyaratan',
                'Pilih Jadwal',
                'Review Permohonan',
                'Kirim Permohonan',
                'Kode/Bukti Permohonan',
                'Datang Sesuai Jadwal',
              ].map((step, index) => (
                <div
                  key={step}
                  className={`relative overflow-hidden rounded-2xl border p-4 ${
                    index === 0
                      ? 'border-[#0b5fa8] bg-[#edf6ff] text-[#0b5fa8]'
                      : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[0.62rem] font-black uppercase tracking-[0.18em]">Langkah {index + 1}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-[#0b5fa8] border border-blue-200">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-extrabold leading-snug">{step}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Priority Checker Widget */}
      <section 
        id="checker-widget" 
        className="w-full py-16 bg-gradient-to-br from-white to-[#f6faff] border border-blue-100 rounded-[28px] shadow-[0_18px_45px_rgba(13,94,168,0.05)] space-y-12 px-10"
        aria-labelledby="checker-title"
      >
        <div className="border-b pb-6 border-slate-200">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">Kategori</span>
          <h2 id="checker-title" className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Pengecekan Kategori Prioritas & Berkas</h2>
        </div>

        <div className="grid gap-10 md:grid-cols-12 items-start">
          
          {/* Select Options Form Column */}
          <div className="md:col-span-5 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 font-mono uppercase tracking-wide">Pilih Kondisi Pemohon</h3>
            
            <div className="space-y-4">
              {/* Category dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="check-category" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Kategori Prioritas:</label>
                <select
                  id="check-category"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCheckedDocs({});
                  }}
                  className="px-4 py-3 border-2 border-slate-300 rounded w-full bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="lansia">Lansia (Lanjut Usia &gt;= 60 Tahun)</option>
                  <option value="disabilitas">Penyandang Disabilitas / Difabel</option>
                  <option value="hamil">Ibu Hamil</option>
                  <option value="balita">Balita / Anak di bawah 5 Tahun</option>
                </select>
              </div>

              {/* Passport Type dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="check-type" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Jenis Pengajuan Paspor:</label>
                <select
                  id="check-type"
                  value={selectedPassportType}
                  onChange={(e) => {
                    setSelectedPassportType(e.target.value);
                    setCheckedDocs({});
                  }}
                  className="px-4 py-3 border-2 border-slate-300 rounded w-full bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="baru">Paspor Baru (Belum pernah punya paspor)</option>
                  <option value="perpanjang">Perpanjangan Paspor (Habis masa berlaku)</option>
                  <option value="hilang_rusak">Penggantian Paspor Hilang atau Rusak</option>
                </select>
              </div>

              {selectedCategory === 'disabilitas' && (
                <div className="space-y-1.5">
                  <label htmlFor="disability-type" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Jenis Disabilitas:</label>
                  <input
                    id="disability-type"
                    type="text"
                    value={disabilityType}
                    onChange={(e) => setDisabilityType(e.target.value)}
                    placeholder="Contoh: netra, rungu, fisik, mental"
                    className="w-full rounded border-2 border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                  <p className="text-sm text-slate-500">Tambahkan informasi singkat tentang jenis disabilitas yang Anda alami.</p>
                </div>
              )}
            </div>

            {/* Live Eligibility Results Box */}
            <div className={`p-6 rounded border-2 space-y-2 ${
              isPriority 
                ? 'bg-yellow-50/50 border-yellow-400 text-yellow-950' 
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`} aria-live="polite">
              <span className="font-mono text-xs uppercase tracking-widest block font-bold">HASIL VALIDASI KATEGORI:</span>
              <p className="text-xl font-black">
                ✓ LAYANAN JALUR PRIORITAS
              </p>
              <p className="text-sm">
                Pemohon berhak mendapatkan antrean khusus dengan prioritas pelayanan langsung di loket imigrasi.
              </p>
            </div>
          </div>

          {/* Interactive Document Checklist Column */}
          <div className="md:col-span-7 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 font-mono uppercase tracking-wide">
              Checklist Dokumen yang Wajib Dibawa
            </h3>
            <p className="text-sm text-slate-600">
              Silakan centang dokumen yang telah Anda siapkan untuk melacak kelengkapan sebelum berkunjung ke kantor imigrasi:
            </p>

            <ul className="space-y-3">
              {activeDocumentsList.map((doc, idx) => {
                const isChecked = !!checkedDocs[doc];
                const checkboxId = `doc-checkbox-${idx}`;
                return (
                  <li key={doc + idx}>
                    <label
                      htmlFor={checkboxId}
                      className={`flex items-start gap-4 p-4 border rounded cursor-pointer transition-all ${
                        isChecked
                          ? 'border-slate-800 bg-slate-50'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleDocToggle(doc)}
                        className="sr-only"
                      />

                      {/* Checkbox box indicator */}
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ease-out ${
                        isChecked ? 'bg-slate-900 border-slate-900 text-white animate-doc-check' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <span className={`text-base font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {doc}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm font-semibold flex justify-between items-center text-slate-700">
              <span>Progres Berkas Anda:</span>
              <span className="font-mono text-slate-900 font-bold">
                {activeDocumentsList.filter((doc) => checkedDocs[doc]).length} dari {activeDocumentsList.length} siap
              </span>
            </div>
          </div>

        </div>
      </section>

      <section className="w-full space-y-8 px-6 md:px-10" aria-labelledby="passport-issue-title">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Informasi layanan</p>
            <h2 id="passport-issue-title" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Prosedur dan Ketentuan Paspor Hilang & Rusak
            </h2>
          </div>
          <div className="hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d5ea8] md:inline-flex">
            BAP Diperlukan
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <div className="mb-4 inline-flex rounded-full bg-blue-100 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#0d5ea8]">
              Prosedur BAP
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-700 md:text-base">
              <p>
                Untuk layanan <span className="font-semibold text-slate-900">paspor rusak dan hilang</span>, proses diawali dengan <span className="font-semibold text-slate-900">Berita Acara Pemeriksaan (BAP)</span> sebagai tahap awal verifikasi. BAP dilakukan untuk mencatat kondisi dokumen, memastikan keabsahan identitas pemohon, serta menentukan kebutuhan administrasi lanjutan.
              </p>

              <p>
                Pemohon menyampaikan laporan kehilangan atau kerusakan paspor kepada petugas layanan dengan membawa dokumen pendukung yang diperlukan. Setelah laporan diterima, petugas akan menetapkan tahapan selanjutnya sesuai dengan hasil pemeriksaan awal.
              </p>

              <p>
                Bagi pemohon paspor hilang, wajib menyertakan surat keterangan kehilangan dari kepolisian. Sementara untuk paspor rusak, dokumen asli yang rusak akan diperiksa dan dicatat sebelum dilanjutkan ke proses pembuatan paspor pengganti.
              </p>

              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                <span className="font-bold">Catatan:</span> Permohonan untuk paspor hilang dan rusak tidak melalui layanan M-Paspor. Pengajuan dilakukan melalui proses layanan administrasi dan pemeriksaan dokumen di kantor imigrasi.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-7 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
            <h3 className="text-xl font-bold text-slate-900">Biaya dan Alur</h3>
            <p className="mt-4 text-sm leading-7 text-slate-700 md:text-base">
              Biaya penggantian atau penerbitan paspor baru mengikuti ketentuan yang berlaku pada saat pengajuan.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700 md:text-base">
              <li>Pelaporan awal dan BAP.</li>
              <li>Pengumpulan dokumen pendukung.</li>
              <li>Verifikasi data dan formulir.</li>
              <li>Pembayaran layanan.</li>
              <li>Biometrik dan penerbitan dokumen.</li>
            </ol>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-[22px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800">
              Paspor Rusak
            </div>
            <h3 className="text-xl font-bold text-slate-900">Paspor Rusak</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
              Paspor rusak adalah dokumen perjalanan yang mengalami kerusakan fisik atau data identitas di dalamnya tidak terbaca dengan jelas. Kondisi seperti halaman sobek, basah, aus, atau terlipat berlebihan termasuk dalam kategori ini.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Dokumen asli rusak akan diperiksa dan dicatat oleh petugas.</li>
              <li>Persyaratan pendukung harus dilengkapi sebelum proses lanjut.</li>
              <li>Proses dapat dilanjutkan setelah verifikasi awal selesai.</li>
            </ul>
          </article>

          <article className="rounded-[22px] border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-orange-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-orange-800">
              Paspor Hilang
            </div>
            <h3 className="text-xl font-bold text-slate-900">Paspor Hilang</h3>
            <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
              Paspor hilang adalah dokumen perjalanan yang tidak dapat ditemukan dalam penguasaan pemohon, baik karena tertinggal, hilang saat perjalanan, atau dicuri. Kejadian ini harus segera dilaporkan sesuai prosedur yang berlaku.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Wajib melaporkan kehilangan sesuai mekanisme yang berlaku.</li>
              <li>Surat keterangan kehilangan dari kepolisian biasanya diperlukan.</li>
              <li>Petugas akan menilai kelengkapan berkas sebelum dilanjutkan.</li>
            </ul>
          </article>
        </div>
      </section>

      {/* Grid: 3 Pillars of Accessibility - Full Width */}
      <section 
        className="w-full space-y-10" 
        aria-labelledby="features-info-title"
      >
        <div className="text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">INFORMASI LAYANAN PRIORITAS</span>
          <h2 id="features-info-title" className="text-3xl font-extrabold text-slate-900 tracking-tight">Kategori & Alur Kunjungan</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="p-8 bg-white border border-slate-200 rounded-md shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Kategori Prioritas Terdaftar</h3>
            <ul className="space-y-2 list-disc pl-5 text-slate-700 text-sm font-medium">
              <li><strong>Lanjut Usia (Lansia)</strong>: Berusia 60 tahun ke atas saat mendaftar.</li>
              <li><strong>Ibu Hamil</strong>: Diutamakan bagi yang memiliki kehamilan fisik tampak.</li>
              <li><strong>Balita</strong>: Anak-anak berusia di bawah 5 tahun didampingi orang tua.</li>
              <li><strong>Penyandang Disabilitas</strong>: Cacat fisik, rungu, netra, atau disabilitas psikis.</li>
            </ul>
          </div>

          <div className="p-8 bg-white border border-slate-200 rounded-md shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Jam Layanan & Alur Kedatangan</h3>
            <ul className="space-y-2 list-disc pl-5 text-slate-700 text-sm font-medium">
              <li><strong>Jam Pelayanan</strong>: Senin - Jumat, Pukul 08:00 - 15:00 WIB.</li>
              <li><strong>Check-in</strong>: Scan barcode/tunjukkan tiket Anda langsung ke Front Office.</li>
              <li><strong>Asistensi</strong>: Petugas berseragam khusus siap mengarahkan kursi roda atau pendampingan pengisian formulir fisik di lokasi.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Steps to Register - Full Width */}
      <section 
        className="w-full space-y-8"
        aria-labelledby="faq-steps-title"
      >
        <h3 id="faq-steps-title" className="text-3xl font-extrabold text-slate-900 tracking-tight text-center md:text-left">Langkah Mudah Pendaftaran</h3>
        <div className="grid gap-8 md:grid-cols-3 text-slate-800">
          <div className="p-8 border border-slate-200 rounded-md bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-xl">1. Pilih Jadwal Kedatangan</h4>
            <p className="text-base text-slate-700">Cari slot pelayanan yang masih tersedia untuk hari ini di halaman permohonan.</p>
          </div>
          <div className="p-8 border border-slate-200 rounded-md bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-xl">2. Isi Data & Unggah Syarat</h4>
            <p className="text-base text-slate-700">Untuk paspor baru, unggah e-KTP, Kartu Keluarga (KK), dan satu dokumen pendukung seperti akta kelahiran, ijazah, atau buku nikah.</p>
          </div>
          <div className="p-8 border border-slate-200 rounded-md bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-xl">3. Unduh Tiket Antrean</h4>
            <p className="text-base text-slate-700">Nomor antrean resmi (P- atau D-) akan terbit otomatis. Simpan tiket untuk discan petugas loket.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Guide;
