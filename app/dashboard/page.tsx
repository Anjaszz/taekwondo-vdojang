"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context';

export default function DashboardRootPage() {
  const router = useRouter();
  const { currentUser } = useDashboard();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'kasir') {
        router.replace('/dashboard/ringkasan');
      } else if (currentUser.role === 'anggota') {
        router.replace('/dashboard/profil');
      }
    }
  }, [currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafc] text-slate-500 font-semibold text-sm">
      ⚖️ Mengarahkan ke Dashboard...
    </div>
  );
}
