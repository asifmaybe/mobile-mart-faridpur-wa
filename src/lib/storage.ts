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
  phone: "+8801922650505",
  whatsapp: "8801750000036",
  email: "makelectronics35@gmail.com",
  address: "1st & 2nd Shop (Ground Floor), Kacchi Bhai Building, Janata Bank Mor, Faridpur Sadar, Faridpur",
  addressBn: "১ম ও ২য় শপ (নিচতলা), কাচ্চি ভাই বিল্ডিং, জনতা ব্যাংকের মোড়, ফরিদপুর সদর, ফরিদপুর",
  website: "",
  hours: "Sat–Thu 10:00–21:00 · Fri Closed",
  adminUsername: "admin",
  adminPassword: "repair2025",
};

const KEYS = {
  memos: "repairShopMemos",
  settings: "repairShopSettings",
  auth: "repairShopAuth",
  inventory: "repairShopInventory",
  marketPrices: "repairShopMarketPrices",
  receipts: "repairShopReceipts",
  phones: "mac_phones",
  accessories: "mac_accessories",
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
const fire = () => window.dispatchEvent(new Event("repairshop:change"));

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

export function getMemos(): Memo[] {
  if (!isBrowser()) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.memos) || "[]");
    return Array.isArray(raw) ? raw.map(normalizeMemo) : [];
  } catch { return []; }
}
export function saveMemos(memos: Memo[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.memos, JSON.stringify(memos));
  fire();
}
export function getMemoByToken(token: string) {
  return getMemos().find((m) => m.token.toLowerCase() === token.toLowerCase());
}
export function updateMemo(token: string, patch: Partial<Memo>) {
  const memos = getMemos().map((m) => (m.token === token ? { ...m, ...patch } : m));
  saveMemos(memos);
}
export function deleteMemo(token: string) {
  saveMemos(getMemos().filter((m) => m.token !== token));
}
export function addMemo(m: Memo) {
  saveMemos([normalizeMemo(m), ...getMemos()]);
}
export function generateToken(): string {
  const existing = new Set(getMemos().map((m) => m.token));
  let t = "";
  do { t = "MEMO-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}

// ===== Settings =====
export function getSettings(): Settings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(s: Settings) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.settings, JSON.stringify(s));
  fire();
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

// ===== Inventory (Parts for Market Prices if needed, though they don't do repairs, we can keep the base part logic just in case it's used for accessories) =====
export function getInventory(): InventoryPart[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.inventory) || "[]"); } catch { return []; }
}
export function saveInventory(items: InventoryPart[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.inventory, JSON.stringify(items));
  fire();
}
export function getPartById(partId: string) {
  return getInventory().find((p) => p.partId === partId);
}
export function generatePartId(): string {
  const existing = new Set(getInventory().map((p) => p.partId));
  let t = "";
  do { t = "PART-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function upsertPart(part: InventoryPart) {
  const items = getInventory();
  const i = items.findIndex((p) => p.partId === part.partId);
  if (i >= 0) items[i] = part; else items.unshift(part);
  saveInventory(items);
}
export function deletePart(partId: string) {
  saveInventory(getInventory().filter((p) => p.partId !== partId));
}
export function adjustStock(partId: string, delta: number) {
  const items = getInventory();
  const i = items.findIndex((p) => p.partId === partId);
  if (i < 0) return;
  items[i] = { ...items[i], quantity: Math.max(0, items[i].quantity + delta) };
  if (delta > 0) items[i].lastRestocked = new Date().toISOString().slice(0, 10);
  saveInventory(items);
}
export function getLowStockItems() {
  return getInventory().filter((p) => p.quantity <= p.reorderThreshold);
}

// ===== Market Prices =====
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
export function getReceipts(): Receipt[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.receipts) || "[]"); } catch { return []; }
}
export function saveReceipts(items: Receipt[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.receipts, JSON.stringify(items));
  fire();
}
export function generateReceiptNo(): string {
  const existing = new Set(getReceipts().map((r) => r.receiptNo));
  let t = "";
  do { t = "RCP-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function addReceipt(r: Receipt) {
  saveReceipts([r, ...getReceipts()]);
  for (const it of r.items) {
    if (it.partId) adjustStock(it.partId, -Math.abs(it.qty));
  }
}
export function deleteReceipt(id: string) {
  saveReceipts(getReceipts().filter((r) => r.id !== id));
}

export function seedDemoData() {
  if (!isBrowser()) return;
  const today = new Date();
  seedBuySellData();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const minus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };

  // --- Market Prices ---
  if (getMarketPrices().length === 0) {
    const mkt: MarketPriceEntry[] = [
      { entryId: "MKT-0201", brand: "Samsung", model: "Galaxy A54", partType: "Display", marketLow: 1800, marketHigh: 2400, notes: "OEM ~2200, copy ~1800", lastUpdated: minus(5) },
    ];
    saveMarketPrices(mkt);
  }
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
  imei?: string;
  soldDate?: string;
  warrantyTerms?: string;
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
export function getPhones(): UsedPhone[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.phones) || "[]"); } catch { return []; }
}
export function savePhones(items: UsedPhone[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.phones, JSON.stringify(items));
  fire();
}
export function getPhoneById(id: string) {
  return getPhones().find((p) => p.id === id);
}
export function getAvailablePhones() {
  return getPhones().filter((p) => p.status === "Listed");
}
export function generatePhoneId(): string {
  const existing = new Set(getPhones().map((p) => p.id));
  let t = "";
  do { t = "PHN-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function upsertPhone(p: UsedPhone) {
  const list = getPhones();
  const i = list.findIndex((x) => x.id === p.id);
  if (i >= 0) list[i] = p; else list.unshift(p);
  savePhones(list);
}
export function deletePhone(id: string) {
  savePhones(getPhones().filter((p) => p.id !== id));
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
export function getAccessories(): Accessory[] {
  if (!isBrowser()) return [];
  try {
    const raw: Accessory[] = JSON.parse(localStorage.getItem(KEYS.accessories) || "[]");
    return raw.map(recomputeAccessoryStatus);
  } catch { return []; }
}
export function saveAccessories(items: Accessory[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.accessories, JSON.stringify(items.map(recomputeAccessoryStatus)));
  fire();
}
export function getAccessoryById(id: string) {
  return getAccessories().find((a) => a.id === id);
}
export function generateAccessoryId(): string {
  const existing = new Set(getAccessories().map((a) => a.id));
  let t = "";
  do { t = "ACC-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function upsertAccessory(a: Accessory) {
  const list = getAccessories();
  const norm = recomputeAccessoryStatus(a);
  const i = list.findIndex((x) => x.id === norm.id);
  if (i >= 0) list[i] = norm; else list.unshift(norm);
  saveAccessories(list);
}
export function deleteAccessory(id: string) {
  saveAccessories(getAccessories().filter((a) => a.id !== id));
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

export function getJustInItems(limit = 6): JustInItem[] {
  const phones: JustInItem[] = getAvailablePhones().map((item) => ({ type: "phone" as const, item }));
  const acc: JustInItem[] = getAccessories().map((item) => ({ type: "accessory" as const, item }));
  return [...phones, ...acc]
    .sort((a, b) => Date.parse(b.item.dateAdded) - Date.parse(a.item.dateAdded))
    .slice(0, limit);
}

export function seedBuySellData() {
  if (!isBrowser()) return;
  const today = new Date();
  const minusDays = (n: number) => {
    const d = new Date(today); d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  if (getPhones().length === 0) {
    const phones: UsedPhone[] = [
      { id: "PHN-1042", brand: "Samsung", model: "Galaxy S21", storage: "128GB", ram: "8GB", batteryHealth: 87, condition: "Good", purchasePrice: 18000, sellingPrice: 22000, status: "Listed", photoUrl: "", notes: "Minor scratch on back panel, screen flawless", dateAdded: minusDays(2), galleryUrls: [], shortDescription: "Clean unit, no dents. Screen and digitizer flawless. Original charger included." },
      { id: "PHN-1043", brand: "Apple", model: "iPhone 11", storage: "64GB", ram: "4GB", batteryHealth: 82, condition: "Excellent", purchasePrice: 26000, sellingPrice: 32000, status: "Listed", photoUrl: "", notes: "Original box and charger included", dateAdded: minusDays(4), galleryUrls: [], shortDescription: "Excellent condition, original box and charger included. Face ID and battery perform reliably." },
      { id: "PHN-1044", brand: "Xiaomi", model: "Redmi Note 11", storage: "128GB", ram: "6GB", batteryHealth: 91, condition: "Good", purchasePrice: 11000, sellingPrice: 14500, status: "Listed", photoUrl: "", notes: "", dateAdded: minusDays(10), galleryUrls: [], shortDescription: "Smooth daily-use device, battery health 91%. Minor wear on edges." },
      { id: "PHN-1045", brand: "Oppo", model: "A78", storage: "128GB", ram: "8GB", batteryHealth: 95, condition: "Excellent", purchasePrice: 16000, sellingPrice: 19500, status: "Sold", photoUrl: "", notes: "", dateAdded: minusDays(20), soldDate: minusDays(5), galleryUrls: [], shortDescription: "Near-mint Oppo A78 with 95% battery health." },
      { id: "PHN-1046", brand: "Vivo", model: "Y35", storage: "128GB", ram: "8GB", batteryHealth: 78, condition: "Fair", purchasePrice: 9000, sellingPrice: 12000, status: "Reserved", photoUrl: "", notes: "Reserved for customer pickup", dateAdded: minusDays(12), galleryUrls: [], shortDescription: "Budget-friendly daily driver. Light scuffs, fully functional." },
      { id: "PHN-1047", brand: "Samsung", model: "Galaxy A54", storage: "256GB", ram: "8GB", batteryHealth: 94, condition: "Excellent", purchasePrice: 28000, sellingPrice: 33000, status: "Listed", photoUrl: "", notes: "", dateAdded: minusDays(1), galleryUrls: [], shortDescription: "Immaculate A54 with 256GB storage. AMOLED panel flawless, no scratches." },
    ];
    savePhones(phones);
  }

  if (getAccessories().length === 0) {
    const acc: Accessory[] = [
      { id: "ACC-2031", name: "20000mAh Power Bank", category: "Power Bank", brand: "Anker", purchasePrice: 1400, sellingPrice: 1900, stockQuantity: 5, photoUrl: "", status: "In Stock", dateAdded: minusDays(3) },
      { id: "ACC-2032", name: "25W USB-C Fast Charger", category: "Charger", brand: "Samsung", purchasePrice: 700, sellingPrice: 1100, stockQuantity: 12, photoUrl: "", status: "In Stock", dateAdded: minusDays(8) },
      { id: "ACC-2033", name: "Wired Earphones (Type-C)", category: "Headphones", brand: "Oppo", purchasePrice: 250, sellingPrice: 450, stockQuantity: 0, photoUrl: "", status: "Out of Stock", dateAdded: minusDays(15) },
      { id: "ACC-2034", name: "Silicone Case — iPhone 13", category: "Case", brand: "Spigen", purchasePrice: 300, sellingPrice: 600, stockQuantity: 8, photoUrl: "", status: "In Stock", dateAdded: minusDays(5) },
      { id: "ACC-2035", name: "Braided USB-C Cable 2m", category: "Cable", brand: "Anker", purchasePrice: 200, sellingPrice: 400, stockQuantity: 20, photoUrl: "", status: "In Stock", dateAdded: minusDays(11) },
      { id: "ACC-2036", name: "Tempered Glass — Galaxy A54", category: "Screen Protector", brand: "Nillkin", purchasePrice: 80, sellingPrice: 200, stockQuantity: 30, photoUrl: "", status: "In Stock", dateAdded: minusDays(2) },
    ];
    saveAccessories(acc);
  }
}
