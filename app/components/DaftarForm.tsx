import React, { useState, useEffect } from 'react';
import { db, SystemSettings, User, Transaction } from '../lib/db';
import { useToast } from './ui/ToastProvider';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  Shield, 
  ArrowRight, 
  UploadCloud, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  FileImage,
  Award,
  Copy,
  Check
} from 'lucide-react';

interface DaftarFormProps {
  onSuccess: (user: User) => void;
  onBackToLanding: () => void;
}

export default function DaftarForm({
  onSuccess,
  onBackToLanding,
}: DaftarFormProps) {
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast();
  
  // State
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Form, 2 = Payment
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [belts, setBelts] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [jenjang, setJenjang] = useState<'TK' | 'SD' | 'SMP' | 'SMA/SMK' | 'Kuliah'>('SD');
  const [dojang, setDojang] = useState('');
  const [belt, setBelt] = useState('Sabuk Putih');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [age, setAge] = useState<number | ''>('');
  const [showPassword, setShowPassword] = useState(false);

  // Payment Proof File State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  // Load Settings & Belts
  useEffect(() => {
    async function loadSettingsAndBelts() {
      try {
        const [s, b] = await Promise.all([
          db.getSettings(),
          db.getBelts(),
        ]);
        setSettings(s);
        setBelts(b);
        if (b && b.length > 0) {
          setBelt(b[0]);
        }
      } catch (err) {
        console.error(err);
        toastError('Gagal memuat pengaturan sistem.');
      }
    }
    loadSettingsAndBelts();
  }, []);

  const handleStepOneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !email || !phone || !password || !dojang || !age) {
      const msg = 'Semua data formulir wajib diisi.';
      setErrorMessage(msg);
      toastWarning(msg);
      return;
    }

    setLoading(true);
    try {
      const users = await db.getUsers();
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        const msg = 'Email sudah terdaftar. Silakan gunakan email lain.';
        setErrorMessage(msg);
        toastError(msg);
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: 'user-' + Date.now(),
        email: email,
        name: name,
        role: 'anggota',
        phone: phone,
        gender: gender,
        age: Number(age),
        jenjang: (jenjang === 'TK' || jenjang === 'Kuliah') ? 'Umum' : jenjang,
        dojang: dojang,
        belt: belt,
        status: 'Nonaktif',
        password: password,
      };

      setRegisteredUser(newUser);
      setStep(2);
      toastSuccess('Data diri berhasil disimpan. Silakan lanjutkan pembayaran.');
    } catch (err) {
      console.error(err);
      const msg = 'Terjadi kesalahan saat memproses data.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toastInfo('File bukti pembayaran berhasil dipilih.');
    }
  };

  const handleStepTwoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!proofFile && !proofPreview) {
      const msg = 'Harap unggah bukti pembayaran transfer Anda.';
      setErrorMessage(msg);
      toastWarning(msg);
      return;
    }

    if (!registeredUser || !settings) {
      const msg = 'Data pendaftaran tidak valid.';
      setErrorMessage(msg);
      toastError(msg);
      return;
    }

    setLoading(true);
    try {
      const uploadData = proofFile || proofPreview;
      const imageUrl = await db.uploadImage(uploadData);

      await db.addUser(registeredUser);

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        memberId: registeredUser.id,
        memberName: registeredUser.name,
        type: 'Pendaftaran',
        details: 'Pendaftaran Anggota Baru',
        amount: settings.registrationFee,
        proofImage: imageUrl,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
      };

      await db.addTransaction(newTx);
      toastSuccess('Pendaftaran berhasil! Akun Anda sedang diverifikasi admin.');
      onSuccess(registeredUser);
    } catch (err) {
      console.error(err);
      const msg = 'Gagal menyimpan bukti pembayaran. Hubungi admin.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAccount = () => {
    if (settings?.bankAccount) {
      navigator.clipboard.writeText(settings.bankAccount);
      setCopied(true);
      toastSuccess('Nomor rekening berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-8 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden animate-fade-in font-sans">
      {/* Form Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#090681] to-brand-blue p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-red/20 rounded-full blur-2xl -ml-20 -mb-20" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
              <Award size={11} className="text-brand-red" />
              Pendaftaran Anggota Baru
            </div>
            <h2 className="text-2xl font-black tracking-tight">V-Dojang Taekwondo</h2>
            <p className="text-white/60 text-xs mt-1 font-semibold">
              Mulai perjalanan bela diri Anda bersama instruktur profesional terbaik.
            </p>
          </div>
          
          <button
            onClick={onBackToLanding}
            className="self-start md:self-auto flex items-center gap-2 text-xs text-white/80 hover:text-white font-bold bg-white/10 hover:bg-white/20 border border-white/25 px-4 py-2 rounded-xl transition duration-150"
          >
            <ArrowLeft size={14} />
            Kembali ke Beranda
          </button>
        </div>
        
        {/* Progress Tracker */}
        <div className="relative mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition duration-300 ${
              step === 1 
                ? 'bg-brand-red text-white ring-4 ring-brand-red/30' 
                : 'bg-emerald-500 text-white'
            }`}>
              {step === 1 ? '1' : <CheckCircle size={14} />}
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-none">Langkah 1</p>
              <p className="text-xs font-bold text-white mt-1">Formulir Data Diri</p>
            </div>
          </div>
          
          <div className="flex-1 h-0.5 mx-4 bg-white/20 relative">
            <div className={`absolute top-0 left-0 h-full bg-emerald-400 transition-all duration-300 ${step === 2 ? 'w-full' : 'w-0'}`} />
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition duration-300 ${
              step === 2 
                ? 'bg-brand-red text-white ring-4 ring-brand-red/30' 
                : 'bg-white/10 text-white/50 border border-white/20'
            }`}>
              2
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-none">Langkah 2</p>
              <p className={`text-xs font-bold mt-1 ${step === 2 ? 'text-white' : 'text-white/40'}`}>Pembayaran Registrasi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-10">
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 text-brand-red rounded-2xl animate-fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: Form */}
        {step === 1 && (
          <form onSubmit={handleStepOneSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Lengkap */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap sesuai identitas"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Alamat Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@alamat.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white"
                    required
                  />
                </div>
              </div>

              {/* Nomor HP */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Nomor HP (WhatsApp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white"
                    required
                  />
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Jenis Kelamin
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'Laki-laki', label: '♂️ Laki-laki' },
                    { value: 'Perempuan', label: '♀️ Perempuan' }
                  ].map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value as any)}
                      className={`py-3 text-center rounded-xl text-xs font-bold border transition duration-150 ${
                        gender === g.value 
                          ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-black' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-500'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Umur */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Umur (Tahun)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Masukkan umur Anda"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white"
                    required
                  />
                </div>
              </div>

              {/* Jenjang */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  Jenjang Pendidikan
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(['TK', 'SD', 'SMP', 'SMA/SMK', 'Kuliah'] as const).map(j => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setJenjang(j)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition duration-150 ${
                        jenjang === j 
                          ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-black' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-500'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama Tempat Latihan (Dojang) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Nama Tempat Latihan (Dojang)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    value={dojang}
                    onChange={e => setDojang(e.target.value)}
                    placeholder="Contoh: Dojang Waterfall Cikunir"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white"
                    required
                  />
                </div>
              </div>

              {/* Sabuk Terakhir */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Sabuk Terakhir
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                    <Award size={16} />
                  </span>
                  <select
                    value={belt}
                    onChange={e => setBelt(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white appearance-none cursor-pointer text-slate-850"
                  >
                    {belts.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* Sandi Baru */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  Kata Sandi Akun Baru
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Buat sandi minimal 6 karakter untuk login"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 transition bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-black uppercase tracking-wider rounded-xl transition duration-200 shadow-md shadow-brand-blue/20 hover:shadow-lg hover:shadow-brand-blue/30 mt-4 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <>
                  Lanjut Ke Pembayaran
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Checkout */}
        {step === 2 && settings && (
          <form onSubmit={handleStepTwoSubmit} className="space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Biaya Registrasi</p>
                <p className="text-3xl font-black text-brand-blue mt-1">
                  Rp {settings.registrationFee.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="border-t border-slate-200/50 pt-4 text-xs font-semibold text-slate-500 space-y-1.5 max-w-sm mx-auto">
                <p className="text-slate-400">Transfer manual ke rekening resmi:</p>
                <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs">
                  <p className="font-bold text-slate-800 text-[10px] mb-1 uppercase tracking-wider">{settings.bankName}</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <p className="font-black text-lg text-brand-red tracking-wider leading-none">{settings.bankAccount}</p>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="p-1 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition flex items-center justify-center border border-slate-100/50"
                      title="Salin Nomor Rekening"
                    >
                      {copied ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">a/n {settings.bankRecipient}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Unggah Bukti Pembayaran (Foto/Struk)
              </label>
              
              <div className="relative group border-2 border-dashed border-slate-200 hover:border-brand-blue/40 rounded-2xl p-8 transition-all duration-200 text-center bg-slate-50/10 hover:bg-slate-50/30 flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required={!proofPreview}
                />
                
                {proofPreview ? (
                  <div className="w-full flex flex-col items-center gap-3 relative z-20">
                    <div className="relative max-h-48 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white p-1">
                      <img src={proofPreview} alt="Bukti Transfer" className="max-h-44 object-contain rounded-lg" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 bg-brand-blue/5 border border-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-xs font-bold">
                      <FileImage size={12} />
                      Ubah file bukti pembayaran
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 group-hover:scale-105 group-hover:bg-brand-blue/5 group-hover:text-brand-blue transition duration-200">
                      <UploadCloud size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-slate-600">Pilih file atau seret ke sini</p>
                      <p className="text-[10px] text-slate-400 font-medium">JPEG, JPG, atau PNG (Maks. 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-black uppercase tracking-wider rounded-xl transition duration-150"
              >
                Ubah Data
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex items-center justify-center gap-2 py-3.5 bg-brand-red hover:bg-[#c01423] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-brand-red/10 hover:shadow-lg hover:shadow-brand-red/20 transition duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </span>
                ) : (
                  <>
                    <CreditCard size={14} />
                    Kirim Bukti Pembayaran
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
