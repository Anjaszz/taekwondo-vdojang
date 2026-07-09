import React, { useState, useEffect } from 'react';
import { db, User, Transaction, Product, Category, Event, SystemSettings } from '../lib/db';
import { useToast } from './ui/ToastProvider';
import {
  User as UserIcon, Package, Calendar, History, Shield, Menu,
  ChevronLeft, ChevronRight, Upload, X, ShoppingBag, Ticket, CreditCard,
} from 'lucide-react';

const getBeltCardTheme = (beltName: string) => {
  const b = (beltName || '').toLowerCase();
  if (b.includes('putih')) {
    return {
      bg: 'from-slate-50 to-slate-200 text-slate-800 border-slate-350',
      badge: 'bg-white text-slate-700 border-slate-300',
      labelColor: 'text-slate-500',
      beltText: 'Putih',
      printBg: 'linear-gradient(135deg, #f8fafc, #cbd5e1)',
      printText: '#1e293b',
      printBadgeBg: '#ffffff',
      printBadgeText: '#475569'
    };
  }
  if (b.includes('kuning strip hijau')) {
    return {
      bg: 'from-yellow-100 to-emerald-50 text-slate-850 border-yellow-300',
      badge: 'bg-yellow-450 text-slate-900 border-yellow-500',
      labelColor: 'text-slate-500',
      beltText: 'Kuning Strip Hijau',
      printBg: 'linear-gradient(135deg, #fef08a, #d1fae5)',
      printText: '#1e293b',
      printBadgeBg: '#facc15',
      printBadgeText: '#1e293b'
    };
  }
  if (b.includes('kuning')) {
    return {
      bg: 'from-yellow-50 to-yellow-150 text-slate-850 border-yellow-300',
      badge: 'bg-yellow-400 text-slate-900 border-yellow-500',
      labelColor: 'text-slate-500',
      beltText: 'Kuning',
      printBg: 'linear-gradient(135deg, #fef08a, #fef9c3)',
      printText: '#1e293b',
      printBadgeBg: '#eab308',
      printBadgeText: '#1e293b'
    };
  }
  if (b.includes('hijau strip biru')) {
    return {
      bg: 'from-emerald-50 to-blue-50 text-slate-850 border-emerald-300',
      badge: 'bg-emerald-600 text-white border-emerald-700',
      labelColor: 'text-slate-500',
      beltText: 'Hijau Strip Biru',
      printBg: 'linear-gradient(135deg, #d1fae5, #dbeafe)',
      printText: '#1e293b',
      printBadgeBg: '#059669',
      printBadgeText: '#ffffff'
    };
  }
  if (b.includes('hijau')) {
    return {
      bg: 'from-emerald-50 to-emerald-150 text-slate-850 border-emerald-300',
      badge: 'bg-emerald-600 text-white border-emerald-700',
      labelColor: 'text-emerald-800/70',
      beltText: 'Hijau',
      printBg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      printText: '#065f46',
      printBadgeBg: '#059669',
      printBadgeText: '#ffffff'
    };
  }
  if (b.includes('biru strip merah')) {
    return {
      bg: 'from-blue-50 to-rose-50 text-slate-850 border-blue-300',
      badge: 'bg-blue-600 text-white border-blue-700',
      labelColor: 'text-slate-500',
      beltText: 'Biru Strip Merah',
      printBg: 'linear-gradient(135deg, #dbeafe, #ffe4e6)',
      printText: '#1e293b',
      printBadgeBg: '#2563eb',
      printBadgeText: '#ffffff'
    };
  }
  if (b.includes('biru')) {
    return {
      bg: 'from-blue-50 to-blue-150 text-slate-850 border-blue-300',
      badge: 'bg-blue-600 text-white border-blue-700',
      labelColor: 'text-blue-800/70',
      beltText: 'Biru',
      printBg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      printText: '#1e40af',
      printBadgeBg: '#2563eb',
      printBadgeText: '#ffffff'
    };
  }
  if (b.includes('merah strip hitam')) {
    return {
      bg: 'from-rose-100 to-slate-900 text-white border-rose-350',
      badge: 'bg-rose-600 text-white border-rose-700',
      labelColor: 'text-slate-400',
      beltText: 'Merah Strip Hitam',
      printBg: 'linear-gradient(135deg, #fecdd3, #0f172a)',
      printText: '#ffffff',
      printBadgeBg: '#e11d48',
      printBadgeText: '#ffffff'
    };
  }
  if (b.includes('merah')) {
    return {
      bg: 'from-rose-50 to-rose-150 text-slate-850 border-rose-300',
      badge: 'bg-rose-600 text-white border-rose-700',
      labelColor: 'text-rose-800/70',
      beltText: beltName,
      printBg: 'linear-gradient(135deg, #ffe4e6, #fca5a5)',
      printText: '#9f1239',
      printBadgeBg: '#e11d48',
      printBadgeText: '#ffffff'
    };
  }
  return {
    bg: 'from-slate-100 to-slate-200 text-slate-800 border-slate-350',
    badge: 'bg-slate-500 text-white border-slate-600',
    labelColor: 'text-slate-500',
    beltText: beltName,
    printBg: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)',
    printText: '#1e293b',
    printBadgeBg: '#64748b',
    printBadgeText: '#ffffff'
  };
};

interface DashboardAnggotaProps {
  user: User;
  onUpdateProfile: (updatedUser: User) => void;
  setView: (view: string) => void;
  activeTabProp: string;
  setActiveTabProp: (tab: string) => void;
}

type TabType = 'profil' | 'riwayat' | 'kegiatan';

export default function DashboardAnggota({
  user,
  onUpdateProfile,
  setView,
  activeTabProp,
  setActiveTabProp,
}: DashboardAnggotaProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();

  const printKwitansi = (tx: Transaction) => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    const instructionNote = tx.type === 'Aksesoris'
      ? 'Silahkan tunjukan kwitansi dan ambil aksesoris anda di dojang.'
      : 'Silahkan tunjukan kwitansi ke sabeum dojang anda.';

    printWindow.document.write(`
      <html><head><title>Kwitansi Pembayaran #${tx.id}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; margin: 40px; color: #333; line-height: 1.4; }
        .receipt-container { border: 2px solid #333; padding: 20px; max-width: 500px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #333; padding-bottom: 10px; }
        .header h2 { margin: 0 0 5px 0; font-size: 20px; }
        .header p { margin: 0; font-size: 12px; color: #666; }
        .title { text-align: center; font-weight: bold; font-size: 16px; margin: 15px 0; text-transform: uppercase; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .row-label { font-weight: bold; }
        .divider { border-top: 1px dashed #333; margin: 15px 0; }
        .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 15px; }
        .footer { text-align: center; margin-top: 30px; font-size: 11px; border-top: 1px dashed #333; padding-top: 10px; }
        .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-box { text-align: center; width: 150px; font-size: 12px; }
        .signature-line { border-bottom: 1px solid #333; margin-top: 50px; }
        @media print { body { margin: 20px; } }
      </style>
      </head><body>
      <div class="receipt-container">
        <div class="header">
          <h2>V-DOJANG TAEKWONDO</h2>
          <p>Waterfall Cikunir, Bekasi, Indonesia</p>
          <p>WhatsApp: +62 812-1389-0279</p>
        </div>
        <div class="title">KWITANSI PEMBAYARAN</div>
        <div class="row"><span class="row-label">No. Transaksi:</span><span>${tx.id}</span></div>
        <div class="row"><span class="row-label">Tanggal:</span><span>${tx.date}</span></div>
        <div class="row"><span class="row-label">Nama Anggota:</span><span>${tx.memberName}</span></div>
        <div class="row"><span class="row-label">Tipe Transaksi:</span><span>${tx.type}</span></div>
        <div class="divider"></div>
        <div class="row"><span class="row-label">Deskripsi:</span><span>${tx.details}</span></div>
        <div class="divider"></div>
        <div class="row"><span class="row-label">Subtotal:</span><span>Rp ${tx.amount.toLocaleString('id-ID')}</span></div>
        <div class="total-row"><span>TOTAL BAYAR:</span><span>Rp ${tx.amount.toLocaleString('id-ID')}</span></div>
        <div class="row" style="margin-top:5px; font-size:11px; font-style:italic;"><span class="row-label">Status:</span><span style="color:green; font-weight:bold;">LUNAS / BERHASIL</span></div>
        <div class="signature-section">
          <div class="signature-box">
            <p>Penerima,</p>
            <div class="signature-line"></div>
            <p style="margin-top:5px;">V-Dojang Admin</p>
          </div>
          <div class="signature-box">
            <p>Penyetor,</p>
            <div class="signature-line"></div>
            <p style="margin-top:5px;">${tx.memberName}</p>
          </div>
        </div>
        <div class="footer">
          <p>Terima kasih atas pembayaran Anda.</p>
          <p style="font-weight: bold; margin: 6px 0; color: #000;">* ${instructionNote} *</p>
          <p>Kwitansi ini adalah bukti pembayaran yang sah.</p>
        </div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const printKartuAnggota = () => {
    const theme = getBeltCardTheme(user.belt || 'Sabuk Putih');
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Kartu Anggota - ${user.name}</title>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fafafa; font-family: Arial, sans-serif; }
        .card {
          width: 480px;
          height: 300px;
          background: ${theme.printBg};
          color: ${theme.printText};
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-sizing: border-box;
          overflow: hidden;
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(0,0,0,0.06); padding-bottom: 10px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .logo-section img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; }
        .brand-name { font-weight: 900; font-size: 14px; margin: 0; }
        .brand-sub { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #ef4444; letter-spacing: 0.1em; margin: 2px 0 0 0; }
        .belt-badge { 
          font-size: 9px; 
          font-weight: 900; 
          text-transform: uppercase; 
          padding: 4px 10px; 
          border-radius: 9999px; 
          border: 1px solid rgba(0,0,0,0.1); 
          background: ${theme.printBadgeBg}; 
          color: ${theme.printBadgeText}; 
        }
        .body { display: flex; gap: 16px; align-items: center; margin: 15px 0; }
        .avatar { width: 70px; height: 70px; border-radius: 12px; background: linear-gradient(135deg, #2563eb, #7c3aed); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 900; border: 2px solid rgba(255,255,255,0.8); }
        .info { display: flex; flex-direction: column; gap: 4px; }
        .label { font-size: 8px; font-weight: 850; text-transform: uppercase; opacity: 0.8; margin: 0; letter-spacing: 0.05em; }
        .value { font-size: 14px; font-weight: 900; margin: 0; }
        .value-dojang { font-size: 12px; font-weight: 700; margin: 0; }
        .footer { display: flex; justify-content: space-between; align-items: end; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 10px; }
        .barcode { display: flex; gap: 2px; align-items: end; height: 25px; opacity: 0.7; }
        .barcode div { width: 2px; height: 25px; background: ${theme.printText}; }
        .barcode div.thin { width: 1px; }
        .barcode div.thick { width: 4px; }
        @media print {
          body { background: white; margin: 0; height: auto; }
          .card { border: 1px solid #ccc; box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
      </head><body>
      <div class="card">
        <div class="header">
          <div class="logo-section">
            <img src="/v-dojang.jpeg" alt="Logo" />
            <div>
              <div class="brand-name">V-DOJANG</div>
              <div class="brand-sub">Taekwondo Club</div>
            </div>
          </div>
          <div class="belt-badge">${theme.beltText}</div>
        </div>
        <div class="body">
          <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="info">
            <p class="label">Nama Anggota</p>
            <p class="value">${user.name}</p>
            <p class="label" style="margin-top: 4px;">Cabang Dojang</p>
            <p class="value-dojang">🏢 ${user.dojang || 'Belum dipilih'}</p>
          </div>
        </div>
        <div class="footer">
          <div>
            <p class="label">NOMOR ID</p>
            <p style="font-size: 10px; font-weight: 900; margin: 0; letter-spacing: 0.05em;">${user.id.toUpperCase()}</p>
          </div>
          <div class="barcode">
            <div class="thick"></div>
            <div class="thin"></div>
            <div class="thick"></div>
            <div class="thin"></div>
            <div class="thick"></div>
            <div class="thin"></div>
            <div class="thick"></div>
          </div>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        }
      </script>
      </body></html>
    `);
    printWindow.document.close();
  };

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
  const [profileBelt, setProfileBelt] = useState(user.belt || 'Sabuk Putih');

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
  const [checkoutBelt, setCheckoutBelt] = useState<string>('');

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
        belt: profileBelt,
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
    setCheckoutBelt(user.belt || 'Sabuk Putih');
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

      const uktBeltSuffix = checkoutItem.type === 'UKT' ? ` (Sabuk Terakhir: ${checkoutBelt})` : '';
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        memberId: user.id,
        memberName: user.name,
        type: checkoutItem.type,
        details: `${checkoutItem.type === 'UKT' ? 'Pendaftaran Event' : 'Pembelian Aksesoris'}: ${checkoutItem.name}${uktBeltSuffix}`,
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

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* KARTU ANGGOTA (lg:col-span-5) */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kartu Anggota Digital</h4>
                  
                  {/* Membership Card */}
                  {(() => {
                    const theme = getBeltCardTheme(user.belt || 'Sabuk Putih');
                    const isDark = theme.bg.includes('text-white');
                    return (
                      <div className="space-y-4">
                        <div className={`relative bg-gradient-to-br ${theme.bg} rounded-3xl p-6 border border-slate-200/50 shadow-lg overflow-hidden font-sans aspect-[1.586/1] w-full max-w-sm mx-auto flex flex-col justify-between group transform hover:-translate-y-0.5 transition duration-300`}>
                          {/* Tech Grid Pattern */}
                          <div className={`absolute inset-0 opacity-10 ${isDark ? 'bg-[radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)]' : 'bg-[radial-gradient(rgba(0,0,0,0.1)_1px,transparent_1px)]'} [background-size:12px_12px]`} />

                          {/* Background subtle light effects */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-red/10 rounded-full blur-xl -ml-10 -mb-10" />
                          
                          {/* Hologram Official Sticker */}
                          <div className="absolute right-12 bottom-12 w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-400 to-yellow-300 opacity-60 animate-pulse border border-white/40 shadow-xs z-10 flex items-center justify-center text-[8px] font-black text-white/90 font-mono tracking-tighter" title="Official V-Dojang Badge">
                            V-DJ
                          </div>

                          {/* Card Header */}
                          <div className="flex justify-between items-start border-b border-slate-500/10 pb-2.5 relative z-10">
                            <div className="flex items-center gap-2.5">
                              <img src="/v-dojang.jpeg" alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm border border-white/20" />
                              <div className="leading-none">
                                <span className="font-black text-xs tracking-tight">V-DOJANG</span>
                                <p className="text-[7px] font-bold uppercase tracking-wider text-brand-red mt-0.5">Taekwondo Club</p>
                              </div>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${theme.badge}`}>
                              🥋 {theme.beltText}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="flex gap-4 items-center my-3 relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-violet-600 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 border-2 border-white/40">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1 leading-tight space-y-1">
                              <div>
                                <p className={`text-[6px] uppercase font-black tracking-wider ${theme.labelColor}`}>Nama Anggota</p>
                                <h4 className="font-black text-sm truncate">{user.name}</h4>
                              </div>
                              <div>
                                <p className={`text-[6px] uppercase font-black tracking-wider ${theme.labelColor}`}>Cabang Dojang</p>
                                <p className="font-extrabold text-xs truncate">🏢 {user.dojang || 'Belum dipilih'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="flex justify-between items-end border-t border-slate-500/10 pt-2.5 relative z-10 text-[7px] font-bold">
                            <div>
                              <p className={theme.labelColor}>NOMOR ID</p>
                              <p className="font-black text-[9px] tracking-wider mt-0.5 font-mono">{user.id.toUpperCase()}</p>
                            </div>
                            
                            {/* Barcode representation */}
                            <div className="flex gap-[1.5px] items-end h-6 opacity-60">
                              <div className="w-[3px] h-full bg-current"></div>
                              <div className="w-[1px] h-full bg-current"></div>
                              <div className="w-[2px] h-full bg-current"></div>
                              <div className="w-[1px] h-full bg-current"></div>
                              <div className="w-[4px] h-full bg-current"></div>
                              <div className="w-[1px] h-full bg-current"></div>
                              <div className="w-[2px] h-full bg-current"></div>
                              <div className="w-[3px] h-full bg-current"></div>
                            </div>
                          </div>
                        </div>

                        {/* Print Card Button */}
                        <button
                          type="button"
                          onClick={printKartuAnggota}
                          className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-brand-blue/30 text-xs font-bold uppercase rounded-xl transition bg-white text-slate-700 hover:bg-slate-50 hover:text-brand-blue shadow-xs active:scale-98"
                        >
                          🖨️ Cetak Kartu Anggota (PDF)
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* FORM EDIT PROFIL (lg:col-span-7) */}
                <form onSubmit={handleUpdateProfile} className="lg:col-span-7 space-y-4 w-full">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Sabuk Terakhir</label>
                      <select
                        value={profileBelt}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold bg-slate-100 text-slate-500 cursor-not-allowed"
                      >
                        <option value={profileBelt}>{profileBelt}</option>
                      </select>
                    </div>
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
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {tx.status === 'Pending' ? 'On Process' : tx.status}
                        </span>
                        
                        {tx.proofImage && (
                          <a
                            href={tx.proofImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-brand-blue font-bold hover:underline"
                          >
                            🖼️ Bukti Nota
                          </a>
                        )}

                        {tx.status === 'Berhasil' && (
                          <button
                            type="button"
                            onClick={() => printKwitansi(tx)}
                            className="text-[9px] text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1 border border-emerald-100 bg-emerald-50/30 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition mt-1"
                          >
                            🧾 Kwitansi
                          </button>
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

                      {(() => {
                        const d = new Date();
                        const year = d.getFullYear();
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const todayStr = `${year}-${month}-${day}`;
                        
                        const isEventExpired = evt.date ? evt.date < todayStr : false;
                        const isEventInactive = evt.status === 'Nonaktif';
                        const isClosed = isEventExpired || isEventInactive;

                        if (isApproved) {
                          return (
                            <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-bold">
                              ✓ Terdaftar &amp; Aktif
                            </div>
                          );
                        }
                        if (isRegistered) {
                          return (
                            <div className="w-full text-center py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[10px] font-bold">
                              ⏳ Verifikasi Bukti Bayar
                            </div>
                          );
                        }
                        if (isClosed) {
                          return (
                            <button
                              disabled
                              className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-[11px] font-bold uppercase tracking-wider cursor-not-allowed"
                            >
                              {isEventExpired ? 'Event Berakhir' : 'Tidak Aktif'}
                            </button>
                          );
                        }
                        return (
                          <button
                            onClick={() => openCheckout('UKT', evt)}
                            className="w-full py-2 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition"
                          >
                            Ikuti Event
                          </button>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
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
