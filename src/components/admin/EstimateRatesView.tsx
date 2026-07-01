import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Calculator } from "lucide-react";
import {
  ESTIMATE_BRANDS, ESTIMATE_ISSUES_EN,
  deleteEstimateRate, generateEstimateRateId, getEstimateRates, upsertEstimateRate,
  type EstimateIssueType, type RepairEstimateRate,
} from "../../lib/storage";
import { Modal, showToast } from "../../lib/ui";
import { useStorageRefresh } from "./useStorageRefresh";

export function EstimateRatesView({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  useStorageRefresh();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<RepairEstimateRate | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const rates = getEstimateRates();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rates;
    return rates.filter((r) =>
      r.brand.toLowerCase().includes(s) ||
      r.model.toLowerCase().includes(s) ||
      r.issueType.toLowerCase().includes(s)
    );
  }, [rates, q]);

  return (
    <div className="space-y-4">
      <div className="hidden md:flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold inline-flex items-center gap-2"><Calculator size={22} /> {tr("estimateRatesTitle")}</h1>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-4 text-sm"><Plus size={16} /> {tr("addRate")}</button>
      </div>
      <button onClick={() => setAdding(true)} className="md:hidden btn-primary w-full"><Plus size={16} /> {tr("addRate")}</button>

      <input className="glass-input" placeholder={tr("searchRates")} value={q} onChange={(e) => setQ(e.target.value)} />

      {results.length === 0 ? (
        <div className="glass p-6 text-center text-text-muted text-sm">{tr("noRates")}</div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.rateId} className="glass p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="glass-pill px-3 py-1 text-xs font-bold">{r.brand}</span>
                    <span className="font-semibold">{r.model || (lang === "bn" ? "(যেকোনো মডেল)" : "(any model)")}</span>
                    <span className="glass-pill px-2.5 py-1 text-xs">{r.issueType}</span>
                  </div>
                  <div className="text-sm mt-2 font-semibold">৳{r.priceLow.toLocaleString()} – ৳{r.priceHigh.toLocaleString()}</div>
                  <div className="text-xs text-text-muted mt-1">{tr("turnaround")}: {r.turnaround}</div>
                  {r.notes && <div className="text-xs text-text-muted mt-1">{r.notes}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(r)} className="btn-glass !py-2 !px-3 text-xs" aria-label="Edit"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmDel(r.rateId)} className="btn-danger !py-2 !px-3 text-xs" aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <RateForm
          tr={tr}
          lang={lang}
          initial={editing}
          onCancel={() => { setAdding(false); setEditing(null); }}
          onSave={(r) => { upsertEstimateRate(r); setAdding(false); setEditing(null); showToast(tr("saved")); }}
        />
      )}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title={tr("confirmDelete")}>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmDel(null)} className="btn-glass flex-1">{tr("cancel")}</button>
          <button onClick={() => { if (confirmDel) deleteEstimateRate(confirmDel); setConfirmDel(null); showToast(tr("delete") + " ✓", "info"); }} className="btn-danger flex-1">{tr("delete")}</button>
        </div>
      </Modal>
    </div>
  );
}

function RateForm({ tr, lang, initial, onCancel, onSave }: {
  tr: (k: any) => string; lang: "en" | "bn"; initial: RepairEstimateRate | null;
  onCancel: () => void; onSave: (r: RepairEstimateRate) => void;
}) {
  const [r, setR] = useState<RepairEstimateRate>(initial ?? {
    rateId: generateEstimateRateId(),
    brand: "Samsung", model: "", issueType: "Screen Replacement",
    priceLow: 0, priceHigh: 0, turnaround: "Same day", notes: "",
  });
  const set = (k: keyof RepairEstimateRate, v: any) => setR((s) => ({ ...s, [k]: v }));
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!r.brand || !r.issueType) { showToast(tr("requiredFields"), "error"); return; }
    if (!r.turnaround.trim()) { showToast(tr("requiredFields"), "error"); return; }
    if (r.priceHigh < r.priceLow || r.priceLow < 0) { showToast(lang === "bn" ? "মূল্য সঠিক নয়" : "Price High must be ≥ Price Low", "error"); return; }
    onSave(r);
  };
  return (
    <Modal open onClose={onCancel} title={initial ? `${tr("update")} · ${r.rateId}` : tr("addRate")}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("brand")} *</label>
            <select className="glass-input" value={r.brand} onChange={(e) => set("brand", e.target.value)}>
              {ESTIMATE_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("issueType")} *</label>
            <select className="glass-input" value={r.issueType} onChange={(e) => set("issueType", e.target.value as EstimateIssueType)}>
              {ESTIMATE_ISSUES_EN.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("model")}</label>
          <input className="glass-input" value={r.model} onChange={(e) => set("model", e.target.value)} placeholder={tr("modelWildcardHint")} />
          <p className="text-[11px] text-text-muted mt-1">{tr("modelWildcardHint")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("priceLow")} *</label>
            <input type="number" min={0} className="glass-input" required value={r.priceLow} onChange={(e) => set("priceLow", Number(e.target.value))} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("priceHigh")} *</label>
            <input type="number" min={0} className="glass-input" required value={r.priceHigh} onChange={(e) => set("priceHigh", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("turnaround")} *</label>
          <input className="glass-input" required value={r.turnaround} onChange={(e) => set("turnaround", e.target.value)} placeholder="2–4 hours" />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("notes")}</label>
          <textarea rows={2} className="glass-input resize-none" value={r.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-glass flex-1">{tr("cancel")}</button>
          <button type="submit" className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </form>
    </Modal>
  );
}