"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '../lib/db';
import { Menu, X, Shield, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  isSupabaseConfigured: boolean;
}

export default function Navbar({ currentUser, onLogout, isSupabaseConfigured }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/#dojang-section', label: 'Dojang' },
    { href: '/#events-section', label: 'Kegiatan / UKT' },
    { href: '/#shop-section', label: 'Toko Peralatan' },
  ];

  const roleLabel = currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'kasir' ? 'Kasir' : 'Anggota';
  const roleColor = currentUser?.role === 'admin' ? 'bg-brand-blue/10 text-brand-blue' : currentUser?.role === 'kasir' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className="w-full flex flex-col z-50 sticky top-0">
      {/* Supabase Config Banner */}
      {!isSupabaseConfigured && (
        <div className="bg-brand-red text-white py-2 px-4 text-xs font-bold text-center border-b border-brand-red-hover">
          ⚠️ Supabase belum terkonfigurasi. Buat file <code className="bg-black/20 px-1 rounded">.env.local</code> dan import <code className="bg-black/20 px-1 rounded">schema.sql</code>.
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white/96 backdrop-blur-md shadow-sm border-b border-slate-100/80 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              <img
                src="/v-dojang.jpeg"
                alt="V-Dojang Logo"
                className="w-9 h-9 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow duration-200"
              />
             
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-black text-base tracking-tight text-slate-900 group-hover:text-brand-blue transition-colors">V-DOJANG</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand-red">Taekwondo Club</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? 'text-brand-blue bg-brand-blue/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {currentUser && isSupabaseConfigured && (
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/dashboard')
                    ? 'text-brand-blue bg-brand-blue/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="font-bold text-sm text-slate-800 leading-tight">{currentUser.name}</span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md mt-0.5 ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-brand-red hover:border-brand-red/40 transition-all duration-200"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`px-4 py-2 text-sm font-bold transition-colors ${
                    !isSupabaseConfigured ? 'text-slate-300 pointer-events-none' : 'text-brand-blue hover:text-brand-blue-hover'
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 ${
                    !isSupabaseConfigured
                      ? 'bg-slate-200 text-slate-400 pointer-events-none'
                      : 'bg-brand-red hover:bg-brand-red-hover text-white hover:shadow-md'
                  }`}
                >
                  Daftar
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 animate-fade-in">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition"
              >
                {link.label}
              </Link>
            ))}
            {currentUser && isSupabaseConfigured && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            )}
            {currentUser && (
              <button
                onClick={() => { setMobileOpen(false); onLogout(); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-red hover:bg-rose-50 transition"
              >
                <LogOut size={15} />
                Keluar
              </button>
            )}
          </div>
        )}
      </header>
    </div>
  );
}
