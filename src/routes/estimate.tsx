import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, Clock, CalendarCheck, Info } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { useI18n } from "../lib/i18n";
import {
  ESTIMATE_BRANDS, ESTIMATE_ISSUES_EN, ESTIMATE_ISSUES_BN,
  findBestEstimate, type EstimateMatch,
} from "../lib/storage";
import { shopWhatsAppLink } from "../lib/wa";

export const Route = createFileRoute("/estimate")({
  head: () => ({
    meta: [
      { title: "Repair Cost Estimator — Mak Electronics" },
      { name: "description", content: "Get an instant estimate for your phone repair. Select brand and issue to see a transparent price range." },
      { property: "og:title", content: "Repair Cost Estimator — Mak Electronics" },
      { property: "og:description", content: "Instant repair price estimates for all major phone brands in Faridpur." },
    ],
  }),
  component: EstimatePage,
});

const PUBLIC_BRANDS = ESTIMATE_BRANDS.filter((b) => b !== "All Brands");

function EstimatePage() {
  const { tr, lang } = useI18n();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [issueType, setIssueType] = useState<string>("");
  const [result, setResult] = useState<EstimateMatch | null>(null);

  const canSubmit = Boolean(brand && issueType);
  const issueLabel = useMemo(() => (it: string) => lang === "bn" ? (ESTIMATE_ISSUES_BN[it] || it) : it, [lang]);

  const runEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setResult(findBestEstimate(brand, model, issueType));
  };

  const goBook = () => {
    if (!result?.rate) return;
    navigate({ to: "/book", search: { brand, model: model || undefined, problem: issueType } });
  };

  const waLink = () => {
    if (!result?.rate) return "#";
    const r = result.rate;
    const lines = [
      lang === "bn" ? "আমি একটি এস্টিমেট সম্পর্কে জানতে চাই:" : "I'd like to ask about a repair estimate:",
      `${lang === "bn" ? "ব্র্যান্ড" : "Brand"}: ${brand}`,
      model ? `${lang === "bn" ? "মডেল" : "Model"}: ${model}` : null,
      `${lang === "bn" ? "সমস্যা" : "Issue"}: ${issueLabel(issueType)}`,
      `${lang === "bn" ? "এস্টিমেট" : "Estimate"}: ৳${r.priceLow.toLocaleString()} – ৳${r.priceHigh.toLocaleString()}`,
    ].filter(Boolean).join("\n");
    return shopWhatsAppLink(lines);
  };

  const isBrandSpecific = result && (result.tier === "exact" || result.tier === "brandWildcardModel" || result.tier === "allBrands") && result.tier !== "allBrands";
  // Per spec: tiers 1–3 = brand-specific badge; tier 4 (none/fallback) = general.
  // We don't have a literal "tier 4" stored rate, so when rate is null show fallback note via tr only.

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 px-4 pb-12">
        <div className="mx-auto max-w-[480px]">
          <div className="text-center mb-6">
            <div className="label-caps">{lang === "bn" ? "এস্টিমেটর" : "Estimator"}</div>
            <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${lang === "bn" ? "bn" : ""}`}>{tr("instantEstimateTitle")}</h1>
            <p className={`text-sm text-text-secondary mt-2 ${lang === "bn" ? "bn" : ""}`}>{tr("instantEstimateSubtitle")}</p>
          </div>

          <form onSubmit={runEstimate} className="glass p-5 sm:p-6 space-y-4">
            <div>
              <label className="label-caps mb-1.5 block">{tr("brand")} *</label>
              <select className="glass-input" required value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">{tr("selectBrand")}</option>
                {PUBLIC_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("model")}</label>
              <input className="glass-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder={tr("selectModel")} />
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("issueType")} *</label>
              <select className="glass-input" required value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                <option value="">{tr("selectIssueType")}</option>
                {ESTIMATE_ISSUES_EN.map((i) => <option key={i} value={i}>{issueLabel(i)}</option>)}
              </select>
            </div>
            <button type="submit" disabled={!canSubmit} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
              <Calculator size={16} /> {tr("getEstimate")}
            </button>
          </form>

          {/* Result container — aria-live for dynamic update */}
          <div className="mt-5" aria-live="polite">
            {!result && (
              <div className="glass-soft p-6 text-center">
                <Calculator size={28} className="mx-auto mb-3 text-accent-purple" strokeWidth={2.2} />
                <p className={`text-sm text-text-muted ${lang === "bn" ? "bn" : ""}`}>{tr("estimateWillAppearHere")}</p>
              </div>
            )}

            {result && result.rate && (
              <div className="glass p-5 sm:p-6 fade-up">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                  {result.tier === "allBrands" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/40 text-text-secondary border border-white/60">
                      {tr("generalEstimate")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-accent-blue bg-accent-blue/15 border border-accent-blue/40">
                      {tr("brandSpecificEstimate")}
                    </span>
                  )}
                </div>
                <div className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  ৳{result.rate.priceLow.toLocaleString()} – ৳{result.rate.priceHigh.toLocaleString()}
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={14} /> {tr("estimatedTurnaround")}: <span className="font-semibold">{result.rate.turnaround}</span>
                </div>
                {result.tier === "allBrands" && (
                  <p className={`text-xs text-text-muted mt-3 ${lang === "bn" ? "bn" : ""}`}>{tr("noSpecificRateNote")}</p>
                )}
                {result.rate.notes && (
                  <p className="text-xs text-text-muted mt-2 inline-flex items-start gap-1"><Info size={12} className="mt-0.5 shrink-0" /> {result.rate.notes}</p>
                )}
                <p className={`text-xs text-text-muted mt-3 ${lang === "bn" ? "bn" : ""}`}>{tr("finalPriceDisclaimer")}</p>

                <div className="mt-5 grid sm:grid-cols-2 gap-2">
                  <button onClick={goBook} className="btn-primary min-h-[44px]"><CalendarCheck size={16} /> {tr("bookThisRepair")}</button>
                  <a href={waLink()} target="_blank" rel="noreferrer" className="btn-glass min-h-[44px] justify-center inline-flex items-center gap-2"><WhatsAppIcon size={16} color="#25D366" /> {tr("whatsappUs")}</a>
                </div>
              </div>
            )}

            {result && !result.rate && (
              <div className="glass p-5 sm:p-6 fade-up">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/40 text-text-secondary border border-white/60">{tr("generalEstimate")}</span>
                <p className={`text-sm mt-3 ${lang === "bn" ? "bn" : ""}`}>{tr("noSpecificRateNote")}</p>
                <p className={`text-xs text-text-muted mt-3 ${lang === "bn" ? "bn" : ""}`}>{tr("finalPriceDisclaimer")}</p>
                <div className="mt-5 grid sm:grid-cols-2 gap-2">
                  <button onClick={() => navigate({ to: "/book", search: { brand, model: model || undefined, problem: issueType } })} className="btn-primary min-h-[44px]"><CalendarCheck size={16} /> {tr("bookThisRepair")}</button>
                  <a href={shopWhatsAppLink(`${lang === "bn" ? "এস্টিমেট চাই" : "I'd like a repair estimate"} — ${brand} ${model} — ${issueLabel(issueType)}`)} target="_blank" rel="noreferrer" className="btn-glass min-h-[44px] justify-center inline-flex items-center gap-2"><WhatsAppIcon size={16} color="#25D366" /> {tr("whatsappUs")}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}