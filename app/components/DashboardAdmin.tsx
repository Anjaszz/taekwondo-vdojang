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
  ExternalLink, Loader2, FileSpreadsheet, Printer, UserX, UserCheck, UserPlus, Receipt,
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
  | 'kegiatan'
  | 'sabuk'
  | 'laporan-anggota'
  | 'laporan-aksesoris'
  | 'laporan-event'
  | 'laporan-keuangan'
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

  // Filter states
  const [filterMemberName, setFilterMemberName] = useState('');
  const [filterMemberBelt, setFilterMemberBelt] = useState('Semua');
  const [filterMemberStatus, setFilterMemberStatus] = useState('Semua');
  const [filterMemberDojang, setFilterMemberDojang] = useState('Semua');

  const [filterAccMonth, setFilterAccMonth] = useState('Semua');
  const [filterAccYear, setFilterAccYear] = useState('Semua');
  const [filterAccProduct, setFilterAccProduct] = useState('Semua');

  const [filterEvtMonth, setFilterEvtMonth] = useState('Semua');
  const [filterEvtYear, setFilterEvtYear] = useState('Semua');
  const [filterEvtName, setFilterEvtName] = useState('Semua');
  const [filterEvtBelt, setFilterEvtBelt] = useState('Semua');

  const [filterFinMonth, setFilterFinMonth] = useState('Semua');
  const [filterFinYear, setFilterFinYear] = useState('Semua');

  // Loaded DB data
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Custom Belt Dropdown State
  const [beltDropdownOpen, setBeltDropdownOpen] = useState(false);

  // Add Member Modal & Form States
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPaymentLogModal, setShowPaymentLogModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberGender, setNewMemberGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [newMemberAge, setNewMemberAge] = useState<number | ''>('');
  const [newMemberJenjang, setNewMemberJenjang] = useState<'SD' | 'SMP' | 'SMA/SMK' | 'Umum'>('SD');
  const [newMemberDojang, setNewMemberDojang] = useState('');
  const [newMemberBelt, setNewMemberBelt] = useState('Sabuk Putih');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [beltPricesMap, setBeltPricesMap] = useState<Record<string, number>>({});

  // Edit Member Modal & Form States
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [editMemberEmail, setEditMemberEmail] = useState('');
  const [editMemberPhone, setEditMemberPhone] = useState('');
  const [editMemberGender, setEditMemberGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [editMemberAge, setEditMemberAge] = useState<number | ''>('');
  const [editMemberJenjang, setEditMemberJenjang] = useState<'SD' | 'SMP' | 'SMA/SMK' | 'Umum'>('SD');
  const [editMemberDojang, setEditMemberDojang] = useState('');
  const [editMemberBelt, setEditMemberBelt] = useState('Sabuk Putih');
  const [editMemberPassword, setEditMemberPassword] = useState('');
  const [editMemberStatus, setEditMemberStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

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
  const [evtStatus, setEvtStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // New Event configuration states
  const [evtType, setEvtType] = useState<'Seminar' | 'UKT' | 'Gasuku' | 'Turnamen' | 'Lainnya'>('Seminar');
  const [evtCatText, setEvtCatText] = useState('');
  const [allowedBelts, setAllowedBelts] = useState<string[]>([]);
  const [useCustomPrices, setUseCustomPrices] = useState(false);

  // Belts dynamic CRUD states
  const [belts, setBelts] = useState<string[]>([]);
  const [newBeltName, setNewBeltName] = useState('');
  const [editingBeltIdx, setEditingBeltIdx] = useState<number | null>(null);
  const [editingBeltName, setEditingBeltName] = useState('');

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
    const [us, txs, prods, cats, evts, setts, blts] = await Promise.all([
      db.getUsers(),
      db.getTransactions(),
      db.getProducts(),
      db.getCategories(),
      db.getEvents(),
      db.getSettings(),
      db.getBelts(),
    ]);

    setUsers(us);
    setTransactions(txs);
    setProducts(prods);
    setCategories(cats);
    setEvents(evts);
    setSettings(setts);
    setBelts(blts || []);

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
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [activeTabProp]);

  // Accept Transaction Handler
  const handleAcceptTransaction = async (txId: string) => {
    const ok = await confirmModal('Setujui Pembayaran', 'Apakah Anda yakin ingin menyetujui pembayaran ini? Tindakan ini tidak dapat dibatalkan.', { confirmLabel: 'Setujui', variant: 'default' });
    if (!ok) return;
    setLoading(true);
    try {
      // Find transaction details to see if it's an accessory purchase
      const tx = transactions.find(t => t.id === txId);
      if (tx && tx.type === 'Aksesoris') {
        const prefix = 'Pembelian Aksesoris: ';
        if (tx.details.startsWith(prefix)) {
          const rest = tx.details.slice(prefix.length);
          const qtyIndex = rest.lastIndexOf(' (x');
          if (qtyIndex !== -1) {
            const productName = rest.substring(0, qtyIndex).trim();
            const qtyStr = rest.substring(qtyIndex + 3);
            const qty = parseInt(qtyStr) || 1;
            
            const prod = products.find(p => p.name === productName);
            if (prod) {
              const updatedStock = Math.max(0, prod.stock - qty);
              const updatedProds = products.map(p => p.id === prod.id ? { ...p, stock: updatedStock } : p);
              await db.saveProducts(updatedProds);
            }
          }
        }
      }

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
  // Belt CRUD Handlers
  const handleAddBelt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeltName.trim()) return;
    const name = newBeltName.trim();
    if (belts.includes(name)) {
      toastWarning('Nama sabuk sudah ada.');
      return;
    }
    setLoading(true);
    try {
      const updated = [...belts, name];
      console.log('[handleAddBelt] Menyimpan sabuk ke DB:', updated);
      await db.saveBelts(updated);
      console.log('[handleAddBelt] Berhasil disimpan ke DB.');
      setBelts(updated);
      setNewBeltName('');
      toastSuccess('Sabuk berhasil ditambahkan.');
    } catch (err) {
      console.error('[handleAddBelt] ERROR:', err);
      toastError('Gagal menambahkan sabuk: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEditBeltSubmit = async (idx: number) => {
    if (!editingBeltName.trim()) return;
    const newName = editingBeltName.trim();
    if (belts[idx] === newName) {
      setEditingBeltIdx(null);
      return;
    }
    if (belts.includes(newName)) {
      toastWarning('Nama sabuk sudah digunakan.');
      return;
    }
    setLoading(true);
    try {
      const updated = [...belts];
      updated[idx] = newName;
      await db.saveBelts(updated);
      setBelts(updated);
      setEditingBeltIdx(null);
      toastSuccess('Nama sabuk berhasil diubah.');
    } catch (err) {
      console.error(err);
      toastError('Gagal mengubah nama sabuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBelt = async (idx: number) => {
    const beltToDelete = belts[idx];
    const ok = await confirmModal(
      'Hapus Sabuk',
      `Apakah Anda yakin ingin menghapus sabuk "${beltToDelete}"? Anggota yang menggunakan sabuk ini tetap memiliki datanya, tetapi tidak akan muncul sebagai pilihan tingkat sabuk baru.`,
      { confirmLabel: 'Hapus', variant: 'danger' }
    );
    if (!ok) return;

    setLoading(true);
    try {
      const updated = belts.filter((_, i) => i !== idx);
      await db.saveBelts(updated);
      setBelts(updated);
      toastSuccess('Sabuk berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menghapus sabuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveBelt = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= belts.length) return;

    setLoading(true);
    try {
      const updated = [...belts];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      await db.saveBelts(updated);
      setBelts(updated);
      toastSuccess('Urutan sabuk berhasil diubah.');
    } catch (err) {
      console.error(err);
      toastError('Gagal mengubah urutan sabuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategoryName = evtType === 'Lainnya' ? evtCatText : evtType;
    if (!evtName || !evtPrice || !finalCategoryName) {
      toastWarning('Nama, biaya, dan kategori kegiatan wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const finalCategoryValue = evtType === 'UKT'
        ? `UKT:::${JSON.stringify({ allowedBelts, beltPrices: beltPricesMap, useCustomPrices })}`
        : finalCategoryName;

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
            category: finalCategoryValue,
            status: evtStatus,
          };
        }
      } else {
        evtsList.push({
          id: 'evt-' + Date.now(),
          name: evtName,
          date: evtDate || '',
          location: evtLoc || '',
          price: Number(evtPrice.toString().replace(/\D/g, '')),
          category: finalCategoryValue,
          status: evtStatus,
        });
      }

      await db.saveEvents(evtsList);
      setEditingEvent(null);
      setBeltPricesMap({});
      setAllowedBelts([]);
      setUseCustomPrices(false);

      setEvtName('');
      setEvtDate('');
      setEvtLoc('');
      setEvtPrice('');
      setEvtCat('Semua Tingkatan');
      setEvtStatus('Aktif');
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

  const handleToggleMemberStatus = async (userToToggle: User) => {
    const newStatus: 'Aktif' | 'Nonaktif' = userToToggle.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const ok = await confirmModal(
      'Ubah Status Anggota',
      `Apakah Anda yakin ingin mengubah status anggota ${userToToggle.name} menjadi ${newStatus}?`,
      { confirmLabel: 'Ubah Status', variant: 'default' }
    );
    if (!ok) return;
    setLoading(true);
    try {
      const updatedUser: User = { ...userToToggle, status: newStatus };
      await db.updateUser(updatedUser);
      await loadAdminData();
      if (viewingMemberDetails && viewingMemberDetails.id === userToToggle.id) {
        setViewingMemberDetails(updatedUser);
      }
      toastSuccess(`Status anggota berhasil diubah menjadi ${newStatus}.`);
    } catch (err) {
      console.error(err);
      toastError('Gagal mengubah status anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberBelt = async (memberToUpdate: User, newBelt: string) => {
    setLoading(true);
    try {
      const updatedUser: User = { ...memberToUpdate, belt: newBelt };
      await db.updateUser(updatedUser);
      await loadAdminData();
      setViewingMemberDetails(updatedUser);
      toastSuccess(`Sabuk anggota ${memberToUpdate.name} berhasil diubah menjadi ${newBelt}.`);
    } catch (err) {
      console.error(err);
      toastError('Gagal mengubah sabuk anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberDojang) {
      toastWarning('Nama dan Dojang wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const finalEmail = newMemberEmail.trim() || `no-email-${Date.now()}@vdojang.com`;
      
      // Check if email already exists (if email is inputted)
      if (newMemberEmail.trim()) {
        const existingUsers = await db.getUsers();
        const exists = existingUsers.some(u => u.email.toLowerCase() === finalEmail.toLowerCase());
        if (exists) {
          toastError('Email sudah terdaftar. Silakan gunakan email lain.');
          setLoading(false);
          return;
        }
      }

      const newUser: User = {
        id: 'user-' + Date.now(),
        email: finalEmail,
        name: newMemberName,
        role: 'anggota',
        phone: newMemberPhone || undefined,
        gender: newMemberGender,
        age: newMemberAge ? Number(newMemberAge) : undefined,
        jenjang: newMemberJenjang,
        dojang: newMemberDojang,
        belt: newMemberBelt,
        status: 'Aktif',
        password: newMemberPassword || '123456',
      };

      await db.addUser(newUser);
      await loadAdminData();
      toastSuccess(`Anggota ${newMemberName} berhasil ditambahkan.`);
      
      // Reset form
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setNewMemberGender('Laki-laki');
      setNewMemberAge('');
      setNewMemberJenjang('SD');
      setNewMemberDojang('');
      setNewMemberBelt('Sabuk Putih');
      setNewMemberPassword('');
      setShowAddMemberModal(false);
    } catch (err) {
      console.error(err);
      toastError('Gagal menambahkan anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditMember = (member: User) => {
    setEditingMember(member);
    setEditMemberName(member.name);
    setEditMemberEmail(member.email.startsWith('no-email-') ? '' : member.email);
    setEditMemberPhone(member.phone || '');
    setEditMemberGender(member.gender || 'Laki-laki');
    setEditMemberAge(member.age !== undefined && member.age !== null ? member.age : '');
    setEditMemberJenjang(member.jenjang || 'SD');
    setEditMemberDojang(member.dojang || '');
    setEditMemberBelt(member.belt || 'Sabuk Putih');
    setEditMemberPassword(member.password || '');
    setEditMemberStatus(member.status || 'Aktif');
  };

  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editMemberName || !editMemberDojang) {
      toastWarning('Nama dan Dojang wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const finalEmail = editMemberEmail.trim() || editingMember.email || `no-email-${Date.now()}@vdojang.com`;

      // Check if email already exists and was modified
      if (editMemberEmail.trim() && editMemberEmail.trim().toLowerCase() !== editingMember.email.toLowerCase()) {
        const existingUsers = await db.getUsers();
        const exists = existingUsers.some(u => u.email.toLowerCase() === editMemberEmail.trim().toLowerCase());
        if (exists) {
          toastError('Email sudah terdaftar. Silakan gunakan email lain.');
          setLoading(false);
          return;
        }
      }

      const updatedUser: User = {
        ...editingMember,
        email: finalEmail,
        name: editMemberName,
        phone: editMemberPhone || undefined,
        gender: editMemberGender,
        age: editMemberAge ? Number(editMemberAge) : undefined,
        jenjang: editMemberJenjang,
        dojang: editMemberDojang,
        belt: editMemberBelt,
        status: editMemberStatus,
        password: editMemberPassword || editingMember.password || '123456',
      };

      await db.updateUser(updatedUser);
      await loadAdminData();
      toastSuccess(`Data anggota ${editMemberName} berhasil diperbarui.`);
      setEditingMember(null);
    } catch (err) {
      console.error(err);
      toastError('Gagal memperbarui data anggota.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (member: User) => {
    const ok = await confirmModal(
      'Hapus Anggota',
      `Apakah Anda yakin ingin menghapus anggota "${member.name}"? Semua data transaksi dan pesanan yang terkait dengan anggota ini tetap ada namun relasi akunnya akan terhapus.`,
      { confirmLabel: 'Hapus', variant: 'danger' }
    );
    if (!ok) return;

    setLoading(true);
    try {
      await db.deleteUser(member.id);
      await loadAdminData();
      toastSuccess(`Anggota "${member.name}" berhasil dihapus.`);
      if (viewingMemberDetails && viewingMemberDetails.id === member.id) {
        viewingMemberDetails && setViewingMemberDetails(null);
      }
    } catch (err) {
      console.error(err);
      toastError('Gagal menghapus anggota.');
    } finally {
      setLoading(false);
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

  // Computed Filtered Lists
  const filteredUsersList = users
    .filter(u => u.role === 'anggota')
    .filter(u => {
      if (filterMemberName && !u.name.toLowerCase().includes(filterMemberName.toLowerCase())) return false;
      if (filterMemberBelt !== 'Semua' && u.belt !== filterMemberBelt) return false;
      if (filterMemberStatus !== 'Semua' && u.status !== filterMemberStatus) return false;
      if (filterMemberDojang !== 'Semua' && (u.dojang || '').toLowerCase() !== filterMemberDojang.toLowerCase()) return false;
      return true;
    });

  const filteredAccessoryTx = accessoryTx.filter(tx => {
    if (filterAccMonth !== 'Semua' && tx.date.split('-')[1] !== filterAccMonth) return false;
    if (filterAccYear !== 'Semua' && tx.date.split('-')[0] !== filterAccYear) return false;
    if (filterAccProduct !== 'Semua' && !tx.details.toLowerCase().includes(filterAccProduct.toLowerCase())) return false;
    return true;
  });
  const filteredTotalAccRevenue = filteredAccessoryTx.reduce((sum, t) => sum + t.amount, 0);

  const filteredEventTx = eventTx.filter(tx => {
    if (filterEvtMonth !== 'Semua' && tx.date.split('-')[1] !== filterEvtMonth) return false;
    if (filterEvtYear !== 'Semua' && tx.date.split('-')[0] !== filterEvtYear) return false;
    if (filterEvtName !== 'Semua' && !tx.details.toLowerCase().includes(filterEvtName.toLowerCase())) return false;
    if (filterEvtBelt !== 'Semua') {
      const userOfTx = users.find(u => u.id === tx.memberId);
      if (!userOfTx) return false;
      const beltLower = (userOfTx.belt || '').toLowerCase();
      if (filterEvtBelt === 'Poom') {
        if (!beltLower.includes('poom') && !beltLower.includes('dan')) return false;
      } else {
        if (userOfTx.belt !== filterEvtBelt) return false;
      }
    }
    return true;
  });
  const filteredTotalEvtRevenue = filteredEventTx.reduce((sum, t) => sum + t.amount, 0);

  const filteredFinTx = transactions
    .filter(t => t.status === 'Berhasil')
    .filter(tx => {
      if (filterFinMonth !== 'Semua' && tx.date.split('-')[1] !== filterFinMonth) return false;
      if (filterFinYear !== 'Semua' && tx.date.split('-')[0] !== filterFinYear) return false;
      return true;
    });
  const filteredRegRevenue = filteredFinTx.filter(t => t.type === 'Pendaftaran').reduce((sum, t) => sum + t.amount, 0);
  const filteredAccRevenueFin = filteredFinTx.filter(t => t.type === 'Aksesoris').reduce((sum, t) => sum + t.amount, 0);
  const filteredEvtRevenueFin = filteredFinTx.filter(t => t.type === 'UKT').reduce((sum, t) => sum + t.amount, 0);
  const filteredTotalRevenue = filteredFinTx.reduce((sum, t) => sum + t.amount, 0);

  // ── Export Helpers ────────────────────────────────────────────────────
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    const csvContent = [
      'sep=;',
      headers.join(';'),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
      ),
    ].join('\n');
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess(`File ${filename}.csv berhasil diunduh!`);
  };

  const exportToPDF = (title: string, printAreaId: string) => {
    const el = document.getElementById(printAreaId);
    if (!el) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>${title}</title>
      <style>
        * { box-sizing: border-box; font-family: Arial, sans-serif; }
        body { margin: 24px; color: #1e293b; }
        h1 { font-size: 18px; font-weight: 900; margin-bottom: 4px; }
        p.subtitle { font-size: 11px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f1f5f9; color: #475569; font-weight: 800; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge-aktif { background: #ecfdf5; color: #059669; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; }
        .badge-nonaktif { background: #fff1f2; color: #e11d48; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 800; }
        @media print { body { margin: 12px; } }
      </style>
      </head><body>
      <h1>${title}</h1>
      <p class="subtitle">Dicetak pada: ${new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; V-Dojang Taekwondo</p>
      ${el.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const printKwitansi = (tx: Transaction) => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;
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
          <p>Kwitansi ini adalah bukti pembayaran yang sah.</p>
        </div>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const exportLaporanKeuanganPDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Laporan Keuangan Keseluruhan - V-Dojang</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; color: #1e293b; }
        .header { border-bottom: 3px double #cbd5e1; padding-bottom: 12px; margin-bottom: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 900; }
        .header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #f8fafc; }
        .summary-title { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .summary-value { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 4px; }
        .section-title { font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; border-left: 3px solid #090681; padding-left: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
        th { background: #f1f5f9; color: #475569; font-weight: 800; padding: 8px 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        tr:nth-child(even) td { background: #f8fafc; }
        .total-row { font-weight: 900; background: #f1f5f9 !important; border-top: 2px solid #cbd5e1; }
        @media print { body { margin: 15px; } }
      </style>
      </head><body>
      <div class="header">
        <h1>V-DOJANG TAEKWONDO CLUB</h1>
        <p>LAPORAN KEUANGAN KESELURUHAN</p>
        <p style="font-size: 10px; margin-top: 8px;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      </div>
      
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">Pendapatan Pendaftaran</div>
          <div class="summary-value">Rp ${totalRegRevenue.toLocaleString('id-ID')}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Pendapatan Aksesoris</div>
          <div class="summary-value">Rp ${totalAccRevenue.toLocaleString('id-ID')}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Pendapatan Event / UKT</div>
          <div class="summary-value">Rp ${totalEvtRevenue.toLocaleString('id-ID')}</div>
        </div>
        <div class="summary-card" style="background: #eff6ff; border-color: #bfdbfe;">
          <div class="summary-title" style="color: #1d4ed8;">Total Keseluruhan</div>
          <div class="summary-value" style="color: #1d4ed8;">Rp ${totalRevenue.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div class="section-title">Rincian Transaksi Sukses</div>
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>ID Transaksi</th>
            <th>Nama Anggota</th>
            <th>Tipe</th>
            <th>Deskripsi</th>
            <th style="text-align: right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${transactions
            .filter(t => t.status === 'Berhasil')
            .map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.id}</td>
                <td>${t.memberName}</td>
                <td>${t.type}</td>
                <td>${t.details}</td>
                <td style="text-align: right; font-weight: bold; color: #090681;">Rp ${t.amount.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          <tr class="total-row">
            <td colspan="5" style="text-align: right; padding-right: 15px;">TOTAL PENDAPATAN KESELURUHAN:</td>
            <td style="text-align: right; color: #1d4ed8;">Rp ${totalRevenue.toLocaleString('id-ID')}</td>
          </tr>
        </tbody>
      </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

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
      case 'laporan-keuangan': return 'Laporan Keuangan & Total Keseluruhan';
      case 'kegiatan': return 'Kelola Kegiatan & Event';
      case 'sabuk': return 'Kelola Tingkatan Sabuk';
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
            On Process
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

      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. Left Collapsible Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 lg:relative z-40 h-full bg-[#080c18] text-slate-400 flex flex-col shrink-0 transition-all duration-300 shadow-2xl
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-[70px] -translate-x-full lg:translate-x-0 lg:w-[70px]'}
        `}
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
          {renderSidebarItem('sabuk', 'Kelola Sabuk', <Award size={16} />)}
          {renderSidebarItem('kegiatan', 'Kelola Kegiatan', <Calendar size={16} />)}

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
              {renderSidebarItem('laporan-keuangan', 'Keuangan/Total', <TrendingUp size={14} />, undefined, true)}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* TAB: Ringkasan */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="space-y-4 bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aktivitas Transaksi Terbaru</h3>
                  <div className="border border-slate-200/85 rounded-xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
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
                              <td className="p-4">{tx.details.split('\n')[0]}</td>
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
              <div className="space-y-6 bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
                {transactions.length > 0 ? (
                  <div className="border border-slate-200/85 rounded-xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[800px]">
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
                                 <span>{tx.details.split('\n')[0]}</span>
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
                                <div className="flex justify-end items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selesai</span>
                                  {tx.status === 'Berhasil' && (
                                    <button
                                      type="button"
                                      onClick={() => printKwitansi(tx)}
                                      className="text-[9px] text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1 border border-emerald-100 bg-emerald-50/30 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition"
                                    >
                                      🧾 Kwitansi
                                    </button>
                                  )}
                                </div>
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
              <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
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
                        className="px-4 py-2 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg inline-flex items-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>Simpan</span>
                        )}
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
                  <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[700px]">
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
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setActiveTab('produk/edit?id=' + p.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-blue/8 hover:bg-brand-blue/15 text-brand-blue hover:text-brand-blue-hover border border-brand-blue/15 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                                    title="Edit Produk"
                                  >
                                    <Edit2 size={12} />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-red/8 hover:bg-brand-red/15 text-brand-red hover:text-brand-red-hover border border-brand-red/15 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                                    title="Hapus Produk"
                                  >
                                    <Trash2 size={12} />
                                    <span>Hapus</span>
                                  </button>
                                </div>
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
              <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
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
                      disabled={loading}
                      className="px-4 py-2 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg inline-flex items-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan</span>
                      )}
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

                <div className="border border-slate-100 rounded-xl overflow-x-auto max-w-md bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[400px]">
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
              <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
                {/* Export Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Laporan Data Anggota</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{filteredUsersList.length} anggota ditemukan ({users.filter(u => u.role === 'anggota').length} total)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPaymentLogModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <Receipt size={13} />
                      Log Pembayaran
                    </button>
                    <button
                      onClick={() => exportToCSV('laporan-anggota', ['Nama Lengkap', 'Dojang', 'Kontak', 'Gender', 'Jenjang', 'Sabuk', 'Status'],
                        filteredUsersList.map(u => [u.name, u.dojang || '-', u.phone || '-', u.gender || '-', u.jenjang || '-', u.belt || '-', u.status || '-'])
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <FileSpreadsheet size={13} />
                      Export Excel
                    </button>
                    <button
                      onClick={() => exportToPDF('Laporan Data Anggota', 'print-laporan-anggota')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-red/8 hover:bg-brand-red/15 text-brand-red border border-brand-red/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <Printer size={13} />
                      Cetak PDF
                    </button>
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white border border-brand-blue rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-xs"
                    >
                      <UserPlus size={13} />
                      Tambah Anggota
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Cari Nama Anggota</label>
                    <input
                      type="text"
                      value={filterMemberName}
                      onChange={e => { setFilterMemberName(e.target.value); setCurrentPageLaporanAnggota(1); }}
                      placeholder="Ketik nama anggota..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Dojang</label>
                    <select
                      value={filterMemberDojang}
                      onChange={e => { setFilterMemberDojang(e.target.value); setCurrentPageLaporanAnggota(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Dojang</option>
                      {Array.from(new Set(users.filter(u => u.role === 'anggota' && u.dojang).map(u => u.dojang as string))).sort().map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Sabuk</label>
                    <select
                      value={filterMemberBelt}
                      onChange={e => { setFilterMemberBelt(e.target.value); setCurrentPageLaporanAnggota(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Sabuk</option>
                      {belts.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Status</label>
                    <select
                      value={filterMemberStatus}
                      onChange={e => { setFilterMemberStatus(e.target.value); setCurrentPageLaporanAnggota(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

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

                <div id="print-laporan-anggota" className="space-y-3 pt-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Tabel Data Keanggotaan</h4>
                  <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[900px]">
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
                        {filteredUsersList
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
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setViewingMemberDetails(u)}
                                  className="p-1.5 hover:bg-brand-blue/5 text-brand-blue hover:text-brand-blue/80 rounded-lg transition inline-flex items-center justify-center border border-slate-100"
                                  title="Detail Anggota"
                                >
                                  <Eye size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditMember(u)}
                                  className="p-1.5 hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-lg transition inline-flex items-center justify-center border border-slate-100"
                                  title="Edit Anggota"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleMemberStatus(u)}
                                  className={`p-1.5 rounded-lg transition inline-flex items-center justify-center border ${
                                    u.status === 'Aktif'
                                      ? 'hover:bg-rose-50 text-brand-red border-rose-150'
                                      : 'hover:bg-emerald-50 text-emerald-700 border-emerald-150'
                                  }`}
                                  title={u.status === 'Aktif' ? 'Nonaktifkan Anggota' : 'Aktifkan Anggota'}
                                >
                                  {u.status === 'Aktif' ? <UserX size={12} /> : <UserCheck size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(u)}
                                  className="p-1.5 hover:bg-rose-50 text-brand-red hover:text-brand-red/80 rounded-lg transition inline-flex items-center justify-center border border-slate-100"
                                  title="Hapus Anggota"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>

                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {renderPagination(currentPageLaporanAnggota, filteredUsersList.length, setCurrentPageLaporanAnggota)}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Laporan Aksesoris */}
            {activeTab === 'laporan-aksesoris' && (
              <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
                {/* Export Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Laporan Penjualan Aksesoris</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{filteredAccessoryTx.length} transaksi ditemukan ({accessoryTx.length} total)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportToCSV('laporan-aksesoris', ['Tanggal', 'Nama Anggota', 'Deskripsi Barang', 'Subtotal (Rp)'],
                        filteredAccessoryTx.map(tx => [tx.date, tx.memberName, tx.details, tx.amount])
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <FileSpreadsheet size={13} />
                      Export Excel
                    </button>
                    <button
                      onClick={() => exportToPDF('Laporan Penjualan Aksesoris', 'print-laporan-aksesoris')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-red/8 hover:bg-brand-red/15 text-brand-red border border-brand-red/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <Printer size={13} />
                      Cetak PDF
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Bulan</label>
                    <select
                      value={filterAccMonth}
                      onChange={e => { setFilterAccMonth(e.target.value); setCurrentPageLaporanAksesoris(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Bulan</option>
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Tahun</label>
                    <select
                      value={filterAccYear}
                      onChange={e => { setFilterAccYear(e.target.value); setCurrentPageLaporanAksesoris(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Tahun</option>
                      {Array.from(new Set(transactions.map(t => t.date.split('-')[0]))).sort().map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Aksesoris</label>
                    <select
                      value={filterAccProduct}
                      onChange={e => { setFilterAccProduct(e.target.value); setCurrentPageLaporanAksesoris(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Aksesoris</option>
                      {products.filter(p => p.categoryId !== 'cat-1' && p.categoryId !== 'cat-2' && p.categoryId !== 'Pendaftaran' && p.categoryId !== 'UKT').concat(
                        products.filter(p => p.categoryId === 'cat-1' || p.categoryId === 'cat-2')
                      ).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transaksi</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{filteredAccessoryTx.length} Pesanan</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Penjualan</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">Rp {filteredTotalAccRevenue.toLocaleString('id-ID')}</p>
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

                  <div id="print-laporan-aksesoris" className="md:col-span-8 space-y-3">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Log Transaksi Toko</h4>
                    <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Anggota</th>
                            <th className="p-3">Deskripsi Barang</th>
                            <th className="p-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAccessoryTx.slice((currentPageLaporanAksesoris - 1) * 10, currentPageLaporanAksesoris * 10).map(tx => (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3">{tx.date}</td>
                              <td className="p-3 font-bold text-slate-800">{tx.memberName}</td>
                              <td className="p-3">{tx.details.split('\n')[0]}</td>
                              <td className="p-3 text-brand-blue font-bold text-right">Rp {tx.amount.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination(currentPageLaporanAksesoris, filteredAccessoryTx.length, setCurrentPageLaporanAksesoris)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Laporan Event */}
            {activeTab === 'laporan-event' && (
              <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
                {/* Export Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Laporan Event &amp; UKT</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{filteredEventTx.length} peserta ditemukan ({eventTx.length} total)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportToCSV('laporan-event-ukt', ['Tanggal', 'Nama Anggota', 'Detail Kegiatan', 'Nominal (Rp)'],
                        filteredEventTx.map(tx => [tx.date, tx.memberName, tx.details.split('\n')[0], tx.amount])
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <FileSpreadsheet size={13} />
                      Export Excel
                    </button>
                    <button
                      onClick={() => exportToPDF('Laporan Event & UKT', 'print-laporan-event')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-red/8 hover:bg-brand-red/15 text-brand-red border border-brand-red/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <Printer size={13} />
                      Cetak PDF
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Bulan</label>
                    <select
                      value={filterEvtMonth}
                      onChange={e => { setFilterEvtMonth(e.target.value); setCurrentPageLaporanEvent(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Bulan</option>
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Tahun</label>
                    <select
                      value={filterEvtYear}
                      onChange={e => { setFilterEvtYear(e.target.value); setCurrentPageLaporanEvent(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Tahun</option>
                      {Array.from(new Set(transactions.map(t => t.date.split('-')[0]))).sort().map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Kegiatan</label>
                    <select
                      value={filterEvtName}
                      onChange={e => { setFilterEvtName(e.target.value); setCurrentPageLaporanEvent(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Kegiatan</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.name}>{ev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Sabuk Anggota</label>
                    <select
                      value={filterEvtBelt}
                      onChange={e => { setFilterEvtBelt(e.target.value); setCurrentPageLaporanEvent(1); }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Sabuk</option>
                      {belts.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Peserta UKT/Event</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{filteredEventTx.length} Orang</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Biaya Pendaftaran</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">Rp {filteredTotalEvtRevenue.toLocaleString('id-ID')}</p>
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

                  <div id="print-laporan-event" className="md:col-span-7 space-y-3">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Tabel Peserta Kegiatan</h4>
                    <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-xs">
                      <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Nama Anggota</th>
                            <th className="p-3">Detail Kegiatan</th>
                            <th className="p-3 text-right">Nominal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEventTx.slice((currentPageLaporanEvent - 1) * 10, currentPageLaporanEvent * 10).map(tx => (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3">{tx.date}</td>
                              <td className="p-3 font-bold text-slate-800">{tx.memberName}</td>
                              <td className="p-3">{tx.details.split('\n')[0]}</td>
                              <td className="p-3 text-brand-blue font-bold text-right">Rp {tx.amount.toLocaleString('id-ID')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {renderPagination(currentPageLaporanEvent, filteredEventTx.length, setCurrentPageLaporanEvent)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Laporan Keuangan Keseluruhan */}
            {activeTab === 'laporan-keuangan' && (
              <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in font-sans">
                {/* Export Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Laporan Keuangan &amp; Total Keseluruhan</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{filteredFinTx.length} transaksi berhasil ditemukan ({transactions.filter(t => t.status === 'Berhasil').length} total)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportToCSV('laporan-keuangan-total', ['Tanggal', 'ID Transaksi', 'Nama Anggota', 'Tipe', 'Deskripsi', 'Nominal (Rp)'],
                        filteredFinTx.map(tx => [tx.date, tx.id, tx.memberName, tx.type, tx.details.split('\n')[0], tx.amount])
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <FileSpreadsheet size={13} />
                      Export Excel
                    </button>
                    <button
                      onClick={exportLaporanKeuanganPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-red/8 hover:bg-brand-red/15 text-brand-red border border-brand-red/15 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                    >
                      <Printer size={13} />
                      Cetak Laporan PDF
                    </button>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Bulan</label>
                    <select
                      value={filterFinMonth}
                      onChange={e => setFilterFinMonth(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Bulan</option>
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">Filter Tahun</label>
                    <select
                      value={filterFinYear}
                      onChange={e => setFilterFinYear(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white shadow-xs"
                    >
                      <option value="Semua">Semua Tahun</option>
                      {Array.from(new Set(transactions.map(t => t.date.split('-')[0]))).sort().map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stats Summary Card Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendapatan Pendaftaran</p>
                    <p className="text-xl font-black text-slate-850 mt-1">Rp {filteredRegRevenue.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendapatan Aksesoris</p>
                    <p className="text-xl font-black text-slate-850 mt-1">Rp {filteredAccRevenueFin.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendapatan Event / UKT</p>
                    <p className="text-xl font-black text-slate-850 mt-1">Rp {filteredEvtRevenueFin.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm shadow-brand-blue/5">
                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Total Keseluruhan</p>
                    <p className="text-2xl font-black text-brand-blue mt-1">Rp {filteredTotalRevenue.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Breakdown bar */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-3">Persentase Breakdown Pendapatan</h4>
                  {(() => {
                    const regPct = filteredTotalRevenue > 0 ? (filteredRegRevenue / filteredTotalRevenue) * 100 : 0;
                    const accPct = filteredTotalRevenue > 0 ? (filteredAccRevenueFin / filteredTotalRevenue) * 100 : 0;
                    const evtPct = filteredTotalRevenue > 0 ? (filteredEvtRevenueFin / filteredTotalRevenue) * 100 : 0;
                    return (
                      <div className="space-y-4">
                        <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
                          <div style={{ width: `${regPct}%` }} className="bg-brand-blue" title={`Pendaftaran: ${regPct.toFixed(1)}%`}></div>
                          <div style={{ width: `${accPct}%` }} className="bg-emerald-500" title={`Aksesoris: ${accPct.toFixed(1)}%`}></div>
                          <div style={{ width: `${evtPct}%` }} className="bg-brand-red" title={`Event: ${evtPct.toFixed(1)}%`}></div>
                        </div>
                        <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-650 justify-center">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-brand-blue rounded"></span>
                            <span>Pendaftaran ({regPct.toFixed(1)}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-emerald-500 rounded"></span>
                            <span>Aksesoris ({accPct.toFixed(1)}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-brand-red rounded"></span>
                            <span>Event / UKT ({evtPct.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Full Transactions Log */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Tabel Rincian Seluruh Transaksi Sukses</h4>
                  <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">ID Transaksi</th>
                          <th className="p-3">Nama Anggota</th>
                          <th className="p-3">Tipe</th>
                          <th className="p-3">Deskripsi</th>
                          <th className="p-3 text-right">Jumlah</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFinTx
                          .map(tx => (
                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-650">
                              <td className="p-3">{tx.date}</td>
                              <td className="p-3 font-mono text-[10px]">{tx.id}</td>
                              <td className="p-3 font-bold text-slate-800">{tx.memberName}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-650 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                  {tx.type}
                                </span>
                              </td>
                              <td className="p-3">{tx.details.split('\n')[0]}</td>
                              <td className="p-3 text-brand-blue font-bold text-right">Rp {tx.amount.toLocaleString('id-ID')}</td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => printKwitansi(tx)}
                                  className="text-[9px] text-emerald-650 hover:text-emerald-700 font-extrabold flex items-center gap-1 border border-emerald-100 bg-emerald-50/30 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition mx-auto"
                                >
                                  🧾 Kwitansi
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Harga & Bank */}
            {activeTab === 'harga-setting' && (
              <div className="space-y-8 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in max-w-2xl">
                <form onSubmit={handleSaveSettings} className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4 w-full">
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
                    className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-[10px] font-black uppercase rounded-lg flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Pengaturan</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: Kelola Kegiatan */}
            {activeTab === 'kegiatan' && (
              <div className="space-y-8 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Kelola Kegiatan &amp; Event</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Kelola turnamen, UKT (ujian kenaikan tingkat), seminar, dan kegiatan lainnya.</p>
                  </div>
                  {!editingEvent && (
                    <button
                      onClick={() => {
                        setEditingEvent({ id: '', name: '', date: '', location: '', price: 0, category: 'Seminar', status: 'Aktif' });
                        setEvtName('');
                        setEvtDate('');
                        setEvtLoc('');
                        setEvtPrice('');
                        setEvtType('Seminar');
                        setEvtCatText('');
                        setEvtStatus('Aktif');
                        setAllowedBelts(belts);
                        setUseCustomPrices(false);
                        setBeltPricesMap({});
                      }}
                      className="px-4 py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-md shadow-brand-blue/10"
                    >
                      <Plus size={14} />
                      Tambah Kegiatan Baru
                    </button>
                  )}
                </div>

                {editingEvent && (
                  <form onSubmit={handleSaveEvent} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 max-w-4xl">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                        {editingEvent.id ? '✏️ Edit Detail Kegiatan' : '➕ Tambah Kegiatan Baru'}
                      </h4>
                      <button type="button" onClick={() => setEditingEvent(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nama Kegiatan *</label>
                        <input
                          type="text"
                          value={evtName}
                          onChange={e => setEvtName(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                          placeholder="Contoh: Ujian Kenaikan Tingkat (UKT) Periode I"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Jenis / Kategori Event *</label>
                        <select
                          value={evtType}
                          onChange={e => {
                            const val = e.target.value;
                            setEvtType(val as any);
                            if (val === 'UKT') {
                              setAllowedBelts(belts);
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white cursor-pointer text-slate-800"
                          required
                        >
                          <option value="Seminar">🎓 Seminar / Workshop</option>
                          <option value="UKT">🥋 UKT (Ujian Kenaikan Tingkat)</option>
                          <option value="Gasuku">🏕️ Gasuku / Latihan Gabungan</option>
                          <option value="Turnamen">🏆 Turnamen / Kejuaraan</option>
                          <option value="Lainnya">⚙️ Lainnya (Kustom)</option>
                        </select>
                      </div>
                    </div>

                    {evtType === 'Lainnya' && (
                      <div className="animate-fade-in">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nama Kategori Kustom *</label>
                        <input
                          type="text"
                          value={evtCatText}
                          onChange={e => setEvtCatText(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                          placeholder="Masukkan nama kategori kustom..."
                          required
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Tanggal Pelaksanaan *</label>
                        <input
                          type="date"
                          value={evtDate}
                          onChange={e => setEvtDate(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Lokasi Pelaksanaan *</label>
                        <input
                          type="text"
                          value={evtLoc}
                          onChange={e => setEvtLoc(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                          placeholder="Contoh: GOR Basket V-Dojang"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Biaya Dasar (Rp) *</label>
                        <input
                          type="text"
                          value={formatCurrencyInput(evtPrice)}
                          onChange={e => setEvtPrice(e.target.value.replace(/\D/g, ''))}
                          placeholder="Contoh: 150.000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Status Keaktifan *</label>
                        <select
                          value={evtStatus}
                          onChange={e => setEvtStatus(e.target.value as 'Aktif' | 'Nonaktif')}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white cursor-pointer text-slate-800"
                          required
                        >
                          <option value="Aktif">🟢 Aktif (Bisa Diikuti)</option>
                          <option value="Nonaktif">🔴 Nonaktif (Dikunci)</option>
                        </select>
                      </div>
                    </div>

                    {/* UKT-SPECIFIC BI-PRICING AND ELIGIBILITY */}
                    {evtType === 'UKT' && (
                      <div className="border border-slate-200/80 rounded-2xl p-5 bg-white space-y-4 animate-fade-in shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Konfigurasi Peserta &amp; Biaya UKT</h5>
                            <p className="text-[10px] text-slate-450 mt-0.5">Tentukan tingkatan sabuk mana saja yang diijinkan mendaftar dan atur harga spesifiknya.</p>
                          </div>
                          
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition">
                            <input
                              type="checkbox"
                              checked={useCustomPrices}
                              onChange={e => setUseCustomPrices(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                            />
                            <span className="text-[10px] font-black text-slate-700 uppercase">Harga Khusus Sabuk</span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Pilih Tingkat Sabuk &amp; Biaya:</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {belts.map(beltName => {
                              const isAllowed = allowedBelts.includes(beltName);
                              return (
                                <div key={beltName} className={`border rounded-xl p-3 flex flex-col justify-between transition-all duration-200 ${isAllowed ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-100/40 border-slate-200/50 opacity-60'}`}>
                                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={isAllowed}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setAllowedBelts(prev => [...prev, beltName]);
                                        } else {
                                          setAllowedBelts(prev => prev.filter(b => b !== beltName));
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                                    />
                                    <span className="text-xs font-bold text-slate-800">{beltName}</span>
                                  </label>

                                  {isAllowed && useCustomPrices && (
                                    <div className="mt-2.5 animate-fade-in">
                                      <input
                                        type="text"
                                        placeholder={`Dasar: Rp ${evtPrice ? formatCurrencyInput(evtPrice) : '0'}`}
                                        value={beltPricesMap[beltName] ? formatCurrencyInput(beltPricesMap[beltName]) : ''}
                                        onChange={e => {
                                          const val = e.target.value.replace(/\D/g, '');
                                          setBeltPricesMap(prev => ({
                                            ...prev,
                                            [beltName]: val ? Number(val) : 0
                                          }));
                                        }}
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 focus:border-brand-blue transition"
                                      />
                                    </div>
                                  )}
                                  {isAllowed && !useCustomPrices && (
                                    <div className="mt-2 text-[10px] font-semibold text-slate-400 italic pl-6">
                                      Biaya: Rp {evtPrice ? formatCurrencyInput(evtPrice) : '0'}
                                    </div>
                                  )}
                                  {!isAllowed && (
                                    <div className="mt-2 text-[10px] font-semibold text-slate-400 italic pl-6">
                                      ❌ Tidak Dapat Ikut
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-md shadow-brand-blue/10"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>Simpan Kegiatan</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingEvent(null)}
                        className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-850 text-xs font-black uppercase tracking-wider rounded-xl transition"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                )}

                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100 uppercase tracking-wider text-[9px]">
                        <th className="p-4 pl-6">Nama Event / Kegiatan</th>
                        <th className="p-4">Jenis Kategori</th>
                        <th className="p-4">Biaya Dasar</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 pr-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(ev => {
                        let catDisplay = ev.category || 'Seminar';
                        let pricingTypeDisplay = 'Flat (Sama Rata)';
                        if (ev.category.includes(':::')) {
                          const parts = ev.category.split(':::');
                          catDisplay = parts[0];
                          try {
                            const parsed = JSON.parse(parts[1]);
                            if (parsed && typeof parsed === 'object') {
                              pricingTypeDisplay = parsed.useCustomPrices ? 'Harga Khusus Sabuk' : 'Flat (Sama Rata)';
                            } else {
                              pricingTypeDisplay = 'Harga Khusus Sabuk';
                            }
                          } catch {
                            pricingTypeDisplay = 'Harga Khusus Sabuk';
                          }
                        }
                        
                        return (
                          <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition font-semibold text-slate-600">
                            <td className="p-4 pl-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-855 text-sm leading-snug">{ev.name}</span>
                                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                                  📅 {ev.date || '--'} &nbsp;|&nbsp; 📍 {ev.location || '--'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="text-slate-800 font-bold uppercase text-[10px] tracking-wider">{catDisplay}</span>
                                <span className="text-[9px] text-slate-450 mt-0.5">{pricingTypeDisplay}</span>
                              </div>
                            </td>
                            <td className="p-4 text-brand-blue font-bold text-sm">
                              Rp {ev.price.toLocaleString('id-ID')}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                ev.status === 'Nonaktif' ? 'bg-rose-50 text-brand-red border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                {ev.status || 'Aktif'}
                              </span>
                            </td>
                            <td className="p-4 pr-6 text-right space-x-3">
                              <button
                                onClick={() => {
                                  setEditingEvent(ev);
                                  setEvtName(ev.name);
                                  setEvtDate(ev.date);
                                  setEvtLoc(ev.location);
                                  setEvtPrice(ev.price);
                                  setEvtStatus(ev.status || 'Aktif');
                                  
                                  const catVal = ev.category || '';
                                  if (catVal.includes(':::')) {
                                    const parts = catVal.split(':::');
                                    setEvtType('UKT');
                                    setEvtCatText('');
                                    try {
                                      const parsed = JSON.parse(parts[1]);
                                      if (parsed && typeof parsed === 'object') {
                                        if (parsed.allowedBelts !== undefined) {
                                          setAllowedBelts(parsed.allowedBelts || []);
                                          setBeltPricesMap(parsed.beltPrices || {});
                                          setUseCustomPrices(!!parsed.useCustomPrices);
                                        } else {
                                          setAllowedBelts(belts);
                                          setBeltPricesMap(parsed || {});
                                          setUseCustomPrices(true);
                                        }
                                      } else {
                                        setAllowedBelts(belts);
                                        setBeltPricesMap({});
                                        setUseCustomPrices(false);
                                      }
                                    } catch (err) {
                                      setAllowedBelts(belts);
                                      setBeltPricesMap({});
                                      setUseCustomPrices(false);
                                    }
                                  } else {
                                    const knownTypes = ['Seminar', 'Gasuku', 'Turnamen'];
                                    if (knownTypes.includes(catVal)) {
                                      setEvtType(catVal as any);
                                      setEvtCatText('');
                                    } else {
                                      setEvtType('Lainnya');
                                      setEvtCatText(catVal);
                                    }
                                    setAllowedBelts(belts);
                                    setBeltPricesMap({});
                                    setUseCustomPrices(false);
                                  }
                                }}
                                className="text-[10px] font-black text-brand-blue uppercase hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="text-[10px] font-black text-brand-red uppercase hover:underline"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* TAB: Kelola Sabuk */}
            {activeTab === 'sabuk' && (
              <div className="space-y-8 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-800">Kelola Tingkatan Sabuk</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Kelola tingkat sabuk (rank/sabuk) untuk data anggota, turnamen, dan UKT club.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Add Belt */}
                  <div className="md:col-span-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 w-full">
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200/60">➕ Tambah Sabuk Baru</h4>
                    <form onSubmit={handleAddBelt} className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nama Tingkat Sabuk</label>
                        <input
                          type="text"
                          value={newBeltName}
                          onChange={e => setNewBeltName(e.target.value)}
                          placeholder="Contoh: Sabuk Kuning Strip Hijau"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                          required
                          disabled={loading}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !newBeltName.trim()}
                        className="w-full py-2 bg-brand-blue hover:bg-brand-blue-hover text-white text-[10px] font-black uppercase rounded-lg tracking-wider transition shadow-sm"
                      >
                        Tambah Sabuk
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Belt list & order management */}
                  <div className="md:col-span-8 space-y-4 w-full">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Daftar Urutan Tingkatan Sabuk ({belts.length})</h4>
                      <p className="text-[9px] text-slate-400 font-medium">Urutan di bawah ini menentukan hierarki (dari tingkat pemula hingga tinggi).</p>
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto scrollbar-thin">
                        {belts.map((beltName, idx) => {
                          const isEditing = editingBeltIdx === idx;
                          return (
                            <div key={beltName + '-' + idx} className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="text-[10px] font-mono font-black text-slate-350 w-5 shrink-0">#{idx + 1}</span>
                                
                                {isEditing ? (
                                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                                    <input
                                      type="text"
                                      value={editingBeltName}
                                      onChange={e => setEditingBeltName(e.target.value)}
                                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-hidden w-full font-semibold bg-white text-slate-800"
                                      required
                                      disabled={loading}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleEditBeltSubmit(idx)}
                                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-black uppercase"
                                      disabled={loading}
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingBeltIdx(null)}
                                      className="px-2 py-1 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded text-[10px] font-bold"
                                      disabled={loading}
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <span className="font-bold text-slate-800 text-xs truncate">{beltName}</span>
                                )}
                              </div>

                              {!isEditing && (
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0 || loading}
                                    onClick={() => handleMoveBelt(idx, 'up')}
                                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 transition text-slate-500"
                                    title="Pindahkan Ke Atas"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === belts.length - 1 || loading}
                                    onClick={() => handleMoveBelt(idx, 'down')}
                                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 disabled:opacity-30 transition text-slate-500"
                                    title="Pindahkan Ke Bawah"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => {
                                      setEditingBeltIdx(idx);
                                      setEditingBeltName(beltName);
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-black text-brand-blue uppercase hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => handleDeleteBelt(idx)}
                                    className="px-2.5 py-1 text-[10px] font-black text-brand-red uppercase hover:underline"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

{/* TAB: Profil Admin Setting */}
          {activeTab === 'profile-setting' && (
            <div className="space-y-6 bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-xs animate-fade-in max-w-md">
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
                  className="px-5 py-2.5 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg shadow-xs inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
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
                <h4 className="font-extrabold text-slate-800 mt-0.5 text-xs">{rejectingTx.details.split('\n')[0]}</h4>
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
                  className="w-2/3 py-2.5 bg-brand-red hover:bg-brand-red-hover text-white text-[10px] font-black uppercase rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Tolak Transaksi</span>
                  )}
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
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">{viewingTxProof.memberName} — {viewingTxProof.details.split('\n')[0]}</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => { setViewingMemberDetails(null); setBeltDropdownOpen(false); }}>
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-sm text-slate-800 font-sans">Detail Profil Anggota</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">ID: {viewingMemberDetails.id}</p>
              </div>
              <button onClick={() => { setViewingMemberDetails(null); setBeltDropdownOpen(false); }} className="text-slate-400 hover:text-slate-650 font-bold transition">
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

                {/* Belt Dropdown Panel for Admin */}
                <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100/50 flex items-center gap-3 sm:col-span-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Award size={14} className="text-brand-red animate-pulse" />
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap relative">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Ubah Sabuk Anggota</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-bold">Pilih tingkat sabuk baru:</p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBeltDropdownOpen(!beltDropdownOpen)}
                        disabled={loading}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white shadow-xs hover:bg-slate-50 transition inline-flex items-center gap-2 min-w-[150px] justify-between text-slate-800"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-full border border-slate-350 ${
                            (viewingMemberDetails.belt || 'Sabuk Putih') === 'Sabuk Putih' ? 'bg-white' :
                            (viewingMemberDetails.belt || 'Sabuk Putih') === 'Sabuk Kuning' ? 'bg-yellow-400' :
                            (viewingMemberDetails.belt || 'Sabuk Putih') === 'Sabuk Hijau' ? 'bg-emerald-500' :
                            (viewingMemberDetails.belt || 'Sabuk Putih') === 'Sabuk Biru' ? 'bg-blue-600' :
                            (viewingMemberDetails.belt || 'Sabuk Putih') === 'Sabuk Merah' ? 'bg-rose-600' :
                            (viewingMemberDetails.belt || 'Sabuk Putih').startsWith('Poom') ? 'bg-gradient-to-br from-red-500 to-slate-900' :
                            'bg-slate-900'
                          }`} />
                          <span>{viewingMemberDetails.belt || 'Sabuk Putih'}</span>
                        </div>
                        <span className={`text-[9px] text-slate-400 transform transition-transform ${beltDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {beltDropdownOpen && (
                        <div className="absolute right-0 bottom-full mb-2 z-[110] w-[215px] max-h-[220px] overflow-y-auto bg-white border border-slate-150 rounded-2xl shadow-xl p-1.5 animate-scale-up scrollbar-thin">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 mb-1 border-b border-slate-100">Daftar Sabuk</p>
                          {belts.map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={async () => {
                                setBeltDropdownOpen(false);
                                await handleUpdateMemberBelt(viewingMemberDetails, b);
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 active:bg-slate-100 transition flex items-center justify-between text-slate-700 ${
                                (viewingMemberDetails.belt || 'Sabuk Putih') === b ? 'bg-slate-50 text-brand-blue font-black' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full border border-slate-350 ${
                                  b === 'Sabuk Putih' ? 'bg-white' :
                                  b === 'Sabuk Kuning' ? 'bg-yellow-400' :
                                  b === 'Sabuk Hijau' ? 'bg-emerald-500' :
                                  b === 'Sabuk Biru' ? 'bg-blue-600' :
                                  b === 'Sabuk Merah' ? 'bg-rose-600' :
                                  b.startsWith('Poom') ? 'bg-gradient-to-r from-red-500 to-slate-900' :
                                  'bg-slate-900'
                                }`} />
                                <span>{b}</span>
                              </div>
                              {(viewingMemberDetails.belt || 'Sabuk Putih') === b && (
                                <span className="text-brand-blue text-[9px] font-black">✓</span>
                              )}
                            </button>
                          ))
                        }
                        </div>
                      )}
                    </div>
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
                onClick={() => { setViewingMemberDetails(null); setBeltDropdownOpen(false); }}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition font-sans"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setShowAddMemberModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-sm text-slate-800 font-sans">Tambah Anggota Baru</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">Input Data Anggota Mandiri / Anggota Lama</p>
              </div>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-650 font-bold transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4 text-xs font-semibold text-slate-650 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nama Lengkap Anggota *</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  placeholder="Nama Lengkap Anggota..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Alamat Email (Opsional)</label>
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                    placeholder="Contoh: email@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Kosongkan untuk anggota lama tanpa email.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    value={newMemberPhone}
                    onChange={e => setNewMemberPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Jenis Kelamin</label>
                  <select
                    value={newMemberGender}
                    onChange={e => setNewMemberGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Laki-laki">♂️ Laki-laki</option>
                    <option value="Perempuan">♀️ Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Umur (Tahun)</label>
                  <input
                    type="number"
                    value={newMemberAge}
                    onChange={e => setNewMemberAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 17"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Jenjang Pendidikan</label>
                  <select
                    value={newMemberJenjang}
                    onChange={e => setNewMemberJenjang(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Dojang / Cabang Latihan *</label>
                  <input
                    type="text"
                    value={newMemberDojang}
                    onChange={e => setNewMemberDojang(e.target.value)}
                    placeholder="Contoh: Dojang Pusat"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Sabuk Saat Ini</label>
                  <select
                    value={newMemberBelt}
                    onChange={e => setNewMemberBelt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    {belts.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Kata Sandi Akun (Opsional)</label>
                <input
                  type="password"
                  value={newMemberPassword}
                  onChange={e => setNewMemberPassword(e.target.value)}
                  placeholder="Default sandi: 123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition font-sans border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase rounded-xl transition font-sans shadow-xs inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Menambahkan...</span>
                    </>
                  ) : (
                    <span>Tambah Anggota</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setEditingMember(null)}>
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-sm text-slate-800 font-sans">Edit Data Anggota</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">Mengubah Profil Anggota Taekwondo</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-650 font-bold transition">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-6 space-y-4 text-xs font-semibold text-slate-650 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nama Lengkap Anggota *</label>
                <input
                  type="text"
                  value={editMemberName}
                  onChange={e => setEditMemberName(e.target.value)}
                  placeholder="Nama Lengkap Anggota..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Alamat Email (Opsional)</label>
                  <input
                    type="email"
                    value={editMemberEmail}
                    onChange={e => setEditMemberEmail(e.target.value)}
                    placeholder="Contoh: email@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Kosongkan untuk anggota lama tanpa email.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    value={editMemberPhone}
                    onChange={e => setEditMemberPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Jenis Kelamin</label>
                  <select
                    value={editMemberGender}
                    onChange={e => setEditMemberGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Laki-laki">♂️ Laki-laki</option>
                    <option value="Perempuan">♀️ Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Umur (Tahun)</label>
                  <input
                    type="number"
                    value={editMemberAge}
                    onChange={e => setEditMemberAge(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Contoh: 17"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Jenjang Pendidikan</label>
                  <select
                    value={editMemberJenjang}
                    onChange={e => setEditMemberJenjang(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Dojang / Cabang Latihan *</label>
                  <input
                    type="text"
                    value={editMemberDojang}
                    onChange={e => setEditMemberDojang(e.target.value)}
                    placeholder="Contoh: Dojang Pusat"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Status Anggota</label>
                  <select
                    value={editMemberStatus}
                    onChange={e => setEditMemberStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Sabuk Saat Ini</label>
                  <select
                    value={editMemberBelt}
                    onChange={e => setEditMemberBelt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800 cursor-pointer"
                  >
                    {belts.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Ubah Kata Sandi (Opsional)</label>
                  <input
                    type="password"
                    value={editMemberPassword}
                    onChange={e => setEditMemberPassword(e.target.value)}
                    placeholder="Biarkan kosong jika tidak diubah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition font-sans border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase rounded-xl transition font-sans shadow-xs inline-flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT LOG MODAL */}
      {showPaymentLogModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" onClick={() => setShowPaymentLogModal(false)}>
          <div className="bg-white rounded-3xl border border-slate-100 max-w-4xl w-full overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 p-6 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-sm text-slate-800 font-sans">Log Pembayaran Registrasi Anggota</h3>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 font-sans">Riwayat Transaksi Pendaftaran Anggota</p>
              </div>
              <button onClick={() => setShowPaymentLogModal(false)} className="text-slate-400 hover:text-slate-650 font-bold transition">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold text-slate-650 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
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
                                onClick={() => {
                                  setShowPaymentLogModal(false);
                                  setViewingMemberDetails(matchingUser);
                                }}
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
                                onClick={() => {
                                  setShowPaymentLogModal(false);
                                  setViewingMemberDetails(matchingUser);
                                }}
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

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 p-4">
              <button
                type="button"
                onClick={() => setShowPaymentLogModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase rounded-xl transition font-sans border border-slate-200"
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
