import React from 'react';
import type { ReservationData } from '../services/reservationService';

interface SuccessBannerProps {
  data: ReservationData | null;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({ data }) => {
  if (!data) return null;

  return (
    <section 
      className="p-6 bg-white border-2 border-green-600 rounded-lg space-y-4 shadow-sm"
      aria-labelledby="success-title"
    >
      <h2 id="success-title" className="text-2xl font-bold text-green-800">
        ✓ Pemesanan Antrean Berhasil!
      </h2>
      <div className="space-y-2 text-slate-900">
        <p className="text-lg">
          Nomor Antrean Anda: <strong className="text-3xl font-black text-blue-900 block mt-2">{data.queue_number}</strong>
        </p>
        <p className="text-sm text-slate-700">
          Harap simpan nomor antrean ini dan tunjukkan kepada petugas imigrasi saat kedatangan Anda.
        </p>
        {data.companion && (
          <div className="text-sm bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900">Informasi Jalur Prioritas:</p>
            <p className="text-slate-800">Jenis Disabilitas: <span className="capitalize">{data.companion.disability_type}</span></p>
            {data.companion.companion_name && (
              <p className="text-slate-800">Nama Pendamping: {data.companion.companion_name} (NIK: {data.companion.companion_nik || '-'})</p>
            )}
          </div>
        )}
        {data.documents.length > 0 && (
          <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
            <p className="font-semibold text-slate-800">Berkas yang diunggah:</p>
            <ul className="list-disc pl-5">
              {data.documents.map((doc) => (
                <li key={doc.id} className="text-slate-700">
                  {doc.document_type} - {doc.file_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default SuccessBanner;
