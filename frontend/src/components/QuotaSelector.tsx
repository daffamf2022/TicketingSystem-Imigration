import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { Quota } from '../services/reservationService';

export interface ReservationFormInputs {
  quota_id: string;
  needs_companion: boolean;
  disabilityType: string;
  companionName: string;
  companionNik: string;
  // Assistance checklists
  assistance_wheelchair: boolean;
  assistance_guiding: boolean;
  assistance_counter: boolean;
  assistance_comm: boolean;
  passport_type: string;
}

interface QuotaSelectorProps {
  quotas: Quota[];
  loading: boolean;
  onRefresh: () => void;
  register: UseFormRegister<ReservationFormInputs>;
  errors: FieldErrors<ReservationFormInputs>;
  selectedQuotaId: string | undefined;
}

export const QuotaSelector: React.FC<QuotaSelectorProps> = ({ 
  quotas, 
  loading, 
  onRefresh, 
  register, 
  errors,
  selectedQuotaId
}) => {
  return (
    <fieldset className="p-8 bg-white border border-slate-300 rounded-lg shadow-sm space-y-6">
      <div className="space-y-1">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-600 font-bold block">JADWAL KEDATANGAN / SLOTS</span>
        <legend className="text-2xl font-black tracking-tight text-slate-900">1. Pilih Jadwal Pelayanan</legend>
      </div>
      
      <p className="text-base text-slate-600 leading-relaxed font-medium">
        Silakan pilih waktu kehadiran Anda. Jadwal kedatangan dibatasi hanya untuk Hari Ini atau Besok guna meminimalisir kepadatan di lokasi.
      </p>

      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-950 font-mono text-xs uppercase tracking-widest font-bold rounded transition-all focus:ring-2 focus:ring-slate-900 cursor-pointer"
          aria-label="Perbarui jadwal kuota"
        >
          {loading ? 'MEMPERBARUI...' : 'PERBARUI JADWAL'}
        </button>
      </div>

      {quotas.length === 0 ? (
        <p className="text-center py-12 text-base font-mono text-slate-500 uppercase tracking-widest border border-dashed border-slate-200 rounded">
          Jadwal kuota pelayanan belum tersedia.
        </p>
      ) : (
        <div 
          className="grid gap-4 md:grid-cols-2" 
          role="radiogroup" 
          aria-label="Pilih Jam Layanan Kedatangan"
        >
          {quotas.map((quota) => {
            const isExhausted = quota.remaining_quota <= 0;
            const isSelected = selectedQuotaId === quota.id;
            const labelId = `label-quota-${quota.id}`;
            
            const quotaDateStr = quota.date.split('T')[0];
            const localDate = new Date();
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const localTodayStr = `${year}-${month}-${day}`;
            const isToday = quotaDateStr === localTodayStr;
            
            return (
              <label
                key={quota.id}
                htmlFor={quota.id}
                className={`relative flex items-center justify-between p-6 border rounded-lg cursor-pointer transition-all focus-within:ring-2 focus-within:ring-slate-900 ${
                  isExhausted 
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200' 
                    : isSelected
                      ? 'border-slate-900 bg-slate-50/50 ring-1 ring-slate-900 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    id={quota.id}
                    type="radio"
                    value={quota.id}
                    disabled={isExhausted}
                    required
                    {...register('quota_id', { required: 'Jadwal pelayanan wajib dipilih.' })}
                    className="sr-only"
                  />
                  
                  {/* Custom Indicator Circle */}
                  <div 
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-900 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
 
                  <div id={labelId} className="space-y-0.5">
                    <span className="block text-lg font-bold text-slate-900">
                      {isToday ? 'Hari Ini' : 'Besok'}
                    </span>
                    <span className="block font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
                      {quota.start_time} - {quota.end_time} WIB
                    </span>
                  </div>
                </div>
                
                {/* Clean rectangular solid badge */}
                <div 
                  className={`text-xs font-mono font-bold py-1.5 px-3 rounded uppercase tracking-wider transition-colors ${
                    isExhausted 
                      ? 'bg-red-50 text-red-800 border border-red-200' 
                      : isSelected
                        ? 'bg-slate-900 text-white border border-slate-900'
                        : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}
                  aria-live="polite"
                >
                  Sisa: {quota.remaining_quota}
                </div>
              </label>
            );
          })}
        </div>
      )}
      {errors.quota_id && (
        <p className="text-red-600 text-sm font-semibold">{errors.quota_id.message}</p>
      )}
    </fieldset>
  );
};

export default QuotaSelector;
