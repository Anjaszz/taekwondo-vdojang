"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { db, User, supabase } from '../lib/db';
import { DashboardContext } from './context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isSupabaseConfigured = !!supabase;

  // Retrieve user session and sync latest status
  useEffect(() => {
    const checkSession = async () => {
      const savedUser = localStorage.getItem('vd_session');
      if (!savedUser) {
        router.push('/login');
        return;
      }

      try {
        const parsed = JSON.parse(savedUser) as User;
        const users = await db.getUsers();
        const latestUser = users.find(u => u.id === parsed.id);

        if (latestUser) {
          localStorage.setItem('vd_session', JSON.stringify(latestUser));
          setCurrentUser(latestUser);
        } else {
          localStorage.removeItem('vd_session');
          router.push('/login');
        }
      } catch (e) {
        console.error('Error fetching latest user details:', e);
        // Fallback to local storage copy if database query fails
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
        } catch (_) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('vd_session');
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  const handleUpdateProfile = (updatedUser: User) => {
    localStorage.setItem('vd_session', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 font-semibold text-sm">
        ⚖️ Memuat Dashboard...
      </div>
    );
  }

  if (!currentUser) return null;

  const isMember = currentUser.role === 'anggota';
  const isAdminOrKasir = currentUser.role === 'admin' || currentUser.role === 'kasir';

  return (
    <DashboardContext.Provider value={{ currentUser, onUpdateProfile: handleUpdateProfile, onLogout: handleLogout }}>
      <div className={`flex flex-col bg-[#fafafc] ${isAdminOrKasir ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        {/* Only render landing page Navbar for members. Admin/Kasir have full-screen layouts. */}
        {isMember && (
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            isSupabaseConfigured={isSupabaseConfigured}
          />
        )}

        <main className="flex-grow flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  );
}
