import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import authService from '../services/authService';
import type { User } from '../services/authService';
import logoImg from '../assets/Logo_Ditjen_Imigrasi.png';

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const normalizedRole = user?.role === 'ADMIN' ? 'OFFICER' : user?.role;

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authService.getUser());
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  return (
    <header
      className="w-full border-b border-white/15 shadow-[0_10px_28px_rgba(11,95,168,0.22)] backdrop-blur-sm"
      style={{ background: 'linear-gradient(90deg, #0b5fa8 0%, #0d7fc8 100%)', color: '#ffffff' }}
    >
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-[#043666] focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:outline-none"
      >
        Lompat ke Konten Utama
      </a>

      {/* Brand & Menu Header - Full Width */}
      <div className="w-full px-8 md:px-12 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="Logo Kantor Imigrasi"
            className="h-10 w-auto object-contain rounded"
          />
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            SIAP<span className="font-light text-blue-100">.PRIORITAS</span>
          </span>
        </div>

        <nav aria-label="Navigasi Utama" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
          {normalizedRole !== 'OFFICER' && (
            <>
              <NavLink
                to="/guide"
                className={({ isActive }) =>
                  `rounded-full border px-4 py-2.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-white/30 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'border-transparent text-blue-100 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                Panduan Berkas
              </NavLink>
              <NavLink
                to="/reservation"
                className={({ isActive }) =>
                  `rounded-full border px-4 py-2.5 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-white/30 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'border-transparent text-blue-100 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                Reservasi Antrean
              </NavLink>
              <a
                href="/guide#passport-issue-title"
                className="rounded-full border border-white/20 bg-white/8 px-4 py-2.5 text-white transition-all duration-200 hover:bg-white/12 cursor-pointer"
              >
                Informasi
              </a>
            </>
          )}
          {normalizedRole === 'OFFICER' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-full border px-4 py-2.5 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-white/30 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'border-transparent text-blue-100 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              Dashboard Petugas
            </NavLink>
          )}
          {!user && (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `rounded-full border px-4 py-2.5 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-white/30 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'border-transparent text-blue-100 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              Masuk / Daftar
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
