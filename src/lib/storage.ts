import { supabase, supabaseUrl, supabaseAnonKey } from "./supabase";

// ===== In-Memory Cache =====
interface CacheEntry<T> { data: T; ts: number; }
const _cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30_000;          // 30 s for phones/accessories
const SETTINGS_TTL = 300_000;     // 5 min for settings

function cacheGet<T>(key: string, ttl = CACHE_TTL): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) { _cache.delete(key); return null; }
  return entry.data as T;
}
function cacheSet<T>(key: string, data: T) {
  _cache.set(key, { data, ts: Date.now() });
}
export function invalidateCache(...keys: string[]) {
  if (keys.length === 0) _cache.clear();
  else keys.forEach((k) => _cache.delete(k));
}

export interface Settings {
  shopName: string;
  shopNameBn: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  addressBn: string;
  website: string;
  hours: string;
  adminUsername: string;
  adminPassword: string;
}

export type PartCategory =
  | "Display" | "Battery" | "Charging Port" | "Camera" | "Speaker/Mic"
  | "Motherboard/IC" | "Button" | "Back Panel" | "Connector/Cable" | "Other";

export const PART_CATEGORIES: PartCategory[] = [
  "Display", "Battery", "Charging Port", "Camera", "Speaker/Mic",
  "Motherboard/IC", "Button", "Back Panel", "Connector/Cable", "Other",
];

export const PART_BRANDS = [
  "Samsung", "Apple", "Xiaomi", "Oppo", "Vivo", "Realme",
  "OnePlus", "Huawei", "Symphony", "Tecno", "Infinix", "Nokia", "Other",
] as const;

export interface InventoryPart {
  partId: string;
  name: string;
  category: PartCategory;
  compatibleBrand: string;
  compatibleModel: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderThreshold: number;
  supplierNote: string;
  lastRestocked: string;
}

export type MarketPartType =
  | "Display" | "Battery" | "Charging Port" | "Back Glass"
  | "Camera Module" | "Speaker" | "Motherboard" | "Other";

export const MARKET_PART_TYPES: MarketPartType[] = [
  "Display", "Battery", "Charging Port", "Back Glass",
  "Camera Module", "Speaker", "Motherboard", "Other",
];

export interface MarketPriceEntry {
  entryId: string;
  brand: string;
  model: string;
  partType: MarketPartType;
  marketLow: number;
  marketHigh: number;
  notes: string;
  lastUpdated: string;
}

const DEFAULT_SETTINGS: Settings = {
  shopName: "Faridpur Mobile Mart",
  shopNameBn: "ফরিদপুর মোবাইল মার্ট",
  phone: "+8801318630942",
  whatsapp: "8801318630942",
  email: "jadu0033@gmail.com", 
  address: "Faridpur New Market, 3rd Floor, Faridpur",
  addressBn: "ফরিদপুর নিউ মার্কেট, ৩য় তলা, ফরিদপুর",
  website: "",
  hours: "Sat – Thu 10:00 AM – 10:00 PM · Fri Closed",
  adminUsername: "admin",
  adminPassword: "repair2025",
};

const KEYS = {
  settings: "repairShopSettings",
  auth: "repairShopAuth",
  marketPrices: "repairShopMarketPrices",
} as const;

export interface ReceiptItem {
  partId: string | null;
  description: string;
  qty: number;
  costPrice: number;
  unitPrice: number;
  lineTotal: number;
  lineMargin: number;
}

export interface Receipt {
  id: string;
  receiptNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  device: string;
  jobToken: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  grandTotal: number;
  totalCost: number;
  totalMargin: number;
  notes: string;
  createdAt: string;
}

export interface ReceiptTotals {
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  totalCost: number;
  totalMargin: number;
}

export function calculateReceiptTotals(
  items: ReceiptItem[],
  discount: number,
  taxRate: number,
): ReceiptTotals {
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalCost = items.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const d = Math.max(0, Math.min(discount || 0, subtotal));
  const taxable = Math.max(0, subtotal - d);
  const tax = +(taxable * (taxRate || 0) / 100).toFixed(2);
  const grandTotal = +(taxable + tax).toFixed(2);
  const totalMargin = +(grandTotal - totalCost - tax).toFixed(2);
  return { subtotal, discount: d, tax, grandTotal, totalCost, totalMargin };
}

const isBrowser = () => typeof window !== "undefined";
const fire = (invalidate?: string[]) => {
  if (invalidate) invalidateCache(...invalidate);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("repairshop:change"));
};

// ===== Memos =====
export interface Memo {
  token: string;
  customerName: string;
  customerPhone: string;
  device: string;
  note: string;
  date: string;
  createdAt: string;
}

function normalizeMemo(m: Partial<Memo> & { token: string }): Memo {
  return {
    token: m.token,
    customerName: m.customerName ?? "",
    customerPhone: m.customerPhone ?? "",
    device: m.device ?? "",
    note: m.note ?? "",
    date: m.date ?? new Date().toISOString().slice(0, 10),
    createdAt: m.createdAt ?? new Date().toISOString(),
  };
}

// Convert snake_case from DB to camelCase for app
function toCamelCaseMemo(dbMemo: any): Memo {
  return {
    token: dbMemo.token,
    customerName: dbMemo.customer_name,
    customerPhone: dbMemo.customer_phone,
    device: dbMemo.device,
    note: dbMemo.note,
    date: dbMemo.date,
    createdAt: dbMemo.created_at,
  };
}

function toSnakeCaseMemo(m: Memo): any {
  return {
    token: m.token,
    customer_name: m.customerName,
    customer_phone: m.customerPhone,
    device: m.device,
    note: m.note,
    date: m.date,
    created_at: m.createdAt,
  };
}

export async function getMemos(): Promise<Memo[]> {
  if (!isBrowser()) return [];
  const cached = cacheGet<Memo[]>('memos');
  if (cached) return cached;
  const { data, error } = await supabase.from('memos').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching memos:", error);
    return [];
  }
  const result = data.map(toCamelCaseMemo);
  cacheSet('memos', result);
  return result;
}

export async function getMemoByToken(token: string): Promise<Memo | undefined> {
  const { data } = await supabase.from('memos').select('*').ilike('token', token).single();
  return data ? toCamelCaseMemo(data) : undefined;
}

export async function updateMemo(token: string, patch: Partial<Memo>) {
  const snakePatch: any = {};
  if (patch.customerName !== undefined) snakePatch.customer_name = patch.customerName;
  if (patch.customerPhone !== undefined) snakePatch.customer_phone = patch.customerPhone;
  if (patch.device !== undefined) snakePatch.device = patch.device;
  if (patch.note !== undefined) snakePatch.note = patch.note;
  if (patch.date !== undefined) snakePatch.date = patch.date;

  await supabase.from('memos').update(snakePatch).eq('token', token);
  fire(['memos']);
}

export async function deleteMemo(token: string) {
  await supabase.from('memos').delete().eq('token', token);
  fire(['memos']);
}

export async function addMemo(m: Memo) {
  await supabase.from('memos').insert([toSnakeCaseMemo(normalizeMemo(m))]);
  fire(['memos']);
}

export async function generateToken(): Promise<string> {
  const memos = await getMemos();
  const existing = new Set(memos.map((m) => m.token));
  let t = "";
  do { t = "MEMO-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}

// ===== Settings =====
function toCamelCaseSettings(dbSet: any): Settings {
  return {
    shopName: dbSet.shop_name,
    shopNameBn: dbSet.shop_name_bn,
    phone: dbSet.phone,
    whatsapp: dbSet.whatsapp,
    email: dbSet.email,
    address: dbSet.address,
    addressBn: dbSet.address_bn,
    website: dbSet.website,
    hours: dbSet.hours,
    adminUsername: dbSet.admin_username,
    adminPassword: dbSet.admin_password,
  };
}

function toSnakeCaseSettings(s: Settings): any {
  return {
    shop_name: s.shopName,
    shop_name_bn: s.shopNameBn,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    address: s.address,
    address_bn: s.addressBn,
    website: s.website,
    hours: s.hours,
    admin_username: s.adminUsername,
    admin_password: s.adminPassword,
  };
}

export async function getSettings(): Promise<Settings> {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  const memCached = cacheGet<Settings>('settings', SETTINGS_TTL);
  if (memCached) return memCached;
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error || !data) {
    console.error("Error fetching settings:", error);
    return getCachedSettings();
  }
  const settings = toCamelCaseSettings(data);
  // Enforce new working hours (overrides any old database values)
  settings.hours = DEFAULT_SETTINGS.hours;
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  cacheSet('settings', settings);
  return settings;
}

// Synchronous cached version for immediate UI rendering
export function getCachedSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Enforce new working hours (overrides any old cached values)
    parsed.hours = DEFAULT_SETTINGS.hours;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch { return DEFAULT_SETTINGS; }
}

export async function saveSettings(s: Settings) {
  if (!isBrowser()) return;
  await supabase.from('settings').update(toSnakeCaseSettings(s)).eq('id', 1);
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
  fire(['settings']);
}

// Ensure settings exist in DB
export async function initializeSettings() {
  const { data } = await supabase.from('settings').select('id').eq('id', 1).single();
  if (!data) {
    await supabase.from('settings').insert([{ id: 1, ...toSnakeCaseSettings(DEFAULT_SETTINGS) }]);
  }
  await getSettings();
}


// ===== Auth =====
export function isAuthed(): boolean {
  if (!isBrowser()) return false;
  return sessionStorage.getItem(KEYS.auth) === "1";
}
export function setAuthed(v: boolean) {
  if (!isBrowser()) return;
  if (v) sessionStorage.setItem(KEYS.auth, "1");
  else sessionStorage.removeItem(KEYS.auth);
}

// ===== Inventory =====
function toCamelCasePart(dbPart: any): InventoryPart {
  return {
    partId: dbPart.part_id,
    name: dbPart.name,
    category: dbPart.category,
    compatibleBrand: dbPart.compatible_brand,
    compatibleModel: dbPart.compatible_model,
    costPrice: dbPart.cost_price,
    sellingPrice: dbPart.selling_price,
    quantity: dbPart.quantity,
    reorderThreshold: dbPart.reorder_threshold,
    supplierNote: dbPart.supplier_note,
    lastRestocked: dbPart.last_restocked,
  };
}

function toSnakeCasePart(p: InventoryPart): any {
  return {
    part_id: p.partId,
    name: p.name,
    category: p.category,
    compatible_brand: p.compatibleBrand,
    compatible_model: p.compatibleModel,
    cost_price: p.costPrice,
    selling_price: p.sellingPrice,
    quantity: p.quantity,
    reorder_threshold: p.reorderThreshold,
    supplier_note: p.supplierNote,
    last_restocked: p.lastRestocked,
  };
}

export async function getInventory(): Promise<InventoryPart[]> {
  if (!isBrowser()) return [];
  const cached = cacheGet<InventoryPart[]>('inventory');
  if (cached) return cached;
  const { data, error } = await supabase.from('inventory_parts').select('*');
  if (error) return [];
  const result = data.map(toCamelCasePart);
  cacheSet('inventory', result);
  return result;
}

export async function getPartById(partId: string): Promise<InventoryPart | undefined> {
  const { data } = await supabase.from('inventory_parts').select('*').eq('part_id', partId).single();
  return data ? toCamelCasePart(data) : undefined;
}

export async function generatePartId(): Promise<string> {
  const items = await getInventory();
  const existing = new Set(items.map((p) => p.partId));
  let t = "";
  do { t = "PART-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}

export async function upsertPart(part: InventoryPart) {
  await supabase.from('inventory_parts').upsert([toSnakeCasePart(part)], { onConflict: 'part_id' });
  fire(['inventory']);
}

export async function deletePart(partId: string) {
  await supabase.from('inventory_parts').delete().eq('part_id', partId);
  fire(['inventory']);
}

export async function adjustStock(partId: string, delta: number) {
  const part = await getPartById(partId);
  if (!part) return;
  const newQuantity = Math.max(0, part.quantity + delta);
  const patch: any = { quantity: newQuantity };
  if (delta > 0) patch.last_restocked = new Date().toISOString().slice(0, 10);
  await supabase.from('inventory_parts').update(patch).eq('part_id', partId);
  fire();
}

export async function getLowStockItems(): Promise<InventoryPart[]> {
  const items = await getInventory();
  return items.filter((p) => p.quantity <= p.reorderThreshold);
}

// ===== Market Prices (Kept in localStorage as requested) =====
export function getMarketPrices(): MarketPriceEntry[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.marketPrices) || "[]"); } catch { return []; }
}
export function saveMarketPrices(entries: MarketPriceEntry[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.marketPrices, JSON.stringify(entries));
  fire();
}
export function generateMarketEntryId(): string {
  const existing = new Set(getMarketPrices().map((e) => e.entryId));
  let t = "";
  do { t = "MKT-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function upsertMarketEntry(entry: MarketPriceEntry) {
  const list = getMarketPrices();
  const i = list.findIndex((e) => e.entryId === entry.entryId);
  if (i >= 0) list[i] = entry; else list.unshift(entry);
  saveMarketPrices(list);
}
export function deleteMarketEntry(entryId: string) {
  saveMarketPrices(getMarketPrices().filter((e) => e.entryId !== entryId));
}
export function searchMarketPrices(brand?: string, model?: string, partType?: string) {
  const q = (model || "").trim().toLowerCase();
  return getMarketPrices().filter((e) => {
    if (brand && e.brand !== brand) return false;
    if (partType && e.partType !== partType) return false;
    if (q && !e.model.toLowerCase().includes(q) && !e.brand.toLowerCase().includes(q) && !e.partType.toLowerCase().includes(q)) return false;
    return true;
  });
}
export function getStalePriceEntries(daysThreshold = 30) {
  const cutoff = Date.now() - daysThreshold * 86400000;
  return getMarketPrices().filter((e) => {
    const t = Date.parse(e.lastUpdated);
    return !Number.isNaN(t) && t < cutoff;
  });
}
export function daysSince(dateStr: string) {
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

// ===== Receipts =====
function toCamelCaseReceipt(dbRec: any): Receipt {
  return {
    id: dbRec.id,
    receiptNo: dbRec.receipt_no,
    date: dbRec.date,
    customerName: dbRec.customer_name,
    customerPhone: dbRec.customer_phone,
    device: dbRec.device,
    jobToken: dbRec.job_token,
    items: dbRec.items,
    subtotal: dbRec.subtotal,
    discount: dbRec.discount,
    taxRate: dbRec.tax_rate,
    tax: dbRec.tax,
    grandTotal: dbRec.grand_total,
    totalCost: dbRec.total_cost,
    totalMargin: dbRec.total_margin,
    notes: dbRec.notes,
    createdAt: dbRec.created_at,
  };
}

function toSnakeCaseReceipt(r: Receipt): any {
  return {
    id: r.id,
    receipt_no: r.receiptNo,
    date: r.date,
    customer_name: r.customerName,
    customer_phone: r.customerPhone,
    device: r.device,
    job_token: r.jobToken,
    items: r.items,
    subtotal: r.subtotal,
    discount: r.discount,
    tax_rate: r.taxRate,
    tax: r.tax,
    grand_total: r.grandTotal,
    total_cost: r.totalCost,
    total_margin: r.totalMargin,
    notes: r.notes,
    created_at: r.createdAt,
  };
}

export async function getReceipts(): Promise<Receipt[]> {
  if (!isBrowser()) return [];
  const cached = cacheGet<Receipt[]>('receipts');
  if (cached) return cached;
  const { data, error } = await supabase.from('receipts').select('*').order('created_at', { ascending: false });
  if (error) return [];
  const result = data.map(toCamelCaseReceipt);
  cacheSet('receipts', result);
  return result;
}

export async function generateReceiptNo(): Promise<string> {
  const receipts = await getReceipts();
  const existing = new Set(receipts.map((r) => r.receiptNo));
  let t = "";
  do { t = "RCP-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}

export async function addReceipt(r: Receipt) {
  await supabase.from('receipts').insert([toSnakeCaseReceipt(r)]);
  for (const it of r.items) {
    if (it.partId) await adjustStock(it.partId, -Math.abs(it.qty));
  }
  fire(['receipts', 'inventory']);
}

export async function deleteReceipt(id: string) {
  await supabase.from('receipts').delete().eq('id', id);
  fire(['receipts']);
}


// ============= Buy/Sell: Phones & Accessories =============

export type PhoneCondition = "Excellent" | "Good" | "Fair";
export type PhoneStatus = "Draft" | "Listed" | "Reserved" | "Sold";

export interface UsedPhone {
  id: string;
  brand: string;
  model: string;
  storage: string;
  ram: string;
  batteryHealth: number;
  condition: PhoneCondition;
  purchasePrice: number;
  sellingPrice: number;
  status: PhoneStatus;
  photoUrl: string;
  notes: string;
  dateAdded: string;
  galleryUrls?: string[];
  shortDescription?: string;
  soldDate?: string;
  warrantyTerms?: string;
  color?: string;
  variant?: string;
  waterproof?: boolean;
}

export type AccessoryCategory =
  | "Power Bank" | "Charger" | "Headphones" | "Case" | "Cable" | "Screen Protector" | "Other";

export const ACCESSORY_CATEGORIES: AccessoryCategory[] = [
  "Power Bank", "Charger", "Headphones", "Case", "Cable", "Screen Protector", "Other",
];

export type AccessoryStatus = "In Stock" | "Out of Stock" | "Discontinued";

export interface Accessory {
  id: string;
  name: string;
  category: AccessoryCategory;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  photoUrl: string;
  status: AccessoryStatus;
  dateAdded: string;
}

export function isJustIn(dateAdded: string): boolean {
  const t = Date.parse(dateAdded);
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= 7 * 86400000;
}

export function recomputeAccessoryStatus(a: Accessory): Accessory {
  if (a.status === "Discontinued") return a;
  return { ...a, status: a.stockQuantity === 0 ? "Out of Stock" : "In Stock" };
}

// ---- Phones ----
function toCamelCasePhone(dbPhone: any): UsedPhone {
  let extra: any = {};
  try {
    if (typeof dbPhone.imei === 'string' && dbPhone.imei.startsWith('{')) {
      extra = JSON.parse(dbPhone.imei);
    }
  } catch (e) {}

  return {
    id: dbPhone.id,
    brand: dbPhone.brand,
    model: dbPhone.model,
    storage: dbPhone.storage,
    ram: dbPhone.ram,
    batteryHealth: dbPhone.battery_health,
    condition: dbPhone.condition,
    purchasePrice: dbPhone.purchase_price,
    sellingPrice: dbPhone.selling_price,
    status: dbPhone.status,
    photoUrl: dbPhone.photo_url,
    notes: dbPhone.notes,
    dateAdded: dbPhone.date_added,
    galleryUrls: dbPhone.gallery_urls,
    shortDescription: dbPhone.short_description,
    soldDate: dbPhone.sold_date,
    warrantyTerms: dbPhone.warranty_terms,
    color: extra.color || '',
    variant: extra.variant || '',
    waterproof: extra.waterproof,
  };
}

function toSnakeCasePhone(p: UsedPhone): any {
  return {
    id: p.id,
    brand: p.brand,
    model: p.model,
    storage: p.storage,
    ram: p.ram,
    battery_health: p.batteryHealth,
    condition: p.condition,
    purchase_price: p.purchasePrice,
    selling_price: p.sellingPrice,
    status: p.status,
    photo_url: p.photoUrl,
    notes: p.notes,
    date_added: p.dateAdded,
    gallery_urls: p.galleryUrls || [],
    short_description: p.shortDescription || '',
    sold_date: p.soldDate || null,
    warranty_terms: p.warrantyTerms || '',
    imei: JSON.stringify({ color: p.color || '', variant: p.variant || '', waterproof: p.waterproof }),
  };
}

export async function getPhones(): Promise<UsedPhone[]> {
  if (!isBrowser()) return [];
  const cached = cacheGet<UsedPhone[]>('phones');
  if (cached) return cached;
  const { data, error } = await supabase.from('phones').select('*').order('date_added', { ascending: false });
  if (error) return [];
  const result = data.map(toCamelCasePhone);
  cacheSet('phones', result);
  return result;
}

export async function getPhoneById(id: string): Promise<UsedPhone | undefined> {
  const { data } = await supabase.from('phones').select('*').eq('id', id).single();
  return data ? toCamelCasePhone(data) : undefined;
}

// Optimised: filters at DB level, uses a dedicated cache key
export async function getAvailablePhones(): Promise<UsedPhone[]> {
  if (!isBrowser()) return [];
  const cached = cacheGet<UsedPhone[]>('phones_listed');
  if (cached) return cached;
  const { data, error } = await supabase
    .from('phones')
    .select('*')
    .eq('status', 'Listed')
    .order('date_added', { ascending: false });
  if (error) return [];
  const result = data.map(toCamelCasePhone);
  cacheSet('phones_listed', result);
  return result;
}

export async function generatePhoneId(): Promise<string> {
  const phones = await getPhones();
  const existing = new Set(phones.map((p) => p.id));
  let t = "";
  do { t = "PHN-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}

export async function upsertPhone(p: UsedPhone) {
  const { error } = await supabase.from('phones').upsert([toSnakeCasePhone(p)], { onConflict: 'id' });
  if (error) console.error("Error saving phone:", error);
  fire(['phones', 'phones_listed']);
}

export async function deletePhone(id: string) {
  await supabase.from('phones').delete().eq('id', id);
  fire(['phones', 'phones_listed']);
}

export function filterPhones(
  phones: UsedPhone[],
  f: { brand?: string; condition?: string; minPrice?: number; maxPrice?: number },
) {
  return phones.filter((p) => {
    if (f.brand && p.brand !== f.brand) return false;
    if (f.condition && p.condition !== f.condition) return false;
    if (f.minPrice != null && p.sellingPrice < f.minPrice) return false;
    if (f.maxPrice != null && p.sellingPrice > f.maxPrice) return false;
    return true;
  });
}

// ---- Accessories ----
function toCamelCaseAccessory(dbAcc: any): Accessory {
  return {
    id: dbAcc.id,
    name: dbAcc.name,
    category: dbAcc.category,
    brand: dbAcc.brand,
    purchasePrice: dbAcc.purchase_price,
    sellingPrice: dbAcc.selling_price,
    stockQuantity: dbAcc.stock_quantity,
    photoUrl: dbAcc.photo_url,
    status: dbAcc.status,
    dateAdded: dbAcc.date_added,
  };
}

function toSnakeCaseAccessory(a: Accessory): any {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    brand: a.brand,
    purchase_price: a.purchasePrice,
    selling_price: a.sellingPrice,
    stock_quantity: a.stockQuantity,
    photo_url: a.photoUrl,
    status: a.status,
    date_added: a.dateAdded,
  };
}


export async function getAccessories(): Promise<Accessory[]> {
  if (!isBrowser()) return [];
  const cached = cacheGet<Accessory[]>('accessories');
  if (cached) return cached;
  const { data, error } = await supabase.from('accessories').select('*').order('date_added', { ascending: false });
  if (error) return [];
  const result = data.map(toCamelCaseAccessory).map(recomputeAccessoryStatus);
  cacheSet('accessories', result);
  return result;
}

export async function getAccessoryById(id: string): Promise<Accessory | undefined> {
  const { data } = await supabase.from('accessories').select('*').eq('id', id).single();
  return data ? recomputeAccessoryStatus(toCamelCaseAccessory(data)) : undefined;
}

export async function generateAccessoryId(): Promise<string> {
  const accs = await getAccessories();
  const existing = new Set(accs.map((a) => a.id));
  let t = "";
  do { t = "ACC-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}

export async function upsertAccessory(a: Accessory) {
  await supabase.from('accessories').upsert([toSnakeCaseAccessory(recomputeAccessoryStatus(a))], { onConflict: 'id' });
  fire(['accessories']);
}

export async function deleteAccessory(id: string) {
  await supabase.from('accessories').delete().eq('id', id);
  fire(['accessories']);
}

export function filterAccessories(items: Accessory[], f: { category?: string }) {
  return items.filter((a) => {
    if (f.category && a.category !== f.category) return false;
    return true;
  });
}

// ---- Just In feed (mixed) ----
export type JustInItem =
  | { type: "phone"; item: UsedPhone }
  | { type: "accessory"; item: Accessory };

export async function getJustInItems(limit = 6): Promise<JustInItem[]> {
  // Parallel fetch — both requests fire simultaneously
  const [availablePhones, accessories] = await Promise.all([
    getAvailablePhones(),
    getAccessories(),
  ]);
  const phones: JustInItem[] = availablePhones.map((item) => ({ type: "phone" as const, item }));
  const acc: JustInItem[] = accessories.map((item) => ({ type: "accessory" as const, item }));
  return [...phones, ...acc]
    .sort((a, b) => Date.parse(b.item.dateAdded) - Date.parse(a.item.dateAdded))
    .slice(0, limit);
}

// Seed Demo Data Function
export async function seedDemoData() {
  if (!isBrowser()) return;
  await initializeSettings();
}

// --- Supabase Storage Helpers ---
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

export async function deleteImageFromSupabase(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(supabaseUrl)) return;
  try {
    const fileName = publicUrl.split('/').pop();
    if (!fileName) return;
    await supabase.storage.from('images').remove([fileName]);
  } catch (error) {
    console.error("Error deleting image from Supabase:", error);
  }
}

export function uploadImageToSupabase(
  base64: string,
  onProgress?: (pct: number) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's already a public URL (e.g. they cropped a previously uploaded image), just return it
    if (base64.startsWith('http')) return resolve(base64);

    try {
      const blob = dataURLtoBlob(base64);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const url = `${supabaseUrl}/storage/v1/object/images/${fileName}`;

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Content-Type', 'image/webp');
      // For Supabase to know it's not upserting
      xhr.setRequestHeader('x-upsert', 'false');

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => xhr.abort());
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
          resolve(publicUrlData.publicUrl);
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || err.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.onabort = () => reject(new Error("Upload cancelled"));

      xhr.send(blob);
    } catch (error) {
      console.error("Error setting up upload:", error);
      reject(error);
    }
  });
}
