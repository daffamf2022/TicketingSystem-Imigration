import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import reservationService from '../services/reservationService';
import type { SingleReservationData } from '../services/reservationService';
import { ErrorBanner } from '../components/ErrorBanner';

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<SingleReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      
      const token = authService.getToken();
      if (!token) {
        navigate('/login', {
          state: { message: 'Harap masuk log (login) terlebih dahulu untuk melihat detail tiket Anda.' }
        });
        return;
      }

      try {
        const response = await reservationService.getReservationDetails(id, token);
        setTicket(response.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Gagal memuat detail tiket antrean.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="w-full py-24 text-center space-y-4 focus-visible:outline-none bg-brand-bg px-8">
        <div className="animate-spin inline-block w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full" role="status">
          <span className="sr-only">Memuat...</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500">MEMUAT RINCIAN TIKET...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="w-full py-24 space-y-6 focus-visible:outline-none bg-brand-bg px-8">
        <div className="max-w-md mx-auto space-y-6">
          <ErrorBanner message={error || 'Tiket antrean tidak ditemukan.'} />
          <button
            type="button"
            onClick={() => navigate('/reservation')}
            className="w-full py-3 bg-slate-900 text-white font-mono text-xs uppercase tracking-widest font-bold rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Kembali ke Reservasi
          </button>
        </div>
      </div>
    );
  }

  const isPriority = ticket.companion !== null && ticket.companion.needsDisabilityFacility;
  
  const formattedDate = new Date(ticket.quota.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Metadata parser for disabilityType formatted string
  const rawDisability = ticket.companion?.disabilityType || '';
  
  let category = 'reguler';
  let assistance = 'Tidak ada bantuan khusus';
  let passportType = 'Paspor Baru';
  
  if (rawDisability) {
    const [categoryPart, rest] = rawDisability.split(' | Bantuan: ');
    
    if (rest) {
      const [assistancePart, passportPart] = rest.split(' | Jenis: ');
      category = categoryPart;
      assistance = assistancePart;
      if (passportPart) {
        passportType = passportPart === 'baru' ? 'Paspor Baru' : passportPart === 'perpanjang' ? 'Perpanjangan Paspor' : 'Penggantian Paspor Hilang/Rusak';
      }
    } else {
      const [categoryPartOnly, passportPartOnly] = rawDisability.split(' | Jenis: ');
      category = categoryPartOnly;
      if (passportPartOnly) {
        passportType = passportPartOnly === 'baru' ? 'Paspor Baru' : passportPartOnly === 'perpanjang' ? 'Perpanjangan Paspor' : 'Penggantian Paspor Hilang/Rusak';
      }
    }
  }
  
  const displayCategory = category.toUpperCase() === 'LANSIA' 
    ? 'LANSIA (LANJUT USIA >= 60 TAHUN)' 
    : category.toUpperCase() === 'DISABILITAS' 
      ? 'PENYANDANG DISABILITAS / DIFABEL' 
      : category.toUpperCase() === 'HAMIL' 
        ? 'IBU HAMIL' 
        : category.toUpperCase() === 'BALITA' 
          ? 'BALITA (DI BAWAH 5 TAHUN)' 
          : 'REGULER (UMUM)';

  return (
    <div className="w-full px-8 md:px-12 py-12 focus-visible:outline-none bg-brand-bg" id="main-content">
      
      <div className="grid gap-10 md:grid-cols-12 items-start">
        
        {/* Left Column: Huge printable receipt card */}
        <div className="md:col-span-8 space-y-8">
          
          <header className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500 block">BUKTI RESERVASI ELEKTRONIK / TICKET RECEIPT</span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">Bukti Antrean Paspor</h1>
          </header>

          <section 
            className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm print:border-none"
            aria-label="Detail Kartu Tiket Antrean"
          >
            {/* Strip header */}
            <div className={`py-4 text-center text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-white ${
              isPriority ? 'bg-yellow-600' : 'bg-slate-950'
            }`}>
              {isPriority ? 'Jalur Prioritas (Disabilitas)' : 'Jalur Antrian Reguler'}
            </div>

            {/* Big Ticket Number */}
            <div className="p-10 text-center bg-slate-50 border-b border-slate-200 space-y-2">
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-slate-500 block">NOMOR ANTREAN UTAMA</span>
              <div 
                role="alert" 
                aria-live="assertive"
                className="text-7xl md:text-9xl font-mono font-bold text-slate-900 leading-none tracking-tighter py-4"
              >
                {ticket.queueNumber}
              </div>
              <span className="text-[10px] font-mono font-bold bg-white border border-slate-300 px-3 py-1 rounded-sm text-slate-800 uppercase tracking-widest inline-block mb-3">
                STATUS: {ticket.status.toUpperCase()}
              </span>

              {/* Prototype Simulation Warning Box */}
              <div className="p-3.5 bg-yellow-50 border border-yellow-300 rounded text-yellow-950 font-mono text-[11px] font-bold tracking-wide uppercase max-w-md mx-auto">
                ⚠️ SIMULASI PROTOTYPE — BUKAN TIKET RESMI M-PASPOR
              </div>
            </div>

            {/* Data Specs */}
            <div className="p-8 space-y-6 text-sm">
              
              <div className="grid grid-cols-3 gap-4 border-b pb-5 border-slate-100">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-400 col-span-1">PEMOHON:</span>
                <div className="col-span-2 space-y-1 text-slate-900">
                  <span className="block font-bold text-lg">{ticket.user.name.toUpperCase()}</span>
                  <span className="block text-xs font-mono text-slate-500">NIK: {ticket.user.nik}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b pb-5 border-slate-100">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-400 col-span-1">KATEGORI PENGAJUAN:</span>
                <div className="col-span-2 text-slate-900 font-bold">
                  {displayCategory}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-b pb-5 border-slate-100">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-400 col-span-1">JENIS PASPOR:</span>
                <div className="col-span-2 text-slate-900 font-bold">
                  {passportType.toUpperCase()}
                </div>
              </div>

              {isPriority && (
                <div className="grid grid-cols-3 gap-4 border-b pb-5 border-slate-100">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-400 col-span-1">BANTUAN PRIORITAS:</span>
                  <div className="col-span-2 text-slate-900 font-bold text-yellow-800">
                    {assistance.toUpperCase()}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 border-b pb-5 border-slate-100">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-400 col-span-1">JADWAL KEDATANGAN:</span>
                <div className="col-span-2 space-y-2 text-slate-900">
                  <span className="block font-bold">{formattedDate.toUpperCase()}</span>
                  <span className="block font-mono text-xs text-slate-600 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-sm inline-block">
                    Pukul: {ticket.quota.startTime} - {ticket.quota.endTime} WIB
                  </span>
                </div>
              </div>

              {ticket.companion && ticket.companion.companionName && (
                <div className="grid grid-cols-3 gap-4 border-b pb-5 border-slate-100 bg-slate-50 p-4 rounded border border-slate-200">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-500 col-span-1">ASISTENSI PENDAMPING:</span>
                  <div className="col-span-2 space-y-1 text-slate-900">
                    <span className="block text-xs tracking-wide">
                      Nama: <strong>{ticket.companion.companionName.toUpperCase()}</strong>
                    </span>
                    <span className="block text-xs tracking-wide">
                      NIK: <strong>{ticket.companion.companionNik || '-'}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-slate-900">
                <span className="font-mono text-xs uppercase tracking-widest text-slate-400 col-span-1">LAMPIRAN DOKUMEN:</span>
                <div className="col-span-2">
                  {ticket.documents.length === 0 ? (
                    <span className="text-slate-400 font-mono text-xs uppercase tracking-widest">TIDAK ADA BERKAS</span>
                  ) : (
                    <ul className="list-none space-y-2 text-xs font-mono tracking-wide text-slate-700">
                      {ticket.documents.map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2">
                          <span className="text-slate-400">■</span>
                          <span className="font-bold text-slate-800 uppercase">{doc.documentType}</span>: {doc.filePath}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Actions and Next Steps */}
        <aside className="md:col-span-4 space-y-6 md:sticky md:top-6 print:hidden">
          
          {/* Action Buttons */}
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">TINDAKAN TIKET</span>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-3.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-mono text-xs uppercase tracking-[0.15em] font-bold rounded transition-all cursor-pointer text-center"
            >
              Cetak Tiket (Print)
            </button>
            <button
              type="button"
              onClick={() => navigate('/reservation')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-[0.15em] font-bold rounded transition-all cursor-pointer text-center"
            >
              Kembali ke Formulir
            </button>
          </div>

          {/* Guidelines */}
          <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500 font-bold block">PETUNJUK KEDATANGAN</span>
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed font-medium">
              <p>
                1. Harap bawa <strong>seluruh dokumen asli</strong> beserta fotokopinya dalam map terpisah.
              </p>
              <p>
                2. Tunjukkan kode antrean ini di pintu gerbang loket imigrasi untuk mendapatkan verifikasi fisik dari petugas.
              </p>
              <p>
                3. Kenakan pakaian formal berkerah rapi (selain warna putih) untuk kelancaran sesi pengambilan foto biometrik paspor Anda.
              </p>
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
};

export default TicketDetail;
