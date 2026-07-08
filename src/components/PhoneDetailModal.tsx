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

// ─── COMPACT REDESIGN ────────────────────────────────────────────────────────
// Always side-by-side (image left 42% | specs right 58%)
// Header: name + badges + price + close in one compact row
// Image fills available height — no fixed aspect-ratio that forces scrolling
// Everything fits in viewport without user needing to scroll
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days}day${days > 1 ? 's' : ''} ago`;
}

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
              className="pointer-events-auto w-full max-w-[820px] max-h-[85vh] overflow-hidden rounded-[22px] flex flex-col"
              style={{
                background: "rgba(255,255,255,0.76)",
                backdropFilter: "blur(40px) saturate(200%)",
                WebkitBackdropFilter: "blur(40px) saturate(200%)",
                border: "1px solid rgba(255,255,255,0.90)",
                boxShadow: "0 28px 70px rgba(30,20,80,0.24), 0 6px 20px rgba(30,20,80,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
                willChange: "transform, opacity",
              }}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={panelSpring}
            >
              {/* Mobile Close Button (Absolute) */}
              <button
                onClick={onClose}
                aria-label={tr("closeDetails")}
                className="sm:hidden absolute top-[12px] right-[12px] z-[60] w-8 h-8 rounded-full grid place-items-center"
                style={{
                  background: "rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <X size={15} />
              </button>

              {/* Header bar (Desktop only) */}
              <div
                className="hidden sm:flex items-center justify-between px-4 py-3 shrink-0"
                style={{ borderBottom: "none" }}
              >
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <h2
                    id={`phone-detail-title-${phone.id}`}
                    className="font-bold text-base sm:text-lg leading-tight truncate"
                  >
                    {phone.brand} {phone.model}
                  </h2>
                  {isJustIn(phone.dateAdded) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-accent-orange/20 text-accent-orange border-accent-orange/40 shrink-0">
                      <Flame size={10} strokeWidth={1.75} /> {tr("justIn")}
                    </span>
                  )}
                  {isJustIn(phone.dateAdded) && (
                    <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-white/70 text-text-secondary border-white/80 shrink-0">
                      {timeAgo(phone.dateAdded)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <span className="hidden sm:inline text-lg sm:text-xl font-extrabold">{bdt(phone.sellingPrice)}</span>
                  <button
                    ref={closeBtnRef}
                    onClick={onClose}
                    aria-label={tr("closeDetails")}
                    className="w-8 h-8 rounded-full grid place-items-center shrink-0"
                    style={{
                      background: "rgba(0,0,0,0.06)",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Body: image left, specs right on desktop; stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-0 flex-1 min-h-0 overflow-y-auto sm:overflow-hidden no-scrollbar">
                {/* Image panel */}
                <div
                  className="relative w-full sm:w-[42%] shrink-0 p-3 sm:h-auto sm:border-r border-black/5"
                >
                  {isJustIn(phone.dateAdded) && (
                    <span
                      className="sm:hidden absolute top-5 left-5 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent-orange text-white shrink-0"
                      style={{ boxShadow: "0 4px 14px rgba(249, 115, 22, 0.45)" }}
                    >
                      <Flame size={12} strokeWidth={2} /> {tr("justIn")}
                    </span>
                  )}
                  <PhotoGallery
                    phone={phone}
                    activeImg={activeImg}
                    setActiveImg={setActiveImg}
                    label={tr("photoGalleryLabel")}
                  />
                </div>

                {/* Specs panel */}
                <div className="flex-1 min-w-0 flex flex-col sm:overflow-hidden">
                  <div className="flex-1 sm:overflow-y-auto overscroll-contain no-scrollbar p-3 space-y-3">

                    {/* Mobile Title & Price */}
                    <div className="sm:hidden mb-2 flex items-start justify-between gap-3">
                      <h2
                        id={`phone-detail-title-mobile-${phone.id}`}
                        className="font-bold text-xl leading-tight"
                      >
                        {phone.brand} {phone.model}
                      </h2>
                      <span className="text-xl font-extrabold shrink-0 text-text-primary mt-0.5">{bdt(phone.sellingPrice)}</span>
                    </div>

                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {phone.color && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-white/70 text-text-secondary border-white/80">
                          {phone.color}
                        </span>
                      )}
                      {phone.variant && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-white/70 text-text-secondary border-white/80">
                          {phone.variant}
                        </span>
                      )}
                      {isJustIn(phone.dateAdded) && (
                        <span className="sm:hidden inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-white/70 text-text-secondary border-white/80 shrink-0">
                          {timeAgo(phone.dateAdded)}
                        </span>
                      )}
                    </div>

                    {phone.shortDescription && (
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {phone.shortDescription}
                      </p>
                    )}

                    {/* Specs table */}
                    <div>
                      <h3 className="label-caps mb-1.5 text-[10px]">{tr("fullSpecs")}</h3>
                      <div className="glass-soft rounded-xl divide-y divide-black/5">
                        <SpecRow label={tr("brand")} value={phone.brand} />
                        <SpecRow label={tr("model")} value={phone.model} />
                        {phone.variant && <SpecRow label="Variant" value={phone.variant} />}
                        {phone.storage && <SpecRow label={tr("storage")} value={phone.storage} />}
                        {phone.ram && <SpecRow label={tr("ram")} value={phone.ram} />}
                        {phone.batteryHealth > 0 && (
                          <SpecRow label={tr("batteryHealth")} value={`${phone.batteryHealth}%`} />
                        )}
                        <SpecRow label={tr("conditionFilter")} value={phone.condition} />
                        {phone.waterproof === true && <SpecRow label="Waterproof" value="Yes" />}
                        {phone.waterproof === false && <SpecRow label="Waterproof" value="No" />}
                        {phone.warrantyTerms && <SpecRow label="Warranty" value={phone.warrantyTerms} />}
                      </div>
                    </div>
                  </div>

                  {/* CTA (Sticky inside modal on desktop, at bottom of list on mobile) */}
                  <div
                    className="shrink-0 p-3 flex gap-2 sm:sticky sm:bottom-0"
                    style={{
                      background: "rgba(255,255,255,0.45)",
                      backdropFilter: "blur(16px)",
                      borderTop: "1px solid rgba(255,255,255,0.60)",
                    }}
                  >
                    <Link
                      to="/compare"
                      search={{ id1: phone.id }}
                      className="btn-glass flex-1 !min-h-[42px] justify-center text-sm px-2"
                    >
                      <GitCompareArrows size={16} />
                      <span className="ml-1 hidden xs:inline">{lang === "bn" ? "তুলনা" : "Compare"}</span>
                    </Link>
                    <a
                      href={shopWhatsAppLink(
                        `Hi! I'm interested in the ${phone.brand} ${phone.model} (${phone.storage}/${phone.ram}) listed for ${bdt(phone.sellingPrice)}. Is it still available?`
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary flex-[2] !min-h-[42px] justify-center text-sm"
                    >
                      <WhatsAppIcon size={16} color="#FFFFFF" /> {tr("whatsappToBuy")}
                    </a>
                  </div>
                </div>
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
    <div className="flex items-center justify-between px-3 py-2 text-xs">
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

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      setActiveImg(activeImg === urls.length - 1 ? 0 : activeImg + 1);
    }
    if (isRightSwipe) {
      setActiveImg(activeImg === 0 ? urls.length - 1 : activeImg - 1);
    }
  };

  return (
    <div aria-label={label} className="sm:h-full flex flex-col">
      <div
        className="relative sm:flex-1 bg-white/30 rounded-xl overflow-hidden group aspect-[3/4] sm:aspect-auto"
        style={{ minHeight: 0 }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <PhotoPlaceholder url={urls[activeImg] || ""} alt={`${phone.brand} ${phone.model}`} />
        {!single && (
          <>
            <button
              onClick={() => setActiveImg(activeImg === 0 ? urls.length - 1 : activeImg - 1)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 backdrop-blur-md shadow-sm grid place-items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-30 text-text-primary border border-white/40"
              aria-label="Previous image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setActiveImg(activeImg === urls.length - 1 ? 0 : activeImg + 1)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/70 backdrop-blur-md shadow-sm grid place-items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-30 text-text-primary border border-white/40"
              aria-label="Next image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
      {!single && (
        <div className="mt-2 flex items-center justify-center gap-1.5 shrink-0">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              aria-label={`Image ${i + 1}`}
              className={`h-1 rounded-full transition-all ${i === activeImg ? "w-4 bg-text-primary/70" : "w-1.5 bg-text-muted/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}