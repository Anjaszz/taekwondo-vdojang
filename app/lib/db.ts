import { createClient } from '@supabase/supabase-js';

// Types Definition
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'anggota';
  phone?: string;
  gender?: 'Laki-laki' | 'Perempuan';
  age?: number;
  jenjang?: 'SD' | 'SMP' | 'SMA/SMK' | 'Umum';
  dojang?: string;
  belt?: string;
  status?: 'Aktif' | 'Nonaktif';
  password?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  categoryId: string;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  price: number;
  category: string;
  status?: 'Aktif' | 'Nonaktif';
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  type: 'Pendaftaran' | 'UKT' | 'Aksesoris';
  details: string;
  amount: number;
  proofImage: string; // URL
  status: 'Pending' | 'Berhasil' | 'Ditolak';
  rejectReason?: string;
  date: string;
}

export interface SystemSettings {
  registrationFee: number;
  bankName: string;
  bankAccount: string;
  bankRecipient: string;
}

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

export const supabase = isValidUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Default empty values for build time safety
const DEFAULT_SETTINGS: SystemSettings = {
  registrationFee: 0,
  bankName: 'Belum Dikonfigurasi',
  bankAccount: '-',
  bankRecipient: '-',
};

export const db = {
  // Check connection
  async init() {
    if (!supabase) {
      console.warn('Supabase client is not initialized. Check your environment variables.');
    }
  },

  // Users CRUD
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data || []) as User[];
    } catch (err) {
      console.error('Error fetching users from Supabase:', err);
      return [];
    }
  },

  async saveUsers(users: User[]): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('users').upsert(users);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving users to Supabase:', err);
      throw err;
    }
  },

  async updateUser(updatedUser: User): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('users')
        .update(updatedUser)
        .eq('id', updatedUser.id);
      if (error) throw error;
    } catch (err) {
      console.error('Error updating user in Supabase:', err);
      throw err;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting user from Supabase:', err);
      throw err;
    }
  },

  async addUser(user: User): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('users').insert(user);
      if (error) throw error;
    } catch (err) {
      console.error('Error adding user to Supabase:', err);
      throw err;
    }
  },

  // Products CRUD
  async getProducts(): Promise<Product[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        stock: p.stock,
        description: p.description,
        categoryId: p.category_id,
        image: p.image || undefined,
      }));
    } catch (err) {
      console.error('Error fetching products from Supabase:', err);
      return [];
    }
  },

  async saveProducts(products: Product[]): Promise<void> {
    if (!supabase) return;
    try {
      const mapped = products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        description: p.description,
        category_id: p.categoryId,
        image: p.image || null,
      }));
      const { error } = await supabase.from('products').upsert(mapped);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving products to Supabase:', err);
      throw err;
    }
  },

  // Categories CRUD
  async getCategories(): Promise<Category[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return (data || []) as Category[];
    } catch (err) {
      console.error('Error fetching categories from Supabase:', err);
      return [];
    }
  },

  async saveCategories(categories: Category[]): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').upsert(categories);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving categories to Supabase:', err);
      throw err;
    }
  },

  // Events CRUD
  async getEvents(): Promise<Event[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;
      return (data || []).map((e: any) => ({
        ...e,
        price: Number(e.price),
        status: e.status || 'Aktif',
      }));
    } catch (err) {
      console.error('Error fetching events from Supabase:', err);
      return [];
    }
  },

  async saveEvents(events: Event[]): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('events').upsert(events);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving events to Supabase:', err);
      throw err;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting product from Supabase:', err);
      throw err;
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting category from Supabase:', err);
      throw err;
    }
  },

  async deleteEvent(id: string): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting event from Supabase:', err);
      throw err;
    }
  },

  // Transactions CRUD
  async getTransactions(): Promise<Transaction[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        memberId: t.member_id,
        memberName: t.member_name,
        type: t.type,
        details: t.details,
        amount: Number(t.amount),
        proofImage: t.proof_image || '',
        status: t.status,
        rejectReason: t.reject_reason || undefined,
        date: t.date,
      }));
    } catch (err) {
      console.error('Error fetching transactions from Supabase:', err);
      return [];
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    if (!supabase) return;
    try {
      const mapped = transactions.map((t) => ({
        id: t.id,
        member_id: t.memberId,
        member_name: t.memberName,
        type: t.type,
        details: t.details,
        amount: t.amount,
        proof_image: t.proofImage || null,
        status: t.status,
        reject_reason: t.rejectReason || null,
        date: t.date,
      }));
      const { error } = await supabase.from('transactions').upsert(mapped);
      if (error) throw error;
    } catch (err) {
      console.error('Error saving transactions to Supabase:', err);
      throw err;
    }
  },

  async addTransaction(tx: Transaction): Promise<void> {
    if (!supabase) return;
    try {
      const mapped = {
        id: tx.id,
        member_id: tx.memberId,
        member_name: tx.memberName,
        type: tx.type,
        details: tx.details,
        amount: tx.amount,
        proof_image: tx.proofImage || null,
        status: tx.status,
        reject_reason: tx.rejectReason || null,
        date: tx.date,
      };
      const { error } = await supabase.from('transactions').insert(mapped);
      if (error) throw error;
    } catch (err) {
      console.error('Error adding transaction to Supabase:', err);
      throw err;
    }
  },

  async updateTransactionStatus(
    txId: string,
    status: 'Berhasil' | 'Ditolak',
    rejectReason?: string
  ): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: status,
          reject_reason: rejectReason || null,
        })
        .eq('id', txId);
      
      if (error) throw error;

      // Activate member profile status on approved registration
      if (status === 'Berhasil') {
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('type, member_id')
          .eq('id', txId)
          .single();

        if (!txError && txData && txData.type === 'Pendaftaran') {
          await supabase
            .from('users')
            .update({ status: 'Aktif' })
            .eq('id', txData.member_id);
        }
      }
    } catch (err) {
      console.error('Error updating transaction status in Supabase:', err);
      throw err;
    }
  },

  // Settings CRUD
  async getSettings(): Promise<SystemSettings> {
    if (!supabase) return DEFAULT_SETTINGS;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'general_settings')
        .single();
      
      if (error) {
        console.warn('Settings key not found in Supabase. Returning default empty settings.');
        return DEFAULT_SETTINGS;
      }
      return (data?.value) as SystemSettings;
    } catch (err) {
      console.error('Error fetching settings from Supabase:', err);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: SystemSettings): Promise<void> {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'general_settings', value: settings });
      if (error) throw error;
    } catch (err) {
      console.error('Error saving settings to Supabase:', err);
      throw err;
    }
  },

  // Belts settings CRUD
  async getBelts(): Promise<string[]> {
    const DEFAULT_BELTS = [
      'Sabuk Putih',
      'Sabuk Kuning',
      'Sabuk Kuning Strip Hijau',
      'Sabuk Hijau',
      'Sabuk Hijau Strip Biru',
      'Sabuk Biru',
      'Sabuk Biru Strip Merah',
      'Sabuk Merah',
      'Sabuk Merah Strip Hitam (Geup 1)',
      'Sabuk Merah (Poom 1)',
      'Sabuk Merah (Poom 2)',
      'Sabuk Merah (Poom 3)',
      'Sabuk Hitam',
      'Dan 1',
      'Dan 2',
      'Dan 3',
      'Dan 4'
    ];
    if (!supabase) return DEFAULT_BELTS;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'belt_settings')
        .order('key')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[getBelts] Error fetching, using defaults:', error.message);
        return DEFAULT_BELTS;
      }
      if (!data) {
        console.warn('[getBelts] No belt_settings row found, using defaults.');
        return DEFAULT_BELTS;
      }
      // Handle both cases: value could be a JSON array (jsonb) or a JSON string
      const raw = data.value;
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === 'string') {
        try { return JSON.parse(raw) as string[]; } catch { return DEFAULT_BELTS; }
      }
      return DEFAULT_BELTS;
    } catch (err) {
      console.error('Error fetching belts from Supabase:', err);
      return DEFAULT_BELTS;
    }
  },

  async saveBelts(belts: string[]): Promise<void> {
    if (!supabase) {
      console.warn('[saveBelts] Supabase tidak terhubung.');
      return;
    }
    try {
      // Safe approach: delete all existing belt_settings rows, then insert fresh
      const { error: deleteError } = await supabase
        .from('settings')
        .delete()
        .eq('key', 'belt_settings');
      if (deleteError) {
        console.warn('[saveBelts] delete error (continuing):', deleteError.message);
      }
      const { error: insertError } = await supabase
        .from('settings')
        .insert({ key: 'belt_settings', value: belts });
      if (insertError) throw insertError;
      console.log('[saveBelts] Berhasil disimpan:', belts.length, 'sabuk.');
    } catch (err) {
      console.error('Error saving belts to Supabase:', err);
      throw err;
    }
  },

  // File Upload Helper to Supabase Storage
  async uploadImage(fileData: string | File): Promise<string> {
    if (!supabase) throw new Error('Supabase Storage is not initialized.');
    try {
      let fileToUpload: Blob;
      let fileName = `proof_${Date.now()}.png`;

      if (typeof fileData === 'string') {
        // Handle Base64 string data URI
        const response = await fetch(fileData);
        fileToUpload = await response.blob();
      } else {
        fileToUpload = fileData;
        const cleanName = fileData.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        fileName = `proof_${Date.now()}_${cleanName}`;
      }

      // Upload to bucket 'payment-proofs'
      const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, fileToUpload, {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) {
        console.error('Error uploading file to Supabase storage:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Failed to upload image to storage bucket:', err);
      throw err;
    }
  },
};
