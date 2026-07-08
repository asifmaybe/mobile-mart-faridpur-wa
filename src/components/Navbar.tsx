import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Smartphone, Menu, X } from "lucide-react";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import { useI18n } from "../lib/i18n";
import { getSettings, getCachedSettings } from "../lib/storage";

export function Navbar() {
  const { tr, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settings, setSettings] = useState<any>(getCachedSettings);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const refresh = async () => setSettings(await getSettings());
    refresh();
    window.addEventListener("repairshop:change", refresh);
    return () => window.removeEventListener("repairshop:change", refresh);
  }, []);

  // rAF-throttled scroll listener — avoids janky layout thrashing on scroll
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        rafRef.current = null;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const links: { to: string; key: "home" | "services" | "getEstimateNav" | "phones" | "accessories" | "track" | "book" | "contact" }[] = [
    { to: "/", key: "home" },
    { to: "/phones", key: "phones" },
    { to: "/accessories", key: "accessories" },
    { to: "/#contact", key: "contact" },
  ];

  const shopName = settings?.shopName || "Faridpur Mobile Mart";
  const shopNameBn = settings?.shopNameBn || "ম্যাক ইলেকট্রনিক্স";
  const whatsapp = settings?.whatsapp || "8801700000000";

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 ${scrolled ? "py-2" : "py-3"}`}
      style={{
        background: scrolled ? "rgba(255, 255, 255, 0.82)" : "rgba(255, 255, 255, 0.50)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.6)",
        boxShadow: scrolled ? "0 4px 24px rgba(30,28,70,0.08)" : "0 4px 24px rgba(30,28,70,0)",
        transition: "background 0.35s ease, box-shadow 0.35s ease, padding 0.35s ease",
        willChange: "backdrop-filter",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0">
          <img
            src="/logo.png"
            alt="Shop Logo"
            className="w-9 h-9 object-contain rounded-xl"
          />


          <div className="leading-tight min-w-0">
            <div className="font-bold text-sm truncate">{shopName}</div>
            <div className="text-[10px] text-text-muted truncate bn">{shopNameBn}</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition rounded-lg hover:bg-white/30">
              {tr(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="glass-pill px-3 py-1.5 text-xs font-semibold"
            aria-label="Toggle language"
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            {lang === "en" ? "বাং" : "EN"}
          </button>
          <Link to="/admin" className="hidden sm:inline-flex glass-pill px-4 py-2 text-xs font-semibold">
            {tr("adminLogin")}
          </Link>
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank" rel="noreferrer"
            className="w-10 h-10 rounded-full grid place-items-center"
            style={{ background: "rgba(91,184,144,0.18)", border: "1px solid rgba(91,184,144,0.4)", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={20} color="#25D366" />
          </a>
          <button
            className="lg:hidden w-10 h-10 rounded-full grid place-items-center glass-pill"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — CSS transform instead of mount/unmount to avoid layout thrash */}
      <div
        className="lg:hidden mx-4 mt-2 glass p-2 overflow-hidden"
        style={{
          maxHeight: open ? "320px" : "0px",
          opacity: open ? 1 : 0,
          paddingTop: open ? undefined : 0,
          paddingBottom: open ? undefined : 0,
          transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease",
          willChange: "max-height, opacity",
          pointerEvents: open ? "auto" : "none",
        }}
        aria-hidden={!open}
      >
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5">
            {tr(l.key)}
          </Link>
        ))}
        <Link to="/admin" className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-white/5">
          {tr("adminLogin")}
        </Link>
      </div>
    </header>
  );
}
