-- DDL Schema & Seed Data for Taekwondo V-Dojang Club Management System

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2. Create Users / Members Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'kasir', 'anggota')),
  phone TEXT,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  age INTEGER,
  jenjang TEXT CHECK (jenjang IN ('SD', 'SMP', 'SMA/SMK', 'Umum')),
  dojang TEXT,
  belt TEXT,
  status TEXT DEFAULT 'Nonaktif' CHECK (status IN ('Aktif', 'Nonaktif')),
  password TEXT NOT NULL
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Create Products Table (Accessories)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  image TEXT
);
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 4. Create Events Table (Turnamen & UKT)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif'))
);
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 5. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  member_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Pendaftaran', 'UKT', 'Aksesoris')),
  details TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  proof_image TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Berhasil', 'Ditolak')),
  reject_reason TEXT,
  date TEXT NOT NULL
);
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 6. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SEED DATA INSERTIONS
-- =========================================================================

-- Clear existing data (optional, but ensures clean slate)
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE settings CASCADE;

-- Seed Categories
INSERT INTO categories (id, name) VALUES
('cat-1', 'Seragam (Dobok)'),
('cat-2', 'Pelindung Tubuh'),
('cat-3', 'Peralatan Latihan');

-- Seed Users (Admin, Kasir, and default Anggota)
-- Credentials:
-- Admin: admin@vdojang.com / admin
-- Kasir: kasir@vdojang.com / kasir
-- Anggota: anggota@vdojang.com / anggota
-- Budi (Anggota): budi@vdojang.com / budi
-- Ahmad (Anggota): ahmad@vdojang.com / ahmad
INSERT INTO users (id, email, name, role, phone, gender, age, jenjang, dojang, belt, status, password) VALUES
('user-admin', 'admin@vdojang.com', 'Budi Santoso (Admin)', 'admin', '08111222333', NULL, NULL, NULL, NULL, NULL, 'Aktif', 'admin'),
('user-kasir', 'kasir@vdojang.com', 'Siti Rahma (Kasir)', 'kasir', '08122233344', NULL, NULL, NULL, NULL, NULL, 'Aktif', 'kasir'),
('user-member1', 'anggota@vdojang.com', 'Reza Artamevia', 'anggota', '081234567890', 'Perempuan', 17, 'SMA/SMK', 'Dojang Merdeka Jakarta', 'Sabuk Hijau', 'Aktif', 'anggota'),
('user-member2', 'budi@vdojang.com', 'Budi Pratama', 'anggota', '085799988812', 'Laki-laki', 12, 'SD', 'Dojang Garuda Depok', 'Sabuk Kuning', 'Aktif', 'budi'),
('user-member3', 'ahmad@vdojang.com', 'Ahmad Fauzi', 'anggota', '089677766622', 'Laki-laki', 20, 'Umum', 'Dojang Merdeka Jakarta', 'Sabuk Putih', 'Nonaktif', 'ahmad');

-- Seed Products
INSERT INTO products (id, name, price, stock, description, category_id, image) VALUES
('prod-1', 'Dobok Poomsae Premium', 350000, 25, 'Seragam Taekwondo khusus poomsae dengan bahan katun berkualitas tinggi, nyaman untuk gerakan dinamis.', 'cat-1', NULL),
('prod-2', 'Dobok Kyorugi Fighter', 400000, 15, 'Seragam kyorugi dengan sirkulasi udara optimal dan daya tahan tinggi untuk latihan sparring.', 'cat-1', NULL),
('prod-3', 'Body Protector Reversible (Red/Blue)', 275000, 12, 'Pelindung dada bolak-balik warna merah dan biru, tebal dan meredam benturan dengan sangat baik.', 'cat-2', NULL),
('prod-4', 'Shin & Forearm Guard Set', 180000, 30, 'Deker pelindung tulang kering kaki dan lengan tangan, dengan velcro strap yang kokoh.', 'cat-2', NULL),
('prod-5', 'Head Guard (Biru)', 220000, 8, 'Pelindung kepala warna biru, terbuat dari busa padat anti benturan dan bersertifikat.', 'cat-2', NULL),
('prod-6', 'Target Double Kick Pad', 95000, 50, 'Target tendangan ganda suara nyaring, sangat cocok untuk melatih kecepatan tendangan.', 'cat-3', NULL);

-- Seed Events
INSERT INTO events (id, name, date, location, price, category) VALUES
('evt-1', 'Ujian Kenaikan Tingkat (UKT) Periode I 2026', '2026-06-15', 'GOR V-Dojang Hall A', 150000, 'Semua Tingkatan'),
('evt-2', 'V-Dojang Open Championship 2026', '2026-08-20', 'Sport Center Arena', 250000, 'SD, SMP, SMA/Umum'),
('evt-3', 'Spesial Training & Seminar Poomsae Internasional', '2026-09-05', 'Hotel Santika Ballroom', 300000, 'Sabuk Hijau Keatas');

-- Seed Settings
INSERT INTO settings (key, value) VALUES
('general_settings', '{"bankName": "Bank Central Asia (BCA)", "bankAccount": "8291038472", "bankRecipient": "Taekwondo V-Dojang Indonesia", "registrationFee": 200000}'::jsonb);

-- Seed Transactions (Recent Activity)
INSERT INTO transactions (id, member_id, member_name, type, details, amount, proof_image, status, reject_reason, date) VALUES
('tx-1', 'user-member1', 'Reza Artamevia', 'Pendaftaran', 'Pendaftaran Anggota Baru', 200000, NULL, 'Berhasil', NULL, '2026-05-10'),
('tx-2', 'user-member2', 'Budi Pratama', 'Pendaftaran', 'Pendaftaran Anggota Baru', 200000, NULL, 'Berhasil', NULL, '2026-05-12'),
('tx-3', 'user-member1', 'Reza Artamevia', 'Aksesoris', 'Pembelian Dobok Poomsae Premium (x1)', 350000, NULL, 'Berhasil', NULL, '2026-05-14'),
('tx-4', 'user-member2', 'Budi Pratama', 'UKT', 'Ujian Kenaikan Tingkat (UKT) Periode I 2026', 150000, NULL, 'Pending', NULL, '2026-05-23'),
('tx-5', 'user-member3', 'Ahmad Fauzi', 'Pendaftaran', 'Pendaftaran Anggota Baru', 200000, NULL, 'Ditolak', 'Bukti transfer tidak terbaca/salah nominal. Mohon upload ulang.', '2026-05-20');
