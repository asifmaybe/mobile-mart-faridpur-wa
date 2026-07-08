import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Phone as PhoneIcon,
  ShieldCheck, MapPin, Star, Plus, Clock,
  Smartphone, ArrowLeftRight, BadgeCheck, MessageCircle, Package
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useI18n } from "../lib/i18n";
import { CountUp } from "../lib/ui";
import { getSettings, getAvailablePhones, getAccessories, isJustIn, getCachedSettings, type UsedPhone, type Accessory } from "../lib/storage";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";

import { JustInFeed } from "../components/JustInFeed";
import { PhoneCard } from "./phones";
import { AccessoryCard } from "./accessories";
import { PhoneDetailModal } from "../components/PhoneDetailModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faridpur Mobile Mart — Authentic Used Phone Shop, Faridpur" },
      { name: "description", content: "Trusted mobile phone shop in Faridpur: Where You Get Quality Used Mobile Phone." },
    ],
  }),
  component: Home,
});


const BRANDS = ["Samsung", "Apple", "Xiaomi", "Oppo", "Vivo", "Realme", "OnePlus", "Huawei", "Symphony", "Tecno", "Infinix", "Nokia"];

const REVIEWS = [
  { name: "Tanvir H.", en: "Bought a used iPhone 12. Battery health was exactly as promised!", bn: "একটি ইউজড আইফোন ১২ কিনেছি। ব্যাটারি হেলথ যেমন বলেছিল তেমনই পেয়েছি!", device: "iPhone 12", date: "2 weeks ago" },
  { name: "Sumaiya R.", en: "Exchanged my old Samsung for a very good price. Highly recommend.", bn: "আমার পুরনো স্যামসাং খুব ভালো দামে এক্সচেঞ্জ করেছি।", device: "Samsung A52", date: "1 month ago" },
  { name: "Imran K.", en: "Original accessories available here. Trustworthy shop.", bn: "এখানে অরিজিনাল অ্যাকসেসরিজ পাওয়া যায়। ভরসার দোকান।", device: "Accessories", date: "3 weeks ago" },
  { name: "Nadia A.", en: "Best place for used phones in Faridpur. 7-day replacement given.", bn: "ফরিদপুরে ইউজড ফোনের সেরা দোকান। ৭ দিনের রিপ্লেসমেন্ট দেয়।", device: "Oppo Reno 8", date: "5 days ago" },
];

const FAQS = [
  { q_en: "Do you provide warranty on used phones?", a_en: "Yes — all our used phones come with a 7-day replacement guarantee for any functional issues.", q_bn: "ইউজড ফোনে কি ওয়ারেন্টি দেওয়া হয়?", a_bn: "হ্যাঁ — আমাদের সব ইউজড ফোনে ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি দেওয়া হয়।" },
  { q_en: "Do you buy or exchange used phones?", a_en: "Yes — we buy used phones at a fair market price and offer exchange credit toward your next device. Bring your phone in or message us on WhatsApp for an instant assessment.", q_bn: "আপনারা কি ইউজড ফোন কেনেন বা এক্সচেঞ্জ করেন?", a_bn: "হ্যাঁ — আমরা ন্যায্য বাজার মূল্যে ইউজড ফোন কিনি এবং পরবর্তী ডিভাইসের জন্য এক্সচেঞ্জ ক্রেডিট দিই। ফোন নিয়ে আসুন অথবা হোয়াটসঅ্যাপে মেসেজ করুন তাৎক্ষণিক মূল্যায়নের জন্য।" },
  { q_en: "Can I check the phone before buying?", a_en: "Absolutely. You can physically inspect, test the battery, and check all functions at our shop before purchasing.", q_bn: "কেনার আগে কি ফোন চেক করে নেওয়া যাবে?", a_bn: "অবশ্যই। দোকানে এসে আপনি নিজে ফোন নেড়েচেড়ে, ব্যাটারি ও সব ফাংশন চেক করে কিনতে পারবেন।" },
  { q_en: "Are your accessories genuine?", a_en: "Yes, we sell high-quality, verified genuine chargers, cables, and power banks.", q_bn: "আপনাদের অ্যাকসেসরিজ কি অরিজিনাল?", a_bn: "হ্যাঁ, আমরা যাচাইকৃত অরিজিনাল চার্জার, ক্যাবল এবং পাওয়ার ব্যাংক বিক্রি করি।" },
  { q_en: "What payment methods do you accept?", a_en: "Cash, bKash, Nagad, Rocket and card payments accepted.", q_bn: "কী কী পেমেন্ট নেন?", a_bn: "ক্যাশ, bKash, Nagad, Rocket এবং কার্ড।" },
  { q_en: "Do you sell all brands?", a_en: "We stock all major brands — Apple, Samsung, Xiaomi, Oppo, Vivo and more.", q_bn: "সব ব্র্যান্ডের ফোন কি থাকে?", a_bn: "হ্যাঁ — Apple, Samsung, Xiaomi সহ সব জনপ্রিয় ব্র্যান্ড থাকে।" },
];

function Home() {
  const { tr, lang } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [settings, setSettings] = useState<any>(getCachedSettings);
  const [featuredPhones, setFeaturedPhones] = useState<UsedPhone[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(true);
  const [loadingAccs, setLoadingAccs] = useState(true);
  const [detail, setDetail] = useState<UsedPhone | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const h = async () => {
      // All three fetches fire simultaneously — no waterfalls
      const [cfg, avail, fetchedAccs] = await Promise.all([
        getSettings(),
        getAvailablePhones(),
        getAccessories(),
      ]);
      if (cancelled) return;

      setSettings(cfg);

      const sortedPhones = avail.sort((a, b) => {
        const aIsJustIn = isJustIn(a.dateAdded);
        const bIsJustIn = isJustIn(b.dateAdded);
        if (aIsJustIn && !bIsJustIn) return -1;
        if (!aIsJustIn && bIsJustIn) return 1;
        return Date.parse(b.dateAdded) - Date.parse(a.dateAdded);
      });
      setFeaturedPhones(sortedPhones.slice(0, 6));
      setLoadingPhones(false);

      const sortedAccs = fetchedAccs.sort((a, b) => Date.parse(b.dateAdded) - Date.parse(a.dateAdded));
      setAccessories(sortedAccs.slice(0, 4));
      setLoadingAccs(false);
    };
    h();
    window.addEventListener("repairshop:change", h);
    return () => {
      cancelled = true;
      window.removeEventListener("repairshop:change", h);
    };
  }, []);


  const openDetail = (p: UsedPhone, trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    setDetail(p);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24">
        {/* HERO */}
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-6xl text-center">
            <div className="glass-pill inline-flex items-center gap-2 px-4 py-2 mb-6 fade-up text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent-green pulse-dot" />
              {tr("heroEyebrow")}
            </div>
            {lang === "bn" ? (
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] fade-up bn">
                <>ফোন কিনুন, বিক্রি করুন ও এক্সচেঞ্জ করুন।<br /><span style={{ background: "linear-gradient(135deg,#5847C7,#7C6FE8,#5BB890)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>বিশ্বস্ত ও ঝামেলাহীন।</span></>
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] fade-up">
                <>Buy, Sell & Exchange Phones.<br /><span style={{ background: "linear-gradient(135deg,#5847C7,#7C6FE8,#5BB890)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Trusted & Hassle Free.</span></>
              </h1>
            )}
            <p className={`mt-5 max-w-xl mx-auto text-base text-text-secondary fade-up ${lang === "bn" ? "bn" : ""}`} style={{ animationDelay: "0.1s" }}>
              {tr("heroSub")}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 fade-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/phones" className="btn-primary w-full sm:w-auto"><Smartphone size={16} /> {tr("browsePhonesCTA")}</Link>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="btn-glass w-full sm:w-auto"><WhatsAppIcon size={16} color="#25D366" /> {tr("whatsappUs")}</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 fade-up" style={{ animationDelay: "0.3s" }}>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><ShieldCheck size={14} /> {tr("warranty1y")}</span>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><ArrowLeftRight size={14} /> {tr("sameDay")}</span>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><BadgeCheck size={14} /> {tr("genuineParts")}</span>
            </div>



          </div>
        </section>

        {/* FEATURED PHONES */}
        {/* FEATURED PHONES */}
        <section className="px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-6">
              <div className="label-caps">{tr("featuredPhonesEyebrow")}</div>
              <h2 className={`text-3xl md:text-4xl font-bold mt-2 ${lang === "bn" ? "bn" : ""}`}>{tr("featuredPhonesTitle")}</h2>
              <p className={`text-text-secondary text-sm mt-1 ${lang === "bn" ? "bn" : ""}`}>{tr("featuredPhonesSubtitle")}</p>
            </div>
            {loadingPhones ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="glass overflow-hidden flex flex-col" style={{ borderRadius: 22 }}>
                    <div className="skeleton aspect-[4/3] m-3" style={{ borderRadius: 16 }} />
                    <div className="p-4 pt-2 flex flex-col gap-3">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-full" />
                      <div className="skeleton h-7 w-1/2" />
                      <div className="flex gap-2">
                        <div className="skeleton h-11 flex-1" />
                        <div className="skeleton h-11 flex-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredPhones.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPhones.map((p) => (
                    <PhoneCard key={p.id} phone={p} tr={tr} lang={lang} onViewDetails={openDetail} layoutIdPrefix="featured" />
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/phones" className="btn-glass">
                    {tr("viewAllPhones")}
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* JUST IN */}
        <JustInFeed />

        {/* TRADE-IN / EXCHANGE BANNER */}
        <section className="px-4 py-8">
          <div className="mx-auto max-w-4xl text-center p-8 md:p-12 rounded-3xl" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-accent-purple">
              <ArrowLeftRight size={32} strokeWidth={1.75} />
            </div>
            <h2 className={`text-2xl md:text-4xl font-extrabold mb-3 ${lang === "bn" ? "bn" : ""}`}>
              {tr("exchangeTitle")}
            </h2>
            <p className={`text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-8 ${lang === "bn" ? "bn" : ""}`}>
              {tr("exchangeBody")}
            </p>
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I'd like to know the exchange value for my phone.")}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <MessageCircle size={18} /> {tr("exchangeCTA")}
            </a>
          </div>
        </section>




        {/* ACCESSORIES HIGHLIGHT */}
        <section className="px-4 py-8 lazy-section">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-6">
              <div className="label-caps">{tr("accessoriesEyebrow")}</div>
              <h2 className={`text-3xl md:text-4xl font-bold mt-2 ${lang === "bn" ? "bn" : ""}`}>{tr("accessoriesHighlightTitle")}</h2>
            </div>
            {loadingAccs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass overflow-hidden flex flex-col" style={{ borderRadius: 22 }}>
                    <div className="skeleton aspect-[4/3]" style={{ borderRadius: 0 }} />
                    <div className="p-4 flex flex-col gap-3">
                      <div className="skeleton h-5 w-3/4" />
                      <div className="skeleton h-4 w-1/2" />
                      <div className="skeleton h-7 w-1/3" />
                      <div className="skeleton h-11 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : accessories.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {accessories.map((a) => (
                    <AccessoryCard key={a.id} acc={a} tr={tr} />
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/accessories" className="btn-glass">
                    {tr("viewAllAccessories")}
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* TRUST & STATS */}
        <section className="px-4 py-12 lazy-section">
          <div className="mx-auto max-w-6xl glass p-6 md:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
              {[
                { n: 2500, suf: "+", label: tr("phonesDealt"), Icon: Smartphone },
                { n: 98, suf: "%", label: tr("satisfaction"), Icon: Star },
                { n: 1000, suf: "+", label: tr("accessoriesSold"), Icon: Package },
                { n: 5, suf: "y", label: tr("inBusiness"), Icon: ShieldCheck },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <s.Icon size={20} className="mb-2 text-accent-purple" strokeWidth={2.2} />
                  <div className="text-3xl md:text-4xl font-extrabold leading-none" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    <CountUp to={s.n} suffix={s.suf} />
                  </div>
                  <div className={`text-xs text-text-secondary mt-2 ${lang === "bn" ? "bn" : ""}`}>{s.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                { Icon: ShieldCheck, en: "7 Days Replacement", bn: "৭ দিনের রিপ্লেসমেন্ট", d_en: "Peace of mind guaranteed", d_bn: "নিশ্চিন্ত কেনাকাটা" },
                { Icon: BadgeCheck, en: "Verified Devices", bn: "যাচাইকৃত ডিভাইস", d_en: "100% quality checked", d_bn: "১০০% কোয়ালিটি চেক করা" },
                { Icon: Star, en: "Best Market Price", bn: "সেরা বাজার মূল্য", d_en: "Fair prices for buy & sell", d_bn: "কেনা ও বেচায় ন্যায্য দাম" },
              ].map((b, i) => (
                <div key={i} className="glass-soft p-4">
                  <b.Icon size={22} className="text-accent-purple" />
                  <div className={`font-semibold mt-2 ${lang === "bn" ? "bn" : ""}`}>{lang === "bn" ? b.bn : b.en}</div>
                  <div className={`text-xs text-text-muted mt-1 ${lang === "bn" ? "bn" : ""}`}>{lang === "bn" ? b.d_bn : b.d_en}</div>
                </div>
              ))}
            </div>
          </div>
        </section>




        {/* REVIEWS */}
        <section className="px-4 py-12 lazy-section">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className={`text-3xl md:text-4xl font-bold ${lang === "bn" ? "bn" : ""}`}>{tr("reviews")}</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
              {REVIEWS.map((r, i) => (
                <div key={i} className="glass p-5 snap-start min-w-[85%] sm:min-w-[60%] md:min-w-0 hover:translate-y-[-4px] transition">
                  <div className="flex gap-0.5 mb-2 text-accent-orange">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} size={14} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <p className={`text-sm text-text-secondary ${lang === "bn" ? "bn" : ""}`}>"{lang === "bn" ? r.bn : r.en}"</p>
                  <div className="mt-4 pt-4 border-t border-black/10">
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-xs text-text-muted">{r.device} • {r.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-12 lazy-section">
          <div className="mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <h2 className={`text-3xl md:text-4xl font-bold ${lang === "bn" ? "bn" : ""}`}>{tr("faq")}</h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="glass overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full p-5 flex items-center justify-between gap-3 text-left"
                    >
                      <span className={`font-semibold text-sm ${lang === "bn" ? "bn" : ""}`}>{lang === "bn" ? f.q_bn : f.q_en}</span>
                      <Plus size={18} className={`text-accent-purple shrink-0 transition-transform ${open ? "rotate-45" : ""}`} />
                    </button>
                    <div className={`grid transition-all ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <p className={`px-5 pb-5 text-sm text-text-secondary ${lang === "bn" ? "bn" : ""}`}>{lang === "bn" ? f.a_bn : f.a_en}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="px-4 py-12 scroll-mt-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className={`text-3xl md:text-4xl font-bold ${lang === "bn" ? "bn" : ""}`}>{tr("contactUs")}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass p-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(240,138,110,0.18)" }}>
                    <MapPin size={18} className="text-accent-purple" />
                  </div>
                  <div className="min-w-0">
                    <div className="label-caps">{tr("address")}</div>
                    <div className={`text-sm mt-1 ${lang === "bn" ? "bn" : ""}`}>{lang === "bn" ? settings.addressBn : settings.address}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(88,71,199,0.18)" }}>
                    <PhoneIcon size={18} className="text-accent-purple" />
                  </div>
                  <div className="min-w-0">
                    <div className="label-caps">{tr("phone")}</div>
                    <a href={`tel:${settings.phone}`} className="block text-sm mt-1 font-semibold">{settings.phone}</a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(91,184,144,0.20)" }}>
                    <WhatsAppIcon size={18} color="#25D366" />
                  </div>
                  <div className="min-w-0">
                    <div className="label-caps">WhatsApp</div>
                    <a href={`https://wa.me/${settings.whatsapp}`} className="block text-sm mt-1 font-semibold">+{settings.whatsapp}</a>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: "rgba(240,176,64,0.18)" }}>
                    <Clock size={18} className="text-accent-orange" />
                  </div>
                  <div className="min-w-0">
                    <div className="label-caps">{tr("hours")}</div>
                    <div className="text-sm mt-1">{settings.hours}</div>
                  </div>
                </div>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`} target="_blank" rel="noreferrer" className="btn-primary w-full">
                  {lang === "bn" ? "ডিরেকশন নিন" : "Get Directions"}
                </a>
              </div>
              <div className="glass overflow-hidden min-h-[280px]">
                <iframe
                  title="Map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                  className="w-full h-full min-h-[280px] border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <PhoneDetailModal
        phone={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        returnFocusRef={triggerRef}
        layoutIdPrefix="featured"
      />

      <Footer />
    </div>
  );
}
