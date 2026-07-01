const fs = require('fs');

let content = fs.readFileSync('src/routes/index.tsx', 'utf-8');

// 1. Imports
content = content.replace(
`import {
  Phone as PhoneIcon,
  ShieldCheck, Zap, Wrench, Search, ArrowRight, MapPin,
  Microscope, UserCog, Star, Plus, Clock,
} from "lucide-react";`,
`import {
  Phone as PhoneIcon,
  ShieldCheck, Zap, Wrench, Search, ArrowRight, MapPin,
  Microscope, UserCog, Star, Plus, Clock, Smartphone, MessageCircle, Repeat, BadgeCheck,
} from "lucide-react";`
);

content = content.replace(
`import { getSettings } from "../lib/storage";`,
`import { getSettings, getAvailablePhones, getAccessories, isJustIn } from "../lib/storage";
import type { UsedPhone } from "../lib/storage";
import { PhoneCard } from "./phones";
import { AccessoryCard } from "./accessories";
import { PhoneDetailModal } from "../components/PhoneDetailModal";
import { useRef } from "react";`
);

// 2. FAQS
content = content.replace(
`const FAQS = [
  { q_en: "Do you provide warranty on repairs?", a_en: "Yes — all repairs come with a 1-year warranty on parts and a 3-month service warranty.", q_bn: "রিপেয়ারে কি ওয়ারেন্টি দেওয়া হয়?", a_bn: "হ্যাঁ — পার্টসে ১ বছর এবং সার্ভিসে ৩ মাসের ওয়ারেন্টি।" },
  { q_en: "How long does a typical repair take?", a_en: "Most repairs are done same-day. Complex repairs may take 24-48 hours.", q_bn: "একটি রিপেয়ারে কতক্ষণ সময় লাগে?", a_bn: "বেশিরভাগ রিপেয়ার একদিনেই হয়। জটিল কাজ ২৪-৪৮ ঘন্টা।" },`,
`const FAQS = [
  { q_en: "Do you provide warranty on repairs?", a_en: "Yes — all repairs come with a 1-year warranty on parts and a 3-month service warranty.", q_bn: "রিপেয়ারে কি ওয়ারেন্টি দেওয়া হয়?", a_bn: "হ্যাঁ — পার্টসে ১ বছর এবং সার্ভিসে ৩ মাসের ওয়ারেন্টি।" },
  { q_en: "Do you buy or exchange used phones?", a_en: "Yes — we buy used phones at a fair market price and offer exchange credit toward your next device. Bring your phone in or message us on WhatsApp for an instant assessment.", q_bn: "আপনারা কি ইউজড ফোন কেনেন বা এক্সচেঞ্জ করেন?", a_bn: "হ্যাঁ — আমরা ন্যায্য বাজার মূল্যে ইউজড ফোন কিনি এবং পরবর্তী ডিভাইসের জন্য এক্সচেঞ্জ ক্রেডিট দিই। ফোন নিয়ে আসুন অথবা হোয়াটসঅ্যাপে মেসেজ করুন তাৎক্ষণিক মূল্যায়নের জন্য।" },
  { q_en: "How long does a typical repair take?", a_en: "Most repairs are done same-day. Complex repairs may take 24-48 hours.", q_bn: "একটি রিপেয়ারে কতক্ষণ সময় লাগে?", a_bn: "বেশিরভাগ রিপেয়ার একদিনেই হয়। জটিল কাজ ২৪-৪৮ ঘন্টা।" },`
);

// 3. State
const stateOld = `  const [settings, setSettings] = useState(getSettings());
  useEffect(() => {
    const h = () => setSettings(getSettings());
    window.addEventListener("repairshop:change", h);
    return () => window.removeEventListener("repairshop:change", h);
  }, []);`;

const stateNew = `  const [settings, setSettings] = useState(getSettings());
  const [detail, setDetail] = useState<UsedPhone | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const openPhoneDetail = (p: UsedPhone, trigger: HTMLElement | null) => {
    triggerRef.current = trigger;
    setDetail(p);
  };
  const [allPhones, setAllPhones] = useState(getAvailablePhones());
  const [allAccessories, setAllAccessories] = useState(getAccessories());

  useEffect(() => {
    const h = () => {
      setSettings(getSettings());
      setAllPhones(getAvailablePhones());
      setAllAccessories(getAccessories());
    };
    window.addEventListener("repairshop:change", h);
    return () => window.removeEventListener("repairshop:change", h);
  }, []);

  const featuredPhones = [...allPhones].sort((a, b) => {
    const aJust = isJustIn(a.dateAdded) ? 1 : 0;
    const bJust = isJustIn(b.dateAdded) ? 1 : 0;
    if (aJust !== bJust) return bJust - aJust;
    return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
  }).slice(0, 4);

  const featuredAccessories = [...allAccessories].filter(a => a.status !== "Discontinued").sort((a, b) => {
    const aJust = isJustIn(a.dateAdded) ? 1 : 0;
    const bJust = isJustIn(b.dateAdded) ? 1 : 0;
    if (aJust !== bJust) return bJust - aJust;
    return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
  }).slice(0, 4);`;

content = content.replace(stateOld, stateNew);

// 4. Hero copy
const heroOld = `            {lang === "bn" ? (
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] fade-up bn">
                <>বিশ্বস্ত মোবাইল<br/><span style={{ background: "linear-gradient(135deg,#5847C7,#7C6FE8,#5BB890)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>রিপেয়ার সমাধান।</span></>
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] fade-up">
                <>Expert Mobile Repair<br/><span style={{ background: "linear-gradient(135deg,#5847C7,#7C6FE8,#5BB890)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Done Right.</span></>
              </h1>
            )}
            <p className={\`mt-5 max-w-xl mx-auto text-base text-text-secondary fade-up \${lang === "bn" ? "bn" : ""}\`} style={{ animationDelay: "0.1s" }}>
              {tr("heroSub")}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 fade-up" style={{ animationDelay: "0.2s" }}>
              <a href={\`tel:\${settings.phone}\`} className="btn-primary w-full sm:w-auto"><PhoneIcon size={16} /> {tr("callNow")}</a>
              <a href={\`https://wa.me/\${settings.whatsapp}\`} target="_blank" rel="noreferrer" className="btn-glass w-full sm:w-auto"><WhatsAppIcon size={16} color="#25D366" /> {tr("whatsappUs")}</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 fade-up" style={{ animationDelay: "0.3s" }}>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><ShieldCheck size={14} /> {tr("warranty1y")}</span>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><Zap size={14} /> {tr("sameDay")}</span>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><Wrench size={14} /> {tr("genuineParts")}</span>
            </div>`;

const heroNew = `            {lang === "bn" ? (
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] fade-up bn">
                <>ফোন কিনুন, বিক্রি করুন ও এক্সচেঞ্জ করুন।<br/><span style={{ background: "linear-gradient(135deg,#5847C7,#7C6FE8,#5BB890)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>বিশ্বস্ত ও ঝামেলাহীন।</span></>
              </h1>
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] fade-up">
                <>Buy, Sell &amp; Exchange Phones.<br/><span style={{ background: "linear-gradient(135deg,#5847C7,#7C6FE8,#5BB890)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Trusted &amp; Hassle-Free.</span></>
              </h1>
            )}
            <p className={\`mt-5 max-w-xl mx-auto text-base text-text-secondary fade-up \${lang === "bn" ? "bn" : ""}\`} style={{ animationDelay: "0.1s" }}>
              {tr("heroSubtext")}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 fade-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/phones" className="btn-primary w-full sm:w-auto"><Smartphone size={16} /> {tr("browsePhonesCta")}</Link>
              <a href={\`https://wa.me/\${settings.whatsapp}\`} target="_blank" rel="noreferrer" className="btn-glass w-full sm:w-auto"><WhatsAppIcon size={16} color="#25D366" /> {tr("whatsappUs")}</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 fade-up" style={{ animationDelay: "0.3s" }}>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><ShieldCheck size={14} /> {tr("warranty1y")}</span>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><Repeat size={14} /> {tr("sameDay")}</span>
              <span className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"><BadgeCheck size={14} /> {tr("genuineParts")}</span>
            </div>`;

content = content.replace(heroOld, heroNew);

function extractBlock(text, startMarker, endMarker) {
    let startIdx = text.indexOf(startMarker);
    if (startIdx === -1) return ["", text];
    if (endMarker) {
        let endIdx = text.indexOf(endMarker, startIdx);
        if (endIdx === -1) return ["", text];
        let block = text.substring(startIdx, endIdx);
        return [block, text.substring(0, startIdx) + text.substring(endIdx)];
    }
    return ["", text];
}

let mainStart = content.indexOf("        {/* SERVICES */}");
let mainEnd = content.indexOf("      </main>");

let beforeMain = content.substring(0, mainStart);
let mainContent = content.substring(mainStart, mainEnd);

let [servicesBlock, rem1] = extractBlock(mainContent, "{/* SERVICES */}", "{/* STATS */}");
mainContent = rem1;
let [statsBlock, rem2] = extractBlock(mainContent, "{/* STATS */}", "{/* BRANDS */}");
mainContent = rem2;
let [brandsBlock, rem3] = extractBlock(mainContent, "{/* BRANDS */}", "{/* REVIEWS */}");
mainContent = rem3;
let [reviewsBlock, rem4] = extractBlock(mainContent, "{/* REVIEWS */}", "{/* FAQ */}");
mainContent = rem4;
let [faqBlock, rem5] = extractBlock(mainContent, "{/* FAQ */}", "{/* CONTACT */}");
mainContent = rem5;
let contactBlock = mainContent.substring(mainContent.indexOf("{/* CONTACT */}"));

brandsBlock = brandsBlock.replace('tr("brandsWeRepair")', 'tr("brandsWeBuySellRepair")');
brandsBlock = brandsBlock.replace("<JustInFeed />", "");

const featuredPhonesBlock = `
        {/* FEATURED PHONES */}
        {featuredPhones.length > 0 && (
          <section className="px-4 py-12">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-6">
                <div className="label-caps">{tr("ourInventory")}</div>
                <h2 className={\`text-3xl md:text-4xl font-bold mt-2 \${lang === "bn" ? "bn" : ""}\`}>{tr("phonesReadyToGo")}</h2>
                <p className={\`text-text-secondary text-sm mt-2 \${lang === "bn" ? "bn" : ""}\`}>{tr("phonesReadySub")}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredPhones.map(p => (
                  <PhoneCard key={p.id} phone={p} tr={tr} lang={lang} onViewDetails={openPhoneDetail} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link to="/phones" className="btn-glass px-6">{tr("viewAllPhones")}</Link>
              </div>
            </div>
          </section>
        )}`;

const tradeInBlock = `
        {/* TRADE-IN HIGHLIGHT */}
        <section className="px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="glass w-full p-8 md:p-12 text-center relative overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              <div className="relative z-10 flex flex-col items-center">
                <Repeat size={48} className="text-accent-blue mb-4" strokeWidth={1.5} />
                <h2 className={\`text-2xl md:text-3xl font-extrabold mb-3 \${lang === "bn" ? "bn" : ""}\`}>{tr("gotOldPhone")}</h2>
                <p className={\`text-text-secondary max-w-lg mb-6 \${lang === "bn" ? "bn" : ""}\`}>{tr("tradeInSub")}</p>
                <a href={\`https://wa.me/\${settings.whatsapp}?text=\${encodeURIComponent("Hi, I'd like to know the exchange value for my phone.")}\`} target="_blank" rel="noreferrer" className="btn-primary">
                  <MessageCircle size={18} /> {tr("getExchangeValueWa")}
                </a>
              </div>
            </div>
          </div>
        </section>`;

const accessoriesBlock = `
        {/* ACCESSORIES HIGHLIGHT */}
        {featuredAccessories.length > 0 && (
          <section className="px-4 py-12">
            <div className="mx-auto max-w-6xl">
              <div className="text-center mb-6">
                <div className="label-caps">{tr("gadgetsAccessories")}</div>
                <h2 className={\`text-3xl md:text-4xl font-bold mt-2 \${lang === "bn" ? "bn" : ""}\`}>{tr("powerUpDevice")}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredAccessories.map(a => (
                  <AccessoryCard key={a.id} acc={a} tr={tr} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link to="/accessories" className="btn-glass px-6">{tr("viewAllAccessories")}</Link>
              </div>
            </div>
          </section>
        )}`;

let newMainContent = 
    featuredPhonesBlock + 
    "\\n        {/* JUST IN */}\\n        <JustInFeed />\\n" + 
    tradeInBlock + 
    servicesBlock + 
    accessoriesBlock + 
    statsBlock + 
    brandsBlock + 
    reviewsBlock + 
    faqBlock + 
    contactBlock;

const modalStr = `
      <PhoneDetailModal
        phone={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        returnFocusRef={triggerRef}
      />
`;

let afterMainEnd = content.substring(mainEnd + 14); // skipping "      </main>\n"
content = beforeMain + newMainContent + "      </main>\\n" + modalStr + afterMainEnd;

fs.writeFileSync('src/routes/index.tsx', content, 'utf-8');
console.log('Success');
