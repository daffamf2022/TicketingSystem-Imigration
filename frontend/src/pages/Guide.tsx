import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Guide: React.FC = () => {
  const navigate = useNavigate();

  // Dynamic Checker state variables
  const [selectedCategory, setSelectedCategory] = useState<string>('reguler');
  const [selectedPassportType, setSelectedPassportType] = useState<string>('baru');
  
  // Custom document checkboxes state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const handleDocToggle = (docName: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [docName]: !prev[docName]
    }));
  };

  // Determine priority status
  const isPriority = selectedCategory !== 'reguler';

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
      // Reguler
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
    <div className="w-full py-16 space-y-20 focus-visible:outline-none bg-brand-bg px-8 md:px-12">
      
      {/* Hero Section */}
      <section 
        className="w-full text-center space-y-8" 
        aria-label="Pengenalan Layanan"
      >
        <div className="space-y-4">
          <span className="font-mono text-xs md:text-sm uppercase tracking-[0.25em] text-slate-500 font-bold block">
            KANTOR IMIGRASI REPUBLIK INDONESIA
          </span>
          <h1 className="text-4xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight">
            SISTEM ANTREAN PASPOR INKLUSIF
          </h1>
          <p className="text-lg md:text-2xl text-slate-800 leading-relaxed max-w-4xl mx-auto font-medium">
            Layanan pengurusan antrean paspor online yang dirancang ramah untuk semua kalangan, memudahkan lansia dan penyandang disabilitas mendapatkan prioritas pelayanan langsung di lokasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <button
            onClick={() => navigate('/reservation')}
            className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-lg transition-all focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-sm"
          >
            Mulai Buat Antrean
          </button>
          <a
            href="#checker-widget"
            className="px-10 py-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold rounded text-lg transition-all text-center focus:ring-2 focus:ring-slate-300"
          >
            Cek Syarat Prioritas
          </a>
        </div>
      </section>

      {/* Dynamic Priority Checker Widget */}
      <section 
        id="checker-widget" 
        className="w-full py-16 bg-white border border-slate-200 rounded-md shadow-sm space-y-12 px-10"
        aria-labelledby="checker-title"
      >
        <div className="border-b pb-6 border-slate-200">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">DYNAMIC CHECKER SYSTEM</span>
          <h2 id="checker-title" className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Pengecekan Kategori Prioritas & Berkas</h2>
        </div>

        <div className="grid gap-10 md:grid-cols-12 items-start">
          
          {/* Select Options Form Column */}
          <div className="md:col-span-5 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 font-mono uppercase tracking-wide">Pilih Kondisi Pemohon</h3>
            
            <div className="space-y-4">
              {/* Category dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="check-category" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Kategori Pemohon:</label>
                <select
                  id="check-category"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCheckedDocs({});
                  }}
                  className="px-4 py-3 border-2 border-slate-300 rounded w-full bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="reguler">Reguler (Dewasa Umum)</option>
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
            </div>

            {/* Live Eligibility Results Box */}
            <div className={`p-6 rounded border-2 space-y-2 ${
              isPriority 
                ? 'bg-yellow-50/50 border-yellow-400 text-yellow-950' 
                : 'bg-slate-50 border-slate-300 text-slate-900'
            }`} aria-live="polite">
              <span className="font-mono text-xs uppercase tracking-widest block font-bold">HASIL VALIDASI KATEGORI:</span>
              <p className="text-xl font-black">
                {isPriority ? '✓ LAYANAN JALUR PRIORITAS' : '● LAYANAN JALUR REGULER'}
              </p>
              <p className="text-sm">
                {isPriority 
                  ? 'Pemohon berhak mendapatkan antrean khusus dengan prioritas pelayanan langsung di loket imigrasi.'
                  : 'Pemohon menggunakan antrean standar loket reguler.'
                }
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
                return (
                  <li key={idx}>
                    <label 
                      onClick={() => handleDocToggle(doc)}
                      className={`flex items-start gap-4 p-4 border rounded cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-slate-800 bg-slate-50' 
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="sr-only"
                      />
                      
                      {/* Checkbox box indicator */}
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isChecked ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'
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
                {Object.values(checkedDocs).filter(Boolean).length} dari {activeDocumentsList.length} siap
              </span>
            </div>
          </div>

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
            <p className="text-base text-slate-700">Cari slot jam kedatangan yang masih tersedia untuk hari ini atau besok di halaman reservasi.</p>
          </div>
          <div className="p-8 border border-slate-200 rounded-md bg-white space-y-3">
            <h4 className="font-bold text-slate-900 text-xl">2. Isi Data & Unggah Syarat</h4>
            <p className="text-base text-slate-700">Lengkapi formulir identitas diri serta unggah dokumen wajib KTP/KK secara langsung.</p>
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
