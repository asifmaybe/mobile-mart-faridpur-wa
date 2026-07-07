import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Flame, ChevronLeft, ChevronRight, GitCompareArrows } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "../lib/i18n";
import { isJustIn, type UsedPhone } from "../lib/storage";
import { bdt, shopWhatsAppLink } from "../lib/wa";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

interface Props {
  phone: UsedPhone | null;
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  /** kept for API compatibility — no longer used for layoutId */
  layoutIdPrefix?: string;
}

export function PhoneDetailModal({ phone, open, onClose, returnFocusRef }: Props) {
  const { tr, lang } = useI18n();
  const reduceMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeImg, setActiveImg] = useState(0);
  

  useEffect(() => { if (open) setActiveImg(0); }, [open, phone?.id]);

  // Esc + focus trap + scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tId = setTimeout(() => closeBtnRef.current?.focus(), 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(tId);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      const target = returnFocusRef?.current ?? prev;
      target?.focus?.();
    };
  }, [open, onClose, returnFocusRef]);

  if (typeof document === "undefined") return null;

  // iOS 26-style spring: critically damped, fast settle, no bounce
  const panelSpring = reduceMotion
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 500, damping: 42, mass: 0.85 };

  const scrimTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  // Mobile: slides up from bottom. Desktop: scales up from center.
  const panelVariants = {
    hidden: reduceMotion
      ? { opacity: 0 }
      : {
        opacity: 0,
        y: typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 24,
        scale: typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 0.95,
      },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: reduceMotion
      ? { opacity: 0 }
      : {
        opacity: 0,
        y: typeof window !== "undefined" && window.innerWidth < 640 ? "100%" : 16,
        scale: typeof window !== "undefined" && window.innerWidth < 640 ? 1 : 0.97,
        transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
      },
  };

  return createPortal(
    <AnimatePresence>
      {open && phone && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[95] bg-[rgba(14,12,32,0.50)] backdrop-blur-[18px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={scrimTransition}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel container */}
          <div className="fixed inset-0 z-[96] pointer-events-none flex sm:items-center items-end justify-center p-4 sm:p-6">
            <motion.div
              ref={panelRef}
              key={`modal-${phone.id}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`phone-detail-title-${phone.id}`}
              className="pointer-events-auto w-full sm:max-w-[680px] max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col rounded-[26px]"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.88)",
                borderTop: "1px solid rgba(255,255,255,0.98)",
                boxShadow: "0 32px 80px rgba(30,20,80,0.22), 0 8px 24px rgba(30,20,80,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
                willChange: "transform, opacity",
              }}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={panelSpring}
            >
              {/* Drag handle (mobile) */}
              <div className="sm:hidden pt-3 pb-1 grid place-items-center shrink-0">
                <div className="w-10 h-1 rounded-full bg-text-muted/35" />
              </div>

              {/* Close button */}
              <button
                ref={closeBtnRef}
                onClick={onClose}
                aria-label={tr("closeDetails")}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full grid place-items-center"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.85)",
                  boxShadow: "0 2px 8px rgba(80,70,160,0.10)",
                }}
              >
                <X size={16} />
              </button>

              {/* Scrollable content wrapper with static top padding so it clips before the top edge */}
              <div className="flex-1 overflow-hidden flex flex-col pt-0 sm:pt-3 px-3">
                <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar rounded-t-2xl">
                  <PhotoGallery phone={phone} activeImg={activeImg} setActiveImg={setActiveImg} label={tr("photoGalleryLabel")} />

                  <div className="px-2 pt-4 pb-5 space-y-4">
                  <div className="flex items-start justify-between gap-3 pr-12">
                    <div>
                      <h2 id={`phone-detail-title-${phone.id}`} className="text-xl sm:text-2xl font-extrabold leading-tight">
                        {phone.brand} {phone.model}
                      </h2>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-white/70 text-text-secondary border-white/80">
                          {phone.condition}
                        </span>
                        {isJustIn(phone.dateAdded) && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-accent-orange/25 text-accent-orange border-accent-orange/50">
                            <Flame size={11} strokeWidth={1.75} /> {tr("justIn")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold whitespace-nowrap">{bdt(phone.sellingPrice)}</div>
                  </div>

                  {phone.shortDescription && (
                    <p className="text-sm text-text-secondary leading-relaxed">{phone.shortDescription}</p>
                  )}

                  <div>
                    <h3 className="label-caps mb-2">{tr("fullSpecs")}</h3>
                    <div className="glass-soft rounded-2xl divide-y divide-black/5">
                      <SpecRow label={tr("brand")} value={phone.brand} />
                      <SpecRow label={tr("model")} value={phone.model} />
                      <SpecRow label={tr("storage")} value={phone.storage || "—"} />
                      <SpecRow label={tr("ram")} value={phone.ram || "—"} />
                      <SpecRow label={tr("batteryHealth")} value={`${phone.batteryHealth}%`} />
                      <SpecRow label={tr("conditionFilter")} value={phone.condition} />
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Sticky CTA */}
              <div className="shrink-0 p-4 flex gap-3"
                style={{
                  background: "rgba(255,255,255,0.50)",
                  backdropFilter: "blur(20px)",
                  borderTop: "1px solid rgba(255,255,255,0.60)",
                }}
              >
                <Link
                  to="/compare"
                  search={{ id1: phone.id }}
                  className="btn-glass flex-1 !min-h-[48px] justify-center text-sm sm:text-base px-2"
                >
                  <GitCompareArrows size={18} /> <span className="ml-1">{lang === "bn" ? "তুলনা" : "Compare"}</span>
                </Link>
                <a
                  href={shopWhatsAppLink(
                    `Hi! I'm interested in the ${phone.brand} ${phone.model} (${phone.storage}/${phone.ram}) listed for ${bdt(phone.sellingPrice)}. Is it still available?`
                  )}
                  target="_blank" rel="noreferrer"
                  className="btn-primary flex-[2] !min-h-[48px] justify-center text-sm sm:text-base"
                >
                  <WhatsAppIcon size={18} color="#FFFFFF" /> {tr("whatsappToBuy")}
                </a>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function PhotoGallery({
  phone, activeImg, setActiveImg, label,
}: { phone: UsedPhone; activeImg: number; setActiveImg: (n: number) => void; label: string }) {
  const urls = (phone.galleryUrls && phone.galleryUrls.filter(Boolean).length > 0)
    ? phone.galleryUrls.filter(Boolean)
    : (phone.photoUrl ? [phone.photoUrl] : [""]);
  const single = urls.length === 1;

  return (
    <div aria-label={label}>
      <div className="relative aspect-[3/4] bg-white/30 rounded-2xl overflow-hidden group">
        <PhotoPlaceholder url={urls[activeImg] || ""} alt={`${phone.brand} ${phone.model}`} />
        {!single && (
          <>
            <button
              onClick={() => setActiveImg(activeImg === 0 ? urls.length - 1 : activeImg - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-md shadow-sm grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 text-text-primary border border-white/40"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActiveImg(activeImg === urls.length - 1 ? 0 : activeImg + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur-md shadow-sm grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 text-text-primary border border-white/40"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      {!single && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              aria-label={`Image ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-5 bg-text-primary/70" : "w-1.5 bg-text-muted/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}