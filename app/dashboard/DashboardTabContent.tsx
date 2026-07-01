"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './context';
import DashboardAdmin from '../components/DashboardAdmin';
import DashboardAnggota from '../components/DashboardAnggota';
import { db, User, Transaction, SystemSettings } from '../lib/db';
import { useToast } from '../components/ui/ToastProvider';
import { 
  LogOut, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  Phone, 
  UploadCloud, 
  FileImage, 
  CheckCircle, 
  ShieldAlert,
  Loader2,
  Copy,
  Check
} from 'lucide-react';

interface DashboardTabContentProps {
  activeTab: string;
}

// Sub-component for pending activation screen
function PendingActivation({ user, onLogout }: { user: User; onLogout: () => void }) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();
  
  const [tx, setTx] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Re-upload form state
  const [reUploadFile, setReUploadFile] = useState<File | null>(null);
  const [reUploadPreview, setReUploadPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    try {
      const [txs, setts] = await Promise.all([
        db.getTransactions(),
        db.getSettings()
      ]);
      
      const foundTx = txs.find(t => t.memberId === user.id && t.type === 'Pendaftaran');
      setTx(foundTx || null);
      setSettings(setts);
    } catch (err) {
      console.error('Gagal memuat data aktivasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleCopyAccount = () => {
    if (settings?.bankAccount) {
      navigator.clipboard.writeText(settings.bankAccount);
      setCopied(true);
      toastSuccess('Nomor rekening berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx) {
      toastError('Data transaksi pendaftaran tidak ditemukan.');
      return;
    }
    if (!reUploadFile && !reUploadPreview) {
      toastWarning('Harap unggah bukti pembayaran transfer yang baru.');
      return;
    }

    setUploading(true);
    try {
      const uploadData = reUploadFile || reUploadPreview;
      const imageUrl = await db.uploadImage(uploadData);

      // Construct updated transaction
      const updatedTx: Transaction = {
        ...tx,
        proofImage: imageUrl,
        status: 'Pending',
        rejectReason: '', // Clear the reject reason
      };

      await db.saveTransactions([updatedTx]);
      toastSuccess('Bukti pembayaran baru berhasil diunggah! Menunggu verifikasi admin.');
      
      // Clear form and reload data
      setReUploadFile(null);
      setReUploadPreview('');
      await loadData();
    } catch (err) {
      console.error(err);
      toastError('Gagal mengirim bukti pembayaran baru.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fafafc] text-slate-500 font-semibold text-sm">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue mb-2" />
        Memuat Status Aktivasi...
      </div>
    );
  }

  // Create WhatsApp template message
  const waMessage = encodeURIComponent(
    `Halo Admin V-Dojang, saya sudah mendaftar dengan nama *${user.name}* (Email: ${user.email}). Mohon bantuan untuk memverifikasi pendaftaran saya. Terima kasih.`
  );

  return (
    <div className="max-w-2xl mx-auto my-12 px-6 w-full animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#090681] to-brand-blue p-8 text-white text-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-red/20 rounded-full blur-xl -ml-16 -mb-16" />
          
          <h2 className="text-xl font-black uppercase tracking-widest text-white/50 mb-1">Status Keanggotaan</h2>
          <h1 className="text-2xl font-black">Menunggu Verifikasi Pembayaran</h1>
          <p className="text-xs text-white/70 mt-1 max-w-md mx-auto leading-relaxed">
            Akun Anda saat ini belum aktif. Silakan tunggu verifikasi admin atau unggah ulang bukti transfer yang valid.
          </p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Member Details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Nama Pendaftar</p>
              <p className="text-slate-800 text-sm font-bold mt-0.5">{user.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Tempat Latihan (Dojang)</p>
              <p className="text-slate-800 text-sm font-bold mt-0.5">{user.dojang}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Alamat Email</p>
              <p className="text-slate-800 text-sm font-bold mt-0.5 truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Jenjang / Role</p>
              <p className="text-slate-800 text-sm font-bold mt-0.5">{user.jenjang || 'Umum'} / Anggota</p>
            </div>
          </div>

          {/* Transaction Status Card */}
          {tx ? (
            <div className="space-y-6">
              {tx.status === 'Pending' && (
                <div className="flex items-start gap-4 p-5 bg-amber-50/60 border border-amber-100 rounded-2xl animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 animate-pulse">
                    <Clock size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-sm">Bukti Transfer Sedang Ditinjau</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Kami telah menerima bukti transfer pendaftaran Anda sebesar <strong className="text-brand-blue">Rp {tx.amount.toLocaleString('id-ID')}</strong>. Verifikasi biasanya membutuhkan waktu 1-24 jam.
                    </p>
                  </div>
                </div>
              )}

              {tx.status === 'Ditolak' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-brand-red">
                      <ShieldAlert size={20} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">Pembayaran Ditolak oleh Admin</h3>
                      <p className="text-xs text-brand-red font-bold mt-0.5">
                        Alasan: "{tx.rejectReason || 'Bukti transfer pendaftaran tidak sesuai atau tidak terbaca.'}"
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                        Silakan lakukan transfer ulang atau kirim bukti transfer baru yang sah pada formulir di bawah ini.
                      </p>
                    </div>
                  </div>

                  {/* Re-transfer Info */}
                  {settings && (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center space-y-3 max-w-md mx-auto">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Transfer Registrasi Baru</p>
                      <p className="text-2xl font-black text-brand-blue">
                        Rp {settings.registrationFee.toLocaleString('id-ID')}
                      </p>
                      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs">
                        <p className="font-bold text-slate-800 text-[10px] mb-1 uppercase tracking-wider">{settings.bankName}</p>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <p className="font-black text-base text-brand-red tracking-wider leading-none">{settings.bankAccount}</p>
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className="p-1 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition flex items-center justify-center border border-slate-100/50"
                          >
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold">a/n {settings.bankRecipient}</p>
                      </div>
                    </div>
                  )}

                  {/* Re-upload Form */}
                  <form onSubmit={handleReUploadSubmit} className="space-y-4 max-w-md mx-auto pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        Unggah Bukti Baru (Foto/Struk)
                      </label>
                      <div className="relative group border-2 border-dashed border-slate-200 hover:border-brand-blue/45 rounded-2xl p-6 transition-all duration-200 text-center bg-slate-50/10 hover:bg-slate-50/30 flex flex-col items-center justify-center cursor-pointer">
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
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          required
                        />
                        {reUploadPreview ? (
                          <div className="relative max-h-36 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white p-1">
                            <img src={reUploadPreview} alt="Bukti Baru" className="max-h-32 object-contain rounded-lg" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                              <UploadCloud size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-[10px] text-slate-600">Klik untuk upload bukti baru</p>
                              <p className="text-[8px] text-slate-400">PNG, JPG, JPEG (Maks. 5MB)</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-brand-blue/10 hover:shadow-lg transition duration-200 disabled:opacity-60"
                    >
                      {uploading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <CreditCard size={14} />
                          Kirim Bukti Pembayaran Baru
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-brand-red">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-sm">Bukti Pendaftaran Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Sistem tidak dapat menemukan transaksi bukti pembayaran pendaftaran Anda. Silakan hubungi admin untuk konfirmasi manual.
                </p>
              </div>
            </div>
          )}

          {/* Quick CS Action & Log Out */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <a
              href={`https://wa.me/6281234567890?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition duration-150 shadow-md shadow-emerald-500/20"
            >
              <Phone size={14} />
              Hubungi Admin (WhatsApp)
            </a>

            <button
              onClick={onLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition duration-150"
            >
              <LogOut size={14} />
              Keluar Akun
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DashboardTabContent({ activeTab }: DashboardTabContentProps) {
  const router = useRouter();
  const { currentUser, onUpdateProfile, onLogout } = useDashboard();

  if (!currentUser) return null;

  return (
    <>
      {currentUser.role === 'admin' && (
        <DashboardAdmin
          adminUser={currentUser}
          onUpdateAdminProfile={onUpdateProfile}
          onLogout={onLogout}
          activeTabProp={activeTab}
          setActiveTabProp={(newTab) => router.push('/dashboard/' + newTab)}
        />
      )}
      {currentUser.role === 'anggota' && (
        currentUser.status === 'Nonaktif' ? (
          <PendingActivation
            user={currentUser}
            onLogout={onLogout}
          />
        ) : (
          <DashboardAnggota
            user={currentUser}
            onUpdateProfile={onUpdateProfile}
            activeTabProp={activeTab}
            setActiveTabProp={(newTab) => router.push('/dashboard/' + newTab)}
            setView={(view) => {
              if (view === 'landing') router.push('/');
              else if (view === 'login') router.push('/login');
              else if (view === 'daftar') router.push('/daftar');
              else if (view === 'dashboard') router.refresh();
            }}
          />
        )
      )}
    </>
  );
}
