import React from 'react';
import type { UseFormRegister, UseFormWatch } from 'react-hook-form';
import type { ReservationFormInputs } from './QuotaSelector';

interface PriorityFieldsProps {
  register: UseFormRegister<ReservationFormInputs>;
  needsCompanion: boolean;
  watch: UseFormWatch<ReservationFormInputs>;
  mode?: 'full' | 'category' | 'identity';
  readOnlyIdentity?: boolean;
}

export const PriorityFields: React.FC<PriorityFieldsProps> = ({ register, needsCompanion, watch, mode = 'full', readOnlyIdentity = false }) => {
  // Watch values for checklist feedback
  const watchWheelchair = watch('assistance_wheelchair');
  const watchGuiding = watch('assistance_guiding');
  const watchCounter = watch('assistance_counter');
  const watchComm = watch('assistance_comm');
  const applicantType = watch('applicant_type') || 'pemohon';

  const title = mode === 'category'
    ? '1. Pilih Kategori Prioritas'
    : mode === 'identity'
      ? '3. Isi Data Diri'
      : '1. Pilih Kategori Prioritas';

  return (
    <fieldset className="p-8 bg-white border border-slate-200 rounded-lg shadow-sm space-y-6">
      <div className="space-y-1">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 font-bold block">Kategori Prioritas / Data Pemohon</span>
        <legend className="text-2xl font-black tracking-tight text-slate-900">{title}</legend>
      </div>

      {mode !== 'category' && (
        <div className="space-y-5 border-b border-slate-100 pb-5">
          <div className="space-y-2">
            <span className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Siapa yang mengisi formulir ini?</span>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${applicantType === 'pemohon' ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                <input type="radio" value="pemohon" {...register('applicant_type', { required: true })} className="h-4 w-4 text-slate-900 border-slate-300" />
                <span className="text-sm font-semibold text-slate-900">Saya sendiri sebagai pemohon</span>
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${applicantType === 'pendamping' ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                <input type="radio" value="pendamping" {...register('applicant_type', { required: true })} className="h-4 w-4 text-slate-900 border-slate-300" />
                <span className="text-sm font-semibold text-slate-900">Saya mengisi untuk orang lain / pendamping</span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="applicant-name" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Nama Lengkap</label>
              <input
                id="applicant-name"
                type="text"
                readOnly={readOnlyIdentity}
                {...register('name', { required: 'Nama pemohon wajib diisi.' })}
                className={`w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-900 focus:border-slate-900 focus:outline-none ${readOnlyIdentity ? 'bg-slate-100' : 'bg-white'}`}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="applicant-nik" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">NIK</label>
              <input
                id="applicant-nik"
                type="text"
                maxLength={16}
                readOnly={readOnlyIdentity}
                {...register('nik', { required: 'NIK pemohon wajib diisi.' })}
                className={`w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-900 focus:border-slate-900 focus:outline-none ${readOnlyIdentity ? 'bg-slate-100' : 'bg-white'}`}
                placeholder="16 digit NIK"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="applicant-email" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Email</label>
              <input
                id="applicant-email"
                type="email"
                readOnly={readOnlyIdentity}
                {...register('email', { required: 'Email pemohon wajib diisi.' })}
                className={`w-full px-3 py-2.5 border border-slate-300 rounded text-sm text-slate-900 focus:border-slate-900 focus:outline-none ${readOnlyIdentity ? 'bg-slate-100' : 'bg-white'}`}
                placeholder="nama@email.com"
              />
            </div>
          </div>

          {applicantType === 'pendamping' && (
            <div className="grid gap-4 md:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-1.5">
                <label htmlFor="representative-name" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">Nama Pemohon yang Diwakili</label>
                <input
                  id="representative-name"
                  type="text"
                  {...register('representative_name')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  placeholder="Nama lengkap pemohon"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="representative-nik" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">NIK Pemohon yang Diwakili</label>
                <input
                  id="representative-nik"
                  type="text"
                  maxLength={16}
                  {...register('representative_nik')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                  placeholder="16 digit NIK pemohon"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {mode !== 'category' && (
        <div className="space-y-1.5 border-b border-slate-100 pb-5">
          <label htmlFor="passport-type" className="block text-xs font-mono uppercase tracking-widest text-slate-600 font-bold">
            Jenis Pengajuan Paspor:
          </label>
          <select
            id="passport-type"
            {...register('passport_type', { required: 'Jenis pengajuan paspor wajib dipilih.' })}
            className="px-3 py-2.5 border border-slate-300 rounded w-full bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="baru">Paspor Baru (Pertama kali membuat paspor)</option>
            <option value="perpanjang">Perpanjangan Paspor (Habis masa berlaku)</option>
            <option value="hilang_rusak">Penggantian Paspor Hilang atau Rusak</option>
          </select>
        </div>
      )}

      {mode === 'category' || mode === 'full' ? (
        <>
          <label 
            htmlFor="needs-companion"
            className={`flex items-start gap-4 p-6 border rounded-lg cursor-pointer transition-all ${
              needsCompanion 
                ? 'border-slate-900 bg-slate-50/50 ring-1 ring-slate-900' 
                : 'border-slate-200 bg-white hover:border-slate-400'
            }`}
          >
            <input
              id="needs-companion"
              type="checkbox"
              {...register('needs_companion')}
              className="sr-only"
            />
            <div 
              className={`w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 ${
                needsCompanion ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'
              }`}
              aria-hidden="true"
            >
              {needsCompanion && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="space-y-1">
              <span className="block font-bold text-lg text-slate-900">Saya termasuk kategori layanan prioritas</span>
              <span className="block text-sm text-slate-600 font-medium">Pilih untuk melanjutkan. Layanan ini hanya menerima pemohon lansia, ibu hamil, balita, atau penyandang disabilitas.</span>
            </div>
          </label>

          {needsCompanion && (
            <div className="space-y-6 pl-6 border-l border-slate-300 py-1" aria-live="polite">
              <div className="space-y-1.5">
                <label htmlFor="disability-type" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Kategori Prioritas:</label>
                <select
                  id="disability-type"
                  {...register('disabilityType')}
                  className="px-3 py-2.5 border border-slate-300 rounded w-full bg-white text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="lansia">Lansia (Lanjut Usia &gt;= 60 Tahun)</option>
                  <option value="disabilitas">Penyandang Disabilitas / Difabel</option>
                  <option value="hamil">Ibu Hamil</option>
                  <option value="balita">Balita / Anak di bawah 5 Tahun</option>
                </select>
              </div>

              <div className="space-y-3">
                <span className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Bantuan Khusus yang Diperlukan:</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${watchWheelchair ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                    <input type="checkbox" {...register('assistance_wheelchair')} className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900" />
                    <span className="text-sm font-semibold text-slate-900">Kursi Roda (Wheelchair)</span>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${watchGuiding ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                    <input type="checkbox" {...register('assistance_guiding')} className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900" />
                    <span className="text-sm font-semibold text-slate-900">Pendampingan Petugas</span>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${watchCounter ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                    <input type="checkbox" {...register('assistance_counter')} className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900" />
                    <span className="text-sm font-semibold text-slate-900">Akses Loket Prioritas</span>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-colors ${watchComm ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                    <input type="checkbox" {...register('assistance_comm')} className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900" />
                    <span className="text-sm font-semibold text-slate-900">Bantuan Komunikasi / Isyarat</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="companion-name" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">Nama Lengkap Pendamping (jika ada):</label>
                <input
                  id="companion-name"
                  type="text"
                  {...register('companionName')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="Masukkan nama lengkap pendamping"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="companion-nik" className="block text-xs font-mono uppercase tracking-widest text-slate-500 font-bold">NIK Pendamping (jika ada):</label>
                <input
                  id="companion-nik"
                  type="text"
                  maxLength={16}
                  {...register('companionNik')}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded bg-white text-sm text-slate-900 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="Masukkan 16 digit NIK pendamping"
                />
              </div>
            </div>
          )}
        </>
      ) : null}
    </fieldset>
  );
};

export default PriorityFields;
