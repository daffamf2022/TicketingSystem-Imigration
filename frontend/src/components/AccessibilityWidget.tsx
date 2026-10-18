import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import type { FontSizeLevel } from '../context/AccessibilityContext';

/* ---------------------------------------------------------------
   Small icon helpers (inline SVG, no external dependency)
--------------------------------------------------------------- */
const Icon = ({ d, size = 28 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/* ---------------------------------------------------------------
   Single feature tile
--------------------------------------------------------------- */
interface TileProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  info?: string;
}

const Tile: React.FC<TileProps> = ({ label, icon, active, onClick, info }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[96px]
      ${active
        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50'
      }`}
  >
    <span className="text-2xl flex items-center justify-center">{icon}</span>
    <span className="text-center leading-tight">{label}</span>
    {info && (
      <span
        title={info}
        className="absolute top-2 left-2 w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold"
      >i</span>
    )}
  </button>
);

/* ---------------------------------------------------------------
   Text size step button
--------------------------------------------------------------- */
interface SizeButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  textClass: string;
}
const SizeBtn: React.FC<SizeButtonProps> = ({ label, active, onClick, textClass }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all cursor-pointer focus:outline-none
      ${textClass}
      ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50'}`}
  >
    {label}
  </button>
);

/* ---------------------------------------------------------------
   Main widget
--------------------------------------------------------------- */
export const AccessibilityWidget: React.FC = () => {
  const { pathname } = useLocation();
  const {
    panelOpen, setPanelOpen,
    fontSizeLevel, setFontSizeLevel,
    highContrastMode, setHighContrastMode,
    pureBlackWhite, setPureBlackWhite,
    highlightLinks, setHighlightLinks,
    largerTextSpacing, setLargerTextSpacing,
    pauseAnimations, setPauseAnimations,
    hideImages, setHideImages,
    dyslexiaFont, setDyslexiaFont,
    largeCursor, setLargeCursor,
    tooltips, setTooltips,
    lineHeight, setLineHeight,
    textAlign, setTextAlign,
    saturation, setSaturation,
    resetAll,
  } = useAccessibility();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* ── Floating trigger button ───────────────────────────── */}
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label="Buka Menu Aksesibilitas (CTRL+U)"
        aria-expanded={panelOpen}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 cursor-pointer"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM6.75 8.5a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5H6.75ZM8 13l-1.5 7h2l1-4.5L12 17l2.5-1.5 1 4.5h2L16 13l-2 1.5H10L8 13Z"/>
        </svg>
      </button>

      {/* ── Panel overlay ─────────────────────────────────────── */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-[9997] bg-black/30 backdrop-blur-[2px]"
          onClick={() => setPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in panel ────────────────────────────────────── */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu Aksesibilitas"
        className={`fixed top-0 right-0 z-[9999] h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out
          ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="font-bold text-base tracking-tight">Menu Aksesibilitas</p>
            <p className="text-[11px] text-blue-200 font-mono">CTRL+U untuk membuka/menutup</p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Tutup menu aksesibilitas"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white font-bold text-lg cursor-pointer transition-colors focus:outline-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* ── Font size ─────────────────────────────────────── */}
          <section aria-labelledby="a11y-size-label">
            <p id="a11y-size-label" className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-2 font-bold">Ukuran Teks</p>
            <div className="flex gap-2">
              <SizeBtn label="T" textClass="text-sm" active={fontSizeLevel === 1} onClick={() => setFontSizeLevel(1 as FontSizeLevel)} />
              <SizeBtn label="T" textClass="text-base" active={fontSizeLevel === 2} onClick={() => setFontSizeLevel(2 as FontSizeLevel)} />
              <SizeBtn label="T" textClass="text-xl" active={fontSizeLevel === 3} onClick={() => setFontSizeLevel(3 as FontSizeLevel)} />
            </div>
          </section>

          {/* ── Feature tiles grid ────────────────────────────── */}
          <section aria-labelledby="a11y-features-label">
            <p id="a11y-features-label" className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-3 font-bold">Fitur Aksesibilitas</p>
            <div className="grid grid-cols-2 gap-3">

              <Tile
                label="Kontras +"
                active={highContrastMode}
                onClick={() => setHighContrastMode(!highContrastMode)}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v18M12 3a9 9 0 0 1 0 18" fill="currentColor" />
                  </svg>
                }
              />

              <Tile
                label="Hitam Putih"
                active={pureBlackWhite}
                onClick={() => setPureBlackWhite(!pureBlackWhite)}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 3h9v18H3z" fill="currentColor" stroke="none" />
                  </svg>
                }
              />

              <Tile
                label="Sorot Tautan"
                active={highlightLinks}
                onClick={() => setHighlightLinks(!highlightLinks)}
                icon={<Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />}
              />

              <Tile
                label="Spasi Teks"
                active={largerTextSpacing}
                onClick={() => setLargerTextSpacing(!largerTextSpacing)}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
                    <path d="M3 10l2-2M3 10l2 2M21 10l-2-2M21 10l-2 2" />
                  </svg>
                }
              />

              <Tile
                label="Animasi Dijeda"
                active={pauseAnimations}
                onClick={() => setPauseAnimations(!pauseAnimations)}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" strokeDasharray="3 2" />
                    <rect x="9" y="8" width="2" height="8" rx="1" fill="currentColor" stroke="none" />
                    <rect x="13" y="8" width="2" height="8" rx="1" fill="currentColor" stroke="none" />
                  </svg>
                }
              />

              <Tile
                label="Sembunyikan Gambar"
                active={hideImages}
                onClick={() => setHideImages(!hideImages)}
                icon={<Icon d="M1 1l22 22M10.94 6.08A6.93 6.93 0 0 1 12 6c3.18 0 6 2.5 7.68 6-0.53 1.1-1.2 2.1-2 3.01M6.53 6.53C4.52 7.85 2.85 9.78 2 12c1.68 3.5 4.5 6 7.5 6.78M9 9a3 3 0 0 0 4.13 4.13" />}
              />

              <Tile
                label="Font Disleksia"
                active={dyslexiaFont}
                onClick={() => setDyslexiaFont(!dyslexiaFont)}
                info="Menggunakan font Lexend yang lebih mudah dibaca untuk pengguna dengan disleksia"
                icon={
                  <span className="font-black text-2xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>Df</span>
                }
              />

              <Tile
                label="Kursor Besar"
                active={largeCursor}
                onClick={() => setLargeCursor(!largeCursor)}
                icon={<Icon d="M5 3l14 9-7 1-4 7-3-17Z" />}
              />

              <Tile
                label="Keterangan Alat"
                active={tooltips}
                onClick={() => setTooltips(!tooltips)}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
              />

              <Tile
                label="Tinggi Garis"
                active={lineHeight}
                onClick={() => setLineHeight(!lineHeight)}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="21" y1="6" x2="9" y2="6" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                    <line x1="21" y1="18" x2="9" y2="18" />
                    <polyline points="3 8 3 3 3 8" />
                    <polyline points="3 21 3 16" />
                    <line x1="3" y1="12" x2="3" y2="12" />
                  </svg>
                }
              />

            </div>
          </section>

          {/* ── Text alignment ────────────────────────────────── */}
          <section aria-labelledby="a11y-align-label">
            <p id="a11y-align-label" className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-2 font-bold">Perataan Teks</p>
            <div className="flex gap-2">
              {(['normal', 'left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setTextAlign(align)}
                  aria-pressed={textAlign === align}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-[11px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer focus:outline-none
                    ${textAlign === align ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50'}`}
                >
                  {align === 'normal' ? 'Auto' : align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}
                </button>
              ))}
            </div>
          </section>

          {/* ── Saturation ────────────────────────────────────── */}
          <section aria-labelledby="a11y-sat-label">
            <p id="a11y-sat-label" className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-2 font-bold">Kejenuhan Warna</p>
            <div className="flex gap-2">
              {(['normal', 'low', 'high', 'mono'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSaturation(level)}
                  aria-pressed={saturation === level}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-[11px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer focus:outline-none
                    ${saturation === level ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50'}`}
                >
                  {level === 'normal' ? 'Auto' : level === 'low' ? 'Rendah' : level === 'high' ? 'Tinggi' : 'Mono'}
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* Footer reset button */}
        <div className="px-4 py-4 border-t border-slate-200 shrink-0 space-y-2">
          <button
            type="button"
            onClick={resetAll}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.92" />
            </svg>
            Atur Ulang Semua Pengaturan
          </button>
          <p className="text-[10px] text-slate-400 text-center font-mono">SIAP.PRIORITAS</p>
        </div>
      </aside>
    </>
  );
};

export default AccessibilityWidget;
