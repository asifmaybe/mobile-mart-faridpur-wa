export type JobStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

export interface JobPartUsed {
  partId: string;
  qty: number;
}

export interface Job {
  token: string;
  customerName: string;
  customerPhone: string;
  device: string;
  issue: string;
  receivedDate: string;
  estimatedDate: string;
  status: JobStatus;
  techNote: string;
  diagnosticNotes: string;
  assignedTechId: string;
  partsUsed: JobPartUsed[];
  createdAt: string;
}

export interface Appointment {
  ref: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  problem: string;
  preferredDate: string;
  notes: string;
  createdAt: string;
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

export type TechSpecialty =
  | "Screen/Display" | "Battery" | "Software/Flashing"
  | "Micro-soldering/Board-level" | "Water Damage" | "General";

export const TECH_SPECIALTIES: TechSpecialty[] = [
  "Screen/Display", "Battery", "Software/Flashing",
  "Micro-soldering/Board-level", "Water Damage", "General",
];

export interface Technician {
  techId: string;
  name: string;
  phone: string;
  specialties: TechSpecialty[];
  active: boolean;
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
  shopName: "Mak Electronics",
  shopNameBn: "ম্যাক ইলেকট্রনিক্স",
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
  jobs: "repairShopJobs",
  appts: "repairShopAppointments",
  settings: "repairShopSettings",
  auth: "repairShopAuth",
  inventory: "repairShopInventory",
  technicians: "repairShopTechnicians",
  marketPrices: "repairShopMarketPrices",
  receipts: "repairShopReceipts",
  phones: "mac_phones",
  accessories: "mac_accessories",
  estimateRates: "repairEstimateRates",
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

function normalizeJob(j: Partial<Job> & { token: string }): Job {
  return {
    token: j.token,
    customerName: j.customerName ?? "",
    customerPhone: j.customerPhone ?? "",
    device: j.device ?? "",
    issue: j.issue ?? "",
    receivedDate: j.receivedDate ?? "",
    estimatedDate: j.estimatedDate ?? "",
    status: (j.status as JobStatus) ?? "received",
    techNote: j.techNote ?? "",
    diagnosticNotes: j.diagnosticNotes ?? "",
    assignedTechId: j.assignedTechId ?? "",
    partsUsed: Array.isArray(j.partsUsed) ? j.partsUsed : [],
    createdAt: j.createdAt ?? new Date().toISOString(),
  };
}

// ===== Jobs =====
export function getJobs(): Job[] {
  if (!isBrowser()) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEYS.jobs) || "[]");
    return Array.isArray(raw) ? raw.map(normalizeJob) : [];
  } catch { return []; }
}
export function saveJobs(jobs: Job[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.jobs, JSON.stringify(jobs));
  fire();
}
export function getJobByToken(token: string) {
  return getJobs().find((j) => j.token.toLowerCase() === token.toLowerCase());
}
export function updateJob(token: string, patch: Partial<Job>) {
  const jobs = getJobs().map((j) => (j.token === token ? { ...j, ...patch } : j));
  saveJobs(jobs);
}
export function deleteJob(token: string) {
  saveJobs(getJobs().filter((j) => j.token !== token));
}
export function addJob(j: Job) {
  saveJobs([normalizeJob(j), ...getJobs()]);
  // Decrement inventory for any parts already attached at intake
  if (j.partsUsed?.length) {
    for (const p of j.partsUsed) adjustStock(p.partId, -Math.abs(p.qty));
  }
}
export function generateToken(): string {
  const existing = new Set(getJobs().map((j) => j.token));
  let t = "";
  do { t = "JOB-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function generateApptRef(): string {
  return "APT-" + Math.floor(1000 + Math.random() * 9000);
}

// ===== Appointments =====
export function getAppointments(): Appointment[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.appts) || "[]"); } catch { return []; }
}
export function saveAppointments(a: Appointment[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.appts, JSON.stringify(a));
  fire();
}
export function addAppointment(a: Appointment) { saveAppointments([a, ...getAppointments()]); }
export function deleteAppointment(ref: string) {
  saveAppointments(getAppointments().filter((a) => a.ref !== ref));
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

// ===== Inventory =====
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

// ===== Technicians =====
export function getTechnicians(): Technician[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.technicians) || "[]"); } catch { return []; }
}
export function saveTechnicians(techs: Technician[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.technicians, JSON.stringify(techs));
  fire();
}
export function getTechnicianById(techId: string) {
  return getTechnicians().find((t) => t.techId === techId);
}
export function generateTechId(): string {
  const existing = new Set(getTechnicians().map((t) => t.techId));
  let t = "";
  do { t = "TECH-" + String(Math.floor(100 + Math.random() * 900)); } while (existing.has(t));
  return t;
}
export function upsertTechnician(tech: Technician) {
  const list = getTechnicians();
  const i = list.findIndex((t) => t.techId === tech.techId);
  if (i >= 0) list[i] = tech; else list.unshift(tech);
  saveTechnicians(list);
}
export function deleteTechnician(techId: string) {
  saveTechnicians(getTechnicians().filter((t) => t.techId !== techId));
}
export function getActiveJobCountForTech(techId: string) {
  return getJobs().filter((j) => j.assignedTechId === techId && j.status !== "delivered").length;
}
export function getCompletedJobCountForTech(techId: string) {
  return getJobs().filter((j) => j.assignedTechId === techId && j.status === "delivered").length;
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
  seedEstimateRates();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const minus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  const plus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  // --- Technicians (seed first; jobs reference techIds) ---
  if (getTechnicians().length === 0) {
    const techs: Technician[] = [
      { techId: "TECH-101", name: "Karim Hossain", phone: "01911000010", specialties: ["Screen/Display", "Water Damage"], active: true },
      { techId: "TECH-102", name: "Sabbir Rahman", phone: "01711000011", specialties: ["Micro-soldering/Board-level", "Battery"], active: true },
      { techId: "TECH-103", name: "Imran Hossain", phone: "01811000012", specialties: ["Software/Flashing", "General"], active: false },
    ];
    saveTechnicians(techs);
  }

  // --- Inventory ---
  if (getInventory().length === 0) {
    const inv: InventoryPart[] = [
      { partId: "PART-1042", name: "Galaxy A54 OLED Display", category: "Display", compatibleBrand: "Samsung", compatibleModel: "Galaxy A54", costPrice: 1800, sellingPrice: 2200, quantity: 6, reorderThreshold: 2, supplierNote: "Local supplier — Dhaka wholesale market", lastRestocked: minus(15) },
      { partId: "PART-1043", name: "iPhone 13 Battery (OEM)", category: "Battery", compatibleBrand: "Apple", compatibleModel: "iPhone 13", costPrice: 1500, sellingPrice: 2000, quantity: 2, reorderThreshold: 2, supplierNote: "Imported", lastRestocked: minus(40) },
      { partId: "PART-1044", name: "Redmi Note 12 Charging Port", category: "Charging Port", compatibleBrand: "Xiaomi", compatibleModel: "Redmi Note 12", costPrice: 250, sellingPrice: 500, quantity: 0, reorderThreshold: 3, supplierNote: "", lastRestocked: minus(60) },
      { partId: "PART-1045", name: "Oppo A78 Back Panel", category: "Back Panel", compatibleBrand: "Oppo", compatibleModel: "A78", costPrice: 400, sellingPrice: 700, quantity: 8, reorderThreshold: 2, supplierNote: "", lastRestocked: minus(7) },
      { partId: "PART-1046", name: "Vivo Y35 Loudspeaker", category: "Speaker/Mic", compatibleBrand: "Vivo", compatibleModel: "Y35", costPrice: 180, sellingPrice: 350, quantity: 4, reorderThreshold: 2, supplierNote: "", lastRestocked: minus(20) },
      { partId: "PART-1047", name: "Galaxy S21 OLED Display", category: "Display", compatibleBrand: "Samsung", compatibleModel: "Galaxy S21", costPrice: 4200, sellingPrice: 5000, quantity: 1, reorderThreshold: 2, supplierNote: "Genuine Samsung", lastRestocked: minus(5) },
    ];
    saveInventory(inv);
  }

  // --- Jobs ---
  if (getJobs().length === 0) {
    const demo: Job[] = [
      { token: "JOB-1001", customerName: "Rahim Uddin", customerPhone: "8801711000001", device: "Samsung Galaxy A54", issue: "Cracked screen", receivedDate: minus(2), estimatedDate: iso(today), status: "ready", techNote: "Replaced with genuine Samsung display. Ready for pickup.", diagnosticNotes: "Display cracked top-left, digitizer unresponsive in that zone. No board damage on visual inspection.", assignedTechId: "TECH-101", partsUsed: [], createdAt: new Date().toISOString() },
      { token: "JOB-1002", customerName: "Fatima Begum", customerPhone: "8801812000002", device: "iPhone 13", issue: "Battery draining fast", receivedDate: minus(1), estimatedDate: plus(1), status: "repairing", techNote: "Battery replacement in progress.", diagnosticNotes: "Battery health 71%. No swelling. Replacement recommended.", assignedTechId: "TECH-102", partsUsed: [], createdAt: new Date().toISOString() },
      { token: "JOB-1003", customerName: "Karim Hossain", customerPhone: "8801911000003", device: "Xiaomi Redmi Note 12", issue: "Charging not working", receivedDate: minus(1), estimatedDate: plus(2), status: "diagnosing", techNote: "Checking charging port and motherboard.", diagnosticNotes: "", assignedTechId: "TECH-102", partsUsed: [], createdAt: new Date().toISOString() },
      { token: "JOB-1004", customerName: "Nusrat Jahan", customerPhone: "8801611000004", device: "Oppo A78", issue: "Water damage", receivedDate: iso(today), estimatedDate: plus(3), status: "received", techNote: "", diagnosticNotes: "", assignedTechId: "TECH-101", partsUsed: [], createdAt: new Date().toISOString() },
      { token: "JOB-1005", customerName: "Jalal Ahmed", customerPhone: "8801511000005", device: "Vivo Y35", issue: "Speaker not working", receivedDate: minus(5), estimatedDate: minus(3), status: "delivered", techNote: "Picked up by customer.", diagnosticNotes: "Loudspeaker coil burned out. Replaced.", assignedTechId: "TECH-102", partsUsed: [{ partId: "PART-1046", qty: 1 }], createdAt: new Date().toISOString() },
    ];
    saveJobs(demo);
  }

  // --- Market Prices ---
  if (getMarketPrices().length === 0) {
    const mkt: MarketPriceEntry[] = [
      { entryId: "MKT-0201", brand: "Samsung", model: "Galaxy A54", partType: "Display", marketLow: 1800, marketHigh: 2400, notes: "OEM ~2200, copy ~1800", lastUpdated: minus(5) },
      { entryId: "MKT-0202", brand: "Samsung", model: "Galaxy S21", partType: "Display", marketLow: 4000, marketHigh: 5500, notes: "OLED original ~4500–5500, incell copy ~4000", lastUpdated: minus(45) },
      { entryId: "MKT-0203", brand: "Apple", model: "iPhone 13", partType: "Battery", marketLow: 1800, marketHigh: 2400, notes: "OEM only", lastUpdated: minus(10) },
      { entryId: "MKT-0204", brand: "Xiaomi", model: "Redmi Note 12", partType: "Charging Port", marketLow: 400, marketHigh: 650, notes: "", lastUpdated: minus(8) },
      { entryId: "MKT-0205", brand: "Oppo", model: "A78", partType: "Back Glass", marketLow: 600, marketHigh: 900, notes: "", lastUpdated: minus(12) },
      { entryId: "MKT-0206", brand: "Vivo", model: "Y35", partType: "Speaker", marketLow: 300, marketHigh: 450, notes: "", lastUpdated: minus(3) },
      { entryId: "MKT-0207", brand: "Apple", model: "iPhone 14", partType: "Display", marketLow: 8000, marketHigh: 11000, notes: "Genuine OLED only", lastUpdated: minus(18) },
      { entryId: "MKT-0208", brand: "Realme", model: "C55", partType: "Motherboard", marketLow: 2500, marketHigh: 3500, notes: "Used boards available", lastUpdated: minus(40) },
    ];
    saveMarketPrices(mkt);
  }
}

// ============= Buy/Sell: Phones & Accessories =============

export type PhoneCondition = "Excellent" | "Good" | "Fair";
export type PhoneStatus = "Available" | "Sold" | "Reserved";

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
  return getPhones().filter((p) => p.status === "Available");
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
      { id: "PHN-1042", brand: "Samsung", model: "Galaxy S21", storage: "128GB", ram: "8GB", batteryHealth: 87, condition: "Good", purchasePrice: 18000, sellingPrice: 22000, status: "Available", photoUrl: "", notes: "Minor scratch on back panel, screen flawless", dateAdded: minusDays(2), galleryUrls: [], shortDescription: "Clean unit, no dents. Screen and digitizer flawless. Original charger included." },
      { id: "PHN-1043", brand: "Apple", model: "iPhone 11", storage: "64GB", ram: "4GB", batteryHealth: 82, condition: "Excellent", purchasePrice: 26000, sellingPrice: 32000, status: "Available", photoUrl: "", notes: "Original box and charger included", dateAdded: minusDays(4), galleryUrls: [], shortDescription: "Excellent condition, original box and charger included. Face ID and battery perform reliably." },
      { id: "PHN-1044", brand: "Xiaomi", model: "Redmi Note 11", storage: "128GB", ram: "6GB", batteryHealth: 91, condition: "Good", purchasePrice: 11000, sellingPrice: 14500, status: "Available", photoUrl: "", notes: "", dateAdded: minusDays(10), galleryUrls: [], shortDescription: "Smooth daily-use device, battery health 91%. Minor wear on edges." },
      { id: "PHN-1045", brand: "Oppo", model: "A78", storage: "128GB", ram: "8GB", batteryHealth: 95, condition: "Excellent", purchasePrice: 16000, sellingPrice: 19500, status: "Sold", photoUrl: "", notes: "", dateAdded: minusDays(20), galleryUrls: [], shortDescription: "Near-mint Oppo A78 with 95% battery health." },
      { id: "PHN-1046", brand: "Vivo", model: "Y35", storage: "128GB", ram: "8GB", batteryHealth: 78, condition: "Fair", purchasePrice: 9000, sellingPrice: 12000, status: "Reserved", photoUrl: "", notes: "Reserved for customer pickup", dateAdded: minusDays(12), galleryUrls: [], shortDescription: "Budget-friendly daily driver. Light scuffs, fully functional." },
      { id: "PHN-1047", brand: "Samsung", model: "Galaxy A54", storage: "256GB", ram: "8GB", batteryHealth: 94, condition: "Excellent", purchasePrice: 28000, sellingPrice: 33000, status: "Available", photoUrl: "", notes: "", dateAdded: minusDays(1), galleryUrls: [], shortDescription: "Immaculate A54 with 256GB storage. AMOLED panel flawless, no scratches." },
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

// ============= Repair Estimate Rates =============

export const ESTIMATE_BRANDS = [
  "All Brands",
  "Samsung", "iPhone", "Xiaomi", "Oppo", "Vivo", "Realme",
  "OnePlus", "Symphony", "Tecno", "Infinix", "Nokia", "Other",
] as const;

export const ESTIMATE_ISSUES_EN = [
  "Screen Replacement", "Battery Replacement", "Charging Port Repair",
  "Water Damage Treatment", "Camera Repair", "Speaker/Mic Fix",
  "Software Flash/Unlock", "Network/Signal Fix", "Button Repair",
  "Back Panel Replacement",
] as const;

export const ESTIMATE_ISSUES_BN: Record<string, string> = {
  "Screen Replacement": "স্ক্রিন রিপ্লেসমেন্ট",
  "Battery Replacement": "ব্যাটারি রিপ্লেসমেন্ট",
  "Charging Port Repair": "চার্জিং পোর্ট রিপেয়ার",
  "Water Damage Treatment": "পানির ক্ষতি",
  "Camera Repair": "ক্যামেরা রিপেয়ার",
  "Speaker/Mic Fix": "স্পিকার / মাইক",
  "Software Flash/Unlock": "সফটওয়্যার / আনলক",
  "Network/Signal Fix": "নেটওয়ার্ক / সিগন্যাল",
  "Button Repair": "বাটন রিপেয়ার",
  "Back Panel Replacement": "ব্যাক প্যানেল রিপ্লেসমেন্ট",
};

export type EstimateIssueType = typeof ESTIMATE_ISSUES_EN[number];

export interface RepairEstimateRate {
  rateId: string;
  brand: string;
  model: string;
  issueType: EstimateIssueType;
  priceLow: number;
  priceHigh: number;
  turnaround: string;
  notes: string;
}

export type EstimateMatchTier = "exact" | "brandWildcardModel" | "allBrands" | "none";
export interface EstimateMatch {
  tier: EstimateMatchTier;
  rate: RepairEstimateRate | null;
}

export function getEstimateRates(): RepairEstimateRate[] {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(KEYS.estimateRates) || "[]"); } catch { return []; }
}
export function saveEstimateRates(items: RepairEstimateRate[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEYS.estimateRates, JSON.stringify(items));
  fire();
}
export function generateEstimateRateId(): string {
  const existing = new Set(getEstimateRates().map((r) => r.rateId));
  let t = "";
  do { t = "EST-" + Math.floor(1000 + Math.random() * 9000); } while (existing.has(t));
  return t;
}
export function upsertEstimateRate(rate: RepairEstimateRate) {
  const list = getEstimateRates();
  const i = list.findIndex((r) => r.rateId === rate.rateId);
  if (i >= 0) list[i] = rate; else list.unshift(rate);
  saveEstimateRates(list);
}
export function deleteEstimateRate(rateId: string) {
  saveEstimateRates(getEstimateRates().filter((r) => r.rateId !== rateId));
}

export function findBestEstimate(brand: string, model: string, issueType: string): EstimateMatch {
  const rates = getEstimateRates();
  const m = (model || "").trim().toLowerCase();
  const matchIssue = (r: RepairEstimateRate) => r.issueType === issueType;
  // Tier 1: exact brand + exact model
  if (m) {
    const exact = rates.find((r) => matchIssue(r) && r.brand === brand && r.model.trim().toLowerCase() === m);
    if (exact) return { tier: "exact", rate: exact };
  }
  // Tier 2: brand + wildcard model
  const brandWild = rates.find((r) => matchIssue(r) && r.brand === brand && !r.model.trim());
  if (brandWild) return { tier: "brandWildcardModel", rate: brandWild };
  // Tier 3: All Brands wildcard
  const allWild = rates.find((r) => matchIssue(r) && r.brand === "All Brands");
  if (allWild) return { tier: "allBrands", rate: allWild };
  return { tier: "none", rate: null };
}

export function seedEstimateRates() {
  if (!isBrowser()) return;
  if (getEstimateRates().length > 0) return;
  const seed: RepairEstimateRate[] = [
    // Tier 1: brand + model specific
    { rateId: "EST-0118", brand: "Samsung", model: "Galaxy S21", issueType: "Screen Replacement", priceLow: 3200, priceHigh: 4500, turnaround: "2–4 hours", notes: "Price varies for OLED vs incell panels" },
    { rateId: "EST-0119", brand: "iPhone", model: "iPhone 13", issueType: "Battery Replacement", priceLow: 2200, priceHigh: 2800, turnaround: "1–2 hours", notes: "OEM battery only" },
    { rateId: "EST-0120", brand: "Xiaomi", model: "Redmi Note 12", issueType: "Charging Port Repair", priceLow: 600, priceHigh: 900, turnaround: "Same day", notes: "" },
    { rateId: "EST-0121", brand: "Samsung", model: "Galaxy A54", issueType: "Screen Replacement", priceLow: 2400, priceHigh: 3200, turnaround: "2–4 hours", notes: "" },
    // Tier 2: brand + wildcard model
    { rateId: "EST-0122", brand: "iPhone", model: "", issueType: "Screen Replacement", priceLow: 4500, priceHigh: 12000, turnaround: "Same day", notes: "Varies widely by model" },
    { rateId: "EST-0123", brand: "Samsung", model: "", issueType: "Water Damage Treatment", priceLow: 1500, priceHigh: 4000, turnaround: "1–3 days", notes: "Depends on damage severity" },
    { rateId: "EST-0124", brand: "Oppo", model: "", issueType: "Back Panel Replacement", priceLow: 700, priceHigh: 1200, turnaround: "Same day", notes: "" },
    { rateId: "EST-0125", brand: "Vivo", model: "", issueType: "Speaker/Mic Fix", priceLow: 400, priceHigh: 800, turnaround: "Same day", notes: "" },
    // Tier 3: All Brands wildcard
    { rateId: "EST-0126", brand: "All Brands", model: "", issueType: "Software Flash/Unlock", priceLow: 500, priceHigh: 1500, turnaround: "1–3 hours", notes: "Includes FRP / pattern unlock" },
    { rateId: "EST-0127", brand: "All Brands", model: "", issueType: "Network/Signal Fix", priceLow: 800, priceHigh: 2500, turnaround: "1–2 days", notes: "Antenna or baseband repair" },
    { rateId: "EST-0128", brand: "All Brands", model: "", issueType: "Button Repair", priceLow: 300, priceHigh: 700, turnaround: "Same day", notes: "" },
    { rateId: "EST-0129", brand: "All Brands", model: "", issueType: "Camera Repair", priceLow: 800, priceHigh: 3500, turnaround: "Same day", notes: "Module replacement" },
  ];
  saveEstimateRates(seed);
}
