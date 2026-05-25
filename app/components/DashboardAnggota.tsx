import React, { useState, useEffect } from 'react';
import { db, User, Transaction, Product, Category, Event, SystemSettings } from '../lib/db';
import { useToast } from './ui/ToastProvider';
import {
  User as UserIcon, Package, Calendar, History, Shield, Menu,
  ChevronLeft, ChevronRight, Upload, X, ShoppingBag, Ticket, CreditCard,
} from 'lucide-react';

interface DashboardAnggotaProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  setView: (view: string) => void;
  activeTabProp: string;
  setActiveTabProp: (tab: string) => void;
}

type TabType = 'profil' | 'riwayat' | 'kegiatan' | 'aksesoris';

export default function DashboardAnggota({
  user,
  onUpdateProfile,
  setView,
  activeTabProp,
  setActiveTabProp,
}: DashboardAnggotaProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();

  // Tabs
  const activeTab = (activeTabProp || 'profil') as TabType;
  const setActiveTab = setActiveTabProp;

  // Pagination state
  const [currentPageRiwayat, setCurrentPageRiwayat] = useState(1);

  // Loaded DB Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Form states for profile edit
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileAge, setProfileAge] = useState(user.age || 0);
  const [profileGender, setProfileGender] = useState<'Laki-laki' | 'Perempuan'>(user.gender || 'Laki-laki');
  const [profileDojang, setProfileDojang] = useState(user.dojang || '');

  // Operation States
  const [loading, setLoading] = useState(false);

  // Modal / Checkout states
  const [checkoutItem, setCheckoutItem] = useState<{
    type: 'UKT' | 'Aksesoris';
    id: string;
    name: string;
    price: number;
    extraDetail?: string;
  } | null>(null);
  const [checkoutFile, setCheckoutFile] = useState<File | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<string>('');

  // Re-upload proof state (for rejected payments)
  const [reUploadTx, setReUploadTx] = useState<Transaction | null>(null);
  const [reUploadFile, setReUploadFile] = useState<File | null>(null);
  const [reUploadPreview, setReUploadPreview] = useState<string>('');

  // Load Data
  const loadDashboardData = async () => {
    const [txs, prods, cats, evts, setts] = await Promise.all([
      db.getTransactions(),
      db.getProducts(),
      db.getCategories(),
      db.getEvents(),
      db.getSettings(),
    ]);

    const memberTxs = txs.filter(t => t.memberId === user.id);
    setTransactions(memberTxs);
    setProducts(prods);
    setCategories(cats);
    setEvents(evts);
    setSettings(setts);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  // Profile Form Handle
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedUser: User = {
        ...user,
        name: profileName,
        phone: profilePhone,
        age: Number(profileAge),
        gender: profileGender,
        dojang: profileDojang,
      };

      await db.updateUser(updatedUser);
      onUpdateProfile(updatedUser);
      toastSuccess('Profil berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      toastError('Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Checkout Modal
  const openCheckout = (type: 'UKT' | 'Aksesoris', item: Event | Product) => {
    setCheckoutItem({
      type,
      id: item.id,
      name: item.name,
      price: item.price,
    });
    setCheckoutFile(null);
    setCheckoutPreview('');
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
    if (!checkoutItem || !settings) return;
    if (!checkoutFile && !checkoutPreview) {
      toastWarning('Harap unggah bukti transfer pembayaran.');
      return;
    }

    setLoading(true);
    try {
      const uploadData = checkoutFile || checkoutPreview;
      const imageUrl = await db.uploadImage(uploadData);

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        memberId: user.id,
        memberName: user.name,
        type: checkoutItem.type,
        details: `${checkoutItem.type === 'UKT' ? 'Pendaftaran Event' : 'Pembelian Aksesoris'}: ${checkoutItem.name}`,
        amount: checkoutItem.price,
        proofImage: imageUrl,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      };

      await db.addTransaction(newTx);
      setCheckoutItem(null);
      await loadDashboardData();
      setActiveTab('riwayat');
      toastSuccess('Pembayaran berhasil dikirim! Silakan tunggu verifikasi.');
    } catch (err) {
      console.error(err);
      toastError('Gagal mengirim bukti pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Re-upload proof
  const handleReUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reUploadTx) return;
    if (!reUploadFile && !reUploadPreview) {
      toastWarning('Harap pilih foto bukti pembayaran baru.');
      return;
    }

    setLoading(true);
    try {
      const uploadData = reUploadFile || reUploadPreview;
      const imageUrl = await db.uploadImage(uploadData);

      const updatedTxList = transactions.map(t => {
        if (t.id === reUploadTx.id) {
          return {
            ...t,
            proofImage: imageUrl,
            status: 'Pending' as const,
            rejectReason: '',
          };
        }
        return t;
      });

      await db.saveTransactions(updatedTxList);
      setReUploadTx(null);
      await loadDashboardData();
      toastSuccess('Bukti transfer baru berhasil dikirim untuk diverifikasi ulang.');
    } catch (err) {
      console.error(err);
      toastError('Gagal mengunggah bukti transfer baru.');
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / 5);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-slate-100 bg-slate-50/20 text-xs font-semibold text-slate-500 rounded-xl mt-4">
        <div>
          Menampilkan <span className="font-bold text-slate-707">{Math.min(totalItems, (currentPage - 1) * 5 + 1)}</span> sampai{' '}
          <span className="font-bold text-slate-707">{Math.min(totalItems, currentPage * 5)}</span> dari{' '}
          <span className="font-bold text-slate-707">{totalItems}</span> entri
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition"
          >
            <ChevronLeft size={14} />
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 flex items-center justify-center rounded-lg border transition text-[10px] ${
                  currentPage === pageNum
                    ? 'bg-brand-blue border-brand-blue text-white font-black'
                    : 'border-slate-200 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8 flex-1 w-full animate-fade-in font-sans">
      {/* Premium Welcome Header */}
      <div className="bg-gradient-to-br from-brand-blue to-[#0d0ba3] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-white shadow-lg shadow-brand-blue/25">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={14} className="text-white/70" />
            <span className="text-[10px] uppercase font-black tracking-widest text-white/70">Portal Anggota</span>
          </div>
          <h2 className="text-xl font-black text-white mt-0.5">{user.name}</h2>
          <p className="text-xs text-white/70 mt-1">
            Sabuk: <strong className="text-white">{user.belt}</strong> &nbsp;|&nbsp; Status:{' '}
            <span className={`font-bold ${user.status === 'Aktif' ? 'text-emerald-300' : 'text-rose-300'}`}>
              {user.status === 'Aktif' ? 'Aktif' : 'Menunggu Aktivasi'}
            </span>
          </p>
        </div>
        <div className="text-left md:text-right text-xs">
          <p className="text-white/60 font-bold uppercase tracking-wider text-[10px]">Cabang Latihan</p>
          <p className="font-extrabold text-white mt-0.5">{user.dojang || 'Belum dipilih'}</p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 flex flex-col gap-1 bg-white border border-slate-100 rounded-2xl p-3 shadow-xs">
          <button
            onClick={() => setActiveTab('profil')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'profil' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            👤 Profil Saya
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition flex justify-between items-center ${
              activeTab === 'riwayat' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span>💳 Riwayat Transaksi</span>
            {transactions.some(t => t.status === 'Pending') && (
              <span className="w-2 h-2 bg-brand-red rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('kegiatan')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'kegiatan' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            🏆 Event & UKT
          </button>
          <button
            onClick={() => setActiveTab('aksesoris')}
            className={`w-full py-2.5 px-3 rounded-xl text-left text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'aksesoris' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            🛍️ Toko Peralatan
          </button>
        </aside>

        {/* Content Box */}
        <main className="lg:col-span-9 bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-xs">

          {/* TAB: Profil */}
          {activeTab === 'profil' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Detail Profil</h3>
                <p className="text-slate-400 text-xs mt-0.5">Kelola informasi kontak dan tempat latihan Anda.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-blue"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Nomor HP</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-blue"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Jenis Kelamin</label>
                    <select
                      value={profileGender}
                      onChange={e => setProfileGender(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-white focus:outline-hidden focus:border-brand-blue"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Umur (Tahun)</label>
                    <input
                      type="number"
                      value={profileAge}
                      onChange={e => setProfileAge(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-blue"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Dojang / Cabang Latihan</label>
                  <input
                    type="text"
                    value={profileDojang}
                    onChange={e => setProfileDojang(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-blue"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </form>
            </div>
          )}

          {/* TAB: Riwayat */}
          {activeTab === 'riwayat' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Riwayat Pembayaran</h3>
                <p className="text-slate-400 text-xs mt-0.5">Daftar transaksi setoran transfer dana Anda.</p>
              </div>

               {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice((currentPageRiwayat - 1) * 5, currentPageRiwayat * 5).map(tx => (
                    <div key={tx.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/20 hover:bg-slate-50/60 transition">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-slate-400">{tx.date}</span>
                          <span className="bg-slate-100 text-slate-650 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            {tx.type}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-sm">{tx.details}</h4>
                        <p className="text-xs font-bold text-brand-blue">Rp {tx.amount.toLocaleString('id-ID')}</p>
                        
                        {tx.status === 'Ditolak' && tx.rejectReason && (
                          <div className="mt-2.5 p-3 bg-rose-50 border border-rose-100 text-brand-red rounded-lg text-xs font-semibold space-y-2">
                            <p>❌ Pembayaran ditolak: "{tx.rejectReason}"</p>
                            <button
                              onClick={() => {
                                setReUploadTx(tx);
                                setReUploadFile(null);
                                setReUploadPreview('');
                              }}
                              className="bg-brand-red text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-md hover:bg-brand-red-hover transition shadow-xs"
                            >
                              Kirim Ulang Bukti Bayar
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                          tx.status === 'Berhasil'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : tx.status === 'Ditolak'
                            ? 'bg-rose-50 text-brand-red border border-rose-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {tx.status}
                        </span>
                        
                        {tx.proofImage && (
                          <a
                            href={tx.proofImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-brand-blue font-bold hover:underline"
                          >
                            🖼️ Bukti Kirim
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {renderPagination(currentPageRiwayat, transactions.length, setCurrentPageRiwayat)}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                  Belum ada transaksi terdaftar.
                </div>
              )}
            </div>
          )}

          {/* TAB: Kegiatan */}
          {activeTab === 'kegiatan' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Event &amp; UKT Tersedia</h3>
                <p className="text-slate-400 text-xs mt-0.5">Daftar turnamen atau ujian sabuk aktif yang dapat Anda ikuti.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map(evt => {
                  const isRegistered = transactions.some(
                    t => t.type === 'UKT' && t.details.includes(evt.name) && (t.status === 'Pending' || t.status === 'Berhasil')
                  );
                  const isApproved = transactions.some(
                    t => t.type === 'UKT' && t.details.includes(evt.name) && t.status === 'Berhasil'
                  );
                  return (
                    <div key={evt.id} className="border border-slate-100 rounded-xl p-5 flex flex-col bg-slate-50/20 hover:bg-slate-50/60 transition">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                          {evt.category}
                        </span>
                        <span className="font-extrabold text-xs text-slate-800">
                          Rp {evt.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-800 text-sm mb-1 leading-snug">{evt.name}</h4>
                      <p className="text-[11px] text-slate-400 mb-6 font-semibold">
                        📅 {evt.date || '--'} | 📍 {evt.location || '--'}
                      </p>

                      {isApproved ? (
                        <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold">
                          ✓ Terdaftar &amp; Aktif
                        </div>
                      ) : isRegistered ? (
                        <div className="w-full text-center py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[10px] font-bold">
                          ⏳ Verifikasi Bukti Bayar
                        </div>
                      ) : (
                        <button
                          onClick={() => openCheckout('UKT', evt)}
                          className="w-full py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition"
                        >
                          Ikuti Event
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Aksesoris */}
          {activeTab === 'aksesoris' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Toko Kelengkapan Latihan</h3>
                <p className="text-slate-400 text-xs mt-0.5">Beli dobok, deker, target kick, atau pelindung badan resmi.</p>
              </div>

              {categories.map(cat => {
                const catProducts = products.filter(p => p.categoryId === cat.id);
                if (catProducts.length === 0) return null;

                return (
                  <div key={cat.id} className="space-y-3 pt-2">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">
                      {cat.name}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {catProducts.map(prod => (
                        <div key={prod.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/10 hover:bg-slate-50/40 transition flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center text-xl shrink-0 animate-fade-in">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              '🥋'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-extrabold text-slate-800 text-xs truncate leading-tight">{prod.name}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{prod.description}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-black text-brand-blue text-xs">
                                Rp {prod.price.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold">Stok: {prod.stock}</span>
                            </div>
                            <button
                              onClick={() => openCheckout('Aksesoris', prod)}
                              disabled={prod.stock === 0}
                              className="mt-2.5 bg-brand-red hover:bg-brand-red-hover disabled:bg-slate-200 disabled:text-slate-400 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                            >
                              {prod.stock === 0 ? 'Habis' : 'Beli'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* CHECKOUT MODAL */}
      {checkoutItem && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm overflow-hidden shadow-lg animate-fade-in">
            <div className="border-b border-slate-100 p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm text-slate-800">Checkout Pembayaran</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{checkoutItem.type}</p>
              </div>
              <button onClick={() => setCheckoutItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Rincian:</p>
                <h4 className="font-extrabold text-slate-800 text-sm mt-0.5 leading-snug">{checkoutItem.name}</h4>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center space-y-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Transfer Nominal</p>
                  <p className="text-xl font-black text-brand-blue">
                    Rp {checkoutItem.price.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="border-t border-slate-200/50 pt-2.5 text-[11px] font-semibold text-slate-500 space-y-0.5">
                  <p>Kirim ke rekening resmi:</p>
                  <p className="font-bold text-slate-800">{settings.bankName}</p>
                  <p className="font-black text-base text-brand-red">{settings.bankAccount}</p>
                  <p className="text-[9px]">a/n {settings.bankRecipient}</p>
                </div>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
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
                  className="w-full py-3 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  {loading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RE-UPLOAD PROOF MODAL */}
      {reUploadTx && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm overflow-hidden shadow-lg">
            <div className="border-b border-slate-100 p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm text-slate-800">Kirim Ulang Bukti</h3>
                <p className="text-[9px] text-rose-500 uppercase tracking-widest mt-0.5">Penolakan Transaksi</p>
              </div>
              <button onClick={() => setReUploadTx(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs">{reUploadTx.details}</h4>
                <p className="text-[10px] text-rose-600 font-bold mt-1">❌ Ditolak: "{reUploadTx.rejectReason}"</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center space-y-2">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Jumlah Bayar</p>
                  <p className="text-lg font-black text-brand-blue">
                    Rp {reUploadTx.amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="border-t border-slate-200/50 pt-2 text-[10px] font-semibold text-slate-500">
                  <p>Kirim ke rekening resmi:</p>
                  <p className="font-bold text-slate-800">{settings.bankName}</p>
                  <p className="font-black text-sm text-brand-red">{settings.bankAccount}</p>
                </div>
              </div>

              <form onSubmit={handleReUploadSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Upload Bukti Baru
                  </label>
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 hover:border-brand-blue/30 rounded-xl p-4 transition bg-slate-50/20 cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setReUploadFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setReUploadPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    {reUploadPreview ? (
                      <img src={reUploadPreview} alt="Bukti Baru" className="max-h-24 object-contain rounded-lg" />
                    ) : (
                      <div className="text-center">
                        <span className="text-xl block">📸</span>
                        <p className="font-bold text-[10px] text-slate-500 mt-1">Pilih Bukti Transfer Baru</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition"
                >
                  {loading ? 'Mengirim...' : 'Kirim Bukti Baru'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
