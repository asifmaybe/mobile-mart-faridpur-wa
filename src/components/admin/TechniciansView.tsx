import { useState } from "react";
import { Plus, Pencil, Trash2, Phone, AlertTriangle } from "lucide-react";
import {
  TECH_SPECIALTIES, deleteTechnician, generateTechId, getActiveJobCountForTech,
  getCompletedJobCountForTech, getTechnicians, upsertTechnician,
  type TechSpecialty, type Technician,
} from "../../lib/storage";
import { Modal, showToast } from "../../lib/ui";
import { useStorageRefresh } from "./useStorageRefresh";

export function TechniciansView({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  useStorageRefresh();
  const techs = getTechnicians();
  const [editing, setEditing] = useState<Technician | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Technician | null>(null);

  const onDelete = (t: Technician) => {
    if (getActiveJobCountForTech(t.techId) > 0) {
      showToast(lang === "bn" ? "চলমান জব আছে — ডিলিট সম্ভব নয়।" : "Has active jobs — cannot delete.", "error");
      return;
    }
    setConfirmDel(t);
  };

  return (
    <div className="space-y-4">
      <div className="hidden md:flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr("techniciansTitle")}</h1>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-4 text-sm"><Plus size={16} /> {tr("addTechnician")}</button>
      </div>
      <button onClick={() => setAdding(true)} className="md:hidden btn-primary w-full"><Plus size={16} /> {tr("addTechnician")}</button>

      {techs.length === 0 ? (
        <div className="glass p-8 text-center text-text-muted text-sm">{lang === "bn" ? "কোনো টেকনিশিয়ান নেই।" : "No technicians yet."}</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {techs.map((t) => {
            const activeJobs = getActiveJobCountForTech(t.techId);
            const done = getCompletedJobCountForTech(t.techId);
            return (
              <div key={t.techId} className="glass p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="glass-pill px-3 py-1 text-xs font-bold">{t.techId}</span>
                      {t.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold text-accent-green bg-accent-green/15 border-accent-green/40">{tr("active")}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold text-text-muted bg-black/5 border-black/10">{tr("inactive")}</span>
                      )}
                    </div>
                    <div className="font-semibold mt-2">{t.name}</div>
                    <a href={`tel:${t.phone}`} className="text-xs text-text-muted inline-flex items-center gap-1 mt-0.5"><Phone size={12} /> {t.phone}</a>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.specialties.map((s) => (
                        <span key={s} className="glass-pill px-2.5 py-1 text-[11px]">{s}</span>
                      ))}
                    </div>
                    <div className="text-xs text-text-secondary mt-3 flex gap-4">
                      <span><span className="font-semibold text-accent-purple">{activeJobs}</span> {tr("activeJobs").toLowerCase()}</span>
                      <span><span className="font-semibold text-accent-green">{done}</span> {tr("completedJobs").toLowerCase()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setEditing(t)} className="btn-glass !py-2 !px-3 text-xs flex-1"><Pencil size={14} /> {tr("update")}</button>
                  <button onClick={() => onDelete(t)} className="btn-danger !py-2 !px-3 text-xs"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(adding || editing) && (
        <TechForm tr={tr} lang={lang} initial={editing}
          onCancel={() => { setAdding(false); setEditing(null); }}
          onSave={(t) => { upsertTechnician(t); setAdding(false); setEditing(null); showToast(tr("saved")); }} />
      )}

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title={tr("confirmDelete")}>
        <p className="text-sm text-text-secondary mb-2 inline-flex items-center gap-1"><AlertTriangle size={14} className="text-accent-orange" /> {confirmDel?.name}</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmDel(null)} className="btn-glass flex-1">{tr("cancel")}</button>
          <button onClick={() => { if (confirmDel) deleteTechnician(confirmDel.techId); setConfirmDel(null); showToast(tr("delete") + " ✓", "info"); }} className="btn-danger flex-1">{tr("delete")}</button>
        </div>
      </Modal>
    </div>
  );
}

function TechForm({ tr, lang, initial, onCancel, onSave }: {
  tr: (k: any) => string; lang: "en" | "bn"; initial: Technician | null;
  onCancel: () => void; onSave: (t: Technician) => void;
}) {
  const [t, setT] = useState<Technician>(initial ?? {
    techId: generateTechId(), name: "", phone: "", specialties: ["General"], active: true,
  });
  const set = <K extends keyof Technician>(k: K, v: Technician[K]) => setT((s) => ({ ...s, [k]: v }));
  const toggleSpec = (s: TechSpecialty) => {
    setT((cur) => ({
      ...cur,
      specialties: cur.specialties.includes(s) ? cur.specialties.filter((x) => x !== s) : [...cur.specialties, s],
    }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t.name.trim()) { showToast(lang === "bn" ? "নাম দিন" : "Name required", "error"); return; }
    if (!/^01\d{9}$/.test(t.phone.replace(/\D/g, "").replace(/^88/, ""))) {
      showToast(lang === "bn" ? "সঠিক ফোন নম্বর দিন (01XXXXXXXXX)" : "Invalid Bangladeshi phone (01XXXXXXXXX)", "error");
      return;
    }
    onSave(t);
  };
  return (
    <Modal open onClose={onCancel} title={initial ? `${tr("update")} · ${t.techId}` : tr("addTechnician")}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label-caps mb-1.5 block">{tr("technicianName")} *</label>
          <input className="glass-input" required value={t.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("phone")} *</label>
          <input type="tel" className="glass-input" required placeholder="01XXXXXXXXX" value={t.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("specialties")}</label>
          <div className="flex flex-wrap gap-2">
            {TECH_SPECIALTIES.map((s) => {
              const on = t.specialties.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleSpec(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    on ? "bg-accent-purple/20 border-accent-purple/50 text-accent-purple" : "glass-pill"
                  }`}>{s}</button>
              );
            })}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={t.active} onChange={(e) => set("active", e.target.checked)} className="w-4 h-4" />
          <span className="text-sm">{tr("active")}</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn-glass flex-1">{tr("cancel")}</button>
          <button type="submit" className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </form>
    </Modal>
  );
}
