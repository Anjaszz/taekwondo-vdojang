import React, { useState, useEffect } from 'react';
import { db, User, Transaction } from '../lib/db';
import { useToast } from './ui/ToastProvider';
import { useConfirm } from './ui/ConfirmModal';
import {
  LayoutDashboard, CreditCard, Users, TrendingUp, Clock, CheckCircle2, Menu,
  User as UserIcon, ChevronLeft, ChevronRight,
} from 'lucide-react';

interface DashboardKasirProps {
  kasirUser: User;
  onLogout: () => void;
  activeTabProp: string;
  setActiveTabProp: (tab: string) => void;
}

type TabType = 'ringkasan' | 'pesanan';

export default function DashboardKasir({ kasirUser, onLogout, activeTabProp, setActiveTabProp }: DashboardKasirProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { confirm: confirmModal, modal: confirmModalEl } = useConfirm();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeTab = (activeTabProp || 'ringkasan') as TabType;
  const setActiveTab = setActiveTabProp;

  // Pagination states
  const [currentPagePesanan, setCurrentPagePesanan] = useState(1);

  // Loaded DB data
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal / Interaction states
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingTxProof, setViewingTxProof] = useState<Transaction | null>(null);

  // Load Data
  const loadKasirData = async () => {
    const [us, txs] = await Promise.all([
      db.getUsers(),
      db.getTransactions(),
    ]);
    setUsers(us);
    setTransactions(txs);
  };

  useEffect(() => {
    loadKasirData();
  }, []);

  // Accept Transaction Handler
  const handleAcceptTransaction = async (txId: string) => {
    const ok = await confirmModal('Setujui Pembayaran', 'Apakah Anda yakin ingin menyetujui pembayaran ini?', { confirmLabel: 'Setujui', variant: 'default' });
    if (!ok) return;
    setLoading(true);
    try {
      await db.updateTransactionStatus(txId, 'Berhasil');
      await loadKasirData();
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
      await loadKasirData();
      toastWarning('Pembayaran telah ditolak.');
    } catch (err) {
      console.error(err);
      toastError('Gagal menolak pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  // Stats Calculations
  const totalRevenue = transactions
    .filter(t => t.status === 'Berhasil')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingPaymentsCount = transactions.filter(t => t.status === 'Pending').length;
  const activeMembers = users.filter(u => u.role === 'anggota' && u.status === 'Aktif').length;

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
      default: return 'Kasir Portal';
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

  // Sidebar Item Helper
  const renderSidebarItem = (tab: TabType, label: string, icon: React.ReactNode, badgeCount?: number) => {
    const isActive = activeTab === tab;
    
    const buttonClasses = `
      w-full flex items-center transition-all duration-200 rounded-xl relative group px-3 py-2.5 text-xs font-bold uppercase tracking-wider
      ${sidebarOpen ? 'justify-start gap-3' : 'justify-center py-2.5 px-0'}
      ${isActive 
        ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
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
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
            isActive ? 'bg-white text-brand-blue' : 'bg-brand-red text-white'
          }`}>
            {badgeCount}
          </span>
        ) : null}

        {!sidebarOpen && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950 text-slate-200 text-[10px] font-bold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap border border-slate-800 pointer-events-none">
            {label}
            {badgeCount && badgeCount > 0 ? ` (${badgeCount})` : ''}
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
          sidebarOpen ? 'w-64' : 'w-16'
        } h-full bg-[#0b0f19] text-slate-400 flex flex-col shrink-0 transition-all duration-300 z-40 relative shadow-xl`}
      >
        {/* Sidebar Header Brand */}
        <div className={`h-16 flex items-center border-b border-slate-800/60 overflow-hidden shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'px-4 gap-3' : 'justify-center px-0'
        }`}>
          <img
            src="/v-dojang.jpeg"
            alt="Logo"
            className="w-8 h-8 rounded-lg object-cover shadow-md shrink-0"
          />
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
                V-DOJANG
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-brand-red truncate mt-0.5">
                Kasir Panel
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          {sidebarOpen && (
            <div className="px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase">
              Menu Utama
            </div>
          )}

          {renderSidebarItem('ringkasan', 'Ringkasan', <LayoutDashboard size={16} />)}
          {renderSidebarItem('pesanan', 'Verifikasi Transaksi', <CreditCard size={16} />, pendingPaymentsCount)}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800/40 flex items-center gap-2.5 shrink-0 overflow-hidden bg-slate-950/30">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-xs shrink-0">
            {kasirUser.name.charAt(0).toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs text-slate-200 truncate">{kasirUser.name}</span>
              <span className="text-[9px] text-slate-500 truncate">{kasirUser.email}</span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden relative">
        {/* Sticky Dashboard Header */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 select-none">
          <div className="flex items-center gap-4 min-w-0">
            {/* Sidebar toggle icon button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 rounded-lg hover:bg-slate-50 flex items-center justify-center border border-slate-200/60 active:scale-95 transition"
            >
              {sidebarOpen ? (
                <svg className="w-5 h-5 text-slate-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-650" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <h1 className="text-lg font-black text-slate-900 truncate">
              {getSectionTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="px-4 py-2 border border-slate-200 hover:border-brand-red/30 hover:text-brand-red rounded-lg text-xs font-black uppercase tracking-wider transition active:scale-95 shrink-0"
            >
              Keluar
            </button>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* TAB: Ringkasan */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-8 animate-fade-in">
                {/* Stats Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Card 1: Anggota Aktif */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Anggota Aktif</p>
                      <p className="text-2xl font-black text-brand-blue mt-1">{activeMembers} <span className="text-xs font-bold text-slate-500">Orang</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#090681] text-xl font-bold">
                      🥋
                    </div>
                  </div>

                  {/* Card 2: Pending Verifikasi */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pending Verifikasi</p>
                      <p className="text-2xl font-black text-brand-red mt-1">{pendingPaymentsCount} <span className="text-xs font-bold text-slate-500">Item</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-[#9d0f17] text-xl font-bold">
                      💳
                    </div>
                  </div>

                  {/* Card 3: Total Pendapatan */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Pendapatan</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl font-bold">
                      💰
                    </div>
                  </div>
                </div>

                {/* Quick Transaction List */}
                <div className="space-y-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aktivitas Transaksi Terbaru</h3>
                  <div className="border border-slate-200/85 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 text-slate-500 font-bold border-b border-slate-200/85">
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Nama Pembayar</th>
                          <th className="p-4">Rincian</th>
                          <th className="p-4">Nominal</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map(tx => (
                          <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition font-semibold text-slate-650">
                            <td className="p-4">{tx.date}</td>
                            <td className="p-4 font-bold text-slate-800">{tx.memberName}</td>
                            <td className="p-4">{tx.details}</td>
                            <td className="p-4 text-brand-blue font-bold">Rp {tx.amount.toLocaleString('id-ID')}</td>
                            <td className="p-4">
                              {renderStatusBadge(tx.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Verifikasi Transaksi */}
            {activeTab === 'pesanan' && (
              <div className="space-y-6 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs animate-fade-in">
                {transactions.length > 0 ? (
                  <div className="border border-slate-200/85 rounded-xl overflow-hidden bg-white shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 text-slate-500 font-bold border-b border-slate-200/85">
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Nama Anggota</th>
                          <th className="p-4">Rincian Pembayaran</th>
                          <th className="p-4">Nominal</th>
                          <th className="p-4">Struk</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice((currentPagePesanan - 1) * 10, currentPagePesanan * 10).map(tx => (
                          <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition font-semibold text-slate-650">
                            <td className="p-4">{tx.date}</td>
                            <td className="p-4 font-bold text-slate-800">{tx.memberName}</td>
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
                        ))}
                      </tbody>
                    </table>
                    {renderPagination(currentPagePesanan, transactions.length, setCurrentPagePesanan)}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold text-xs">
                    Tidak ada kiriman pembayaran saat ini.
                  </div>
                )}
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
              <button onClick={() => setRejectingTx(null)} className="text-slate-400 hover:text-slate-650 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectTransaction} className="p-6 space-y-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400">Pemesanan:</p>
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
                  {loading ? 'Memproses...' : 'Tolak Pembayaran'}
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
    </div>
  );
}
