-- ============================================================
-- Faridpur Mobile Mart — Supabase Schema
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- ── Phones ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phones (
  id               TEXT PRIMARY KEY,
  brand            TEXT NOT NULL DEFAULT '',
  model            TEXT NOT NULL DEFAULT '',
  storage          TEXT NOT NULL DEFAULT '',
  ram              TEXT NOT NULL DEFAULT '',
  battery_health   INTEGER NOT NULL DEFAULT 100,
  condition        TEXT NOT NULL DEFAULT 'Good',
  purchase_price   NUMERIC NOT NULL DEFAULT 0,
  selling_price    NUMERIC NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'Draft',
  photo_url        TEXT NOT NULL DEFAULT '',
  notes            TEXT NOT NULL DEFAULT '',
  date_added       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gallery_urls     JSONB NOT NULL DEFAULT '[]',
  short_description TEXT NOT NULL DEFAULT '',
  imei             TEXT NOT NULL DEFAULT '',
  sold_date        TIMESTAMPTZ,
  warranty_terms   TEXT NOT NULL DEFAULT ''
);

-- ── Accessories ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accessories (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL DEFAULT 'Other',
  brand            TEXT NOT NULL DEFAULT '',
  purchase_price   NUMERIC NOT NULL DEFAULT 0,
  selling_price    NUMERIC NOT NULL DEFAULT 0,
  stock_quantity   INTEGER NOT NULL DEFAULT 0,
  photo_url        TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'In Stock',
  date_added       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Memos ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS memos (
  token            TEXT PRIMARY KEY,
  customer_name    TEXT NOT NULL DEFAULT '',
  customer_phone   TEXT NOT NULL DEFAULT '',
  device           TEXT NOT NULL DEFAULT '',
  note             TEXT NOT NULL DEFAULT '',
  date             TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Receipts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id               TEXT PRIMARY KEY,
  receipt_no       TEXT NOT NULL DEFAULT '',
  date             TEXT NOT NULL DEFAULT '',
  customer_name    TEXT NOT NULL DEFAULT '',
  customer_phone   TEXT NOT NULL DEFAULT '',
  device           TEXT NOT NULL DEFAULT '',
  job_token        TEXT NOT NULL DEFAULT '',
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal         NUMERIC NOT NULL DEFAULT 0,
  discount         NUMERIC NOT NULL DEFAULT 0,
  tax_rate         NUMERIC NOT NULL DEFAULT 0,
  tax              NUMERIC NOT NULL DEFAULT 0,
  grand_total      NUMERIC NOT NULL DEFAULT 0,
  total_cost       NUMERIC NOT NULL DEFAULT 0,
  total_margin     NUMERIC NOT NULL DEFAULT 0,
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Inventory Parts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_parts (
  part_id          TEXT PRIMARY KEY,
  name             TEXT NOT NULL DEFAULT '',
  category         TEXT NOT NULL DEFAULT 'Other',
  compatible_brand TEXT NOT NULL DEFAULT '',
  compatible_model TEXT NOT NULL DEFAULT '',
  cost_price       NUMERIC NOT NULL DEFAULT 0,
  selling_price    NUMERIC NOT NULL DEFAULT 0,
  quantity         INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER NOT NULL DEFAULT 2,
  supplier_note    TEXT NOT NULL DEFAULT '',
  last_restocked   TEXT NOT NULL DEFAULT ''
);

-- ── Settings (single row, id always = 1) ─────────────────
CREATE TABLE IF NOT EXISTS settings (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  shop_name        TEXT NOT NULL DEFAULT 'Faridpur Mobile Mart',
  shop_name_bn     TEXT NOT NULL DEFAULT 'ফরিদপুর মোবাইল মার্ট',
  phone            TEXT NOT NULL DEFAULT '+8801318630942',
  whatsapp         TEXT NOT NULL DEFAULT '8801318630942',
  email            TEXT NOT NULL DEFAULT 'jadu0033@gmail.com',
  address          TEXT NOT NULL DEFAULT 'Faridpur New Market, 3rd Floor, Faridpur',
  address_bn       TEXT NOT NULL DEFAULT 'ফরিদপুর নিউ মার্কেট, ৩য় তলা, ফরিদপুর',
  website          TEXT NOT NULL DEFAULT '',
  hours            TEXT NOT NULL DEFAULT 'Sat–Thu 10:00–21:00 · Fri Closed',
  admin_username   TEXT NOT NULL DEFAULT 'admin',
  admin_password   TEXT NOT NULL DEFAULT 'repair2025'
);

-- Seed default settings row if not exists
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── Disable RLS (single-shop app, auth handled in-app) ───
ALTER TABLE phones           DISABLE ROW LEVEL SECURITY;
ALTER TABLE accessories      DISABLE ROW LEVEL SECURITY;
ALTER TABLE memos            DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_parts  DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings         DISABLE ROW LEVEL SECURITY;
