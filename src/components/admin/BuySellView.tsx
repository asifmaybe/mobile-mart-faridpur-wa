import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Pencil, Trash2, Search, ShoppingCart, Smartphone, Headphones,
  Package, Coins, TrendingUp, AlertTriangle, X, Upload, Crop,
} from "lucide-react";
import { Modal, showToast, StatusBadge } from "../../lib/ui";
import {
  ACCESSORY_CATEGORIES, deleteAccessory, deletePhone, generateAccessoryId, generatePhoneId,
  getAccessories, getPhones, recomputeAccessoryStatus, upsertAccessory, upsertPhone,
  type Accessory, type AccessoryCategory, type AccessoryStatus, type PhoneCondition,
  type PhoneStatus, type UsedPhone,
} from "../../lib/storage";
import { bdt } from "../../lib/wa";

const BRANDS = ["Samsung", "Apple", "Xiaomi", "Oppo", "Vivo", "Realme", "OnePlus", "Huawei", "Nokia", "Other"];
const CONDITIONS: PhoneCondition[] = ["Excellent", "Good", "Fair"];
const PHONE_STATUSES: PhoneStatus[] = ["Draft", "Listed", "Reserved", "Sold"];
const ACC_STATUSES: AccessoryStatus[] = ["In Stock", "Out of Stock", "Discontinued"];

const todayISO = () => new Date().toISOString();

export function BuySellView({ tr }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  const [sub, setSub] = useState<"phones" | "accessories">("phones");
  const [phones, setPhones] = useState<UsedPhone[]>([]);
  const [accs, setAccs] = useState<Accessory[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setPhones(await getPhones());
      setAccs(await getAccessories());
    };
    fetch();
    window.addEventListener("repairshop:change", fetch);
    return () => window.removeEventListener("repairshop:change", fetch);
  }, []);

  const listedCount = phones.filter((p) => p.status !== "Sold").length + accs.filter((a) => a.status !== "Discontinued").length;
  const soldPhones = phones.filter((p) => p.status === "Sold");
  const soldCount = soldPhones.length;
  const revenue = soldPhones.reduce((s, p) => s + p.sellingPrice, 0);
  const profit = soldPhones.reduce((s, p) => s + (p.sellingPrice - p.purchasePrice), 0);

  const summary = [
    { label: tr("totalListed"), value: listedCount, Icon: Package },
    { label: tr("totalSold"), value: soldCount, Icon: ShoppingCart },
    { label: tr("totalRevenue"), value: bdt(revenue), Icon: Coins },
    { label: tr("totalProfit"), value: bdt(profit), Icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      <h1 className="hidden md:block text-2xl font-bold inline-flex items-center gap-2">{tr("buySellTitle")}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((c, i) => (
          <div key={i} className="glass p-4">
            <div className="flex items-center justify-between">
              <div className="label-caps">{c.label}</div>
              <c.Icon size={16} className="text-accent-purple" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold mt-2" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setSub("phones")} className={`btn-glass !py-2 !px-3 text-xs ${sub === "phones" ? "!bg-white/70 !text-text-primary" : ""}`}>
          <Smartphone size={14} /> {tr("phones")}
        </button>
        <button onClick={() => setSub("accessories")} className={`btn-glass !py-2 !px-3 text-xs ${sub === "accessories" ? "!bg-white/70 !text-text-primary" : ""}`}>
          <Headphones size={14} /> {tr("accessories")}
        </button>
      </div>

      {sub === "phones" ? <PhonesAdmin tr={tr} phones={phones} /> : <AccessoriesAdmin tr={tr} accs={accs} />}
    </div>
  );
}

/* ---------------- Phones admin ---------------- */
function PhonesAdmin({ tr, phones }: { tr: (k: any) => string; phones: UsedPhone[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | PhoneStatus>("All");
  const [edit, setEdit] = useState<UsedPhone | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<UsedPhone | null>(null);

  const filtered = useMemo(() => phones.filter((p) => {
    if (status !== "All" && p.status !== status) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!(`${p.brand} ${p.model} ${p.id}`).toLowerCase().includes(s)) return false;
    }
    return true;
  }), [phones, q, status]);

  return (
    <div className="space-y-3">
      <div className="glass p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("search")} className="glass-input !pl-9 !py-2" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="glass-input !py-2 max-w-[160px]">
          {["All", ...PHONE_STATUSES].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-3 text-xs"><Plus size={14} /> {tr("addPhone")}</button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-muted text-sm py-6 text-center glass p-6">{tr("noPhones")}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="glass overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="p-3 label-caps">{tr("idLabel") || "ID"}</th>
                  <th className="p-3 label-caps">{tr("brand")}</th>
                  <th className="p-3 label-caps">{tr("conditionFilter")}</th>
                  <th className="p-3 label-caps text-right">{tr("sellingPrice")}</th>
                  <th className="p-3 label-caps">{tr("statusLabel") || "Status"}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-black/5">
                    <td className="p-3 text-xs text-text-muted">{p.id}</td>
                    <td className="p-3">
                      <div className="font-semibold">{p.brand} {p.model}</div>
                      <div className="text-xs text-text-muted">{p.storage} · {p.ram} · {p.batteryHealth}%</div>
                    </td>
                    <td className="p-3">{p.condition}</td>
                    <td className="p-3 text-right font-bold">
                      {bdt(p.sellingPrice)}
                      {p.status === "Sold" && (
                        <div className={`text-xs font-semibold ${p.sellingPrice - p.purchasePrice >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                          {p.sellingPrice - p.purchasePrice >= 0 ? "+" : ""}{bdt(p.sellingPrice - p.purchasePrice)}
                        </div>
                      )}
                    </td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <PhoneRowActions phone={p} tr={tr} onEdit={() => setEdit(p)} onDelete={() => setConfirm(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="glass p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{p.brand} {p.model}</div>
                    <div className="text-[11px] text-text-muted">{p.id} · {p.storage} · {p.ram} · {p.batteryHealth}%</div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <div className="font-bold">{bdt(p.sellingPrice)}</div>
                    {p.status === "Sold" && (
                      <div className={`text-xs font-semibold ${p.sellingPrice - p.purchasePrice >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                        {p.sellingPrice - p.purchasePrice >= 0 ? "+" : ""}{bdt(p.sellingPrice - p.purchasePrice)}
                      </div>
                    )}
                  </div>
                  <PhoneRowActions phone={p} tr={tr} onEdit={() => setEdit(p)} onDelete={() => setConfirm(p)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {adding && (
        <PhoneForm
          tr={tr}
          initial={null}
          onClose={() => setAdding(false)}
          onSave={(p) => { upsertPhone(p); showToast(tr("savedToast") || "Saved"); setAdding(false); }}
        />
      )}
      {edit && (
        <PhoneForm
          tr={tr}
          initial={edit}
          onClose={() => setEdit(null)}
          onSave={(p) => { upsertPhone(p); showToast(tr("savedToast") || "Saved"); setEdit(null); }}
        />
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={tr("confirmDelete") || "Delete?"}>
        {confirm && (
          <div className="space-y-3">
            <p className="text-sm">{confirm.brand} {confirm.model} ({confirm.id})</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="btn-glass flex-1">{tr("cancel")}</button>
              <button onClick={() => { deletePhone(confirm.id); setConfirm(null); }} className="btn-primary flex-1 !bg-accent-red">{tr("delete")}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PhoneRowActions({ phone, tr, onEdit, onDelete }: { phone: UsedPhone; tr: (k: any) => string; onEdit: () => void; onDelete: () => void }) {
  const flip = (next: PhoneStatus) => upsertPhone({ ...phone, status: next });
  return (
    <div className="inline-flex items-center gap-1.5">
      {phone.status !== "Sold" && (
        <button onClick={() => flip("Sold")} className="btn-glass !py-1.5 !px-2 text-[11px]">{tr("markSold") || "Sold"}</button>
      )}
      {phone.status === "Listed" && (
        <button onClick={() => flip("Reserved")} className="btn-glass !py-1.5 !px-2 text-[11px]">{tr("markReserved") || "Reserve"}</button>
      )}
      <button onClick={onEdit} aria-label="Edit" className="w-8 h-8 rounded-lg grid place-items-center glass-pill"><Pencil size={14} /></button>
      <button onClick={onDelete} aria-label="Delete" className="w-8 h-8 rounded-lg grid place-items-center glass-pill text-accent-red"><Trash2 size={14} /></button>
    </div>
  );
}

function PhoneForm({ tr, initial, onClose, onSave }: {
  tr: (k: any) => string; initial: UsedPhone | null;
  onClose: () => void; onSave: (p: UsedPhone) => void;
}) {
  const [p, setP] = useState<UsedPhone>(initial ?? {
    id: "", brand: "Samsung", model: "", storage: "", ram: "",
    batteryHealth: 100, condition: "Good", purchasePrice: 0, sellingPrice: 0,
    status: "Draft", photoUrl: "", notes: "", dateAdded: todayISO(),
    galleryUrls: [], shortDescription: "", imei: "", soldDate: "", warrantyTerms: "",
  });
  useEffect(() => {
    if (!initial) generatePhoneId().then((id) => setP((s) => ({ ...s, id })));
  }, [initial]);
  const set = <K extends keyof UsedPhone>(k: K, v: UsedPhone[K]) => setP((s) => ({ ...s, [k]: v }));

  const gallery = p.galleryUrls ?? [];
  const setGallery = (next: string[]) => set("galleryUrls", next);
  const [cropTarget, setCropTarget] = useState<{ index: number; src: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.brand.trim() || !p.model.trim()) { showToast(tr("requiredFields") || "Please fill required fields"); return; }
    if (p.purchasePrice < 0 || p.sellingPrice < 0 || p.batteryHealth < 0 || p.batteryHealth > 100) {
      showToast(tr("invalidValues") || "Invalid values"); return;
    }
    onSave({ ...p, dateAdded: p.dateAdded || todayISO(), photoUrl: p.galleryUrls?.[0] || "" });
  };

  const lossWarning = p.sellingPrice > 0 && p.purchasePrice > 0 && p.sellingPrice < p.purchasePrice;

  return (
    <Modal open onClose={onClose} title={initial ? tr("editPhone") : tr("addPhone")}>
      <form onSubmit={submit} className="space-y-3">
        <div className="mb-6 -mt-2">
          <PhoneStepper status={p.status} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tr("brand") + " *"}>
            <select value={p.brand} onChange={(e) => set("brand", e.target.value)} className="glass-input">
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label={tr("model") + " *"}>
            <input value={p.model} onChange={(e) => set("model", e.target.value)} className="glass-input" required />
          </Field>
          <Field label={tr("storage")}>
            <input value={p.storage} onChange={(e) => set("storage", e.target.value)} placeholder="128GB" className="glass-input" />
          </Field>
          <Field label={tr("ram")}>
            <input value={p.ram} onChange={(e) => set("ram", e.target.value)} placeholder="8GB" className="glass-input" />
          </Field>
          <Field label={tr("batteryHealthPct")}>
            <input type="number" min={0} max={100} value={p.batteryHealth} onChange={(e) => set("batteryHealth", Number(e.target.value))} className="glass-input" />
          </Field>
          <Field label={tr("conditionFilter")}>
            <select value={p.condition} onChange={(e) => set("condition", e.target.value as PhoneCondition)} className="glass-input">
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={tr("purchasePrice") + " ৳"}>
            <input type="number" min={0} value={p.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} className="glass-input" />
          </Field>
          <Field label={tr("sellingPrice") + " ৳"}>
            <input type="number" min={0} value={p.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} className="glass-input" />
          </Field>
          <Field label={tr("statusLabel") || "Status"}>
            <select value={p.status} onChange={(e) => set("status", e.target.value as PhoneStatus)} className="glass-input font-semibold">
              {PHONE_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={tr("dateAdded") || "Date Added"}>
            <input type="date" value={p.dateAdded.slice(0, 10)} onChange={(e) => set("dateAdded", new Date(e.target.value).toISOString())} className="glass-input" />
          </Field>
          <Field label="IMEI">
            <input value={p.imei || ""} onChange={(e) => set("imei", e.target.value)} placeholder="15-digit IMEI" className="glass-input" />
          </Field>
          <Field label="Warranty Terms">
            <input value={p.warrantyTerms || ""} onChange={(e) => set("warrantyTerms", e.target.value)} placeholder="e.g. 7 Days Replacement" className="glass-input" />
          </Field>
          {p.status === "Sold" && (
            <Field label="Sold Date">
              <input type="date" value={p.soldDate ? p.soldDate.slice(0, 10) : ""} onChange={(e) => set("soldDate", new Date(e.target.value).toISOString())} className="glass-input" />
            </Field>
          )}
        </div>
        <Field label={tr("photosLabel") || "Photos"}>
          <MultiPhotoUploader
            gallery={gallery}
            onGalleryChange={setGallery}
            onCropRequest={(index, src) => setCropTarget({ index, src })}
          />
        </Field>
        {cropTarget && (
          <PhotoCropModal
            src={cropTarget.src}
            onClose={() => setCropTarget(null)}
            onSave={(cropped) => {
              const next = [...gallery];
              next[cropTarget.index] = cropped;
              setGallery(next);
              setCropTarget(null);
            }}
          />
        )}
        <Field label={tr("shortDescription")}>
          <textarea
            value={p.shortDescription ?? ""}
            onChange={(e) => set("shortDescription", e.target.value)}
            rows={2}
            maxLength={240}
            placeholder={tr("shortDescriptionHint")}
            className="glass-input"
          />
          <div className="text-[11px] text-text-muted mt-1">{(p.shortDescription ?? "").length}/200</div>
        </Field>
        <Field label={tr("notesLabel") || "Notes"}>
          <textarea value={p.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="glass-input" />
        </Field>
        {lossWarning && (
          <div className="text-xs inline-flex items-center gap-1.5 text-accent-orange"><AlertTriangle size={14} /> {tr("sellingBelowCost") || "Selling below purchase price"}</div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-glass flex-1">{tr("cancel")}</button>
          <button type="submit" className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Accessories admin ---------------- */
function AccessoriesAdmin({ tr, accs }: { tr: (k: any) => string; accs: Accessory[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | AccessoryStatus>("All");
  const [edit, setEdit] = useState<Accessory | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<Accessory | null>(null);

  const filtered = useMemo(() => accs.filter((a) => {
    if (status !== "All" && a.status !== status) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!(`${a.name} ${a.brand} ${a.id}`).toLowerCase().includes(s)) return false;
    }
    return true;
  }), [accs, q, status]);

  return (
    <div className="space-y-3">
      <div className="glass p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("search")} className="glass-input !pl-9 !py-2" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="glass-input !py-2 max-w-[160px]">
          {["All", ...ACC_STATUSES].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setAdding(true)} className="btn-primary !py-2 !px-3 text-xs"><Plus size={14} /> {tr("addAccessory")}</button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-muted text-sm py-6 text-center glass p-6">{tr("noAccessories")}</p>
      ) : (
        <>
          <div className="glass overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left">
                  <th className="p-3 label-caps">{tr("idLabel") || "ID"}</th>
                  <th className="p-3 label-caps">{tr("nameLabel") || "Name"}</th>
                  <th className="p-3 label-caps">{tr("category")}</th>
                  <th className="p-3 label-caps text-right">{tr("sellingPrice")}</th>
                  <th className="p-3 label-caps text-right">{tr("stockQty") || "Stock"}</th>
                  <th className="p-3 label-caps">{tr("statusLabel") || "Status"}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-black/5">
                    <td className="p-3 text-xs text-text-muted">{a.id}</td>
                    <td className="p-3">
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-xs text-text-muted">{a.brand}</div>
                    </td>
                    <td className="p-3">{a.category}</td>
                    <td className="p-3 text-right font-bold">{bdt(a.sellingPrice)}</td>
                    <td className="p-3 text-right">{a.stockQuantity}</td>
                    <td className="p-3"><StatusBadge status={a.status as any} /></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => setEdit(a)} aria-label="Edit" className="w-8 h-8 rounded-lg grid place-items-center glass-pill"><Pencil size={14} /></button>
                      <button onClick={() => setConfirm(a)} aria-label="Delete" className="w-8 h-8 rounded-lg grid place-items-center glass-pill text-accent-red ml-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden space-y-2">
            {filtered.map((a) => (
              <div key={a.id} className="glass p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{a.name}</div>
                    <div className="text-[11px] text-text-muted">{a.id} · {a.category} · {a.brand}</div>
                  </div>
                  <StatusBadge status={a.status as any} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-bold">{bdt(a.sellingPrice)} <span className="text-xs font-normal text-text-muted">· {a.stockQuantity} {tr("stockQty") || "qty"}</span></div>
                  <div className="inline-flex items-center gap-1.5">
                    <button onClick={() => setEdit(a)} aria-label="Edit" className="w-8 h-8 rounded-lg grid place-items-center glass-pill"><Pencil size={14} /></button>
                    <button onClick={() => setConfirm(a)} aria-label="Delete" className="w-8 h-8 rounded-lg grid place-items-center glass-pill text-accent-red"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {adding && (
        <AccessoryForm tr={tr} initial={null} onClose={() => setAdding(false)} onSave={(a) => { upsertAccessory(a); showToast(tr("savedToast") || "Saved"); setAdding(false); }} />
      )}
      {edit && (
        <AccessoryForm tr={tr} initial={edit} onClose={() => setEdit(null)} onSave={(a) => { upsertAccessory(a); showToast(tr("savedToast") || "Saved"); setEdit(null); }} />
      )}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={tr("confirmDelete") || "Delete?"}>
        {confirm && (
          <div className="space-y-3">
            <p className="text-sm">{confirm.name} ({confirm.id})</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(null)} className="btn-glass flex-1">{tr("cancel")}</button>
              <button onClick={() => { deleteAccessory(confirm.id); setConfirm(null); }} className="btn-primary flex-1 !bg-accent-red">{tr("delete")}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AccessoryForm({ tr, initial, onClose, onSave }: {
  tr: (k: any) => string; initial: Accessory | null;
  onClose: () => void; onSave: (a: Accessory) => void;
}) {
  const [a, setA] = useState<Accessory>(initial ?? {
    id: "", name: "", category: "Power Bank", brand: "",
    purchasePrice: 0, sellingPrice: 0, stockQuantity: 0, photoUrl: "",
    status: "In Stock", dateAdded: todayISO(),
  });
  useEffect(() => {
    if (!initial) generateAccessoryId().then((id) => setA((s) => ({ ...s, id })));
  }, [initial]);
  const set = <K extends keyof Accessory>(k: K, v: Accessory[K]) => setA((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.name.trim()) { showToast(tr("requiredFields") || "Please fill required fields"); return; }
    if (a.purchasePrice < 0 || a.sellingPrice < 0 || a.stockQuantity < 0) { showToast(tr("invalidValues") || "Invalid values"); return; }
    onSave(recomputeAccessoryStatus({ ...a, dateAdded: a.dateAdded || todayISO() }));
  };

  const lossWarning = a.sellingPrice > 0 && a.purchasePrice > 0 && a.sellingPrice < a.purchasePrice;

  return (
    <Modal open onClose={onClose} title={initial ? tr("editAccessory") : tr("addAccessory")}>
      <form onSubmit={submit} className="space-y-3">
        <Field label={(tr("nameLabel") || "Name") + " *"}>
          <input value={a.name} onChange={(e) => set("name", e.target.value)} className="glass-input" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tr("category")}>
            <select value={a.category} onChange={(e) => set("category", e.target.value as AccessoryCategory)} className="glass-input">
              {ACCESSORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={tr("brand")}>
            <input value={a.brand} onChange={(e) => set("brand", e.target.value)} className="glass-input" />
          </Field>
          <Field label={tr("purchasePrice") + " ৳"}>
            <input type="number" min={0} value={a.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} className="glass-input" />
          </Field>
          <Field label={tr("sellingPrice") + " ৳"}>
            <input type="number" min={0} value={a.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} className="glass-input" />
          </Field>
          <Field label={tr("stockQty") || "Stock Quantity"}>
            <input type="number" min={0} value={a.stockQuantity} onChange={(e) => set("stockQuantity", Number(e.target.value))} className="glass-input" />
          </Field>
          <Field label={tr("statusLabel") || "Status"}>
            <select value={a.status} onChange={(e) => set("status", e.target.value as AccessoryStatus)} className="glass-input">
              {ACC_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={tr("dateAdded") || "Date Added"}>
            <input type="date" value={a.dateAdded.slice(0, 10)} onChange={(e) => set("dateAdded", new Date(e.target.value).toISOString())} className="glass-input" />
          </Field>
          <Field label={tr("photoUrl") || "Photo"}>
            <div className="flex gap-3 items-end">
              {a.photoUrl ? (
                <div className="relative shrink-0 rounded-xl overflow-hidden shadow-md border border-white/20" style={{ width: 72, aspectRatio: "3/4" }}>
                  <img src={a.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col gap-1.5 items-center justify-center backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => set("photoUrl", "")}
                      className="flex items-center gap-1 text-[10px] font-semibold text-white bg-red-500/60 hover:bg-red-500/80 rounded-lg px-2 py-1 transition-colors"
                    >
                      <X size={11} /> Remove
                    </button>
                  </div>
                </div>
              ) : null}
              <label
                className="shrink-0 rounded-xl border-2 border-dashed border-accent-purple/40 hover:border-accent-purple/80 hover:bg-accent-purple/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-text-muted hover:text-accent-purple"
                style={{ width: 72, aspectRatio: "3/4" }}
              >
                <Upload size={18} />
                <span className="text-[9px] font-semibold tracking-wide">Upload</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const img = await loadImageFromFile(file);
                    set("photoUrl", compressToDataUrl(img));
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </Field>
        </div>
        {lossWarning && (
          <div className="text-xs inline-flex items-center gap-1.5 text-accent-orange"><AlertTriangle size={14} /> {tr("sellingBelowCost") || "Selling below purchase price"}</div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-glass flex-1">{tr("cancel")}</button>
          <button type="submit" className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ text }: { text: string }) {
  const cls =
    text === "In Stock" ? "bg-accent-green/20 text-accent-green border-accent-green/40" :
    text === "Sold" || text === "Discontinued" ? "bg-text-muted/20 text-text-muted border-text-muted/30" :
    "bg-accent-red/20 text-accent-red border-accent-red/40";
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}>{text}</span>;
}

function PhoneStepper({ status }: { status: PhoneStatus }) {
  const STAGES: PhoneStatus[] = ["Draft", "Listed", "Reserved", "Sold"];
  const currentIndex = STAGES.indexOf(status);
  return (
    <div className="relative pt-6 pb-2 px-2 flex justify-between">
      <div className="absolute top-[34px] left-8 right-8 h-1 bg-black/10 -z-10 rounded-full" />
      <div 
        className="absolute top-[34px] left-8 h-1 bg-accent-purple -z-10 rounded-full transition-all duration-700" 
        style={{ width: `calc(${(Math.max(currentIndex, 0) / (STAGES.length - 1)) * 100}% - ${currentIndex === 0 ? 0 : 32}px)` }} 
      />
      {STAGES.map((s, i) => {
        const past = i <= currentIndex;
        const current = i === currentIndex;
        return (
          <div key={s} className="flex flex-col items-center gap-1.5 w-16 relative">
            <div className={`w-5 h-5 rounded-full grid place-items-center transition-all duration-500 ${
              current ? "bg-accent-purple text-white shadow-[0_0_12px_rgba(124,111,232,0.5)] scale-125" :
              past ? "bg-accent-purple text-white" :
              "bg-white border-2 border-black/10 text-transparent"
            }`}>
              <div className="w-1.5 h-1.5 bg-current rounded-full" />
            </div>
            <div className={`text-[10px] font-bold ${current ? "text-accent-purple" : past ? "text-text-primary" : "text-text-muted"}`}>
              {s}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MAX_PHOTOS = 7;
const OUT_W = 900;
const OUT_H = 1200; // 3:4

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressToDataUrl(img: HTMLImageElement): string {
  // Scale to max 1200px on long edge while keeping aspect ratio
  const MAX = 1200;
  let w = img.naturalWidth, h = img.naturalHeight;
  if (w > MAX || h > MAX) {
    const r = Math.min(MAX / w, MAX / h);
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/webp", 0.88);
}

// ── MultiPhotoUploader ────────────────────────────────────────────────────────
function MultiPhotoUploader({
  gallery,
  onGalleryChange,
  onCropRequest,
}: {
  gallery: string[];
  onGalleryChange: (next: string[]) => void;
  onCropRequest: (index: number, src: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - gallery.length;
    if (remaining <= 0) { showToast(`Max ${MAX_PHOTOS} photos allowed`); return; }
    const toProcess = files.slice(0, remaining);
    const newUrls: string[] = [];
    for (const file of toProcess) {
      const img = await loadImageFromFile(file);
      newUrls.push(compressToDataUrl(img));
    }
    onGalleryChange([...gallery, ...newUrls]);
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) => onGalleryChange(gallery.filter((_, idx) => idx !== i));

  return (
    <div>
      {/* Thumbnail grid */}
      <div className="flex flex-wrap gap-2 items-end mb-3">
        {gallery.map((src, i) => (
          <div
            key={i}
            className="relative shrink-0 rounded-xl overflow-hidden shadow-md border border-white/20"
            style={{ width: 72, aspectRatio: "3/4" }}
          >
            <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />

            {/* Primary badge */}
            {i === 0 && (
              <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-accent-purple/90 to-transparent text-[9px] text-white text-center pt-1 pb-2 font-bold tracking-wide">
                PRIMARY
              </div>
            )}

            {/* Hover overlay: Crop + Remove */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col gap-1.5 items-center justify-center backdrop-blur-[2px]">
              <button
                type="button"
                onClick={() => onCropRequest(i, src)}
                className="flex items-center gap-1 text-[10px] font-semibold text-white bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1 transition-colors"
              >
                <Crop size={11} /> Adjust
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="flex items-center gap-1 text-[10px] font-semibold text-white bg-red-500/60 hover:bg-red-500/80 rounded-lg px-2 py-1 transition-colors"
              >
                <X size={11} /> Remove
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        {gallery.length < MAX_PHOTOS && (
          <label
            className="relative shrink-0 rounded-xl border-2 border-dashed border-accent-purple/40 hover:border-accent-purple/80 hover:bg-accent-purple/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-text-muted hover:text-accent-purple"
            style={{ width: 72, aspectRatio: "3/4" }}
          >
            <Upload size={18} />
            <span className="text-[9px] font-semibold tracking-wide">
              {gallery.length === 0 ? "Add Photos" : `${gallery.length}/${MAX_PHOTOS}`}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </label>
        )}
      </div>

      {/* Hint */}
      <p className="text-[11px] text-text-muted">
        {gallery.length === 0
          ? "Upload up to 7 photos. First photo becomes the primary listing image."
          : `${gallery.length} of ${MAX_PHOTOS} photos · First is primary · Click any photo to adjust crop`}
      </p>
    </div>
  );
}

// ── PhotoCropModal ────────────────────────────────────────────────────────────
function PhotoCropModal({
  src,
  onClose,
  onSave,
}: {
  src: string;
  onClose: () => void;
  onSave: (cropped: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const minZoomRef = useRef(1); // minimum zoom to always fill the canvas

  // State for pan & zoom
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Display scale: canvas is OUT_W wide, display is DISPLAY_W px — used to scale drag deltas
  const DISPLAY_H = 400;
  const DISPLAY_W = Math.round(DISPLAY_H * OUT_W / OUT_H); // 300
  const displayScale = OUT_W / DISPLAY_W; // 3.0

  // Helper: clamp offset so image always fully covers the 3:4 canvas
  const clampOffset = (z: number, ox: number, oy: number) => {
    const img = imgRef.current;
    if (!img) return { x: ox, y: oy };
    const drawW = img.naturalWidth * z;
    const drawH = img.naturalHeight * z;
    const maxX = Math.max(0, (drawW - OUT_W) / 2);
    const maxY = Math.max(0, (drawH - OUT_H) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  };

  // Load image and compute initial zoom to fill 3:4 crop
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const cropRatio = OUT_W / OUT_H;
      const minZoom = imgRatio > cropRatio
        ? OUT_H / img.naturalHeight
        : OUT_W / img.naturalWidth;
      minZoomRef.current = minZoom;
      setZoom(minZoom);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  // Redraw canvas whenever zoom/offset changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    const drawW = img.naturalWidth * zoom;
    const drawH = img.naturalHeight * zoom;
    const x = (OUT_W - drawW) / 2 + offset.x;
    const y = (OUT_H - drawH) / 2 + offset.y;
    ctx.clearRect(0, 0, OUT_W, OUT_H);
    ctx.drawImage(img, x, y, drawW, drawH);
  }, [zoom, offset]);

  // ── Pointer events ──────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    // Scale display-pixel deltas to canvas-pixel deltas
    const dx = (e.clientX - lastPos.current.x) * displayScale;
    const dy = (e.clientY - lastPos.current.y) * displayScale;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => clampOffset(zoom, o.x + dx, o.y + dy));
  };
  const onPointerUp = () => { dragging.current = false; };

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const newZ = Math.max(minZoomRef.current, Math.min(10, z * (e.deltaY < 0 ? 1.08 : 0.93)));
      // Re-clamp offset for the new zoom level
      setOffset((o) => clampOffset(newZ, o.x, o.y));
      return newZ;
    });
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/webp", 0.88));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
    >
      <div className="glass rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ maxWidth: 380, width: "100%" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
          <div>
            <div className="font-bold text-sm">Adjust Photo</div>
            <div className="text-[11px] text-text-muted mt-0.5">Drag to pan · Scroll to zoom · Output: 3:4</div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex items-center justify-center bg-black/30 p-4">
          <div
            className="rounded-xl overflow-hidden shadow-inner border border-white/20"
            style={{ width: DISPLAY_W, height: DISPLAY_H, cursor: "grab" }}
          >
            <canvas
              ref={canvasRef}
              width={OUT_W}
              height={OUT_H}
              style={{ width: DISPLAY_W, height: DISPLAY_H, display: "block", touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              onWheel={onWheel}
            />
          </div>
        </div>

        {/* Zoom slider */}
        <div className="px-5 pb-3 flex items-center gap-3">
          <span className="text-[11px] text-text-muted w-8">Zoom</span>
          <input
            type="range"
            min={minZoomRef.current}
            max={10}
            step={0.001}
            value={zoom}
            onChange={(e) => {
              const newZ = Number(e.target.value);
              setZoom(newZ);
              setOffset((o) => clampOffset(newZ, o.x, o.y));
            }}
            className="flex-1 accent-[#7C6FE8]"
          />
          <span className="text-[11px] text-text-muted w-10 text-right">{(zoom * 100).toFixed(0)}%</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button type="button" onClick={onClose} className="btn-glass flex-1 text-sm py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all"
            style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)" }}
          >
            Save Crop
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
