import { useState } from "react";
import {
  Smartphone, BatteryCharging, Plug, Droplets, Camera, Volume2,
  HardDrive, Wifi, CircleDot, Layers, X, type LucideIcon,
} from "lucide-react";
import { Modal } from "../lib/ui";
import { useI18n } from "../lib/i18n";

type AnimKey =
  | "screen" | "battery" | "port" | "water" | "camera"
  | "speaker" | "software" | "wifi" | "button" | "panel";

type Service = {
  key: AnimKey;
  icon: LucideIcon;
  en: string;
  bn: string;
  desc_en: string;
  desc_bn: string;
  accent: string; // hex used for the radial glow
};

const SERVICES: Service[] = [
  { key: "screen",   icon: Smartphone,      en: "Screen Replacement",  bn: "স্ক্রিন রিপ্লেসমেন্ট",   desc_en: "Original-grade OLED & LCD replacements for cracked or unresponsive displays, restored same-day with full touch & color calibration.", desc_bn: "ভাঙা বা অচল ডিসপ্লের জন্য অরিজিনাল-গ্রেড OLED ও LCD রিপ্লেসমেন্ট, সম্পূর্ণ টাচ ও কালার ক্যালিব্রেশনসহ একদিনেই।",   accent: "#7C6FE8" },
  { key: "battery",  icon: BatteryCharging, en: "Battery Replacement", bn: "ব্যাটারি রিপ্লেসমেন্ট",  desc_en: "Genuine cells with health certification — fixes fast drain, swelling, and shutdown issues. Backed by a 1-year warranty.", desc_bn: "অরিজিনাল সেল ও হেলথ সার্টিফিকেশনসহ — দ্রুত চার্জ ফুরানো, ফুলে যাওয়া এবং বন্ধ হয়ে যাওয়ার সমস্যা সমাধান।",                     accent: "#5BB890" },
  { key: "port",     icon: Plug,            en: "Charging Port",       bn: "চার্জিং পোর্ট",          desc_en: "Loose, bent, or dead charging ports cleaned, re-soldered, or replaced. Includes data-line check.",                                            desc_bn: "ঢিলা, বাঁকা বা নষ্ট চার্জিং পোর্ট পরিষ্কার, রি-সোল্ডার বা রিপ্লেস। ডেটা লাইনসহ চেক করা হয়।",                                accent: "#F0A856" },
  { key: "water",    icon: Droplets,        en: "Water Damage",        bn: "পানির ক্ষতি",            desc_en: "Ultrasonic cleaning, corrosion removal, and board-level recovery for water/liquid-damaged phones.",                                          desc_bn: "পানি বা তরলে ভেজা ফোনের জন্য আল্ট্রাসনিক ক্লিনিং, করোশন রিমুভাল ও বোর্ড-লেভেল রিকভারি।",                                  accent: "#7FB3E0" },
  { key: "camera",   icon: Camera,          en: "Camera Repair",       bn: "ক্যামেরা রিপেয়ার",       desc_en: "Blurry shots, black screen, or shaky OIS? We replace lens modules and fix focus/sensor errors.",                                            desc_bn: "ঝাপসা ছবি, কালো স্ক্রিন বা OIS সমস্যা? লেন্স মডিউল রিপ্লেস ও ফোকাস/সেন্সর ত্রুটি সমাধান করি।",                            accent: "#5847C7" },
  { key: "speaker",  icon: Volume2,         en: "Speaker / Mic Fix",   bn: "স্পিকার / মাইক",         desc_en: "No sound, low volume, or muffled calls — we repair earpieces, loudspeakers, and microphones.",                                              desc_bn: "শব্দ না আসা, কম ভলিউম বা কলে অস্পষ্টতা — ইয়ারপিস, লাউডস্পিকার ও মাইক্রোফোন রিপেয়ার করি।",                                  accent: "#F0C24A" },
  { key: "software", icon: HardDrive,       en: "Software / Unlock",   bn: "সফটওয়্যার / আনলক",      desc_en: "Bootloop, FRP lock, forgotten passwords, OS reflashing and firmware restoration handled safely.",                                          desc_bn: "বুটলুপ, FRP লক, ভুলে যাওয়া পাসওয়ার্ড, OS রিফ্ল্যাশ ও ফার্মওয়্যার পুনরুদ্ধার নিরাপদে।",                                   accent: "#E07566" },
  { key: "wifi",     icon: Wifi,            en: "Network / Signal",    bn: "নেটওয়ার্ক / সিগন্যাল",   desc_en: "Weak Wi-Fi, no SIM, or dropping calls? Antenna and baseband issues diagnosed and repaired.",                                              desc_bn: "দুর্বল Wi-Fi, SIM ধরছে না, কল কেটে যায়? অ্যান্টেনা ও বেসব্যান্ড সমস্যা সমাধান করি।",                                    accent: "#7FB3E0" },
  { key: "button",   icon: CircleDot,       en: "Button Repair",       bn: "বাটন রিপেয়ার",          desc_en: "Stuck power, volume, or home buttons rebuilt with OEM tact switches and flex cables.",                                                      desc_bn: "আটকে যাওয়া পাওয়ার, ভলিউম বা হোম বাটন OEM ট্যাক্ট সুইচ ও ফ্লেক্স কেবল দিয়ে পুনর্নির্মাণ।",                                accent: "#8B8AA8" },
  { key: "panel",    icon: Layers,          en: "Back Panel",          bn: "ব্যাক প্যানেল",          desc_en: "Cracked rear glass or back covers replaced with color-matched panels and proper adhesive seal.",                                            desc_bn: "ভাঙা পেছনের গ্লাস বা ব্যাক কভার রঙ-মিলিত প্যানেল ও সঠিক আঠা সিলসহ রিপ্লেস।",                                                accent: "#5847C7" },
];

export function ServiceCardsGrid() {
  const { lang } = useI18n();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const active = activeIdx !== null ? SERVICES[activeIdx] : null;

  const handleClick = (i: number) => {
    setClickedIdx(i);
    // open the modal after the click pulse plays
    window.setTimeout(() => {
      setActiveIdx(i);
      setClickedIdx(null);
    }, 380);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {SERVICES.map((s, i) => {
          const Icon = s.icon;
          const isClicked = clickedIdx === i;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleClick(i)}
              aria-label={lang === "bn" ? s.bn : s.en}
              className="glass-soft fade-up rounded-2xl p-3 flex items-center gap-3 hover:translate-y-[-2px] transition text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/60"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <span
                className="w-9 h-9 rounded-xl grid place-items-center shrink-0 overflow-hidden relative"
                style={{ background: "linear-gradient(135deg,rgba(240,138,110,0.22),rgba(88,71,199,0.18))" }}
              >
                <span className={`svc-icon ${isClicked ? `svc-click-${s.key}` : ""}`}>
                  <Icon size={18} className="text-accent-purple" strokeWidth={2.2} />
                </span>
              </span>
              <div className="min-w-0">
                <div className={`text-xs sm:text-sm font-semibold truncate ${lang === "bn" ? "bn" : ""}`}>
                  {lang === "bn" ? s.bn : s.en}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Modal open={!!active} onClose={() => setActiveIdx(null)}>
        {active && <ServiceDetail service={active} onClose={() => setActiveIdx(null)} />}
      </Modal>
    </>
  );
}

function ServiceDetail({ service, onClose }: { service: Service; onClose: () => void }) {
  const { lang } = useI18n();
  const Icon = service.icon;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full grid place-items-center bg-white/70 hover:bg-white border border-black/10"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col items-center text-center pt-2 pb-1">
        <div
          className="relative w-28 h-28 rounded-full grid place-items-center mb-4"
          style={{
            background: `radial-gradient(circle at center, ${service.accent}33 0%, ${service.accent}11 45%, transparent 75%)`,
          }}
        >
          <span className={`svc-icon-lg svc-idle-${service.key}`}>
            <Icon size={48} strokeWidth={2.1} style={{ color: service.accent }} />
          </span>
        </div>
        <h3 className={`text-xl font-bold ${lang === "bn" ? "bn" : ""}`}>
          {lang === "bn" ? service.bn : service.en}
        </h3>
        <p className={`mt-3 text-sm text-text-secondary ${lang === "bn" ? "bn" : ""}`}>
          {lang === "bn" ? service.desc_bn : service.desc_en}
        </p>
      </div>
    </div>
  );
}
