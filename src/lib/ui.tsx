import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Inbox, Search, CheckCircle2, PackageCheck, type LucideIcon } from "lucide-react";
import type { PhoneStatus } from "./storage";

// ===== Toast =====
type Toast = { id: number; msg: string; type: "success" | "error" | "info" | "warning" };
let toastSubs: ((t: Toast) => void)[] = [];
export function showToast(msg: string, type: Toast["type"] = "success") {
  const t = { id: Date.now() + Math.random(), msg, type };
  toastSubs.forEach((f) => f(t));
}
export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const sub = (t: Toast) => {
      setItems((s) => [...s, t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 3000);
    };
    toastSubs.push(sub);
    return () => { toastSubs = toastSubs.filter((f) => f !== sub); };
  }, []);
  const colors: Record<Toast["type"], string> = {
    success: "border-accent-green/50 text-accent-green",
    error: "border-accent-red/50 text-accent-red",
    info: "border-accent-blue/50 text-accent-blue",
    warning: "border-accent-orange/50 text-accent-orange",
  };
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
      {items.map((t) => (
        <div key={t.id} className={`glass scale-in px-4 py-3 text-sm font-medium border ${colors[t.type]}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ===== Modal =====
export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="glass scale-in p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  );
}

// ===== Status Badge =====
const STATUS_META: Record<PhoneStatus, { label: string; bn: string; color: string; bg: string; dot: string }> = {
  Draft:     { label: "Draft",     bn: "খসড়া",        color: "text-text-muted",    bg: "bg-black/5 border-black/10",                  dot: "bg-text-muted" },
  Listed:    { label: "Listed",    bn: "তালিকাভুক্ত", color: "text-accent-blue",   bg: "bg-accent-blue/15 border-accent-blue/40",     dot: "bg-accent-blue" },
  Reserved:  { label: "Reserved",  bn: "রিজার্ভড",    color: "text-accent-orange", bg: "bg-accent-orange/15 border-accent-orange/40", dot: "bg-accent-orange" },
  Sold:      { label: "Sold",      bn: "বিক্রিত",     color: "text-accent-green",  bg: "bg-accent-green/15 border-accent-green/40",   dot: "bg-accent-green" },
};

export function StatusBadge({ status, lang = "en" }: { status: PhoneStatus; lang?: "en" | "bn" }) {
  const m = STATUS_META[status] || STATUS_META.Draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${status === "Listed" ? "pulse-dot" : ""}`} />
      {lang === "bn" ? m.bn : m.label}
    </span>
  );
}

export const STATUSES: PhoneStatus[] = ["Draft", "Listed", "Reserved", "Sold"];
export const STATUS_ICONS: Record<PhoneStatus, LucideIcon> = {
  Draft: Inbox,
  Listed: Search,
  Reserved: PackageCheck,
  Sold: CheckCircle2,
};

export function getStatusLabel(s: PhoneStatus, lang: "en" | "bn") {
  return lang === "bn" ? (STATUS_META[s]?.bn || "") : (STATUS_META[s]?.label || "");
}

// ===== Stat Counter =====
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now(); const dur = 1500;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setVal(Math.floor(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}
