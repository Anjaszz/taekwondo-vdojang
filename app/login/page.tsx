"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { db, User, supabase } from '../lib/db';
import { Eye, EyeOff, LogIn, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSupabaseConfigured = !!supabase;

  useEffect(() => {
    const savedUser = localStorage.getItem('vd_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        router.push('/dashboard');
      } catch (e) { console.error(e); }
    }
  }, [router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!isSupabaseConfigured) { setLoginError('Koneksi Supabase belum terkonfigurasi.'); return; }
    if (!loginEmail || !loginPassword) { setLoginError('Harap isi email dan kata sandi.'); return; }

    setLoading(true);
    try {
      const users = await db.getUsers();
      const matched = users.find(u =>
        u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
      );
      if (matched) {
        localStorage.setItem('vd_session', JSON.stringify(matched));
        setCurrentUser(matched);
        setLoginEmail('');
        setLoginPassword('');
        router.push('/dashboard');
        router.refresh();
      } else {
        setLoginError('Email atau kata sandi salah. Silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Terjadi kesalahan koneksi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vd_session');
    setCurrentUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar currentUser={currentUser} onLogout={handleLogout} isSupabaseConfigured={isSupabaseConfigured} />

      <main className="flex-grow flex items-stretch">
        {/* Left branding panel — hidden on mobile */}
        <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 relative overflow-hidden bg-[#090681] flex-col justify-between p-12">
          {/* BG decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-red/20 rounded-full blur-3xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <img src="/v-dojang.jpeg" alt="Logo" className="w-10 h-10 rounded-xl object-cover border-2 border-white/30" />
            <div>
              <p className="font-black text-white text-lg leading-none">V-DOJANG</p>
              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mt-0.5">Taekwondo Club</p>
            </div>
          </div>

          {/* Center content */}
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield size={26} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white leading-snug">
              Selamat Datang di<br />
              <span className="text-white/60">V-Dojang Portal</span>
            </h2>
            <p className="text-white/50 text-sm font-medium leading-relaxed max-w-sm">
              Akses portal anggota, pantau riwayat pembayaran, daftar event UKT, dan beli perlengkapan bela diri — semuanya dalam satu tempat.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                'Pantau Status & Riwayat Sabuk',
                'Daftar Event & Ujian Kenaikan Tingkat',
                'Beli Perlengkapan Bela Diri',
                'Upload & Lacak Bukti Pembayaran',
              ].map(feat => (
                <div key={feat} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <ArrowRight size={10} className="text-white" />
                  </div>
                  <span className="text-sm text-white/70 font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="relative text-white/30 text-xs font-medium">
            © {new Date().getFullYear()} V-Dojang Taekwondo. All rights reserved.
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center py-12 px-6 sm:px-12 bg-white">
          <div className="w-full max-w-md animate-fade-in">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-brand-blue/8 border border-brand-blue/15 px-3 py-1.5 rounded-full mb-4">
                <LogIn size={12} className="text-brand-blue" />
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-blue">Portal Masuk</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">Masuk ke Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">Gunakan akun yang telah terdaftar di sistem V-Dojang.</p>
            </div>

            {/* Error */}
            {loginError && (
              <div className="mb-5 flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl animate-fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-300 transition bg-white"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 placeholder:text-slate-300 transition bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-md shadow-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/30 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  <>
                    <LogIn size={16} />
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-7 text-xs text-slate-400 font-semibold">
              Belum punya akun?{' '}
              <Link href="/daftar" className="text-brand-red font-black hover:underline">
                Daftar Anggota Baru
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
