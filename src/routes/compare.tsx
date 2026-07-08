import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Check } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { useI18n } from "../lib/i18n";
import { getAvailablePhones, type UsedPhone, type PhoneCondition, getSettings } from "../lib/storage";
import { shopWhatsAppLink, bdt } from "../lib/wa";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id1: (search.id1 as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Compare Phones | Faridpur Mobile Mart" },
      { name: "description", content: "Side-by-side comparison of available used phones." },
    ],
  }),
  component: ComparePage,
});

const COND_RANK: Record<PhoneCondition, number> = { Excellent: 3, Good: 2, Fair: 1 };
const num = (s: string) => {
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : 0;
};

type Row = {
  key: string;
  label: string;
  get: (p: UsedPhone) => string;
  rank?: (p: UsedPhone) => number; // higher = better; for price we invert
  lowerIsBetter?: boolean;
};

function ComparePage() {
  const { tr, lang } = useI18n();
  const search = Route.useSearch();
  const [phones, setPhones] = useState<UsedPhone[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const h = async () => {
      setPhones(await getAvailablePhones());
      setSettings(await getSettings());
    };
    h();
    window.addEventListener("repairshop:change", h);
    return () => window.removeEventListener("repairshop:change", h);
  }, []);
  const [id1, setId1] = useState(search.id1 || "");
  const [id2, setId2] = useState("");

  const p1 = phones.find((p) => p.id === id1);
  const p2 = phones.find((p) => p.id === id2);

  const rows: Row[] = useMemo(() => [
    { key: "brand", label: tr("brand"), get: (p) => p.brand },
    { key: "model", label: tr("model"), get: (p) => p.model },
    { key: "storage", label: tr("storage"), get: (p) => p.storage, rank: (p) => num(p.storage) },
    { key: "ram", label: tr("ram"), get: (p) => p.ram, rank: (p) => num(p.ram) },
    { key: "battery", label: tr("batteryHealth"), get: (p) => `${p.batteryHealth}%`, rank: (p) => p.batteryHealth },
    { key: "condition", label: tr("conditionFilter"), get: (p) => p.condition, rank: (p) => COND_RANK[p.condition] },
    { key: "price", label: tr("sellingPrice"), get: (p) => bdt(p.sellingPrice), rank: (p) => p.sellingPrice, lowerIsBetter: true },
  ], [tr]);

  const winner = (r: Row): 1 | 2 | 0 => {
    if (!p1 || !p2 || !r.rank) return 0;
    const a = r.rank(p1), b = r.rank(p2);
    if (a === b) return 0;
    if (r.lowerIsBetter) return a < b ? 1 : 2;
    return a > b ? 1 : 2;
  };

  if (phones.length < 2) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-24 pb-12 px-4">
          <div className="max-w-md mx-auto glass p-10 text-center mt-12">
            <div className="w-14 h-14 rounded-2xl mx-auto grid place-items-center mb-3 bg-white/40">
              <GitCompareArrows size={26} strokeWidth={1.75} className="text-text-muted" />
            </div>
            <p className={`text-sm text-text-secondary ${lang === "bn" ? "bn" : ""}`}>{tr("needTwoPhones")}</p>
            <Link to="/phones" className="btn-primary mt-4 inline-flex">{tr("browsePhones")}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const buyLink = (p: UsedPhone) =>
    shopWhatsAppLink(`Hi! I'm interested in the ${p.brand} ${p.model} (${p.storage}/${p.ram}) listed for ${bdt(p.sellingPrice)}.`);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12">
        <section className="px-4 mb-6">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className={`text-3xl md:text-5xl font-extrabold ${lang === "bn" ? "bn" : ""}`}>{tr("compareTitle")}</h1>
            <p className={`mt-2 text-text-secondary ${lang === "bn" ? "bn" : ""}`}>{tr("compareSub")}</p>
          </div>
        </section>

        <section className="px-4">
          <div className="mx-auto max-w-5xl glass p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-caps mb-1.5 block">{tr("phone1")}</label>
              <select className="glass-input" value={id1} onChange={(e) => setId1(e.target.value)}>
                <option value="">{tr("selectPhone")}</option>
                {phones.filter((p) => p.id !== id2).map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} {p.model} — {bdt(p.sellingPrice)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-caps mb-1.5 block">{tr("phone2")}</label>
              <select className="glass-input" value={id2} onChange={(e) => setId2(e.target.value)}>
                <option value="">{tr("selectPhone")}</option>
                {phones.filter((p) => p.id !== id1).map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} {p.model} — {bdt(p.sellingPrice)}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {p1 && p2 && (
          <>
            {/* Desktop side-by-side */}
            <section className="px-4 mt-6 hidden sm:block">
              <div className="mx-auto max-w-5xl glass overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="text-left p-3 label-caps">{tr("description")}</th>
                      <th className="text-left p-3 font-bold">{p1.brand} {p1.model}</th>
                      <th className="text-left p-3 font-bold">{p2.brand} {p2.model}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const w = winner(r);
                      return (
                        <tr key={r.key} className="border-b border-black/5">
                          <td className="p-3 font-semibold text-text-secondary">{r.label}</td>
                          <td className={`p-3 ${w === 1 ? "bg-accent-green/15 font-bold text-accent-green" : ""}`}>{r.get(p1)}</td>
                          <td className={`p-3 ${w === 2 ? "bg-accent-green/15 font-bold text-accent-green" : ""}`}>{r.get(p2)}</td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="p-3"></td>
                      <td className="p-3"><a href={buyLink(p1)} target="_blank" rel="noreferrer" className="btn-primary !min-h-[44px]"><WhatsAppIcon size={16} color="#FFFFFF" /> {tr("whatsappToBuy")}</a></td>
                      <td className="p-3"><a href={buyLink(p2)} target="_blank" rel="noreferrer" className="btn-primary !min-h-[44px]"><WhatsAppIcon size={16} color="#FFFFFF" /> {tr("whatsappToBuy")}</a></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Mobile stacked */}
            <section className="px-4 mt-6 sm:hidden space-y-3">
              {[p1, p2].map((p, idx) => (
                <div key={p.id}>
                  <div className="glass p-4">
                    <h2 className="font-bold text-lg">{p.brand} {p.model}</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                      {rows.map((r) => {
                        const w = winner(r);
                        const wins = (idx === 0 && w === 1) || (idx === 1 && w === 2);
                        return (
                          <div key={r.key} className="flex justify-between gap-3">
                            <dt className="text-text-muted">{r.label}</dt>
                            <dd className={`text-right font-semibold inline-flex items-center gap-1 ${wins ? "text-accent-green" : ""}`}>
                              {wins && <Check size={14} strokeWidth={2} />} {r.get(p)}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                    <a href={buyLink(p)} target="_blank" rel="noreferrer" className="btn-primary w-full mt-4 !min-h-[44px]">
                      <WhatsAppIcon size={16} color="#FFFFFF" /> {tr("whatsappToBuy")}
                    </a>
                  </div>
                  {idx === 0 && (
                    <div className="text-center text-xs label-caps my-2 text-text-muted">VS</div>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
