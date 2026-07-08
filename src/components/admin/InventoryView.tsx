import { useMemo, useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle, XCircle, Minus } from "lucide-react";
import {
  PART_BRANDS, PART_CATEGORIES, adjustStock, deletePart, generatePartId,
  getInventory, upsertPart, type InventoryPart, type PartCategory,
} from "../../lib/storage";
import { Modal, showToast } from "../../lib/ui";
import { useStorageRefresh } from "./useStorageRefresh";

type Filter = "all" | "low" | "out";

export function InventoryView({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  const [items, setItems] = useState<InventoryPart[]>([]);
  useEffect(() => {
    const fetch = async () => setItems(await getInventory());
    fetch();
    window.addEventListener("repairshop:change", fetch);
    return () => window.removeEventListener("repairshop:change", fetch);
  }, []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<InventoryPart | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((p) => {
      if (filter === "low" && p.quantity > p.reorderThreshold) return false;
      if (filter === "out" && p.quantity !== 0) return false;
      if (!s) return true;
      return p.name.toLowerCase().includes(s)
        || p.category.toLowerCase().includes(s)
        || p.compatibleBrand.toLowerCase().includes(s)
        || p.compatibleModel.toLowerCase().includes(s);
    });
  }, [items, q, filter]);

  const statusFor = (p: InventoryPart) => {
    if (p.quantity === 0) return { label: tr("outOfStock"), icon: XCircle, cls: "text-accent-red bg-accent-red/15 border-accent-red/40" };
    if (p.quantity <= p.reorderThreshold) return { label: tr("lowStock"), icon: AlertTriangle, cls: "text-accent-orange bg-accent-orange/15 border-accent-orange/40" };
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="hidden md:flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr("inventoryTitle")}</h1>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-4 text-sm"><Plus size={16} /> {tr("addPart")}</button>
      </div>
      <button onClick={() => setAdding(true)} className="md:hidden btn-primary w-full"><Plus size={16} /> {tr("addPart")}</button>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input className="glass-input pl-10" placeholder={lang === "bn" ? "নাম, ক্যাটাগরি, ব্র্যান্ড..." : "Search name, category, brand, model..."} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {(["all", "low", "out"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition ${
              filter === f ? "bg-accent-purple/20 border-accent-purple/50 text-accent-purple" : "glass-pill"
            }`}>
            {f === "all" ? (lang === "bn" ? "সব" : "All") : f === "low" ? tr("lowStock") : tr("outOfStock")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass p-8 text-center text-text-muted text-sm">{lang === "bn" ? "কোনো পার্ট নেই।" : "No parts."}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const st = statusFor(p);
            return (
              <div key={p.partId} className="glass p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="glass-pill px-3 py-1 text-xs font-bold">{p.partId}</span>
                      <span className="glass-pill px-3 py-1 text-xs">{p.category}</span>
                      {st && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${st.cls}`}>
                          <st.icon size={12} /> {st.label}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold mt-2">{p.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">{p.compatibleBrand} · {p.compatibleModel}</div>
                    <div className="text-xs text-text-secondary mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      <span>{tr("costPrice")}: ৳{p.costPrice}</span>
                      <span>{tr("sellingPrice")}: ৳{p.sellingPrice}</span>
                      <span className="font-semibold text-text-primary">Qty: {p.quantity}</span>
                      <span className="text-text-muted">≤ {p.reorderThreshold} low</span>
                    </div>
                    {p.supplierNote && <div className="text-xs text-text-muted mt-1">{p.supplierNote}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <div className="inline-flex items-center gap-1 glass-pill p-1">
                    <button onClick={() => adjustStock(p.partId, -1)} className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/40" aria-label="Decrement"><Minus size={14} /></button>
                    <span className="text-xs font-semibold px-1">{tr("adjustStock")}</span>
                    <button onClick={() => adjustStock(p.partId, +1)} className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/40" aria-label="Increment"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => setEditing(p)} className="btn-glass !py-2 !px-3 text-xs"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmDel(p.partId)} className="btn-danger !py-2 !px-3 text-xs"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(adding || editing) && (
        <PartForm
          tr={tr} lang={lang}
          initial={editing}
          onCancel={() => { setAdding(false); setEditing(null); }}
          onSave={(part) => { upsertPart(part); setAdding(false); setEditing(null); showToast(tr("saved")); }}
        />
      )}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title={tr("confirmDelete")}>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmDel(null)} className="btn-glass flex-1">{tr("cancel")}</button>
          <button onClick={() => { if (confirmDel) deletePart(confirmDel); setConfirmDel(null); showToast(tr("delete") + " ✓", "info"); }} className="btn-danger flex-1">{tr("delete")}</button>
        </div>
      </Modal>
    </div>
  );
}

function PartForm({
  tr, lang, initial, onCancel, onSave,
}: {
  tr: (k: any) => string; lang: "en" | "bn"; initial: InventoryPart | null;
  onCancel: () => void; onSave: (p: InventoryPart) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [p, setP] = useState<InventoryPart>(initial ?? {
    partId: "", name: "", category: "Display", compatibleBrand: "Samsung",
    compatibleModel: "", costPrice: 0, sellingPrice: 0, quantity: 0, reorderThreshold: 2,
    supplierNote: "", lastRestocked: today,
  });
  useEffect(() => {
    if (!initial) generatePartId().then((id) => setP((s) => ({ ...s, partId: id })));
  }, [initial]);
  const set = (k: keyof InventoryPart, v: any) => setP((s) => ({ ...s, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.name.trim() || !p.compatibleModel.trim()) { showToast(lang === "bn" ? "প্রয়োজনীয় ফিল্ড পূরণ করুন" : "Fill required fields", "error"); return; }
    if (p.costPrice < 0 || p.sellingPrice < 0 || p.quantity < 0 || p.reorderThreshold < 0) { showToast(lang === "bn" ? "ঋণাত্মক সংখ্যা গ্রহণযোগ্য নয়" : "Negative numbers not allowed", "error"); return; }
    onSave(p);
  };
  return (
    <Modal open onClose={onCancel} title={initial ? `${tr("update")} · ${p.partId}` : tr("addPart")}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label-caps mb-1.5 block">{tr("partName")} *</label>
          <input className="glass-input" required value={p.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("category")} *</label>
            <select className="glass-input" value={p.category} onChange={(e) => set("category", e.target.value as PartCategory)}>
              {PART_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("compatibleBrand")} *</label>
            <select className="glass-input" value={p.compatibleBrand} onChange={(e) => set("compatibleBrand", e.target.value)}>
              {PART_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("compatibleModel")} *</label>
          <input className="glass-input" required value={p.compatibleModel} onChange={(e) => set("compatibleModel", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("costPrice")} (৳) *</label>
            <input type="number" min={0} className="glass-input" required value={p.costPrice} onChange={(e) => set("costPrice", Number(e.target.value))} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("sellingPrice")} (৳) *</label>
            <input type="number" min={0} className="glass-input" required value={p.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("quantityInStock")} *</label>
            <input type="number" min={0} className="glass-input" required value={p.quantity} onChange={(e) => set("quantity", Number(e.target.value))} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("reorderThreshold")} *</label>
            <input type="number" min={0} className="glass-input" required value={p.reorderThreshold} onChange={(e) => set("reorderThreshold", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("supplierNote")}</label>
          <input className="glass-input" value={p.supplierNote} onChange={(e) => set("supplierNote", e.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("lastRestocked")}</label>
          <input type="date" className="glass-input" value={p.lastRestocked} onChange={(e) => set("lastRestocked", e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-glass flex-1">{tr("cancel")}</button>
          <button type="submit" className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </form>
    </Modal>
  );
}
