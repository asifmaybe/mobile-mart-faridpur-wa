import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Headphones, PackageX, Filter as FilterIcon, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PhotoPlaceholder } from "../components/PhotoPlaceholder";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { useI18n } from "../lib/i18n";
import {
  ACCESSORY_CATEGORIES, filterAccessories, getAccessories, getSettings,
  type Accessory,
} from "../lib/storage";
import { shopWhatsAppLink, bdt } from "../lib/wa";
import { Modal } from "../lib/ui";
import { EmptyState } from "./phones";

export const Route = createFileRoute("/accessories")({
  head: () => ({
    meta: [
      { title: "Accessories — Faridpur Mobile Mart" },
      { name: "description", content: "Power banks, chargers, headphones, cases and cables in Faridpur." },
      { property: "og:title", content: "Accessories — Faridpur Mobile Mart" },
      { property: "og:description", content: "Quality phone accessories at fair prices." },
    ],
  }),
  component: AccessoriesPage,
});

function AccessoriesPage() {
  const { tr, lang } = useI18n();
  const [all, setAll] = useState<Accessory[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const h = async () => {
      const accs = await getAccessories();
      setAll(accs.filter((a) => a.status !== "Discontinued"));
      setSettings(await getSettings());
    };
    h();
    window.addEventListener("repairshop:change", h);
    return () => window.removeEventListener("repairshop:change", h);
  }, []);

  const [category, setCategory] = useState("");
  const [mobileFilters, setMobileFilters] = useState(false);

  const categories = useMemo(() => Array.from(new Set(all.map((a) => a.category))).sort(), [all]);
  const filtered = useMemo(() => filterAccessories(all, { category: category || undefined }), [all, category]);
  const activeCount = category ? 1 : 0;
  const clearAll = () => setCategory("");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12">
        <section className="px-4 mb-6">
          <div className="mx-auto max-w-6xl text-center">
            <h1 className={`text-3xl md:text-5xl font-extrabold ${lang === "bn" ? "bn" : ""}`}>{tr("accessoriesTitle")}</h1>
            <p className={`mt-2 text-text-secondary ${lang === "bn" ? "bn" : ""}`}>{tr("accessoriesSub")}</p>
          </div>
        </section>

        <section className="px-4 mb-4 hidden sm:block">
          <div className="mx-auto max-w-6xl glass p-3 flex flex-wrap items-center gap-3">
            <select className="glass-input !py-2 max-w-[220px]" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{tr("allCategoriesFilter")}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {activeCount > 0 && (
              <button onClick={clearAll} className="btn-glass !py-2 !px-3 text-xs"><X size={14} /> {tr("clearFilters")}</button>
            )}
          </div>
        </section>

        <section className="px-4 mb-4 sm:hidden">
          <button onClick={() => setMobileFilters(true)} className="btn-glass w-full justify-center">
            <FilterIcon size={16} /> {tr("filters")}
            {activeCount > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-xs font-bold">{activeCount}</span>}
          </button>
        </section>

        <section className="px-4">
          <div className="mx-auto max-w-6xl">
            {filtered.length === 0 ? (
              <EmptyState
                icon={activeCount > 0 ? Headphones : PackageX}
                message={tr("noAccessoriesMatch")}
                action={activeCount > 0 ? { label: tr("clearFilters"), onClick: clearAll } : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((a) => (
                  <AccessoryCard key={a.id} acc={a} tr={tr} settings={settings} />
                ))}</div>
            )}
          </div>
        </section>
      </main>

      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)} title={tr("filters")}>
        <div className="space-y-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("category")}</label>
            <select className="glass-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{tr("allCategoriesFilter")}</option>
              {ACCESSORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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

export function AccessoryCard({ acc, tr, settings }: { acc: Accessory; tr: (k: any) => string; settings?: any }) {
  const inStock = acc.status === "In Stock";
  const msg = `Hi! I'd like to buy the ${acc.name} (${acc.brand}) listed for ${bdt(acc.sellingPrice)}. Is it available?`;
  return (
    <article className="glass overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] bg-white/30">
        <PhotoPlaceholder url={acc.photoUrl} alt={acc.name} />
        <span className={`absolute top-2 right-2 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${inStock ? "bg-accent-green/20 text-accent-green border-accent-green/40"
          : "bg-accent-red/20 text-accent-red border-accent-red/40"
          }`}>
          {inStock ? tr("inStock") : tr("outOfStockLabel")}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-base leading-tight">{acc.name}</h3>
        <div className="text-xs text-text-muted">{acc.category} · {acc.brand}</div>
        <div className="text-2xl font-extrabold mt-1">{bdt(acc.sellingPrice)}</div>
        {inStock ? (
          <a href={shopWhatsAppLink(msg)} target="_blank" rel="noreferrer" className="btn-primary w-full mt-2 !min-h-[44px]">
            <WhatsAppIcon size={16} color="#FFFFFF" /> {tr("whatsappToBuy")}
          </a>
        ) : (
          <div className="btn-glass w-full mt-2 !min-h-[44px] !cursor-default opacity-70 justify-center">
            {tr("notifyMe")}
          </div>
        )}
      </div>
    </article>
  );
}
