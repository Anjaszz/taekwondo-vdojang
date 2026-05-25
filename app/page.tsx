"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import { db, User, Event, Product, Category, supabase } from './lib/db';

export default function Page() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const isSupabaseConfigured = !!supabase;

  // Load session & events
  useEffect(() => {
    async function loadData() {
      // Initialize db connection
      await db.init();
      
      // Load events, products, and categories if Supabase is active
      if (isSupabaseConfigured) {
        try {
          const [evts, prods, cats] = await Promise.all([
            db.getEvents(),
            db.getProducts(),
            db.getCategories(),
          ]);
          setEvents(evts);
          setProducts(prods);
          setCategories(cats);
        } catch (e) {
          console.error('Error loading data:', e);
        }
      }

      // Check session
      const savedUser = localStorage.getItem('vd_session');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadData();
  }, [isSupabaseConfigured]);

  const handleLogout = () => {
    localStorage.removeItem('vd_session');
    setCurrentUser(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        isSupabaseConfigured={isSupabaseConfigured}
      />

      <main className="flex-1 flex flex-col">
        {/* If Supabase is not configured, show setup instructions */}
        {!isSupabaseConfigured ? (
          <div className="max-w-2xl mx-auto my-16 bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-lg text-slate-800 animate-fade-in flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⚡</span>
              <div>
                <h2 className="text-2xl font-black text-brand-blue">Taekwondo V-Dojang Setup</h2>
                <p className="text-slate-500 text-xs mt-0.5">Konfigurasi database Supabase Anda untuk memulai</p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-relaxed border-t border-slate-200/80 pt-6">
              <p>Untuk menjalankan aplikasi ini dengan Supabase secara eksklusif, harap ikuti langkah berikut:</p>
              
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <div>
                  <p className="font-extrabold text-slate-900">Buat File Kredensial</p>
                  <p className="text-xs text-slate-500 mt-1">Buat file bernama <code className="bg-slate-200 text-slate-850 px-1 py-0.5 rounded font-mono font-bold">.env.local</code> di root folder proyek ini, dan isi dengan kredensial API Supabase Anda:</p>
                  <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono mt-2 overflow-x-auto shadow-sm select-all">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key`}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <div>
                  <p className="font-extrabold text-slate-900">Jalankan SQL Schema</p>
                  <p className="text-xs text-slate-500 mt-1">Buka SQL Editor di dasbor Supabase Anda, salin seluruh isi dari file <code className="bg-slate-200 text-slate-850 px-1 py-0.5 rounded font-mono font-bold">[schema.sql](file:///c:/Users/HYPE%20AMD/Desktop/Project%20Anjaszz/taekwondo-vdojang/schema.sql)</code> yang telah kami buat di direktori proyek, lalu klik <strong>Run</strong>.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <div>
                  <p className="font-extrabold text-slate-900">Konfigurasi Storage Bucket</p>
                  <p className="text-xs text-slate-500 mt-1">Masuk ke menu Storage di dasbor Supabase Anda, buat bucket baru bernama <code className="bg-slate-200 text-slate-850 px-1 py-0.5 rounded font-mono font-bold">payment-proofs</code> dan atur aksesnya menjadi <strong>Public</strong> agar bukti bayar dapat terunggah.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-6 text-center text-xs text-slate-400">
              Setelah selesai mengatur kredensial dan file di atas, restart server dev lokal dengan menekan <code className="bg-slate-200 px-1.5 py-0.5 rounded font-bold">Ctrl+C</code> lalu jalankan kembali <code className="bg-slate-200 px-1.5 py-0.5 rounded font-bold">npm run dev</code>.
            </div>
          </div>
        ) : (
          <LandingPage
            events={events}
            products={products}
            categories={categories}
            currentUser={currentUser}
            onDaftarClick={() => router.push('/daftar')}
            setView={(view) => {
              if (view === 'login') router.push('/login');
              else if (view === 'daftar') router.push('/daftar');
              else if (view === 'dashboard') router.push('/dashboard');
            }}
          />
        )}
      </main>
    </div>
  );
}
