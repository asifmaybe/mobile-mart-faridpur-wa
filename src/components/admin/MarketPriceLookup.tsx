import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, TrendingUp, X } from "lucide-react";
import {
  PART_BRANDS, MARKET_PART_TYPES, daysSince, deleteMarketEntry, generateMarketEntryId,
  getInventory, getMarketPrices, searchMarketPrices, upsertMarketEntry,
  type MarketPartType, type MarketPriceEntry,
} from "../../lib/storage";
import { Modal, showToast } from "../../lib/ui";
import { useStorageRefresh } from "./useStorageRefresh";

interface Props {
  tr: (k: any) => string; lang: "en" | "bn";
  asView?: boolean;
  initialBrand?: string; initialModel?: string; initialPartType?: string;
  onClose?: () => void;
}

export function MarketPricesView({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  return <MarketPricesPanel tr={tr} lang={lang} asView />;
}

// Reusable overlay used by the "Check Market Price" shortcut
export function MarketPriceLookup(props: Omit<Props, "asView">) {
  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto" onClick={props.onClose}>
      <div className="glass scale-in p-5 w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold inline-flex items-center gap-2"><TrendingUp size={18} /> {props.tr("marketPriceTrackerTitle")}</h3>
          <button onClick={props.onClose} className="glass-pill w-8 h-8 grid place-items-center" aria-label="Close"><X size={14} /></button>
        </div>
        <MarketPricesPanel {...props} />
      </div>
    </div>
  );
}

function MarketPricesPanel({ tr, lang, asView, initialBrand, initialModel, initialPartType }: Props) {
  useStorageRefresh();
  const [q, setQ] = useState(initialModel ?? "");
  const [brand, setBrand] = useState<string>(initialBrand ?? "");
  const [partType, setPartType] = useState<string>(initialPartType ?? "");
  const [editing, setEditing] = useState<MarketPriceEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const inventory = getInventory();
  const results = useMemo(() => {
    const list = searchMarketPrices(brand || undefined, q, partType || undefined);
    // sort: model match first
    const s = q.trim().toLowerCase();
    return [...list].sort((a, b) => {
      const am = s && a.model.toLowerCase().includes(s) ? 0 : 1;
      const bm = s && b.model.toLowerCase().includes(s) ? 0 : 1;
      return am - bm;
    });
  }, [brand, q, partType, getMarketPrices().length]);

  const inventoryMatch = (e: MarketPriceEntry) =>
    inventory.find((p) => p.compatibleBrand === e.brand && p.compatibleModel === e.model && p.category === e.partType);

  return (
    <div className="space-y-4">
      {asView && (
        <>
          <div className="hidden md:flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold">{tr("marketPriceTrackerTitle")}</h1>
            <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-4 text-sm"><Plus size={16} /> {tr("addEntry")}</button>
          </div>
          <button onClick={() => setAdding(true)} className="md:hidden btn-primary w-full"><Plus size={16} /> {tr("addEntry")}</button>
        </>
      )}

      <div className="grid sm:grid-cols-3 gap-2">
        <input className="glass-input" placeholder={lang === "bn" ? "মডেল / ব্র্যান্ড খুঁজুন" : "Search brand or model..."} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="glass-input" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">{tr("allBrands")}</option>
          {PART_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="glass-input" value={partType} onChange={(e) => setPartType(e.target.value)}>
          <option value="">{tr("allTypes")}</option>
          {MARKET_PART_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {!asView && (
        <div className="flex justify-end">
          <button onClick={() => setAdding(true)} className="btn-glass !py-2 !px-3 text-xs"><Plus size={14} /> {tr("addEntry")}</button>
        </div>
      )}

      {results.length === 0 ? (
        <div className="glass p-6 text-center text-text-muted text-sm">{tr("noEntries")}</div>
      ) : (
        <div className="space-y-3">
          {results.map((e) => {
            const inv = inventoryMatch(e);
            const days = daysSince(e.lastUpdated);
            const stale = days > 30;
            const sellIndicator = inv ? (inv.sellingPrice > e.marketHigh ? "above" : "within") : null;
            return (
              <div key={e.entryId} className="glass p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="glass-pill px-3 py-1 text-xs font-bold">{e.brand}</span>
                      <span className="font-semibold">{e.model}</span>
                      <span className="glass-pill px-2.5 py-1 text-xs">{e.partType}</span>
                      {stale && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold text-accent-orange bg-accent-orange/15 border-accent-orange/40">
                          <AlertTriangle size={12} /> {days} {tr("daysAgo")}
                        </span>
                      )}
                    </div>
                    <div className="text-sm mt-2">
                      <span className="font-semibold">৳{e.marketLow.toLocaleString()} – ৳{e.marketHigh.toLocaleString()}</span>
                      <span className="text-text-muted text-xs ml-2">{tr("lastUpdated")}: {e.lastUpdated}</span>
                    </div>
                    {e.notes && <div className="text-xs text-text-muted mt-1">{e.notes}</div>}
                    <div className="text-xs mt-2">
                      <span className="text-text-muted">{tr("compareToInventory")}: </span>
                      {inv ? (
                        <span className={sellIndicator === "above" ? "text-accent-orange font-semibold" : "text-accent-green font-semibold"}>
                          ৳{inv.costPrice} / ৳{inv.sellingPrice} ({inv.quantity} {tr("currentStock")})
                        </span>
                      ) : (
                        <span className="text-text-muted">{tr("notInInventory")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(e)} className="btn-glass !py-2 !px-3 text-xs"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmDel(e.entryId)} className="btn-danger !py-2 !px-3 text-xs"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(adding || editing) && (
        <EntryForm tr={tr} lang={lang} initial={editing}
          onCancel={() => { setAdding(false); setEditing(null); }}
          onSave={(en) => { upsertMarketEntry(en); setAdding(false); setEditing(null); showToast(tr("saved")); }} />
      )}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title={tr("confirmDelete")}>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmDel(null)} className="btn-glass flex-1">{tr("cancel")}</button>
          <button onClick={() => { if (confirmDel) deleteMarketEntry(confirmDel); setConfirmDel(null); showToast(tr("delete") + " ✓", "info"); }} className="btn-danger flex-1">{tr("delete")}</button>
        </div>
      </Modal>
    </div>
  );
}

function EntryForm({ tr, lang, initial, onCancel, onSave }: {
  tr: (k: any) => string; lang: "en" | "bn"; initial: MarketPriceEntry | null;
  onCancel: () => void; onSave: (e: MarketPriceEntry) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [e, setE] = useState<MarketPriceEntry>(initial ?? {
    entryId: generateMarketEntryId(), brand: "Samsung", model: "", partType: "Display",
    marketLow: 0, marketHigh: 0, notes: "", lastUpdated: today,
  });
  const set = (k: keyof MarketPriceEntry, v: any) => setE((s) => ({ ...s, [k]: v }));
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!e.model.trim()) { showToast(lang === "bn" ? "মডেল লিখুন" : "Model required", "error"); return; }
    if (e.marketHigh < e.marketLow) { showToast(lang === "bn" ? "সর্বোচ্চ ≥ সর্বনিম্ন হতে হবে" : "High must be ≥ Low", "error"); return; }
    onSave({ ...e, lastUpdated: e.lastUpdated || today });
  };
  return (
    <Modal open onClose={onCancel} title={initial ? `${tr("update")} · ${e.entryId}` : tr("addEntry")}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("compatibleBrand")} *</label>
            <select className="glass-input" value={e.brand} onChange={(ev) => set("brand", ev.target.value)}>
              {PART_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("partType")} *</label>
            <select className="glass-input" value={e.partType} onChange={(ev) => set("partType", ev.target.value as MarketPartType)}>
              {MARKET_PART_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("compatibleModel")} *</label>
          <input className="glass-input" required value={e.model} onChange={(ev) => set("model", ev.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("marketLowPrice")} *</label>
            <input type="number" min={0} className="glass-input" required value={e.marketLow} onChange={(ev) => set("marketLow", Number(ev.target.value))} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("marketHighPrice")} *</label>
            <input type="number" min={0} className="glass-input" required value={e.marketHigh} onChange={(ev) => set("marketHigh", Number(ev.target.value))} />
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("notes")}</label>
          <textarea rows={2} className="glass-input resize-none" value={e.notes} onChange={(ev) => set("notes", ev.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("lastUpdated")}</label>
          <input type="date" className="glass-input" value={e.lastUpdated} onChange={(ev) => set("lastUpdated", ev.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-glass flex-1">{tr("cancel")}</button>
          <button type="submit" className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </form>
    </Modal>
  );
}
