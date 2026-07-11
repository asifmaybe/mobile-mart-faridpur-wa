import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Plus, ClipboardList, Settings as SettingsIcon,
  LogOut, Menu, Lock, Printer, ArrowRight, Trash2,
  Package, TrendingUp, Receipt as ReceiptIcon, ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { useI18n } from "../lib/i18n";
import {
  addMemo, addReceipt, calculateReceiptTotals, getMemos, getSettings, getCachedSettings, saveSettings, isAuthed,
  generateReceiptNo, seedDemoData, setAuthed, getPhones, getAccessories,
  type Memo, type Receipt, type ReceiptItem, updateMemo, deleteMemo, generateToken
} from "../lib/storage";
import { showToast, Modal } from "../lib/ui";

import { emptyItem, openReceiptPrint, buildWhatsAppText, ReceiptItemsList, ReceiptSummaryCard } from "../components/admin/ReceiptItemsPanel";
import { BuySellView } from "../components/admin/BuySellView";

export const Route = createFileRoute("/adminfmm")({
  head: () => ({ meta: [{ title: "Admin | Faridpur Mobile Mart" }] }),
  component: AdminPage,
});

type Tab = "dashboard" | "new" | "memos" | "buysell";

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


// The recovery code that unlocks password reset (share this only with the shop owner)
const RECOVERY_CODE = "MART-RESET-2025";

function ForgotPasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"code" | "newpass">("code");
  const [code, setCode] = useState("");
  const [codeErr, setCodeErr] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passErr, setPassErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Reset internal state when modal closes
  const handleClose = () => {
    setStep("code"); setCode(""); setCodeErr(false);
    setNewPass(""); setConfirmPass(""); setPassErr("");
    setDone(false); setSaving(false);
    onClose();
  };

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === RECOVERY_CODE) {
      setCodeErr(false);
      setStep("newpass");
    } else {
      setCodeErr(true);
      setTimeout(() => setCodeErr(false), 600);
    }
  };

  const saveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassErr("Password must be at least 6 characters."); return; }
    if (newPass !== confirmPass) { setPassErr("Passwords do not match."); return; }
    setSaving(true);
    const s = await getSettings();
    await saveSettings({ ...s, adminPassword: newPass });
    setSaving(false);
    setDone(true);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Reset Admin Password">
      {done ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 rounded-full bg-accent-green/15 grid place-items-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5BB890" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p className="font-semibold text-text-primary">Password updated!</p>
          <p className="text-sm text-text-secondary">You can now log in with your new password.</p>
          <button className="btn-primary w-full" onClick={handleClose}>Back to Login</button>
        </div>
      ) : step === "code" ? (
        <form onSubmit={verifyCode} className={`space-y-4 ${codeErr ? "shake" : ""}`}>
          <div>
            <label className="label-caps mb-1.5 block">Recovery Code</label>
            <input
              className="glass-input"
              type="password"
              placeholder="Enter recovery code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            {codeErr && <p className="text-accent-red text-xs mt-1.5">Incorrect recovery code.</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn-glass flex-1" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1">Verify</button>
          </div>
        </form>
      ) : (
        <form onSubmit={saveNewPassword} className="space-y-4">
          <p className="text-sm text-text-secondary">Recovery code verified. Set your new password below.</p>
          <div>
            <label className="label-caps mb-1.5 block">New Password</label>
            <input
              className="glass-input"
              type="password"
              placeholder="Min. 6 characters"
              value={newPass}
              onChange={(e) => { setNewPass(e.target.value); setPassErr(""); }}
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Confirm New Password</label>
            <input
              className="glass-input"
              type="password"
              placeholder="Repeat new password"
              value={confirmPass}
              onChange={(e) => { setConfirmPass(e.target.value); setPassErr(""); }}
              autoComplete="new-password"
            />
          </div>
          {passErr && <p className="text-accent-red text-xs">{passErr}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" className="btn-glass flex-1" onClick={() => setStep("code")}>Back</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving…" : "Save Password"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { tr, lang } = useI18n();
  const [p, setP] = useState("");
  const [err, setErr] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = await getSettings();
    if (p === s.adminPassword) {
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
            <input
              className="glass-input opacity-70 cursor-not-allowed"
              value="admin"
              readOnly
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("password")}</label>
            <input
              className="glass-input"
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>
        </div>
        {err && <p className="text-accent-red text-sm mt-3 text-center">{tr("invalidCreds")}</p>}
        <button type="submit" className="btn-primary w-full mt-5">{tr("login")} <ArrowRight size={16} /></button>
        <button
          type="button"
          className="block w-full text-center text-xs text-accent-blue mt-3 hover:underline"
          onClick={() => setShowReset(true)}
        >
          Forgot password ?
        </button>
        <Link to="/" className="block text-center text-xs text-text-muted mt-2">← {lang === "bn" ? "হোম" : "Back to site"}</Link>
      </form>
      <ForgotPasswordModal open={showReset} onClose={() => setShowReset(false)} />
    </div>
  );
}


function AdminShell({ onLogout, tr, lang }: { onLogout: () => void; tr: (k: any) => string; lang: "en" | "bn" }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  const TABS: { id: Tab; Icon: LucideIcon; label: string }[] = [
    { id: "dashboard",    Icon: LayoutDashboard, label: tr("dashboard") },
    { id: "new",          Icon: Plus,            label: tr("newMemo") },
    { id: "memos",        Icon: ClipboardList,   label: tr("allMemos") },
    { id: "buysell",      Icon: ShoppingCart,    label: tr("inventoryTitle") },
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
          <div className="md:hidden flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{currentLabel}</h1>
            <button className="glass-pill w-10 h-10 grid place-items-center" onClick={() => setNavOpen((o) => !o)} aria-label="Menu">
              <Menu size={16} />
            </button>
          </div>

          {tab === "dashboard" && <Dashboard tr={tr} lang={lang} go={setTab} />}
          {tab === "new" && <NewMemo tr={tr} lang={lang} go={setTab} />}
          {tab === "memos" && <AllMemos tr={tr} lang={lang} />}
          {tab === "buysell" && <BuySellView tr={tr} lang={lang} />}
        </main>
      </div>
    </div>
  );
}

function useMemosState() {
  const [memos, setMemos] = useState<Memo[]>([]);
  useEffect(() => {
    const refresh = async () => setMemos(await getMemos());
    refresh();
    window.addEventListener("repairshop:change", refresh);
    return () => window.removeEventListener("repairshop:change", refresh);
  }, []);
  return memos;
}

function Dashboard({ tr, go }: { tr: (k: any) => string; lang: "en" | "bn"; go: (t: Tab) => void }) {
  const memos = useMemosState();
  const today = new Date().toISOString().slice(0, 10);
  
  const [phonesAvailable, setPhonesAvailable] = useState(0);
  const [phonesSold, setPhonesSold] = useState(0);
  const [lowStockAcc, setLowStockAcc] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      const allPhones = await getPhones();
      setPhonesAvailable(allPhones.filter(p => p.status === "Listed").length);
      setPhonesSold(allPhones.filter(p => p.status === "Sold").length);
      const accs = await getAccessories();
      setLowStockAcc(accs.filter(a => a.stockQuantity <= 2 && a.status !== "Discontinued").length);
    };
    refresh();
    window.addEventListener("repairshop:change", refresh);
    return () => window.removeEventListener("repairshop:change", refresh);
  }, []);

  const stats = {
    memosToday: memos.filter((m) => m.date === today).length,
    phonesAvailable,
    phonesSold,
    lowStockAcc
  };
  const recent = memos.slice(0, 10);

  const cards = [
    { label: tr("memosToday"), value: stats.memosToday, color: "from-accent-blue/30 to-accent-blue/5" },
    { label: tr("phonesAvailable"), value: stats.phonesAvailable, color: "from-accent-green/30 to-accent-green/5" },
    { label: tr("phonesSold"), value: stats.phonesSold, color: "from-accent-purple/30 to-accent-purple/5" },
    { label: tr("lowStockAcc"), value: stats.lowStockAcc, color: "from-accent-orange/30 to-accent-orange/5" },
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
          <h2 className="font-bold">{tr("recentMemos")}</h2>
          <button onClick={() => go("memos")} className="text-xs text-accent-purple font-semibold inline-flex items-center gap-1">{tr("allMemos")} <ArrowRight size={12} /></button>
        </div>
        {recent.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center">{tr("noMemos")}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.token} className="glass-soft p-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{m.token}</span>
                  </div>
                  <div className="text-xs text-text-muted truncate mt-1">{m.customerName} • {m.device}</div>
                </div>
                <button onClick={() => go("memos")} className="btn-glass !py-2 !px-3 text-xs">{tr("update")}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewMemo({ tr, lang, go }: { tr: (k: any) => string; lang: "en" | "bn"; go: (t: Tab) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<Memo>({
    token: "", customerName: "", customerPhone: "", device: "", note: "",
    date: today,
    createdAt: new Date().toISOString(),
  });
  const [created, setCreated] = useState<{ memo: Memo; receipt: Receipt | null } | null>(null);

  const [items, setItems] = useState<ReceiptItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [receiptNotes, setReceiptNotes] = useState("");
  const totals = useMemo(() => calculateReceiptTotals(items, discount, taxRate), [items, discount, taxRate]);

  const setF = <K extends keyof Memo>(k: K, v: Memo[K]) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.device.trim()) {
      showToast(lang === "bn" ? "সব প্রয়োজনীয় ঘর পূরণ করুন" : "Fill all required fields", "error");
      return false;
    }
    return true;
  };

  const createMemoAndReceipt = async (): Promise<{ memo: Memo; receipt: Receipt | null } | null> => {
    if (!validate()) return null;
    const memo: Memo = { ...form, token: await generateToken(), createdAt: new Date().toISOString() };
    addMemo(memo);
    const hasItems = items.some((i) => i.description.trim());
    let receipt: Receipt | null = null;
    if (hasItems) {
      const receiptNo = await generateReceiptNo();
      receipt = {
        id: receiptNo + "-" + Date.now(),
        receiptNo, date: today,
        customerName: memo.customerName, customerPhone: memo.customerPhone,
        device: memo.device, jobToken: memo.token,
        items, ...totals, taxRate, notes: receiptNotes,
        createdAt: new Date().toISOString(),
      };
      addReceipt(receipt as Receipt);
    }
    return { memo, receipt };
  };

  const saveMemo = async () => {
    const res = await createMemoAndReceipt();
    if (!res) return;
    setCreated(res);
    showToast(tr("memoCreated"), "success");
    setForm({ ...form, customerName: "", customerPhone: "", device: "", note: "" });
    setItems([emptyItem()]);
    setDiscount(0); setTaxRate(0); setReceiptNotes("");
  };

  const printReceipt = () => {
    if (created?.receipt) openReceiptPrint(created.receipt);
    else if (created?.memo) printSlip(created.memo);
  };

  const shareCreatedWhatsApp = () => {
    if (!created) return;
    const phone = created.memo.customerPhone.replace(/\D/g, "");
    const text = created.receipt
      ? buildWhatsAppText(created.receipt)
      : `Memo ${created.memo.token} created for ${created.memo.customerName} — ${created.memo.device}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const printSlip = (memo: Memo) => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>${memo.token}</title><style>body{font-family:monospace;padding:24px;text-align:center}h1{font-size:28px;margin:8px 0}p{margin:4px 0;font-size:14px}.box{border:2px dashed #000;padding:16px;display:inline-block;min-width:260px}</style></head><body><div class="box"><div style="font-size:11px;letter-spacing:2px">FARIDPUR MOBILE MART</div><h1>${memo.token}</h1><p><b>${memo.customerName}</b></p><p>${memo.customerPhone}</p><p>${memo.device}</p><p>${memo.note}</p><p style="margin-top:12px;font-size:11px">Date: ${memo.date}</p></div><script>window.print();<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("newMemo")}</h1>
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
            <label className="label-caps mb-1.5 block">{tr("device")} *</label>
            <input className="glass-input" value={form.device} onChange={(e) => setF("device", e.target.value)} placeholder="Samsung Galaxy A54" />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("notes")}</label>
            <textarea rows={2} className="glass-input resize-none" value={form.note} onChange={(e) => setF("note", e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("date")}</label>
            <input type="date" className="glass-input" value={form.date} onChange={(e) => setF("date", e.target.value)} />
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
          onSaveAndPrint={saveMemo}
          hideWhatsApp
          tr={tr} lang={lang} sticky
        />
      </div>

      <Modal open={!!created} onClose={() => setCreated(null)} title={lang === "bn" ? "প্রিন্ট প্রিভিউ" : "Print Preview"}>
        <div>
          <div className="text-center mb-4">
            <div className="label-caps">Token</div>
            <div className="text-2xl font-extrabold tracking-tight my-1">{created?.memo.token}</div>
            <p className="text-sm text-text-secondary">{created?.memo.customerName} • {created?.memo.device}</p>
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
    </div>
  );
}

function AllMemos({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  const memos = useMemosState();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Memo | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return memos.filter((m) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return m.token.toLowerCase().includes(s) || m.customerName.toLowerCase().includes(s) || m.customerPhone.includes(s) || m.device.toLowerCase().includes(s);
    });
  }, [memos, q]);

  return (
    <div className="space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("allMemos")}</h1>
      <input className="glass-input" placeholder={lang === "bn" ? "টোকেন, নাম, ফোন খুঁজুন..." : "Search token, name, phone, device..."} value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 ? (
        <div className="glass p-8 text-center text-text-muted text-sm">{tr("noMemos")}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.token} className="glass p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="glass-pill px-3 py-1 text-xs font-bold">{m.token}</span>
                  </div>
                  <div className="font-semibold mt-2">{m.customerName}</div>
                  <div className="text-xs text-text-muted">{m.customerPhone}</div>
                  <div className="text-sm mt-2">{m.device}</div>
                  <div className="text-xs text-text-muted">{m.note}</div>
                  <div className="text-xs text-text-muted mt-1 inline-flex items-center gap-1"><span className="label-caps">Date: </span> {m.date}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => setEditing(m)} className="btn-glass !py-2 !px-3 text-xs flex-1 sm:flex-none">{tr("update")}</button>
                <button onClick={() => setConfirmDel(m.token)} className="btn-danger !py-2 !px-3 text-xs"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <UpdateMemoModal memo={editing} onClose={() => setEditing(null)} tr={tr} lang={lang} />}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title={tr("confirmDelete")}>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setConfirmDel(null)} className="btn-glass flex-1">{lang === "bn" ? "বাতিল" : "Cancel"}</button>
          <button onClick={() => { if (confirmDel) { deleteMemo(confirmDel); showToast(tr("delete") + " ✓", "info"); } setConfirmDel(null); }} className="btn-danger flex-1">{tr("delete")}</button>
        </div>
      </Modal>
    </div>
  );
}

function UpdateMemoModal({ memo, onClose, tr, lang }: { memo: Memo; onClose: () => void; tr: (k: any) => string; lang: "en" | "bn" }) {
  const [note, setNote] = useState(memo.note);
  return (
    <Modal open onClose={onClose} title={`${tr("update")} • ${memo.token}`}>
      <div className="space-y-3">
        <div>
          <label className="label-caps mb-1.5 block">{tr("notes")}</label>
          <textarea rows={3} className="glass-input resize-none" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-glass flex-1">{lang === "bn" ? "বাতিল" : "Cancel"}</button>
          <button onClick={() => { updateMemo(memo.token, { note }); showToast(tr("saved")); onClose(); }} className="btn-primary flex-1">{tr("save")}</button>
        </div>
      </div>
    </Modal>
  );
}

