"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import DaftarForm from '../components/DaftarForm';
import { db, User, supabase } from '../lib/db';

export default function DaftarPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const isSupabaseConfigured = !!supabase;

  // Check if session already exists
  useEffect(() => {
    const savedUser = localStorage.getItem('vd_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        router.push('/dashboard');
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  const handleRegistrationSuccess = (newUser: User) => {
    // Save new user session
    localStorage.setItem('vd_session', JSON.stringify(newUser));
    setRegisteredUser(newUser);
    setRegSuccess(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('vd_session');
    setCurrentUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar
        currentUser={currentUser || registeredUser}
        onLogout={handleLogout}
        isSupabaseConfigured={isSupabaseConfigured}
      />

      <main className="flex-1 flex flex-col">
        {!regSuccess ? (
          <DaftarForm
            onSuccess={handleRegistrationSuccess}
            onBackToLanding={() => router.push('/')}
          />
        ) : (
          registeredUser && (
            <div className="max-w-lg mx-auto my-16 bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-8 text-center flex flex-col items-center gap-6 animate-fade-in w-full">
              <span className="text-5xl animate-bounce">🎉</span>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Registrasi Berhasil!</h2>
                <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
                  Pendaftaran dan upload bukti bayar pendaftaran Anda telah berhasil dikirim. Akun Anda saat ini sedang dalam proses review aktivasi oleh admin/kasir.
                </p>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left w-full text-xs font-semibold text-slate-600 space-y-1.5">
                <p>📌 <strong>Nama:</strong> {registeredUser.name}</p>
                <p>📧 <strong>Email Login:</strong> {registeredUser.email}</p>
                <p>🥋 <strong>Status Latihan:</strong> {registeredUser.dojang}</p>
                <p>⌛ <strong>Status Akun:</strong> <span className="text-brand-red font-bold">Pending Aktivasi</span></p>
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    router.push('/dashboard');
                    router.refresh();
                  }}
                  className="w-1/2 py-3 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  Lihat Dashboard Saya
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-1/2 py-3 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition hover:bg-slate-50"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
