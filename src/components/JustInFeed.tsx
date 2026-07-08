import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, ChevronLeft, ChevronRight, ArrowRight, Eye } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "../lib/i18n";
import { getJustInItems, type JustInItem, type UsedPhone, getSettings, getCachedSettings } from "../lib/storage";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import { shopWhatsAppLink, bdt } from "../lib/wa";
import { PhoneDetailModal } from "./PhoneDetailModal";
import { JustInCardSkeleton } from "./Skeletons";

function itemTitle(j: JustInItem) {
  return j.type === "phone" ? `${j.item.brand} ${j.item.model}` : j.item.name;
}
function itemBadge(j: JustInItem) {
  return j.type === "phone" ? j.item.condition : j.item.category;
}
function itemMsg(j: JustInItem) {
  return j.type === "phone"
    ? `Hi! I'm interested in the ${j.item.brand} ${j.item.model} listed for ${bdt(j.item.sellingPrice)}.`
    : `Hi! I'd like to buy the ${j.item.name} listed for ${bdt(j.item.sellingPrice)}.`;
}

export function JustInFeed() {
  const { tr, lang } = useI18n();
  const [items, setItems] = useState<JustInItem[] | null>(null); // null = loading
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [detail, setDetail] = useState<UsedPhone | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const [settings, setSettings] = useState<any>(getCachedSettings);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      // Parallel fetch — settings and items simultaneously
      const [newItems, newSettings] = await Promise.all([
        getJustInItems(6),
        getSettings(),
      ]);
      if (!cancelled) {
        setItems(newItems);
        setSettings(newSettings);
      }
    };
    refresh();
    window.addEventListener("repairshop:change", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("repairshop:change", refresh);
    };
  }, []);

  const nudge = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(360, el.clientWidth * 0.8), behavior: "smooth" });
  };

  // Show skeleton while loading
  if (items === null) return (
    <section className="px-4 mt-14 mb-14">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="flex items-end justify-between gap-3 mb-5">
          <div className="space-y-2">
            <div className="skeleton h-8 w-52" />
            <div className="skeleton h-4 w-72" />
          </div>
        </div>
        {/* Card row skeleton */}
        <div className="flex gap-4 overflow-hidden">
          {["68%", "48%", "32%", "24%"].map((w, i) => (
            <JustInCardSkeleton key={i} wide={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
  // Hide section if no items
  if (items.length === 0) return null;

  return (
    <section className="px-4 mt-14 mb-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h2 className={`text-2xl md:text-3xl font-extrabold inline-flex items-center gap-2 ${lang === "bn" ? "bn" : ""}`}>
              {tr("justIn")} <Flame size={22} strokeWidth={1.75} className="text-accent-orange" />
            </h2>
            <p className={`text-text-secondary text-sm mt-1 ${lang === "bn" ? "bn" : ""}`}>{tr("justInSubtitle")}</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => nudge(-1)}
              aria-label="Previous"
              className="w-10 h-10 rounded-full glass-pill grid place-items-center"
              style={{ touchAction: "manipulation" }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => nudge(1)}
              aria-label="Next"
              className="w-10 h-10 rounded-full glass-pill grid place-items-center"
              style={{ touchAction: "manipulation" }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="just-in-mask">
            <div
              ref={scrollerRef}
              className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory no-scrollbar"
              style={{ scrollPaddingLeft: "1rem", willChange: "scroll-position" }}
            >
              {items.map((j) => {
                const isPhone = j.type === "phone";
                return (
                  // layoutId removed — it triggers costly FLIP on every list re-render
                  <motion.article
                    key={`${j.type}-${j.item.id}`}
                    className="glass shrink-0 w-[68%] sm:w-[48%] md:w-[32%] lg:w-[24%] snap-start overflow-hidden flex flex-col"
                    style={{ borderRadius: 22 }}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  >
                    <div className="aspect-[3/4] bg-white/30 relative">
                      <PhotoPlaceholder url={j.item.photoUrl} alt={itemTitle(j)} />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-white/70 text-text-secondary border-white/80">
                        {itemBadge(j)}
                      </span>
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <h3 className="font-bold text-sm leading-tight line-clamp-1">{itemTitle(j)}</h3>
                      <div className="text-lg font-extrabold">{bdt(j.item.sellingPrice)}</div>
                      {isPhone ? (
                        <div className="mt-1 flex gap-1.5">
                          <a
                            href={shopWhatsAppLink(itemMsg(j))}
                            target="_blank" rel="noreferrer"
                            className="btn-primary !min-h-[44px] !py-2 text-xs basis-2/3 grow justify-center"
                            aria-label={tr("whatsappToBuy")}
                          >
                            <WhatsAppIcon size={14} color="#FFFFFF" /> {tr("whatsappToBuy")}
                          </a>
                          <button
                            type="button"
                            onClick={(e) => { triggerRef.current = e.currentTarget; setDetail(j.item as UsedPhone); }}
                            aria-label={tr("viewDetails")}
                            className="btn-glass !min-h-[44px] !py-2 text-xs basis-1/3 grow justify-center"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      ) : (
                        <a
                          href={shopWhatsAppLink(itemMsg(j))}
                          target="_blank" rel="noreferrer"
                          className="btn-primary !min-h-[44px] !py-2 mt-1 text-xs justify-center"
                          aria-label={tr("whatsappToBuy")}
                        >
                          <WhatsAppIcon size={14} color="#FFFFFF" /> {tr("whatsappToBuy")}
                        </a>
                      )}
                    </div>
                  </motion.article>
                );
              })}

              <Link
                to="/phones"
                className="shrink-0 w-[40%] sm:w-[24%] md:w-[20%] lg:w-[16%] snap-start glass grid place-items-center text-sm font-semibold"
                style={{ minHeight: 220 }}
              >
                <span className="inline-flex items-center gap-2">{tr("viewAll") || "View All"} <ArrowRight size={16} /></span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PhoneDetailModal
        phone={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        returnFocusRef={triggerRef}
      />
    </section>
  );
}
