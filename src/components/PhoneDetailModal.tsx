import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Flame } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { isJustIn, type UsedPhone } from "../lib/storage";
import { bdt, shopWhatsAppLink } from "../lib/wa";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

interface Props {
  phone: UsedPhone | null;
  open: boolean;
  onClose: () => void;
  /** Triggering element to restore focus to on close. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  layoutIdPrefix?: string;
}

export function PhoneDetailModal({ phone, open, onClose, returnFocusRef, layoutIdPrefix }: Props) {
  const { tr } = useI18n();
  const reduceMotion = useReducedMotion();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => { if (open) setActiveImg(0); }, [open, phone?.id]);

  // Esc + focus trap + focus return
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tId = setTimeout(() => closeBtnRef.current?.focus(), 50);

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

  const spring = reduceMotion
    ? { duration: 0.18 }
    : { type: "spring" as const, stiffness: 260, damping: 28 };

  return createPortal(
    <AnimatePresence>
      {open && phone && (
        <>
          {/* Scrim */}
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[95] bg-[rgba(20,18,40,0.55)] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Morphing panel */}
          <div className="fixed inset-0 z-[96] pointer-events-none flex sm:items-center items-end justify-center sm:p-6">
            <motion.div
              layoutId={reduceMotion ? undefined : (layoutIdPrefix ? `${layoutIdPrefix}-${phone.id}` : `phone-card-${phone.id}`)}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`phone-detail-title-${phone.id}`}
              className="glass pointer-events-auto w-full sm:max-w-[680px] max-h-[92vh] sm:max-h-[88vh] overflow-hidden flex flex-col"
              style={{
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                borderBottomLeftRadius: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : 26,
                borderBottomRightRadius: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : 26,
              }}
              transition={spring}
              initial={reduceMotion ? { opacity: 0 } : false}
              animate={reduceMotion ? { opacity: 1 } : undefined}
              exit={reduceMotion ? { opacity: 0 } : undefined}
            >
              {/* Drag handle (mobile visual cue) */}
              <div className="sm:hidden pt-2 pb-1 grid place-items-center">
                <div className="w-10 h-1.5 rounded-full bg-text-muted/40" />
              </div>

              {/* Close button */}
              <button
                ref={closeBtnRef}
                onClick={onClose}
                aria-label={tr("closeDetails")}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full grid place-items-center glass-pill"
              >
                <X size={16} />
              </button>

              {/* Inner content fades after morph */}
              <motion.div
                className="flex-1 overflow-y-auto"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={reduceMotion ? { duration: 0.15 } : { delay: 0.18, duration: 0.25 }}
              >
                <PhotoGallery phone={phone} activeImg={activeImg} setActiveImg={setActiveImg} label={tr("photoGalleryLabel")} />

                <div className="px-5 pt-4 pb-5 space-y-4">
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
              </motion.div>

              {/* Sticky Buy Now */}
              <div className="p-4 border-t border-white/60 bg-white/40 backdrop-blur-md">
                <a
                  href={shopWhatsAppLink(
                    `Hi! I'm interested in the ${phone.brand} ${phone.model} (${phone.storage}/${phone.ram}) listed for ${bdt(phone.sellingPrice)}. Is it still available?`
                  )}
                  target="_blank" rel="noreferrer"
                  className="btn-primary w-full !min-h-[48px]"
                >
                  <WhatsAppIcon size={16} color="#FFFFFF" /> {tr("whatsappToBuy")}
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
    <div className="px-3 pt-3" aria-label={label}>
      <div className="relative aspect-[4/3] bg-white/30 rounded-2xl overflow-hidden">
        <PhotoPlaceholder url={urls[activeImg] || ""} alt={`${phone.brand} ${phone.model}`} />
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