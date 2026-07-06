import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Smartphone, PackageX, Flame, Filter as FilterIcon, X, Eye } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PhotoPlaceholder } from "../components/PhotoPlaceholder";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { PhoneDetailModal } from "../components/PhoneDetailModal";
import { useI18n } from "../lib/i18n";
import {
  filterPhones, getAvailablePhones, isJustIn, seedBuySellData,
  type PhoneCondition, type UsedPhone,
} from "../lib/storage";
import { shopWhatsAppLink, bdt } from "../lib/wa";
import { Modal } from "../lib/ui";

export const Route = createFileRoute("/phones")({
  head: () => ({
    meta: [
      { title: "Used Phones — Mak Electronics" },
      { name: "description", content: "Quality-checked used phones in Faridpur — Samsung, Apple, Xiaomi and more." },
      { property: "og:title", content: "Used Phones — Mak Electronics" },
      { property: "og:description", content: "Quality-checked used phones, ready to use." },
    ],
  }),
  component: PhonesPage,
});

const CONDITIONS: PhoneCondition[] = ["Excellent", "Good", "Fair"];

function PhonesPage() {
  const { tr, lang } = useI18n();
  const [, force] = useState(0);
  useEffect(() => {
    seedBuySellData();
    const h = () => force((n) => n + 1);
    window.addEventListener("repairshop:change", h);
    return () => window.removeEventListener("repairshop:change", h);
  }, []);

  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [mobileFilters, setMobileFilters] = useState(false);

  const all = getAvailablePhones();
  const brands = useMemo(() => Array.from(new Set(all.map((p) => p.brand))).sort(), [all]);

  const filtered = useMemo(() => filterPhones(all, {
    brand: brand || undefined,
    condition: condition || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  }), [all, brand, condition, minPrice, maxPrice]);

  const activeCount = [brand, condition, minPrice, maxPrice].filter(Boolean).length;
  const clearAll = () => { setBrand(""); setCondition(""); setMinPrice(""); setMaxPrice(""); };

  const [detail, setDetail] = useState<UsedPhone | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const openDetail = (p: UsedPhone, trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    setDetail(p);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12">
        <section className="px-4 mb-6">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className={`text-3xl md:text-5xl font-extrabold ${lang === "bn" ? "bn" : ""}`}>{tr("usedPhonesTitle")}</h1>
            <p className={`mt-2 text-text-secondary ${lang === "bn" ? "bn" : ""}`}>{tr("usedPhonesSub")}</p>
          </div>
        </section>

        {/* Desktop filter bar */}
        <section className="px-4 mb-4 hidden sm:block">
          <div className="mx-auto max-w-6xl glass p-3 flex flex-wrap items-center gap-3">
            <select className="glass-input !py-2 max-w-[180px]" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">{tr("allBrandsFilter")}</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select className="glass-input !py-2 max-w-[180px]" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">{tr("allConditions")}</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" min={0} placeholder={tr("minPrice") + " ৳"} className="glass-input !py-2 max-w-[120px]" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <input type="number" min={0} placeholder={tr("maxPrice") + " ৳"} className="glass-input !py-2 max-w-[120px]" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            {activeCount > 0 && (
              <button onClick={clearAll} className="btn-glass !py-2 !px-3 text-xs"><X size={14} /> {tr("clearFilters")}</button>
            )}
          </div>
        </section>

        {/* Mobile filter trigger */}
        <section className="px-4 mb-4 sm:hidden">
          <button onClick={() => setMobileFilters(true)} className="btn-glass w-full justify-center">
            <FilterIcon size={16} /> {tr("filters")}
            {activeCount > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold">{activeCount}</span>}
          </button>
        </section>

        {/* Grid */}
        <section className="px-4">
          <div className="mx-auto max-w-6xl">
            {filtered.length === 0 ? (
              <EmptyState
                icon={activeCount > 0 ? Smartphone : PackageX}
                message={tr("noPhonesMatch")}
                action={activeCount > 0 ? { label: tr("clearFilters"), onClick: clearAll } : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <PhoneCard key={p.id} phone={p} tr={tr} lang={lang} onViewDetails={openDetail} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <PhoneDetailModal
        phone={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        returnFocusRef={triggerRef}
      />

      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)} title={tr("filters")}>
        <div className="space-y-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("brand")}</label>
            <select className="glass-input" value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">{tr("allBrandsFilter")}</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("conditionFilter")}</label>
            <select className="glass-input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">{tr("allConditions")}</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-caps mb-1.5 block">{tr("minPrice")}</label>
              <input type="number" min={0} className="glass-input" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("maxPrice")}</label>
              <input type="number" min={0} className="glass-input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={clearAll} className="btn-glass flex-1">{tr("clearFilters")}</button>
            <button onClick={() => setMobileFilters(false)} className="btn-primary flex-1">{tr("applyFilters")}</button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

export function PhoneCard({
  phone, tr, lang, onViewDetails,
}: {
  phone: UsedPhone;
  tr: (k: any) => string;
  lang: "en" | "bn";
  onViewDetails?: (p: UsedPhone, trigger: HTMLElement | null) => void;
  layoutIdPrefix?: string; // kept for API compat, unused
}) {
  const justIn = isJustIn(phone.dateAdded);
  const msg = `Hi! I'm interested in the ${phone.brand} ${phone.model} (${phone.storage}/${phone.ram}) listed for ${bdt(phone.sellingPrice)}. Is it still available?`;
  const reduceMotion = useReducedMotion();
  return (
    <motion.article
      className="glass overflow-hidden flex flex-col"
      style={{ borderRadius: 22 }}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      whileHover={reduceMotion ? {} : { y: -3, transition: { type: "spring", stiffness: 500, damping: 30 } }}
    >
      <div className="relative aspect-[4/3] bg-white/30 rounded-2xl overflow-hidden m-3">
        <PhotoPlaceholder url={phone.photoUrl} alt={`${phone.brand} ${phone.model}`} />
        {justIn && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-accent-orange/25 text-accent-orange border-accent-orange/50">
            <Flame size={12} strokeWidth={1.75} /> {tr("justIn")}
          </span>
        )}
      </div>
      <div className="p-4 pt-2 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-base leading-tight">{phone.brand} {phone.model}</h3>
        <div className="text-xs text-text-muted flex items-center gap-1.5 flex-wrap">
          <span>{phone.storage}</span>
          <span className="text-text-muted/50">·</span>
          <span>{phone.ram} RAM</span>
          <span className="text-text-muted/50">·</span>
          <span>{phone.batteryHealth}% {tr("batteryHealth")}</span>
          <span className="text-text-muted/50">·</span>
          <span>{phone.condition}</span>
        </div>
        <div className="text-2xl font-extrabold mt-1">{bdt(phone.sellingPrice)}</div>
        <div className="mt-2 flex gap-2">
          <a
            href={shopWhatsAppLink(msg)}
            target="_blank" rel="noreferrer"
            className="btn-primary !min-h-[44px] flex-1"
          >
            <WhatsAppIcon size={18} color="#FFFFFF" /> {tr("whatsappToBuy")}
          </a>
          <button
            type="button"
            onClick={(e) => onViewDetails?.(phone, e.currentTarget)}
            className="btn-glass !min-h-[44px] flex-1 justify-center"
            aria-label={tr("viewDetails")}
          >
            <Eye size={18} /> <span>{tr("viewDetails")}</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function EmptyState({
  icon: Icon, message, action,
}: { icon: any; message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="glass p-10 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl mx-auto grid place-items-center mb-3 bg-white/40">
        <Icon size={26} strokeWidth={1.75} className="text-text-muted" />
      </div>
      <p className="text-sm text-text-secondary">{message}</p>
      {action && (
        <button onClick={action.onClick} className="btn-glass mt-4">{action.label}</button>
      )}
    </div>
  );
}
