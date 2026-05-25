import React, { useState, useEffect } from 'react';
import { db, User, Transaction, Product, Category, Event, SystemSettings } from '../lib/db';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from './ui/ConfirmModal';
import {
  LayoutDashboard, CreditCard, Package, Tag, Users, BarChart2,
  Trophy, Settings, User as UserIcon, ChevronLeft, ChevronRight,
  Menu, Eye, EyeOff, Save, Plus, Edit2, Trash2, X,
  TrendingUp, ShoppingBag, AlertCircle, CheckCircle2, Clock,
  Upload, ImageIcon, Calendar, MapPin, Mail, Phone, Award, Copy,
  ExternalLink,
} from 'lucide-react';

interface DashboardAdminProps {
  adminUser: User;
  onUpdateAdminProfile: (updatedUser: User) => void;
  onLogout: () => void;
  activeTabProp: string;
  setActiveTabProp: (tab: string) => void;
}

const formatCurrencyInput = (val: string | number) => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = val.toString().replace(/\D/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('id-ID');
};

type TabType =
  | 'ringkasan'
  | 'pesanan'
  | 'produk'
  | 'produk-buat'
  | 'produk-edit'
  | 'kategori'
  | 'laporan-anggota'
  | 'laporan-aksesoris'
  | 'laporan-event'
  | 'profile-setting'
  | 'harga-setting';

export default function DashboardAdmin({
  adminUser,
  onUpdateAdminProfile,
  onLogout,
  activeTabProp,
  setActiveTabProp,
}: DashboardAdminProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { confirm: confirmModal, modal: confirmModalEl } = useConfirm();

  const getWhatsAppLink = (phone?: string) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}`;
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess(`${label} berhasil disalin!`);
  };


  // Collapsible Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeTab = (activeTabProp || 'ringkasan') as TabType;
  const setActiveTab = setActiveTabProp;
  const [showLaporanMenu, setShowLaporanMenu] = useState(true);

  // Pagination states
  const [currentPagePesanan, setCurrentPagePesanan] = useState(1);
  const [currentPageProduk, setCurrentPageProduk] = useState(1);
  const [currentPageLaporanAnggota, setCurrentPageLaporanAnggota] = useState(1);
  const [currentPageLaporanAksesoris, setCurrentPageLaporanAksesoris] = useState(1);
  const [currentPageLaporanEvent, setCurrentPageLaporanEvent] = useState(1);
  const [currentPageLaporanReg, setCurrentPageLaporanReg] = useState(1);

  // Loaded DB data
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Modal / Interaction states
  const [loading, setLoading] = useState(false);
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingTxProof, setViewingTxProof] = useState<Transaction | null>(null);
  const [viewingMemberDetails, setViewingMemberDetails] = useState<User | null>(null);
  
  // Product CRUD states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number | string>('');
  const [prodStock, setProdStock] = useState(0);
  const [prodDesc, setProdDesc] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImagePreview, setProdImagePreview] = useState<string>('');

  // Category CRUD states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');

  // Event CRUD states
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [evtName, setEvtName] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtLoc, setEvtLoc] = useState('');
  const [evtPrice, setEvtPrice] = useState<number | string>('');
  const [evtCat, setEvtCat] = useState('');

  // Profile Form States
  const [adminName, setAdminName] = useState(adminUser.name);
  const [adminEmail, setAdminEmail] = useState(adminUser.email);
  const [adminPassword, setAdminPassword] = useState(adminUser.password || '');
  const [showPassword, setShowPassword] = useState(false);

  // Settings Form States
  const [regFee, setRegFee] = useState<number | string>('');
  const [bankName, setBankName] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankRecipient, setBankRecipient] = useState('');

  // Load Database Values
  const loadAdminData = async () => {
    const [us, txs, prods, cats, evts, setts] = await Promise.all([
      db.getUsers(),
      db.getTransactions(),
      db.getProducts(),
      db.getCategories(),
      db.getEvents(),
      db.getSettings(),
    ]);

    setUsers(us);
    setTransactions(txs);
    setProducts(prods);
    setCategories(cats);
    setEvents(evts);
    setSettings(setts);

    if (cats.length > 0 && !prodCatId) {
      setProdCatId(cats[0].id);
    }

    if (setts) {
      setRegFee(setts.registrationFee);
      setBankName(setts.bankName);
      setBankAcc(setts.bankAccount);
      setBankRecipient(setts.bankRecipient);
    }

    // Prefill form if editing
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('id');
      if (activeTabProp === 'produk-edit' && editId) {
        const prod = prods.find(p => p.id === editId);
        if (prod) {
          setEditingProduct(prod);
          setProdName(prod.name);
          setProdPrice(prod.price);
          setProdStock(prod.stock);
          setProdDesc(prod.description);
          setProdCatId(prod.categoryId);
          setProdImagePreview(prod.image || '');
        }
      } else {
        setEditingProduct(null);
        setProdName('');
        setProdPrice('');
        setProdStock(0);
        setProdDesc('');
        setProdImagePreview('');
        setProdImageFile(null);
      }
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTabProp]);

  // Accept Transaction Handler
  const handleAcceptTransaction = async (txId: string) => {
    const ok = await confirmModal('Setujui Pembayaran', 'Apakah Anda yakin ingin menyetujui pembayaran ini? Tindakan ini tidak dapat dibatalkan.', { confirmLabel: 'Setujui', variant: 'default' });
    if (!ok) return;
    setLoading(true);
    try {
      await db.updateTransactionStatus(txId, 'Berhasil');
      await loadAdminData();
      toastSuccess('Pembayaran berhasil disetujui.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menyetujui pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  // Reject Transaction Handler
  const handleOpenRejectModal = (tx: Transaction) => {
    setRejectingTx(tx);
    setRejectReason('');
  };

  const handleRejectTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTx || !rejectReason.trim()) return;

    setLoading(true);
    try {
      await db.updateTransactionStatus(rejectingTx.id, 'Ditolak', rejectReason);
      setRejectingTx(null);
      await loadAdminData();
      toastWarning('Pembayaran telah ditolak.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menolak pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const handleProdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProdImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProdImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Product Add/Edit Handle
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedUrl = prodImagePreview; // default to existing preview/url
      if (prodImageFile) {
        uploadedUrl = await db.uploadImage(prodImageFile);
      }

      const prodsList = [...products];
      if (editingProduct && editingProduct.id) {
        const idx = prodsList.findIndex(p => p.id === editingProduct.id);
        if (idx !== -1) {
          prodsList[idx] = {
            ...editingProduct,
            name: prodName,
            price: Number(prodPrice.toString().replace(/\D/g, '')),
            stock: Number(prodStock),
            description: prodDesc,
            categoryId: prodCatId,
            image: uploadedUrl,
          };
        }
      } else {
        prodsList.push({
          id: 'prod-' + Date.now(),
          name: prodName,
          price: Number(prodPrice.toString().replace(/\D/g, '')),
          stock: Number(prodStock),
          description: prodDesc,
          categoryId: prodCatId,
          image: uploadedUrl,
        });
      }

      await db.saveProducts(prodsList);
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdStock(0);
      setProdDesc('');
      setProdImagePreview('');
      setProdImageFile(null);
      await loadAdminData();
      setActiveTab('produk');
      toastSuccess('Produk berhasil disimpan.');
    } catch (err: any) {
      console.error(err);
      toastError('Gagal menyimpan produk: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(prod.price);
    setProdStock(prod.stock);
    setProdDesc(prod.description);
    setProdCatId(prod.categoryId);
    setProdImagePreview(prod.image || '');
    setProdImageFile(null);
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = await confirmModal('Hapus Produk', 'Produk ini akan dihapus secara permanen. Lanjutkan?', { confirmLabel: 'Hapus', variant: 'danger' });
    if (!ok) return;
    try {
      await db.deleteProduct(id);
      await loadAdminData();
      toastSuccess('Produk berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menghapus produk.');
    }
  };

  // Category Add/Edit Handle
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setLoading(true);
    try {
      const catsList = [...categories];
      if (editingCategory) {
        const idx = catsList.findIndex(c => c.id === editingCategory.id);
        if (idx !== -1) {
          catsList[idx].name = catName;
        }
      } else {
        catsList.push({
          id: 'cat-' + Date.now(),
          name: catName,
        });
      }

      await db.saveCategories(catsList);
      setEditingCategory(null);
      setCatName('');
      await loadAdminData();
      toastSuccess('Kategori berhasil disimpan.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menyimpan kategori.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const ok = await confirmModal('Hapus Kategori', 'Kategori ini akan dihapus. Produk terkait tidak akan ikut terhapus.', { confirmLabel: 'Hapus', variant: 'danger' });
    if (!ok) return;
    try {
      await db.deleteCategory(id);
      await loadAdminData();
      toastSuccess('Kategori berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menghapus kategori.');
    }
  };

  // Event Add/Edit Handle
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtName || !evtPrice || !evtCat) {
      toastWarning('Nama, biaya, dan kategori/tingkatan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const evtsList = [...events];
      if (editingEvent && editingEvent.id) {
        const idx = evtsList.findIndex(ev => ev.id === editingEvent.id);

        if (idx !== -1) {
          evtsList[idx] = {
            ...editingEvent,
            name: evtName,
            date: evtDate || '',
            location: evtLoc || '',
            price: Number(evtPrice.toString().replace(/\D/g, '')),
            category: evtCat,
          };
        }
      } else {
        evtsList.push({
          id: 'evt-' + Date.now(),
          name: evtName,
          date: evtDate || '',
          location: evtLoc || '',
          price: Number(evtPrice.toString().replace(/\D/g, '')),
          category: evtCat,
        });
      }

      await db.saveEvents(evtsList);
      setEditingEvent(null);

      setEvtName('');
      setEvtDate('');
      setEvtLoc('');
      setEvtPrice('');
      setEvtCat('Semua Tingkatan');
      await loadAdminData();
      toastSuccess('Event berhasil disimpan.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menyimpan event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const ok = await confirmModal('Hapus Event', 'Event ini akan dihapus secara permanen.', { confirmLabel: 'Hapus', variant: 'danger' });
    if (!ok) return;
    try {
      await db.deleteEvent(id);
      await loadAdminData();
      toastSuccess('Event berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menghapus event.');
    }
  };

  // Profile Save Handle
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedAdmin: User = {
        ...adminUser,
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      };

      await db.updateUser(updatedAdmin);
      onUpdateAdminProfile(updatedAdmin);
      toastSuccess('Profil admin berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      toastError('Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  // Settings Save Handle
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newSettings: SystemSettings = {
        registrationFee: Number(regFee.toString().replace(/\D/g, '')),
        bankName,
        bankAccount: bankAcc,
        bankRecipient,
      };

      await db.saveSettings(newSettings);
      toastSuccess('Pengaturan harga dan rekening berhasil diperbarui!');
      await loadAdminData();
    } catch (err) {
      console.error(err);
      toastError('Gagal menyimpan pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalRevenue = transactions
    .filter(t => t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPaymentsCount = transactions.filter(t => t.status === 'Pending').length;
  const totalMembers = users.filter(u => u.role === 'anggota').length;
  const activeMembers = users.filter(u => u.role === 'anggota' && u.status === 'Aktif').length;

  const registrationTx = transactions.filter(t => t.type === 'Pendaftaran');
  const successfulRegTx = registrationTx.filter(t => t.status === 'Berhasil');
  const totalRegRevenue = successfulRegTx.reduce((sum, t) => sum + t.amount, 0);

  const membersByDojang = users
    .filter(u => u.role === 'anggota')
    .reduce((acc: Record<string, number>, u) => {
      const dojangName = u.dojang || 'Lainnya';
      acc[dojangName] = (acc[dojangName] || 0) + 1;
      return acc;
    }, {});

  const membersByBelt = users
    .filter(u => u.role === 'anggota')
    .reduce((acc: Record<string, number>, u) => {
      const beltLevel = u.belt || 'Sabuk Putih';
      acc[beltLevel] = (acc[beltLevel] || 0) + 1;
      return acc;
    }, {});

  const accessoryTx = transactions.filter(t => t.status === 'Berhasil' && t.type === 'Aksesoris');
  const totalAccRevenue = accessoryTx.reduce((sum, t) => sum + t.amount, 0);

  const popularAccessories = accessoryTx.reduce((acc: Record<string, { count: number; name: string }>, t) => {
    const prodNameClean = t.details.includes(': ') ? t.details.split(': ')[1] : t.details;
    if (!acc[prodNameClean]) {
      acc[prodNameClean] = { count: 0, name: prodNameClean };
    }
    acc[prodNameClean].count += 1;
    return acc;
  }, {});

  const eventTx = transactions.filter(t => t.status === 'Berhasil' && t.type === 'UKT');
  const totalEvtRevenue = eventTx.reduce((sum, t) => sum + t.amount, 0);

  const eventParticipants = eventTx.reduce((acc: Record<string, { count: number; name: string }>, t) => {
    const evtNameClean = t.details.includes(': ') ? t.details.split(': ')[1] : t.details;
    if (!acc[evtNameClean]) {
      acc[evtNameClean] = { count: 0, name: evtNameClean };
    }
    acc[evtNameClean].count += 1;
    return acc;
  }, {});

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    setCurrentPage: (page: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / 10);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/20 text-xs font-semibold text-slate-500">
        <div>
          Menampilkan <span className="font-bold text-slate-705">{Math.min(totalItems, (currentPage - 1) * 10 + 1)}</span> sampai{' '}
          <span className="font-bold text-slate-705">{Math.min(totalItems, currentPage * 10)}</span> dari{' '}
          <span className="font-bold text-slate-705">{totalItems}</span> entri
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

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'ringkasan': return 'Ringkasan Dashboard';
      case 'pesanan': return 'Verifikasi Transaksi';
      case 'produk': return 'Kelola Produk Aksesoris';
      case 'produk-buat': return 'Tambah Produk Baru';
      case 'produk-edit': return 'Edit Detail Produk';
      case 'kategori': return 'Kelola Kategori Produk';
      case 'laporan-anggota': return 'Laporan Data Anggota';
      case 'laporan-aksesoris': return 'Laporan Penjualan Aksesoris';
      case 'laporan-event': return 'Laporan Event & UKT';
      case 'harga-setting': return 'Konfigurasi Harga & Rekening';
      case 'profile-setting': return 'Ubah Profil Admin';
      default: return 'Admin Portal';
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Berhasil':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Berhasil
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-brand-red border border-rose-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            Ditolak
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" style={{ animationDuration: '2s' }} />
            Pending
          </span>
        );
    }
  };

  // Sidebar Item Helper — now takes a React node icon instead of string
  const renderSidebarItem = (tab: TabType, label: string, icon: React.ReactNode, badgeCount?: number, isSubItem: boolean = false) => {
    const isActive = activeTab === tab || (tab === 'produk' && (activeTab === 'produk-buat' || activeTab === 'produk-edit'));
    
    const buttonClasses = `
      w-full flex items-center transition-all duration-200 rounded-xl relative group
      ${isSubItem && sidebarOpen ? 'pl-9 pr-3 py-2 text-[11px] font-semibold' : 'px-3 py-2.5 text-xs font-semibold'}
      ${sidebarOpen ? 'justify-start gap-3' : 'justify-center py-2.5 px-0'}
      ${isActive 
        ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }
    `;

    return (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={buttonClasses}
      >
        <div className="relative flex items-center justify-center shrink-0">
          {icon}
          {!sidebarOpen && badgeCount && badgeCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-brand-red rounded-full ring-2 ring-[#0b0f19]" />
          ) : null}
        </div>

        {sidebarOpen && (
          <span className="truncate flex-1 text-left">{label}</span>
        )}

        {sidebarOpen && badgeCount && badgeCount > 0 ? (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
            isActive ? 'bg-white text-brand-blue' : 'bg-brand-red text-white'
          }`}>
            {badgeCount}
          </span>
        ) : null}

        {!sidebarOpen && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-slate-200 text-[10px] font-bold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap border border-slate-800 pointer-events-none">
            {label}{badgeCount && badgeCount > 0 ? ` (${badgeCount})` : ''}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="h-full w-full flex bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {confirmModalEl}
      {/* 1. Left Collapsible Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-[70px]'
        } h-full bg-[#080c18] text-slate-400 flex flex-col shrink-0 transition-all duration-300 z-40 relative shadow-2xl`}
      >
        {/* Sidebar Header Brand */}
        <div className={`h-16 flex items-center border-b border-slate-800/40 overflow-hidden shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'px-4 gap-3' : 'justify-center px-0'
        }`}>
          <div className="relative shrink-0">
            <img
              src="/v-dojang.jpeg"
              alt="Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-lg"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-red rounded-full border-2 border-[#080c18]" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm text-white tracking-tight leading-tight truncate">
                V-DOJANG
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand-red/80 truncate mt-0.5">
                Admin Panel
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {sidebarOpen && (
            <div className="px-3 py-2 text-[9px] font-black tracking-widest text-slate-600 uppercase">
              Menu Utama
            </div>
          )}

          {renderSidebarItem('ringkasan', 'Ringkasan', <LayoutDashboard size={16} />)}
          {renderSidebarItem('pesanan', 'Verifikasi Bayar', <CreditCard size={16} />, pendingPaymentsCount)}
          {renderSidebarItem('produk', 'Kelola Produk', <Package size={16} />)}
          {renderSidebarItem('kategori', 'Kelola Kategori', <Tag size={16} />)}

          <div className="h-px bg-slate-800/40 my-2 mx-1" />
          {sidebarOpen && (
            <div className="px-3 py-1.5 flex justify-between items-center">
              <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase">Laporan</span>
              <button onClick={() => setShowLaporanMenu(!showLaporanMenu)} className="text-slate-600 hover:text-slate-300 transition">
                {showLaporanMenu ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
              </button>
            </div>
          )}

          {(showLaporanMenu || !sidebarOpen) && (
            <div className={`${sidebarOpen ? 'ml-2 border-l border-slate-800/50 pl-2' : ''} space-y-1`}>
              {renderSidebarItem('laporan-anggota', 'Anggota', <Users size={14} />, undefined, true)}
              {renderSidebarItem('laporan-aksesoris', 'Penjualan', <BarChart2 size={14} />, undefined, true)}
              {renderSidebarItem('laporan-event', 'Event / UKT', <Trophy size={14} />, undefined, true)}
            </div>
          )}

          <div className="h-px bg-slate-800/40 my-2 mx-1" />
          {sidebarOpen && (
            <div className="px-3 py-1.5 text-[9px] font-black tracking-widest text-slate-600 uppercase">Sistem</div>
          )}

          {renderSidebarItem('harga-setting', 'Harga & Rekening', <Settings size={16} />)}
          {renderSidebarItem('profile-setting', 'Profil Admin', <UserIcon size={16} />)}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800/40 flex items-center gap-2.5 shrink-0 overflow-hidden bg-slate-950/30">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            {adminUser.name.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-slate-200 truncate">{adminUser.name}</span>
              <span className="text-[9px] text-slate-500 truncate">{adminUser.email}</span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
        {/* Sticky Dashboard Header */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition"
            >
              <Menu size={18} />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <h1 className="text-base font-black text-slate-900 truncate">
              {getSectionTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                <UserIcon size={12} className="text-brand-blue" />
              </div>
              <span className="text-xs font-bold text-slate-700">{adminUser.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-brand-red/40 hover:text-brand-red rounded-xl text-xs font-bold text-slate-600 transition"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* TAB: Ringkasan */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Widgets */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Anggota */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-blue flex items-center justify-center shrink-0 shadow-md shadow-brand-blue/30">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Total Anggota</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">{totalMembers}</p>
                    </div>
                  </div>

                  {/* Card 2: Anggota Aktif */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      <CheckCircle2 size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Anggota Aktif</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">{activeMembers}</p>
                    </div>
                  </div>

                  {/* Card 3: Menunggu Verifikasi */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Menunggu Verif.</p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">{pendingPaymentsCount}</p>
                    </div>
                  </div>

                  {/* Card 4: Total Pendapatan */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm card-hover flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-red flex items-center justify-center shrink-0 shadow-md shadow-brand-red/30">
                      <TrendingUp size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wide">Total Pendapatan</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Grid */}
                <div className="space-y-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aktivitas Transaksi Terbaru</h3>
                  <div className="border border-slate-200/85 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 text-slate-500 font-bold border-b border-slate-200/85">
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Nama Anggota</th>
                          <th className="p-4">Rincian</th>
                          <th className="p-4">Nominal</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map(tx => {
                          const matchingUser = users.find(u => u.id === tx.memberId);
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition font-semibold text-slate-650">
                              <td className="p-4">{tx.date}</td>
                              <td className="p-4 font-bold text-slate-800">
                                {matchingUser ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingMemberDetails(matchingUser)}
                                    className="hover:text-brand-blue transition text-left focus:outline-hidden"
                                    title="Klik untuk detail anggota"
                                  >
                                    {tx.memberName}
                                  </button>
                                ) : (
                                  tx.memberName
                                )}
                              </td>
                              <td className="p-4">{tx.details}</td>
                              <td className="p-4 text-brand-blue font-bold">Rp {tx.amount.toLocaleString('id-ID')}</td>
                              <td className="p-4">
                                {renderStatusBadge(tx.status)}
                              </td>
                            </tr>
                          );
                        })}

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Pesanan & Pembayaran */}
            {activeTab === 'pesanan' && (
              <div className="space-y-6 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs animate-fade-in">
                {transactions.length > 0 ? (
                  <div className="border border-slate-200/85 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 text-slate-500 font-bold border-b border-slate-200/85">
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Anggota</th>
                          <th className="p-4">Rincian Pembayaran</th>
                          <th className="p-4">Jumlah</th>
                          <th className="p-4">Bukti</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice((currentPagePesanan - 1) * 10, currentPagePesanan * 10).map(tx => {
                          const matchingUser = users.find(u => u.id === tx.memberId);
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition font-semibold text-slate-650">
                              <td className="p-4">{tx.date}</td>
                              <td className="p-4 font-bold text-slate-800">
                                {matchingUser ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingMemberDetails(matchingUser)}
                                    className="hover:text-brand-blue transition text-left focus:outline-hidden"
                                    title="Klik untuk detail anggota"
                                  >
                                    {tx.memberName}
                                  </button>
                                ) : (
                                  tx.memberName
                                )}
                              </td>

                            <td className="p-4">
                              <div className="flex flex-col">
                                <span>{tx.details}</span>
                                <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">{tx.type}</span>
                              </div>
                            </td>
                            <td className="p-4 text-brand-blue font-bold">Rp {tx.amount.toLocaleString('id-ID')}</td>
                            <td className="p-4 font-bold">
                              {tx.proofImage ? (
                                <button
                                  type="button"
                                  onClick={() => setViewingTxProof(tx)}
                                  className="text-brand-red hover:text-brand-red-hover underline font-bold focus:outline-hidden"
                                >
                                  Lihat Struk
                                </button>
                              ) : (
                                <span className="text-slate-400 font-semibold">Kosong</span>
                              )}
                            </td>
                            <td className="p-4">
                              {renderStatusBadge(tx.status)}
                              {tx.status === 'Ditolak' && tx.rejectReason && (
                                <p className="text-[9px] text-brand-red font-semibold mt-1">Alasan: {tx.rejectReason}</p>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {tx.status === 'Pending' ? (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleAcceptTransaction(tx.id)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Terima
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(tx)}
                                    disabled={loading}
                                    className="px-3 py-1.5 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Tolak
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selesai</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>

                    </table>
                    {renderPagination(currentPagePesanan, transactions.length, setCurrentPagePesanan)}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold text-xs">
                    Tidak ada transaksi pembayaran terdaftar.
                  </div>
                )}
              </div>
            )}

            {/* TAB: Kelola Produk */}
            {(activeTab === 'produk' || activeTab === 'produk-buat' || activeTab === 'produk-edit') && (
              <div className="space-y-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <h4 className="font-black text-xs text-slate-450 uppercase tracking-widest">
                    {activeTab === 'produk-buat' ? 'Tambah Produk Baru' : activeTab === 'produk-edit' ? 'Edit Detail Produk' : 'Katalog Toko Aksesoris'}
                  </h4>
                  {activeTab === 'produk' && (
                    <button
                      onClick={() => {
                        setActiveTab('produk/buat');
                      }}
                      className="bg-brand-blue text-white text-xs font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-xs"
                    >
                      + Tambah Produk
                    </button>
                  )}
                </div>

                {(activeTab === 'produk-buat' || activeTab === 'produk-edit') && (
                  <form onSubmit={handleSaveProduct} className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4 max-w-xl">
                    <h5 className="font-black text-xs text-brand-blue uppercase">
                      {activeTab === 'produk-edit' ? 'Edit Detail Produk' : 'Buat Produk Baru'}
                    </h5>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Produk</label>
                      <input
                        type="text"
                        value={prodName}
                        onChange={e => setProdName(e.target.value)}
                        placeholder="Contoh: Dobok Kyorugi"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Harga (Rp)</label>
                        <input
                          type="text"
                          value={formatCurrencyInput(prodPrice)}
                          onChange={e => setProdPrice(e.target.value.replace(/\D/g, ''))}
                          placeholder="Contoh: 150.000"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Stok Barang</label>
                        <input
                          type="number"
                          value={prodStock}
                          onChange={e => setProdStock(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Kategori</label>
                        <select
                          value={prodCatId}
                          onChange={e => setProdCatId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:outline-hidden"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Foto Produk</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {prodImagePreview ? (
                            <img src={prodImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">📸</span>
                          )}
                        </div>
                        <div className="flex-1 relative cursor-pointer border border-dashed border-slate-200 hover:border-brand-blue/30 rounded-xl p-3 text-center transition bg-white">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProdImageChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <p className="font-bold text-[10px] text-slate-500">Pilih Foto Produk</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Deskripsi Produk</label>
                      <textarea
                        rows={2}
                        value={prodDesc}
                        onChange={e => setProdDesc(e.target.value)}
                        placeholder="Ukuran, spesifikasi bahan, dll."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('produk')}
                        className="px-4 py-2 border border-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-lg"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === 'produk' && (
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                          <th className="p-4">Nama Produk</th>
                          <th className="p-4">Kategori</th>
                          <th className="p-4">Harga</th>
                          <th className="p-4">Stok</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.slice((currentPageProduk - 1) * 10, currentPageProduk * 10).map(p => {
                          const category = categories.find(c => c.id === p.categoryId);
                          return (
                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-4 font-bold text-slate-800 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    '🥋'
                                  )}
                                </div>
                                <span className="truncate">{p.name}</span>
                              </td>
                              <td className="p-4">
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                  {category ? category.name : 'Uncategorized'}
                                </span>
                              </td>
                              <td className="p-4 text-brand-blue font-bold">Rp {p.price.toLocaleString('id-ID')}</td>
                              <td className="p-4">{p.stock} pcs</td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => setActiveTab('produk/edit?id=' + p.id)}
                                  className="text-[9px] font-black uppercase text-brand-blue hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="text-[9px] font-black uppercase text-brand-red hover:underline"
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {renderPagination(currentPageProduk, products.length, setCurrentPageProduk)}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Kelola Kategori */}
            {activeTab === 'kategori' && (
              <div className="space-y-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in">
                <form onSubmit={handleSaveCategory} className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3 max-w-md animate-fade-in">
                  <h4 className="font-black text-xs text-brand-blue uppercase">
                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={catName}
                      onChange={e => setCatName(e.target.value)}
                      placeholder="Masukkan nama kategori"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg"
                    >
                      Simpan
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => { setEditingCategory(null); setCatName(''); }}
                        className="px-3 py-2 border border-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-lg"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>

                <div className="border border-slate-100 rounded-xl overflow-hidden max-w-md bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                        <th className="p-4">Nama Kategori</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                          <td className="p-4 font-bold text-slate-800">{c.name}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => { setEditingCategory(c); setCatName(c.name); }}
                              className="text-[9px] font-black uppercase text-brand-blue hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(c.id)}
                              className="text-[9px] font-black uppercase text-brand-red hover:underline"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Laporan Anggota */}
            {activeTab === 'laporan-anggota' && (
              <div className="space-y-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in">
                {/* Stats Summary Card Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Anggota Terdaftar</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{totalMembers} Orang</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anggota Aktif</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{activeMembers} Orang</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Uang Registrasi</p>
                    <p className="text-2xl font-black text-brand-blue mt-1">Rp {totalRegRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dojang Distribution */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Anggota Per Dojang</h4>
                    <div className="space-y-2">
                      {Object.entries(membersByDojang).map(([dojang, count]) => (
                        <div key={dojang} className="flex justify-between items-center text-xs font-semibold text-slate-650">
                          <span>🏢 {dojang}</span>
                          <span className="text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded font-bold">{count} Orang</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Belt Level Distribution */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Distribusi Sabuk</h4>
                    <div className="space-y-2">
                      {Object.entries(membersByBelt).map(([belt, count]) => (
                        <div key={belt} className="flex justify-between items-center text-xs font-semibold text-slate-650">
                          <span>🥋 {belt}</span>
                          <span className="text-brand-red bg-brand-red/5 px-2 py-0.5 rounded font-bold">{count} Orang</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Tabel Data Keanggotaan</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                          <th className="p-3">Nama Lengkap</th>
                          <th className="p-3">Dojang</th>
                          <th className="p-3">Kontak</th>
                          <th className="p-3">Gender</th>
                          <th className="p-3">Sabuk</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u => u.role === 'anggota')
                          .slice((currentPageLaporanAnggota - 1) * 10, currentPageLaporanAnggota * 10)
                          .map(u => (
                            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3 font-bold text-slate-800">
                                <button
                                  type="button"
                                  onClick={() => setViewingMemberDetails(u)}
                                  className="hover:text-brand-blue transition text-left focus:outline-hidden"
                                  title="Klik untuk detail profil"
                                >
                                  {u.name}
                                </button>
                              </td>
                              <td className="p-3">{u.dojang || '-'}</td>
                              <td className="p-3">{u.phone || '-'}</td>
                              <td className="p-3">{u.gender || '-'}</td>
                              <td className="p-3 font-bold text-brand-blue">{u.belt}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  u.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-brand-red border border-rose-100'
                                }`}>
                                  {u.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setViewingMemberDetails(u)}
                                  className="p-2 hover:bg-brand-blue/5 text-brand-blue hover:text-brand-blue/80 rounded-xl transition inline-flex items-center justify-center border border-slate-100"
                                  title="Detail Anggota"
                                >
                                  <Eye size={14} />
                                </button>
                              </td>

                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {renderPagination(currentPageLaporanAnggota, users.filter(u => u.role === 'anggota').length, setCurrentPageLaporanAnggota)}
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-100">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Log Pembayaran Registrasi Anggota</h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Nama Anggota</th>
                          <th className="p-3">Biaya Pendaftaran</th>
                          <th className="p-3">Status Pembayaran</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrationTx.slice((currentPageLaporanReg - 1) * 10, currentPageLaporanReg * 10).map(tx => {
                          const matchingUser = users.find(u => u.id === tx.memberId);
                          return (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3">{tx.date}</td>
                              <td className="p-3 font-bold text-slate-800">
                                {matchingUser ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingMemberDetails(matchingUser)}
                                    className="hover:text-brand-blue transition text-left focus:outline-hidden"
                                    title="Klik untuk detail profil"
                                  >
                                    {tx.memberName}
                                  </button>
                                ) : (
                                  tx.memberName
                                )}
                              </td>
                              <td className="p-3 text-brand-blue font-bold">Rp {tx.amount.toLocaleString('id-ID')}</td>
                              <td className="p-3">{renderStatusBadge(tx.status)}</td>
                              <td className="p-3 text-right">
                                {matchingUser ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingMemberDetails(matchingUser)}
                                    className="p-2 hover:bg-brand-blue/5 text-brand-blue hover:text-brand-blue/80 rounded-xl transition inline-flex items-center justify-center border border-slate-100"
                                    title="Detail Anggota"
                                  >
                                    <Eye size={14} />
                                  </button>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {registrationTx.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                              Belum ada transaksi pendaftaran masuk.
                            </td>
                          </tr>
                        )}

                      </tbody>
                    </table>
                    {renderPagination(currentPageLaporanReg, registrationTx.length, setCurrentPageLaporanReg)}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Laporan Aksesoris */}
            {activeTab === 'laporan-aksesoris' && (
              <div className="space-y-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transaksi</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{accessoryTx.length} Pesanan</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Penjualan</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">Rp {totalAccRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 md:col-span-4">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Aksesoris Terlaris</h4>
                    <div className="space-y-2">
                      {Object.values(popularAccessories).map(item => (
                        <div key={item.name} className="flex justify-between items-center text-xs font-semibold text-slate-650">
                          <span className="truncate mr-2">🛍️ {item.name}</span>
                          <span className="bg-brand-blue/5 text-brand-blue px-2 py-0.5 rounded font-bold shrink-0">{item.count} Terjual</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-3">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Log Transaksi Toko</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Anggota</th>
                            <th className="p-3">Deskripsi Barang</th>
                            <th className="p-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accessoryTx.slice((currentPageLaporanAksesoris - 1) * 10, currentPageLaporanAksesoris * 10).map(tx => (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3">{tx.date}</td>
                              <td className="p-3 font-bold text-slate-800">{tx.memberName}</td>
                              <td className="p-3">{tx.details}</td>
                              <td className="p-3 text-brand-blue font-bold text-right">Rp {tx.amount.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination(currentPageLaporanAksesoris, accessoryTx.length, setCurrentPageLaporanAksesoris)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Laporan Event */}
            {activeTab === 'laporan-event' && (
              <div className="space-y-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Peserta UKT/Event</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{eventTx.length} Orang</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Biaya Pendaftaran</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">Rp {totalEvtRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 md:col-span-5">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-4">Jumlah Pendaftar Kegiatan</h4>
                    <div className="space-y-2">
                      {Object.values(eventParticipants).map(evt => (
                        <div key={evt.name} className="flex justify-between items-center text-xs font-semibold text-slate-650">
                          <span className="truncate mr-2">🏆 {evt.name}</span>
                          <span className="bg-brand-red/5 text-brand-red px-2 py-0.5 rounded font-bold shrink-0">{evt.count} Orang</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Tabel Peserta Kegiatan</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Nama Anggota</th>
                            <th className="p-3 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventTx.slice((currentPageLaporanEvent - 1) * 10, currentPageLaporanEvent * 10).map(tx => (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3">{tx.date}</td>
                              <td className="p-3 font-bold text-slate-800">{tx.memberName}</td>
                              <td className="p-3 text-brand-blue font-bold text-right">Rp {tx.amount.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination(currentPageLaporanEvent, eventTx.length, setCurrentPageLaporanEvent)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Harga & Bank */}
            {activeTab === 'harga-setting' && (
              <div className="space-y-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <form onSubmit={handleSaveSettings} className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4 md:col-span-5 w-full">
                    <h4 className="font-black text-xs text-brand-blue uppercase border-b border-slate-200 pb-2">Informasi Pembayaran</h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Pendaftaran Baru (Rp)</label>
                      <input
                        type="text"
                        value={formatCurrencyInput(regFee)}
                        onChange={e => setRegFee(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 200.000"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Bank Penerima</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Nomor Rekening</label>
                      <input
                        type="text"
                        value={bankAcc}
                        onChange={e => setBankAcc(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Penerima Rekening</label>
                      <input
                        type="text"
                        value={bankRecipient}
                        onChange={e => setBankRecipient(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-[10px] font-black uppercase rounded-lg"
                  >
                    Simpan Pengaturan
                  </button>
                </form>

                {/* Manage Events/UKT section */}
                <div className="md:col-span-7 space-y-4 w-full">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Agenda Turnamen &amp; UKT</h4>
                    {!editingEvent && (
                      <button
                        onClick={() => {
                          setEditingEvent({ id: '', name: '', date: '', location: '', price: 0, category: 'Semua Tingkatan' });
                          setEvtName('');
                          setEvtDate('');
                          setEvtLoc('');
                          setEvtPrice('');
                          setEvtCat('Semua Tingkatan');
                        }}
                        className="px-2.5 py-1 bg-brand-blue text-white text-[9px] font-black uppercase rounded-lg"
                      >
                        + Event
                      </button>
                    )}
                  </div>

                  {editingEvent && (
                    <form onSubmit={handleSaveEvent} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-[10px] text-brand-blue uppercase">{editingEvent.id ? 'Edit Event' : 'Tambah Event Baru'}</h5>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Nama Kegiatan</label>
                        <input
                          type="text"
                          value={evtName}
                          onChange={e => setEvtName(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Tanggal</label>
                          <input
                            type="date"
                            value={evtDate}
                            onChange={e => setEvtDate(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Kategori Sabuk/Umur</label>
                          <input
                            type="text"
                            value={evtCat}
                            onChange={e => setEvtCat(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Lokasi</label>
                          <input
                            type="text"
                            value={evtLoc}
                            onChange={e => setEvtLoc(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Biaya (Rp)</label>
                          <input
                            type="text"
                            value={formatCurrencyInput(evtPrice)}
                            onChange={e => setEvtPrice(e.target.value.replace(/\D/g, ''))}
                            placeholder="Contoh: 150.000"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button type="submit" className="px-3 py-1.5 bg-brand-blue text-white text-[9px] font-bold rounded-lg uppercase">Simpan</button>
                        <button type="button" onClick={() => setEditingEvent(null)} className="px-3 py-1.5 border border-slate-200 text-[9px] font-bold rounded-lg uppercase">Batal</button>
                      </div>
                    </form>
                  )}

                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                          <th className="p-3">Nama Event</th>
                          <th className="p-3">Biaya</th>
                          <th className="p-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(ev => (
                          <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{ev.name}</span>
                                <span className="text-[9px] text-slate-400 mt-0.5">📅 {ev.date || '--'} | 📍 {ev.location || '--'}</span>
                              </div>

                            </td>
                            <td className="p-3 text-brand-blue font-bold">Rp {ev.price.toLocaleString('id-ID')}</td>
                            <td className="p-3 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingEvent(ev);
                                  setEvtName(ev.name);
                                  setEvtDate(ev.date);
                                  setEvtLoc(ev.location);
                                  setEvtPrice(ev.price);
                                  setEvtCat(ev.category);
                                }}
                                className="text-[9px] font-black text-brand-blue uppercase hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="text-[9px] font-black text-brand-red uppercase hover:underline"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Profil Admin Setting */}
          {activeTab === 'profile-setting' && (
            <div className="space-y-6 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs animate-fade-in max-w-md">
              <form onSubmit={handleSaveProfile} className="space-y-4 w-full">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Lengkap Admin</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-[#fafafc]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-[#fafafc]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Sandi Baru</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Masukkan sandi baru"
                      className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-[#fafafc]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden flex items-center justify-center"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* REJECTION MODAL */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm overflow-hidden shadow-lg">
            <div className="border-b border-slate-100 p-5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm text-slate-800">Tolak Pembayaran</h3>
                <p className="text-[9px] text-rose-500 uppercase tracking-widest mt-0.5">Penolakan Transaksi</p>
              </div>
              <button onClick={() => setRejectingTx(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectTransaction} className="p-6 space-y-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400">Pesan Anggota:</p>
                <h4 className="font-extrabold text-slate-800 mt-0.5 text-xs">{rejectingTx.details}</h4>
                <p className="text-[9px] text-brand-blue font-bold mt-0.5">Oleh: {rejectingTx.memberName}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Alasan Penolakan
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Beri alasan penolakan..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-brand-red"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2.5 bg-brand-red hover:bg-brand-red-hover text-white text-[10px] font-black uppercase rounded-lg shadow-sm"
                >
                  {loading ? 'Memproses...' : 'Tolak Transaksi'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingTx(null)}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-lg"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMAGE PROOF PREVIEW MODAL */}
      {viewingTxProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setViewingTxProof(null)}>
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm text-slate-800 font-sans">Bukti Pembayaran</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">{viewingTxProof.memberName} — {viewingTxProof.details}</p>
              </div>
              <button onClick={() => setViewingTxProof(null)} className="text-slate-400 hover:text-slate-650 font-bold">
                ✕
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-slate-50">
              <img src={viewingTxProof.proofImage} alt="Bukti Transfer" className="max-h-[60vh] object-contain rounded-2xl shadow-md border border-slate-200/60" />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTxProof(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase rounded-xl transition font-sans"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DETAILS MODAL */}
      {viewingMemberDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setViewingMemberDetails(null)}>
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-sm text-slate-800 font-sans">Detail Profil Anggota</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">ID: {viewingMemberDetails.id}</p>
              </div>
              <button onClick={() => setViewingMemberDetails(null)} className="text-slate-400 hover:text-slate-650 font-bold transition">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5 font-sans">
              {/* Profile Avatar / Logo */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-brand-blue/15">
                    {viewingMemberDetails.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{viewingMemberDetails.name}</h4>
                    <p className="text-xs text-brand-red font-extrabold uppercase mt-0.5">{viewingMemberDetails.belt || 'Sabuk Putih'}</p>
                  </div>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    viewingMemberDetails.status === 'Aktif' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                      : 'bg-rose-50 text-brand-red border border-rose-200/50'
                  }`}>
                    {viewingMemberDetails.status}
                  </span>
                </div>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-semibold">
                {/* Email Block */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Alamat Email</p>
                    <p className="text-slate-800 font-bold mt-0.5 truncate select-all">{viewingMemberDetails.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(viewingMemberDetails.email, 'Email')}
                    className="p-1.5 hover:bg-slate-200 active:bg-slate-300 rounded-lg text-slate-400 hover:text-slate-600 transition"
                    title="Salin Email"
                  >
                    <Copy size={12} />
                  </button>
                </div>

                {/* Phone/WhatsApp Block */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Phone size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Nomor WhatsApp</p>
                    <p className="text-slate-800 font-bold mt-0.5 select-all">{viewingMemberDetails.phone || '-'}</p>
                  </div>
                  {viewingMemberDetails.phone && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyText(viewingMemberDetails.phone!, 'Nomor telepon')}
                        className="p-1.5 hover:bg-slate-200 active:bg-slate-300 rounded-lg text-slate-400 hover:text-slate-650 transition"
                        title="Salin Nomor"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Gender Block */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <UserIcon size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Jenis Kelamin</p>
                    <p className="text-slate-800 font-bold mt-0.5">{viewingMemberDetails.gender || '-'}</p>
                  </div>
                </div>

                {/* Age Block */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Umur</p>
                    <p className="text-slate-800 font-bold mt-0.5">{viewingMemberDetails.age ? `${viewingMemberDetails.age} Tahun` : '-'}</p>
                  </div>
                </div>

                {/* Jenjang Block */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Award size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Jenjang Pendidikan</p>
                    <p className="text-slate-800 font-bold mt-0.5">{viewingMemberDetails.jenjang || '-'}</p>
                  </div>
                </div>

                {/* Dojang Block */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Dojang / Tempat Latihan</p>
                    <p className="text-slate-800 font-bold mt-0.5">{viewingMemberDetails.dojang || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between gap-3 bg-slate-50/50">
              {viewingMemberDetails.phone ? (
                <a
                  href={getWhatsAppLink(viewingMemberDetails.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition"
                >
                  <Phone size={13} />
                  Hubungi Anggota via WA
                </a>
              ) : (
                <div className="flex-1" />
              )}
              <button
                type="button"
                onClick={() => setViewingMemberDetails(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition font-sans"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
