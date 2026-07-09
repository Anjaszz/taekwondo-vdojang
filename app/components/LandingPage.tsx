import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, Event, Product, Category, User, Transaction, SystemSettings } from '../lib/db';
import LazyImage from './ui/LazyImage';
import { useToast } from './ui/ToastProvider';
import {
  Trophy, Swords, Shield, MapPin, Calendar, Users,
  ShoppingBag, Mail, Phone, ChevronRight, ArrowRight,
  Ticket, Star, Package, ExternalLink, Loader2, X, CreditCard, UploadCloud, Copy, Check, Plus, Minus,
} from 'lucide-react';

interface LandingPageProps {
  events: Event[];
  products: Product[];
  categories: Category[];
  currentUser: User | null;
  onDaftarClick: () => void;
  setView: (view: string) => void;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 text-[11px] font-black tracking-widest text-brand-red uppercase">
    <span className="w-4 h-0.5 bg-brand-red rounded-full" />
    {children}
  </span>
);

export default function LandingPage({
  events, products, categories, currentUser, onDaftarClick, setView,
}: LandingPageProps) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Settings loaded from DB
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = () => {
    if (settings?.bankAccount) {
      navigator.clipboard.writeText(settings.bankAccount);
      setCopied(true);
      toastSuccess('Nomor rekening berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Modal / Checkout states
  const [checkoutItem, setCheckoutItem] = useState<{
    type: 'UKT' | 'Aksesoris';
    id: string;
    name: string;
    price: number;
    categoryId?: string;
    stock?: number;
  } | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);
  const [checkoutSize, setCheckoutSize] = useState<string>('');
  const [checkoutFile, setCheckoutFile] = useState<File | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<string>('');
  const [checkoutBelt, setCheckoutBelt] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch bank settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const setts = await db.getSettings();
        setSettings(setts);
      } catch (err) {
        console.error('Gagal memuat pengaturan pembayaran:', err);
      }
    }
    fetchSettings();
  }, []);

  // Trigger Checkout Modal
  const openCheckout = (type: 'UKT' | 'Aksesoris', item: Event | Product) => {
    setCheckoutItem({
      type,
      id: item.id,
      name: item.name,
      price: item.price,
      categoryId: (item as Product).categoryId || undefined,
      stock: (item as Product).stock !== undefined ? (item as Product).stock : undefined,
    });
    setCheckoutQuantity(1);
    setCheckoutSize('');
    setCheckoutFile(null);
    setCheckoutPreview('');
    setCheckoutBelt(currentUser?.belt || 'Sabuk Putih');
  };

  // Detect checkout query parameters on Landing Page and open modal automatically
  useEffect(() => {
    if (products.length > 0 && events.length > 0 && settings) {
      const params = new URLSearchParams(window.location.search);
      const checkoutProductId = params.get('checkout');
      const checkoutEventId = params.get('checkoutEvent');

      if (checkoutProductId) {
        const foundProd = products.find(p => p.id === checkoutProductId);
        if (foundProd && foundProd.stock > 0) {
          openCheckout('Aksesoris', foundProd);
          
          // Clear query params to clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete('checkout');
          window.history.replaceState({}, '', url.toString());
        }
      } else if (checkoutEventId) {
        const foundEvt = events.find(e => e.id === checkoutEventId);
        if (foundEvt) {
          openCheckout('UKT', foundEvt);
          
          // Clear query params to clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete('checkoutEvent');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [products, events, settings]);

  const handleBuyProduct = (prodId: string) => {
    if (currentUser) {
      if (currentUser.role === 'anggota') {
        const foundProd = products.find(p => p.id === prodId);
        if (foundProd && foundProd.stock > 0) {
          openCheckout('Aksesoris', foundProd);
        }
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push(`/login?redirect=/?checkout=${prodId}`);
    }
  };

  const handleRegisterEvent = (evtId: string) => {
    if (currentUser) {
      if (currentUser.role === 'anggota') {
        const foundEvt = events.find(e => e.id === evtId);
        if (foundEvt) {
          openCheckout('UKT', foundEvt);
        }
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push(`/login?redirect=/?checkoutEvent=${evtId}`);
    }
  };

  // Handle Checkout Upload File
  const handleCheckoutFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCheckoutFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCheckoutPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Purchase/Registration Checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !checkoutItem || !settings) return;
    if (!checkoutFile && !checkoutPreview) {
      toastWarning('Harap unggah bukti transfer pembayaran.');
      return;
    }

    setLoading(true);
    try {
      const uploadData = checkoutFile || checkoutPreview;
      const imageUrl = await db.uploadImage(uploadData);

      const finalAmount = checkoutItem.price * (checkoutItem.type === 'Aksesoris' ? checkoutQuantity : 1);
      const uktBeltSuffix = checkoutItem.type === 'UKT' ? ` (Sabuk Terakhir: ${checkoutBelt})` : '';
      const sizeSuffix = checkoutSize ? `, Ukuran: ${checkoutSize}` : '';
      const qtySuffix = checkoutItem.type === 'Aksesoris' ? ` (x${checkoutQuantity}${sizeSuffix})` : '';

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        memberId: currentUser.id,
        memberName: currentUser.name,
        type: checkoutItem.type,
        details: `${checkoutItem.type === 'UKT' ? 'Pendaftaran Event' : 'Pembelian Aksesoris'}: ${checkoutItem.name}${qtySuffix}${uktBeltSuffix}`,
        amount: finalAmount,
        proofImage: imageUrl,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      };

      await db.addTransaction(newTx);
      setCheckoutItem(null);
      toastSuccess('Pembayaran berhasil dikirim! Mengarahkan Anda ke Riwayat Transaksi...');
      
      // Redirect to member dashboard transaction history after short delay
      setTimeout(() => {
        router.push('/dashboard/riwayat');
      }, 1500);
    } catch (err) {
      console.error(err);
      toastError('Gagal mengirim bukti pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white overflow-x-hidden font-sans">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white py-20 sm:py-28 px-6 border-b border-slate-100">
        {/* BG blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/[0.04] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-0" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-red/[0.04] rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 -z-0" />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start gap-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-brand-blue/8 border border-brand-blue/15 px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse-slow" />
              <span className="text-[11px] font-black uppercase tracking-widest text-brand-blue">
                Akademi Sabuk Hitam & Prestasi
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.08] text-slate-900">
              Temukan Disiplin,<br />
              Bangun{' '}
              <span className="relative">
                <span className="relative z-10 text-brand-blue">Mental Juara</span>
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-brand-blue/10 rounded -z-0" />
              </span>
            </h1>

            <p className="text-slate-500 text-base sm:text-lg max-w-lg leading-relaxed font-medium">
              V-Dojang Taekwondo melatih fisik, kedisiplinan diri, dan integritas moral. Kurikulum standar Kukkiwon untuk segala jenjang umur dibimbing langsung oleh Sabeum bersertifikasi nasional.
            </p>

            {/* Stats row */}
            <div className="flex gap-6 text-center">
              {[['200+', 'Anggota Aktif'], ['26+', 'Tahun Berdiri'], ['3', 'Dojang Cabang']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-black text-brand-blue">{num}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-1">
              <button
                onClick={onDaftarClick}
                className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-sm font-black uppercase tracking-wider px-7 py-3.5 rounded-xl shadow-lg shadow-brand-blue/25 hover:shadow-xl hover:shadow-brand-blue/30 transition-all duration-200"
              >
                Daftar Sekarang
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-sm font-bold px-7 py-3.5 rounded-xl transition-all duration-200"
              >
                Pelajari Program
              </button>
            </div>
          </div>

          {/* Right - Hero Image */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center stagger-2 animate-fade-in">
            <div className="relative w-full max-w-md">
              {/* Decorative ring */}
              <div className="absolute -inset-3 bg-gradient-to-br from-brand-blue/10 to-brand-red/10 rounded-[2rem] -z-10" />
              <div className="relative w-full aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden shadow-2xl group border border-white/50">
                <img
                  src="/hero-img.jpg"
                  alt="Taekwondo Training V-Dojang"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROGRAM CARDS ─────────────────────────────────────── */}
      <section id="about-section" className="py-20 px-6 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Program Unggulan</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">Kurikulum Berstandar Internasional</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm font-medium leading-relaxed">
              Tiga pilar program latihan terintegrasi yang membentuk atlet berprestasi sekaligus generasi berkarakter.
            </p>
            <div className="mt-6 flex justify-center">
              <img
                src="/v-dojang.jpeg"
                alt="V-Dojang Logo"
                className="w-40 h-40 rounded-[2rem] object-cover shadow-xl border-4 border-white hover:scale-105 transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Trophy size={22} />,
                color: 'bg-amber-50 text-amber-600 border-amber-100',
                accent: 'bg-amber-600',
                title: 'Prestasi & Turnamen',
                desc: 'Program pembinaan atlet untuk kejuaraan daerah dan nasional dengan bimbingan teknik kyorugi (tarung) modern.',
                delay: 'stagger-1',
              },
              {
                icon: <Swords size={22} />,
                color: 'bg-brand-red/10 text-brand-red border-brand-red/10',
                accent: 'bg-brand-red',
                title: 'Teknik & Poomsae',
                desc: 'Pembelajaran seni jurus (poomsae) yang berfokus pada ketepatan gerakan, keseimbangan, dan kekuatan nafas.',
                delay: 'stagger-2',
              },
              {
                icon: <Shield size={22} />,
                color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/10',
                accent: 'bg-brand-blue',
                title: 'Pilar Kedisiplinan',
                desc: 'Melatih kejujuran, sportivitas, etika moral, dan membangun rasa percaya diri anak sejak tingkatan sabuk dasar.',
                delay: 'stagger-3',
              },
            ].map(item => (
              <div
                key={item.title}
                className={`bg-white rounded-2xl p-7 border border-slate-100 card-hover animate-fade-in ${item.delay} group`}
              >
                <div className={`inline-flex w-12 h-12 rounded-2xl items-center justify-center border ${item.color} mb-5`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                <div className={`h-0.5 ${item.accent} w-0 group-hover:w-12 transition-all duration-300 rounded-full mt-5`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOKO PRODUK ───────────────────────────────────────── */}
      <section id="shop-section" className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-14">
            <div>
              <SectionLabel>Toko Resmi Club</SectionLabel>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">Peralatan Bela Diri & Dobok</h2>
              <p className="text-slate-500 mt-2 font-medium text-sm max-w-lg">
                Lengkapi kebutuhan latihan dengan seragam dobok resmi Kukkiwon, body protector, dan perlengkapan latihan lainnya.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {categories.map(cat => {
              const catProducts = products.filter(p => p.categoryId === cat.id);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <Package size={14} className="text-slate-400" />
                    <h3 className="font-black text-[11px] text-slate-400 uppercase tracking-widest">{cat.name}</h3>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {catProducts.map(prod => (
                      <div
                        key={prod.id}
                        className="bg-white border border-slate-100 rounded-2xl overflow-hidden card-hover group flex flex-col"
                      >
                        {/* Product image */}
                        <div className="relative w-full aspect-square bg-slate-50 overflow-hidden">
                          {prod.image ? (
                            <LazyImage
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full"
                              fallback={<Package size={32} className="text-slate-300" />}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={36} className="text-slate-300" />
                            </div>
                          )}
                          {/* Stock badge */}
                          <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            prod.stock > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {prod.stock > 0 ? `Stok ${prod.stock}` : 'Habis'}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 flex flex-col flex-1">
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug mb-1">{prod.name}</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3 flex-1 font-medium">{prod.description}</p>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <span className="font-black text-brand-blue text-sm">
                              Rp {prod.price.toLocaleString('id-ID')}
                            </span>
                            <button
                              onClick={() => handleBuyProduct(prod.id)}
                              disabled={prod.stock === 0}
                              className="flex items-center gap-1 px-3 py-1.5 bg-brand-red hover:bg-brand-red-hover disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition"
                            >
                              {prod.stock === 0 ? 'Habis' : (currentUser ? 'Beli' : 'Masuk & Beli')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                <Package size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold text-sm">Produk belum tersedia saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── DOJANG CARDS ─────────────────────────────────────── */}
      <section id="dojang-section" className="py-20 px-6 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Tempat Latihan</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">Dojang & Lokasi Latihan Training Center</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm font-medium">
              Pilih cabang dojang latihan terdekat untuk mengikuti jadwal rutin pendaftaran.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                badge: 'Cikunir',
                name: 'Waterfall Cikunir',
                address: 'Jl. Waterfall Raya, Cikunir, Bekasi',
                schedule: 'Minggu (16.00 s/d 18.00)',
                gradient: 'from-brand-blue/8 to-brand-blue/3',
                accent: 'brand-blue',
              },
              {
                badge: 'UNM',
                name: 'Universitas Nusa Mandiri',
                address: 'Kampus Universitas Nusa Mandiri, Jakarta',
                schedule: 'Selasa (19.00 s/d 21.00)',
                gradient: 'from-violet-50 to-violet-50/20',
                accent: 'violet-600',
              },
              {
                badge: 'SMPN 252',
                name: 'Smpn 252 Jakarta Timur',
                address: 'Jl. H. Naman No. 1, Pondok Kelapa, Duren Sawit, Jakarta Timur',
                schedule: 'Rabu & Sabtu (18.00 s/d 20.00)',
                gradient: 'from-brand-red/8 to-brand-red/3',
                accent: 'brand-red',
              },
            ].map((d, i) => (
              <div key={d.name} className={`bg-gradient-to-br ${d.gradient} border border-slate-100 rounded-2xl p-6 card-hover flex flex-col animate-fade-in stagger-${i + 1}`}>
                <div className="flex justify-between items-center mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                    <Shield size={18} className="text-brand-blue" />
                  </div>
                  <span className="bg-white border border-slate-100 text-slate-650 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                    {d.badge}
                  </span>
                </div>

                <h4 className="font-black text-lg text-slate-900 mb-1 leading-snug">{d.name}</h4>

                <div className="space-y-2 my-4 flex-1">
                  <div className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                    <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
                    <span>{d.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar size={13} className="shrink-0 text-slate-400" />
                    <span>{d.schedule}</span>
                  </div>
                </div>

                <button
                  onClick={onDaftarClick}
                  className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 mt-2"
                >
                  Pilih Dojang Ini
                  <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS ───────────────────────────────────────────── */}
      <section id="events-section" className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <SectionLabel>Agenda Club</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">Kegiatan Terdekat & UKT</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm font-medium">
              Lihat agenda turnamen, seminar, serta Ujian Kenaikan Tingkat (UKT) sabuk resmi yang akan datang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.length > 0 ? (
              events.map((evt, i) => (
                <div
                  key={evt.id}
                  className={`bg-white border border-slate-100 rounded-2xl overflow-hidden card-hover flex flex-col animate-fade-in stagger-${(i % 3) + 1}`}
                >
                  {/* Color header bar */}
                  <div className="h-1.5 bg-gradient-to-r from-brand-blue to-brand-red" />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-1.5 bg-brand-blue/8 text-brand-blue px-2.5 py-1 rounded-full">
                        <Star size={10} />
                        <span className="text-[10px] font-black uppercase">{evt.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-brand-blue">
                        <Ticket size={13} />
                        <span className="font-black text-sm">Rp {evt.price.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base mb-3 leading-snug flex-1">{evt.name}</h4>

                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{evt.date || '--'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{evt.location || '--'}</span>
                      </div>
                    </div>

                    {(() => {
                      const d = new Date();
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      const todayStr = `${year}-${month}-${day}`;
                      
                      const isEventExpired = evt.date ? evt.date < todayStr : false;
                      const isEventInactive = evt.status === 'Nonaktif';
                      const isClosed = isEventExpired || isEventInactive;

                      if (isClosed) {
                        return (
                          <button
                            disabled
                            className="w-full py-2.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed"
                          >
                            {isEventExpired ? 'Event Berakhir' : 'Tidak Aktif'}
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={() => handleRegisterEvent(evt.id)}
                          className="w-full py-2.5 border border-brand-blue/30 text-brand-blue font-bold rounded-xl text-xs hover:bg-brand-blue hover:text-white hover:border-brand-blue transition duration-200 uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          {currentUser ? 'Daftar Event' : 'Masuk & Daftar'}
                          <ExternalLink size={12} />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold text-sm">Tidak ada agenda terdekat saat ini.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-3xl bg-[#090681] p-10 sm:p-14">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-red/20 rounded-full blur-3xl" />

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full">
                <Star size={11} className="text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Bergabung Sekarang</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Ayo Mulai Latihan Taekwondo Anda
              </h2>
              <p className="text-white/60 text-sm max-w-md font-medium">
                Pendaftaran online praktis, verifikasi pembayaran cepat, dan pantau riwayat sabuk Anda secara digital.
              </p>
            </div>

            <button
              onClick={onDaftarClick}
              className="shrink-0 flex items-center gap-2.5 bg-white hover:bg-slate-50 text-slate-900 text-sm font-black uppercase tracking-wider px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200"
            >
              Daftar Anggota Sekarang
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-14 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/v-dojang.jpeg" alt="V-Dojang Logo" className="w-9 h-9 rounded-xl object-cover" />
              <div>
                <span className="font-black text-white text-sm">V-DOJANG</span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Taekwondo Club</p>
              </div>
            </div>
            
          </div>

          {/* Links */}
          <div>
            <h5 className="font-black text-white text-xs mb-5 uppercase tracking-widest">Aktivitas</h5>
            <ul className="space-y-2.5 text-xs font-medium">
              {['Latihan Kyorugi (Sparring)', 'Latihan Poomsae (Jurus)', 'Ujian Kenaikan Sabuk', 'Kompetisi Prestasi'].map(item => (
                <li key={item} className="flex items-center gap-2 hover:text-slate-300 transition cursor-default">
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="font-black text-white text-xs mb-5 uppercase tracking-widest">Hubungi Kami</h5>
            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-center gap-2">
                <Mail size={12} className="text-slate-500 shrink-0" />
                <a 
                  href="mailto:naufalmuzakkiramadhan@gmail.com" 
                  className="hover:text-white transition-colors duration-200"
                >
                  naufalmuzakkiramadhan@gmail.com 
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={12} className="text-slate-500 shrink-0" />
                <a 
                  href="https://wa.me/6281213890279" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors duration-200"
                >
                  +62 812-1389-0279
                </a>
              </li>
             
            </ul>
          </div>

          {/* Payment */}
          <div>
            <h5 className="font-black text-white text-xs mb-5 uppercase tracking-widest">Metode Bayar</h5>
            <ul className="space-y-2.5 text-xs font-medium">
              {['Transfer Bank BCA', 'Review Bukti Bayar Instan', 'Konfirmasi oleh admin'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600 font-medium">
          <span>© {new Date().getFullYear()} V-Dojang Taekwondo Club. All rights reserved.</span>
          <span className="flex items-center gap-1">Built with <span className="text-brand-red">♥</span> for Indonesian Taekwondo</span>
        </div>
      </footer>

      {/* CHECKOUT MODAL */}
      {checkoutItem && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm overflow-hidden shadow-lg animate-fade-in animate-duration-150">
            <div className="border-b border-slate-100 p-5 flex justify-between items-center font-sans">
              <div>
                <h3 className="font-black text-sm text-slate-800">Checkout Pembayaran</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{checkoutItem.type}</p>
              </div>
              <button onClick={() => setCheckoutItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 font-sans">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Rincian:</p>
                <h4 className="font-extrabold text-slate-800 text-sm mt-0.5 leading-snug">{checkoutItem.name}</h4>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center space-y-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Transfer Nominal</p>
                  <p className="text-xl font-black text-brand-blue">
                    Rp {(checkoutItem.price * (checkoutItem.type === 'Aksesoris' ? checkoutQuantity : 1)).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="border-t border-slate-200/50 pt-2.5 text-[11px] font-semibold text-slate-500 space-y-0.5">
                  <p>Kirim ke rekening resmi:</p>
                  <p className="font-bold text-slate-800">{settings.bankName}</p>
                  <div className="flex items-center justify-center gap-2 my-1">
                    <p className="font-black text-base text-brand-red tracking-wider leading-none">{settings.bankAccount}</p>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="p-1 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition flex items-center justify-center border border-slate-200/50 bg-white shadow-xs"
                    >
                      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                  </div>
                  <p className="text-[9px]">a/n {settings.bankRecipient}</p>
                </div>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                {checkoutItem.type === 'Aksesoris' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Jumlah Pembelian</label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={checkoutQuantity <= 1}
                          onClick={() => setCheckoutQuantity(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-bold transition disabled:opacity-40 bg-white"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={checkoutItem.stock || 99}
                          value={checkoutQuantity}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            const maxVal = checkoutItem.stock || 99;
                            setCheckoutQuantity(Math.min(maxVal, val));
                          }}
                          className="w-12 h-8 text-center border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white"
                        />
                        <button
                          type="button"
                          disabled={checkoutQuantity >= (checkoutItem.stock || 99)}
                          onClick={() => setCheckoutQuantity(prev => Math.min(checkoutItem.stock || 99, prev + 1))}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-bold transition disabled:opacity-40 bg-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {checkoutItem.categoryId === 'cat-1' && (
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Ukuran Baju</label>
                        <select
                          value={checkoutSize}
                          onChange={e => setCheckoutSize(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white cursor-pointer"
                          required
                        >
                          <option value="">-- Pilih Ukuran --</option>
                          {Array.from({ length: 11 }, (_, i) => 100 + i * 10).map(sz => (
                            <option key={sz} value={String(sz)}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {checkoutItem.categoryId === 'cat-2' && (
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Ukuran Body Guard</label>
                        <select
                          value={checkoutSize}
                          onChange={e => setCheckoutSize(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white cursor-pointer"
                          required
                        >
                          <option value="">-- Pilih Ukuran --</option>
                          {['0', '1', '2', '3', '4', '5'].map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {checkoutItem.type === 'UKT' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Sabuk Terakhir</label>
                    <input
                      type="text"
                      value={checkoutBelt}
                      onChange={e => setCheckoutBelt(e.target.value)}
                      placeholder="Contoh: Sabuk Hijau"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Upload File Bukti Transfer
                  </label>
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-brand-blue/30 rounded-xl p-4 transition bg-slate-50/20 cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCheckoutFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    {checkoutPreview ? (
                      <img src={checkoutPreview} alt="Bukti" className="max-h-24 object-contain rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <span className="text-xl block">📸</span>
                        <p className="font-bold text-[10px] text-slate-500 mt-1">Pilih Foto Bukti Struk</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <CreditCard size={14} />
                      Kirim Bukti Pembayaran
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
