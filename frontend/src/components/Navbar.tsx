import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import authService from '../services/authService';
import type { User } from '../services/authService';
import logoImg from '../assets/logo.jpeg';

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => authService.getUser());

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
    <header className="bg-white text-slate-900 w-full border-b border-slate-200">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-slate-900 focus:text-white focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:outline-none"
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
          <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            SIAP<span className="font-light text-slate-500">.PRIORITAS</span>
          </span>
        </div>

        <nav aria-label="Navigasi Utama" className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest">
          {user?.role !== 'OFFICER' && (
            <>
              <NavLink
                to="/guide"
                className={({ isActive }) =>
                  `px-4 py-2 border-b-2 transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'border-slate-900 text-slate-900 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                Panduan Berkas
              </NavLink>
              <NavLink
                to="/reservation"
                className={({ isActive }) =>
                  `px-4 py-2 border-b-2 transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'border-slate-900 text-slate-900 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                Reservasi Antrean
              </NavLink>
            </>
          )}
          {user?.role === 'OFFICER' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-4 py-2 border-b-2 transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`
              }
            >
              Dashboard Petugas
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
