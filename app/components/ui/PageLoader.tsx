"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setLoading(true);
    setWidth(10);

    const t1 = setTimeout(() => setWidth(60), 100);
    const t2 = setTimeout(() => setWidth(85), 400);
    const t3 = setTimeout(() => {
      setWidth(100);
      const t4 = setTimeout(() => {
        setLoading(false);
        setWidth(0);
      }, 300);
      return () => clearTimeout(t4);
    }, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] h-0.5 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-brand-blue via-blue-400 to-brand-red transition-all duration-300 ease-out shadow-sm shadow-brand-blue/40"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
