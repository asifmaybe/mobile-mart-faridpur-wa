import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Plus, ClipboardList, Calendar as CalIcon, Settings as SettingsIcon,
  LogOut, Menu, Lock, Printer, ArrowRight, Trash2, Bell,
  Package, Users, TrendingUp, AlertTriangle, UserCog, Receipt as ReceiptIcon, ShoppingCart, Calculator,
  type LucideIcon,
} from "lucide-react";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { useI18n } from "../lib/i18n";
import {
  addJob, addReceipt, calculateReceiptTotals, deleteAppointment, deleteJob,
  generateReceiptNo, generateToken, getAppointments, getReceipts,
  getJobs, getSettings, getTechnicianById, getTechnicians, isAuthed, saveSettings,
  seedDemoData, setAuthed, updateJob,
  type Appointment, type Job, type JobStatus, type Receipt, type ReceiptItem, type Settings,
} from "../lib/storage";
import { Modal, STATUSES, StatusBadge, getStatusLabel, showToast } from "../lib/ui";
import { InventoryView } from "../components/admin/InventoryView";
import { TechniciansView } from "../components/admin/TechniciansView";
import { MarketPricesView, MarketPriceLookup } from "../components/admin/MarketPriceLookup";
import { ReceiptMakerView } from "../components/admin/ReceiptMaker";
import { ReceiptItemsPanel, ReceiptItemsList, ReceiptSummaryCard, emptyItem, openReceiptPrint, buildWhatsAppText } from "../components/admin/ReceiptItemsPanel";
import { BuySellView } from "../components/admin/BuySellView";
import { EstimateRatesView } from "../components/admin/EstimateRatesView";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Mak Electronics" }] }),
  component: AdminPage,
});

type Tab = "dashboard" | "new" | "jobs" | "appointments" | "inventory" | "buysell" | "technicians" | "market" | "estimates" | "receipts" | "settings";



function AdminPage() {
  const { tr, lang } = useI18n();
  const [authed, setAuthedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    seedDemoData();
    setAuthedState(isAuthed());
    setHydrated(true);
  }, []);


  if (!hydrated) return null;
  if (!authed) return <LoginScreen onLogin={() => setAuthedState(true)} />;
  return <AdminShell onLogout={() => { setAuthed(false); setAuthedState(false); }} tr={tr} lang={lang} />;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { tr, lang } = useI18n();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = getSettings();
    if (u === s.adminUsername && p === s.adminPassword) {
      setAuthed(true);
      onLogin();
    } else {
      setErr(true);
      setTimeout(() => setErr(false), 500);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className={`glass p-8 w-full max-w-sm fade-up ${err ? "shake" : ""}`}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto grid place-items-center mb-3" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)" }}>
            <Lock size={22} color="#FFFFFF" strokeWidth={2.2} />
          </div>
          <h1 className={`text-2xl font-bold ${lang === "bn" ? "bn" : ""}`}>{tr("adminPanel")}</h1>
          <p className="text-xs text-text-muted mt-1">{lang === "bn" ? "শুধুমাত্র অনুমোদিত কর্মীদের জন্য" : "Authorized staff only"}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("username")}</label>
            <input className="glass-input" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("password")}</label>
            <input className="glass-input" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
          </div>
        </div>
        {err && <p className="text-accent-red text-sm mt-3 text-center">{tr("invalidCreds")}</p>}
        <button type="submit" className="btn-primary w-full mt-5">{tr("login")} <ArrowRight size={16} /></button>
        <p className="text-xs text-text-muted text-center mt-4">Default: admin / repair2025</p>
        <Link to="/" className="block text-center text-xs text-accent-blue mt-3">← {lang === "bn" ? "হোম" : "Back to site"}</Link>
      </form>
    </div>
  );
}

function AdminShell({ onLogout, tr, lang }: { onLogout: () => void; tr: (k: any) => string; lang: "en" | "bn" }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const TABS: { id: Tab; Icon: LucideIcon; label: string }[] = [
    { id: "dashboard",    Icon: LayoutDashboard, label: tr("dashboard") },
    { id: "new",          Icon: Plus,            label: tr("newJob") },
    { id: "jobs",         Icon: ClipboardList,   label: tr("allJobs") },
    { id: "appointments", Icon: CalIcon,         label: tr("appointments") },
    { id: "inventory",    Icon: Package,         label: tr("inventoryTitle") },
    { id: "buysell",      Icon: ShoppingCart,    label: tr("buySellTitle") },

    { id: "market",       Icon: TrendingUp,      label: tr("marketPriceTrackerTitle") },
    { id: "estimates",    Icon: Calculator,      label: tr("estimateRatesTitle") },
    { id: "receipts",     Icon: ReceiptIcon,     label: tr("receiptMakerTitle") },
    { id: "settings",     Icon: SettingsIcon,    label: tr("settings") },
  ];


  const currentLabel = TABS.find((t) => t.id === tab)?.label ?? "";

  return (
    <div className="min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`${navOpen ? "block" : "hidden"} md:block fixed md:sticky inset-x-0 md:inset-x-auto top-0 md:top-0 md:h-screen z-30 md:w-60 p-4`}>
          <nav className="glass p-3 space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setNavOpen(false); }}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition ${
                  tab === t.id ? "bg-white/60 text-text-primary" : "text-text-secondary hover:bg-white/30"
                }`}
              >
                <t.Icon size={18} /> {t.label}
              </button>
            ))}
            <button
              onClick={onLogout}
              className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition text-accent-red hover:bg-white/30"
            >
              <LogOut size={18} /> {tr("logout")}
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6 min-w-0">
          {/* Mobile-only title bar with hamburger on the right */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{currentLabel}</h1>
            <button className="glass-pill w-10 h-10 grid place-items-center" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
              <Menu size={16} />
            </button>
          </div>

          {tab === "dashboard" && <Dashboard tr={tr} lang={lang} go={setTab} />}
          {tab === "new" && <NewJob tr={tr} lang={lang} go={setTab} />}
          {tab === "jobs" && <AllJobs tr={tr} lang={lang} />}
          {tab === "appointments" && <Appointments tr={tr} lang={lang} go={setTab} />}
          {tab === "inventory" && <InventoryView tr={tr} lang={lang} />}
          {tab === "buysell" && <BuySellView tr={tr} lang={lang} />}

          {tab === "market" && <MarketPricesView tr={tr} lang={lang} />}
          {tab === "estimates" && <EstimateRatesView tr={tr} lang={lang} />}
          {tab === "receipts" && <ReceiptMakerView tr={tr} lang={lang} />}
          {tab === "settings" && <SettingsView tr={tr} lang={lang} />}

        </main>
      </div>
    </div>
  );
}


function useJobsState() {
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => {
    const refresh = () => setJobs(getJobs());
    refresh();
    window.addEventListener("repairshop:change", refresh);
    return () => window.removeEventListener("repairshop:change", refresh);
  }, []);
  return jobs;
}

function Dashboard({ tr, go }: { tr: (k: any) => string; lang: "en" | "bn"; go: (t: Tab) => void }) {
  const jobs = useJobsState();
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const stats = {
    today: jobs.filter((j) => j.receivedDate === today).length,
    ready: jobs.filter((j) => j.status === "ready").length,
    inProg: jobs.filter((j) => j.status === "diagnosing" || j.status === "repairing").length,
    month: jobs.filter((j) => j.receivedDate.startsWith(thisMonth)).length,
  };
  const recent = jobs.slice(0, 10);

  const cards = [
    { label: tr("jobsToday"), value: stats.today, color: "from-accent-blue/30 to-accent-blue/5" },
    { label: tr("readyPickup"), value: stats.ready, color: "from-accent-green/30 to-accent-green/5" },
    { label: tr("inProgress"), value: stats.inProg, color: "from-accent-orange/30 to-accent-orange/5" },
    { label: tr("monthJobs"), value: stats.month, color: "from-accent-purple/30 to-accent-purple/5" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("dashboard")}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <div key={i} className="glass p-4 fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="label-caps">{c.label}</div>
            <div className="text-3xl md:text-4xl font-extrabold mt-2" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">{tr("recentJobs")}</h2>
          <button onClick={() => go("jobs")} className="text-xs text-accent-purple font-semibold inline-flex items-center gap-1">{tr("allJobs")} <ArrowRight size={12} /></button>
        </div>
        {recent.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center">{tr("noJobs")}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((j) => (
              <div key={j.token} className="glass-soft p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{j.token}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="text-xs text-text-muted truncate mt-1">{j.customerName} • {j.device}</div>
                </div>
                <button onClick={() => go("jobs")} className="btn-glass !py-2 !px-3 text-xs">{tr("update")}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewJob({ tr, lang, go }: { tr: (k: any) => string; lang: "en" | "bn"; go: (t: Tab) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState<Job>({
    token: "", customerName: "", customerPhone: "", device: "", issue: "",
    receivedDate: today, estimatedDate: tomorrow, status: "received", techNote: "",
    diagnosticNotes: "", assignedTechId: "", partsUsed: [],
    createdAt: new Date().toISOString(),
  });
  const [created, setCreated] = useState<{ job: Job; receipt: Receipt | null } | null>(null);
  const [lookup, setLookup] = useState(false);

  const [items, setItems] = useState<ReceiptItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [receiptNotes, setReceiptNotes] = useState("");
  const totals = useMemo(() => calculateReceiptTotals(items, discount, taxRate), [items, discount, taxRate]);

  const setF = <K extends keyof Job>(k: K, v: Job[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.device.trim() || !form.issue.trim()) {
      showToast(lang === "bn" ? "সব প্রয়োজনীয় ঘর পূরণ করুন" : "Fill all required fields", "error");
      return false;
    }
    return true;
  };

  const createJobAndReceipt = (): { job: Job; receipt: Receipt | null } | null => {
    if (!validate()) return null;
    const job: Job = { ...form, token: generateToken(), createdAt: new Date().toISOString() };
    addJob(job);
    const hasItems = items.some((i) => i.description.trim());
    let receipt: Receipt | null = null;
    if (hasItems) {
      const receiptNo = generateReceiptNo();
      receipt = {
        id: receiptNo + "-" + Date.now(),
        receiptNo, date: today,
        customerName: job.customerName, customerPhone: job.customerPhone,
        device: job.device, jobToken: job.token,
        items, ...totals, taxRate, notes: receiptNotes,
        createdAt: new Date().toISOString(),
      };
      addReceipt(receipt);
    }
    return { job, receipt };
  };

  const saveJob = () => {
    const res = createJobAndReceipt();
    if (!res) return;
    setCreated(res);
    showToast(tr("jobCreated"), "success");
    setForm({ ...form, customerName: "", customerPhone: "", device: "", issue: "", diagnosticNotes: "" });
    setItems([emptyItem()]);
    setDiscount(0); setTaxRate(0); setReceiptNotes("");
  };

  const printReceipt = () => {
    if (created?.receipt) openReceiptPrint(created.receipt);
    else if (created?.job) printSlip(created.job);
  };

  const shareCreatedWhatsApp = () => {
    if (!created) return;
    const phone = created.job.customerPhone.replace(/\D/g, "");
    const text = created.receipt
      ? buildWhatsAppText(created.receipt)
      : `Job ${created.job.token} created for ${created.job.customerName} — ${created.job.device}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const printSlip = (job: Job) => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>${job.token}</title><style>body{font-family:monospace;padding:24px;text-align:center}h1{font-size:28px;margin:8px 0}p{margin:4px 0;font-size:14px}.box{border:2px dashed #000;padding:16px;display:inline-block;min-width:260px}</style></head><body><div class="box"><div style="font-size:11px;letter-spacing:2px">RAKIB TELECOM</div><h1>${job.token}</h1><p><b>${job.customerName}</b></p><p>${job.customerPhone}</p><p>${job.device}</p><p>${job.issue}</p><p style="margin-top:12px;font-size:11px">Received: ${job.receivedDate}</p><p style="font-size:11px">Est: ${job.estimatedDate}</p></div><script>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("newJob")}</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div className="glass p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-caps mb-1.5 block">{tr("fullName")} *</label>
              <input className="glass-input" value={form.customerName} onChange={(e) => setF("customerName", e.target.value)} />
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("phone")} *</label>
              <input type="tel" className="glass-input" value={form.customerPhone} onChange={(e) => setF("customerPhone", e.target.value)} placeholder="8801XXXXXXXXX" />
            </div>
          </div>
          <div>
            <label className="label-caps mb-1.5 flex items-center justify-between">
              <span>{tr("device")} *</span>
              <button type="button" onClick={() => setLookup(true)} className="text-accent-purple inline-flex items-center gap-1 normal-case tracking-normal text-[11px]"><TrendingUp size={12} /> {tr("checkMarketPrice")}</button>
            </label>
            <input className="glass-input" value={form.device} onChange={(e) => setF("device", e.target.value)} placeholder="Samsung Galaxy A54" />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("issue")} *</label>
            <textarea rows={2} className="glass-input resize-none" value={form.issue} onChange={(e) => setF("issue", e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("diagnosticNotes")}</label>
            <textarea rows={3} className="glass-input resize-none" placeholder={tr("diagnosticNotesPlaceholder")} value={form.diagnosticNotes} onChange={(e) => setF("diagnosticNotes", e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-caps mb-1.5 block">{tr("received")}</label>
              <input type="date" className="glass-input" value={form.receivedDate} onChange={(e) => setF("receivedDate", e.target.value)} />
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("estCompletion")}</label>
              <input type="date" className="glass-input" value={form.estimatedDate} onChange={(e) => setF("estimatedDate", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("status")}</label>
            <select className="glass-input" value={form.status} onChange={(e) => setF("status", e.target.value as JobStatus)}>
              <option value="received">{getStatusLabel("received", lang)}</option>
              <option value="diagnosing">{getStatusLabel("diagnosing", lang)}</option>
            </select>
          </div>

          <ReceiptItemsList
            items={items} setItems={setItems}
            notes={receiptNotes} setNotes={setReceiptNotes}
            showNotes={false} tr={tr} lang={lang}
          />
        </div>

        <ReceiptSummaryCard
          discount={discount} setDiscount={setDiscount}
          taxRate={taxRate} setTaxRate={setTaxRate}
          totals={totals}
          onSaveAndPrint={saveJob}
          hideWhatsApp
          tr={tr} lang={lang} sticky
        />
      </div>


      <Modal open={!!created} onClose={() => setCreated(null)} title={lang === "bn" ? "প্রিন্ট প্রিভিউ" : "Print Preview"}>
        <div>
          <div className="text-center mb-4">
            
            <div className="label-caps">Token</div>
            <div className="text-2xl font-extrabold tracking-tight my-1">{created?.job.token}</div>
            <p className="text-sm text-text-secondary">{created?.job.customerName} • {created?.job.device}</p>
          </div>
          {created?.receipt && (
            <div className="glass-soft p-3 text-sm space-y-1 mb-4 max-h-64 overflow-y-auto">
              <div className="flex justify-between font-semibold border-b border-black/10 pb-1 mb-1">
                <span>{created.receipt.receiptNo}</span><span>{created.receipt.date}</span>
              </div>
              {created.receipt.items.filter((i) => i.description.trim()).map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="truncate pr-2">{i.description} × {i.qty}</span>
                  <span>৳{i.lineTotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t border-black/10 mt-2">
                <span>{tr("grandTotal")}</span><span>৳{created.receipt.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={printReceipt} className="btn-primary flex-1"><Printer size={16} /> {tr("print")}</button>
            <button onClick={() => setCreated(null)} className="btn-glass flex-1">{lang === "bn" ? "এড়িয়ে যান" : "Skip"}</button>
            <button onClick={shareCreatedWhatsApp} className="btn-glass flex-1"><WhatsAppIcon size={16} color="#25D366" /> {tr("shareWhatsApp")}</button>
          </div>
        </div>
      </Modal>


      {lookup && <MarketPriceLookup tr={tr} lang={lang} initialModel={form.device} onClose={() => setLookup(false)} />}
    </div>
  );
}



function AllJobs({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  const jobs = useJobsState();
  const settings = getSettings();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | JobStatus>("all");
  const [editing, setEditing] = useState<Job | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filter !== "all" && j.status !== filter) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return j.token.toLowerCase().includes(s) || j.customerName.toLowerCase().includes(s) || j.customerPhone.includes(s) || j.device.toLowerCase().includes(s);
    });
  }, [jobs, q, filter]);

  const notify = (j: Job) => {
    const url = settings.website;
    const lines = [
      `Hello ${j.customerName.split(" ")[0]}!`,
      ``,
      `Your device ${j.device} (Job Token: ${j.token}) is now ${getStatusLabel(j.status, "en").toUpperCase()}.`,
      ``,
      j.status === "ready" ? `✅ Your repair is COMPLETE and ready for pickup!\nVisit us: ${settings.hours}` :
      j.status === "repairing" ? `🔧 We are currently repairing your device.\nEstimated completion: ${j.estimatedDate}` :
      j.status === "delivered" ? `📦 Marked as delivered. Thank you for choosing us!` :
      `📥 We've received your device and will update you shortly.`,
      j.techNote ? `\nTech Note: ${j.techNote}` : "",
      ``,
      `Track: ${url}/track`,
      ``,
      `— ${settings.shopName} Team`,
    ].join("\n");
    const phone = j.customerPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("allJobs")}</h1>
      <input className="glass-input" placeholder={lang === "bn" ? "টোকেন, নাম, ফোন খুঁজুন..." : "Search token, name, phone, device..."} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition ${
              filter === s ? "bg-accent-purple/20 border-accent-purple/50 text-accent-purple" : "glass-pill"
            }`}
          >
            {s === "all" ? (lang === "bn" ? "সব" : "All") : getStatusLabel(s, lang)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass p-8 text-center text-text-muted text-sm">{tr("noJobs")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((j) => {
            const tech = j.assignedTechId ? getTechnicianById(j.assignedTechId) : null;
            const diagPending = j.status === "diagnosing" && !j.diagnosticNotes.trim();
            return (
              <div key={j.token} className={`glass p-4 ${diagPending ? "ring-1 ring-accent-orange/50" : ""}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="glass-pill px-3 py-1 text-xs font-bold">{j.token}</span>
                      <StatusBadge status={j.status} lang={lang} />
                      {tech && (
                        <span className="glass-pill px-2.5 py-1 text-[11px] inline-flex items-center gap-1"><UserCog size={11} /> {tech.name.split(" ")[0]}</span>
                      )}
                      {diagPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold text-accent-orange bg-accent-orange/15 border-accent-orange/40">
                          <AlertTriangle size={11} /> {tr("diagnosisPending")}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold mt-2">{j.customerName}</div>
                    <div className="text-xs text-text-muted">{j.customerPhone}</div>
                    <div className="text-sm mt-2">{j.device}</div>
                    <div className="text-xs text-text-muted">{j.issue}</div>
                    {j.diagnosticNotes && <DiagPreview text={j.diagnosticNotes} label={tr("diagnosticNotes")} />}
                    <div className="text-xs text-text-muted mt-1 inline-flex items-center gap-1"><CalIcon size={12} /> {j.receivedDate} → {j.estimatedDate}</div>
                    {j.techNote && <div className="text-xs mt-2 glass-soft p-2">{j.techNote}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setEditing(j)} className="btn-glass !py-2 !px-3 text-xs flex-1 sm:flex-none">{tr("update")}</button>
                  <button onClick={() => notify(j)} className="btn-primary !py-2 !px-3 text-xs flex-1 sm:flex-none"><Bell size={12} /> {tr("notify")}</button>
                  {(() => {
                    const rec = getReceipts().find((r) => r.jobToken === j.token);
                    if (!rec) return null;
                    return (
                      <button onClick={() => openReceiptPrint(rec)} className="btn-glass !py-2 !px-3 text-xs flex-1 sm:flex-none"><ReceiptIcon size={12} /> {lang === "bn" ? "রসিদ দেখুন" : "View Receipt"}</button>
                    );
                  })()}
                  <button onClick={() => setConfirmDel(j.token)} className="btn-danger !py-2 !px-3 text-xs"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {editing && <UpdateModal job={editing} onClose={() => setEditing(null)} tr={tr} lang={lang} />}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title={tr("confirmDelete")}>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmDel(null)} className="btn-glass flex-1">{lang === "bn" ? "বাতিল" : "Cancel"}</button>
          <button onClick={() => { if (confirmDel) { deleteJob(confirmDel); showToast(tr("delete") + " ✓", "info"); } setConfirmDel(null); }} className="btn-danger flex-1">{tr("delete")}</button>
        </div>
      </Modal>
    </div>
  );
}

function DiagPreview({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const truncated = text.length > 90 && !open ? text.slice(0, 90) + "…" : text;
  return (
    <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs mt-2 glass-soft p-2 text-left w-full block hover:bg-white/30 transition">
      <span className="label-caps text-[10px]">{label}</span>
      <span className="block mt-0.5 text-text-secondary">{truncated}</span>
    </button>
  );
}

function UpdateModal({ job, onClose, tr, lang }: { job: Job; onClose: () => void; tr: (k: any) => string; lang: "en" | "bn" }) {
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [note, setNote] = useState(job.techNote);
  const [diagnosticNotes, setDiagnosticNotes] = useState(job.diagnosticNotes);
  const [assignedTechId, setAssignedTechId] = useState(job.assignedTechId);
  const techs = getTechnicians().filter((t) => t.active || t.techId === job.assignedTechId);
  return (
    <Modal open onClose={onClose} title={`${tr("update")} • ${job.token}`}>
      <div className="space-y-3">
        <div>
          <label className="label-caps mb-1.5 block">{tr("status")}</label>
          <select className="glass-input" value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{getStatusLabel(s, lang)}</option>)}
          </select>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("reassignTechnician")}</label>
          <select className="glass-input" value={assignedTechId} onChange={(e) => setAssignedTechId(e.target.value)}>
            <option value="">{tr("unassigned")}</option>
            {techs.map((t) => <option key={t.techId} value={t.techId}>{t.name}{!t.active ? ` (${tr("inactive")})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("diagnosticNotes")}</label>
          <textarea rows={3} className="glass-input resize-none" placeholder={tr("diagnosticNotesPlaceholder")} value={diagnosticNotes} onChange={(e) => setDiagnosticNotes(e.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("techNote")} <span className="text-text-muted normal-case tracking-normal">({lang === "bn" ? "কাস্টমারকে পাঠানো হবে" : "sent to customer"})</span></label>
          <textarea rows={3} className="glass-input resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-glass flex-1">{lang === "bn" ? "বাতিল" : "Cancel"}</button>
          <button onClick={() => { updateJob(job.token, { status, techNote: note, diagnosticNotes, assignedTechId }); showToast(tr("saved")); onClose(); }} className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </div>
    </Modal>
  );
}

function Appointments({ tr, lang, go }: { tr: (k: any) => string; lang: "en" | "bn"; go: (t: Tab) => void }) {
  const [appts, setAppts] = useState<Appointment[]>([]);
  useEffect(() => {
    const r = () => setAppts(getAppointments());
    r(); window.addEventListener("repairshop:change", r);
    return () => window.removeEventListener("repairshop:change", r);
  }, []);

  const convert = (a: Appointment) => {
    // Prefill: create a job draft from appointment
    const job: Job = {
      token: generateToken(),
      customerName: a.customerName,
      customerPhone: a.customerPhone,
      device: `${a.brand} ${a.model}`.trim(),
      issue: a.problem + (a.notes ? ` — ${a.notes}` : ""),
      receivedDate: new Date().toISOString().slice(0, 10),
      estimatedDate: a.preferredDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      status: "received",
      techNote: "",
      diagnosticNotes: "",
      assignedTechId: "",
      partsUsed: [],
      createdAt: new Date().toISOString(),
    };
    addJob(job);
    deleteAppointment(a.ref);
    showToast(`${tr("jobCreated")} ${job.token}`);
    go("jobs");
  };


  return (
    <div className="space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("appointments")}</h1>
      {appts.length === 0 ? (
        <div className="glass p-8 text-center text-text-muted text-sm">{tr("noAppts")}</div>
      ) : (
        <div className="space-y-3">
          {appts.map((a) => (
            <div key={a.ref} className="glass p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="glass-pill px-3 py-1 text-xs font-bold">{a.ref}</span>
                <span className="text-xs text-text-muted inline-flex items-center gap-1"><CalIcon size={12} /> {a.preferredDate}</span>
              </div>
              <div className="font-semibold mt-2">{a.customerName}</div>
              <div className="text-xs text-text-muted">{a.customerPhone}</div>
              <div className="text-sm mt-2">{a.brand} {a.model} — {a.problem}</div>
              {a.notes && <div className="text-xs text-text-muted mt-1">{a.notes}</div>}
              <div className="flex gap-2 mt-4 flex-wrap">
                <button onClick={() => convert(a)} className="btn-primary !py-2 !px-3 text-xs flex-1 sm:flex-none">{tr("convert")} <ArrowRight size={12} /></button>
                <a href={`https://wa.me/${a.customerPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-glass !py-2 !px-3 text-xs flex-1 sm:flex-none inline-flex items-center gap-1"><WhatsAppIcon size={14} color="#25D366" /> WhatsApp</a>
                <button onClick={() => { deleteAppointment(a.ref); showToast(tr("delete") + " ✓", "info"); }} className="btn-danger !py-2 !px-3 text-xs"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  const [s, setS] = useState<Settings>(getSettings());
  const [newPass, setNewPass] = useState("");
  const setF = (k: keyof Settings, v: string) => setS((x) => ({ ...x, [k]: v }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...s, adminPassword: newPass.trim() || s.adminPassword };
    saveSettings(updated);
    setS(updated);
    setNewPass("");
    showToast(tr("saved"));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("settings")}</h1>
      <form onSubmit={save} className="glass p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-caps mb-1.5 block">{tr("shopName")} (EN)</label>
            <input className="glass-input" value={s.shopName} onChange={(e) => setF("shopName", e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("shopName")} (বাংলা)</label>
            <input className="glass-input bn" value={s.shopNameBn} onChange={(e) => setF("shopNameBn", e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("phone")}</label>
            <input className="glass-input" value={s.phone} onChange={(e) => setF("phone", e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("whatsappNumber")}</label>
            <input className="glass-input" value={s.whatsapp} onChange={(e) => setF("whatsapp", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("address")} (EN)</label>
          <input className="glass-input" value={s.address} onChange={(e) => setF("address", e.target.value)} />
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("address")} (বাংলা)</label>
          <input className="glass-input bn" value={s.addressBn} onChange={(e) => setF("addressBn", e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label-caps mb-1.5 block">{tr("email")}</label>
            <input className="glass-input" value={s.email} onChange={(e) => setF("email", e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("website")}</label>
            <input className="glass-input" value={s.website} onChange={(e) => setF("website", e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label-caps mb-1.5 block">{tr("hours")}</label>
          <input className="glass-input" value={s.hours} onChange={(e) => setF("hours", e.target.value)} />
        </div>
        <div className="pt-4 border-t border-black/10">
          <div className="label-caps mb-3 inline-flex items-center gap-1"><Lock size={12} /> {lang === "bn" ? "অ্যাডমিন" : "Admin Login"}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-caps mb-1.5 block">{tr("username")}</label>
              <input className="glass-input" value={s.adminUsername} onChange={(e) => setF("adminUsername", e.target.value)} />
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("changePass")}</label>
              <input type="password" className="glass-input" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder={lang === "bn" ? "খালি রাখলে অপরিবর্তিত" : "Leave blank to keep"} />
            </div>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full">{tr("save")}</button>
      </form>
    </div>
  );
}
