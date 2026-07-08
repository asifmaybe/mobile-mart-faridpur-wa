/**
 * Skeleton loading components — styled to match the app's glass aesthetic.
 * Pattern from reference image: large rounded image → circle + text lines → price → buttons.
 */

/** Phone listing card skeleton */
export function PhoneCardSkeleton() {
  return (
    <div className="glass overflow-hidden flex flex-col" style={{ borderRadius: 22 }}>
      {/* Image block */}
      <div className="m-3 overflow-hidden" style={{ borderRadius: 18 }}>
        <div className="skeleton aspect-[3/4] md:aspect-[4/3] w-full" style={{ borderRadius: 18 }} />
      </div>
      {/* Brand circle + name/specs */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="skeleton w-10 h-10 shrink-0" style={{ borderRadius: 999 }} />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4" style={{ width: "68%" }} />
          <div className="skeleton h-3" style={{ width: "85%" }} />
        </div>
      </div>
      {/* Price */}
      <div className="px-4 pb-3">
        <div className="skeleton h-7" style={{ width: "45%", borderRadius: 10 }} />
      </div>
      {/* Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <div className="skeleton h-11 flex-1" style={{ borderRadius: 16 }} />
        <div className="skeleton h-11 flex-1" style={{ borderRadius: 16 }} />
      </div>
    </div>
  );
}

/** Accessory listing card skeleton */
export function AccessoryCardSkeleton() {
  return (
    <div className="glass overflow-hidden flex flex-col" style={{ borderRadius: 22 }}>
      {/* Image block — no margin for accessories (matches AccessoryCard) */}
      <div className="skeleton aspect-[4/3] w-full" style={{ borderRadius: 0 }} />
      {/* Name + category circle row */}
      <div className="p-4 flex items-start gap-3">
        <div className="skeleton w-9 h-9 shrink-0" style={{ borderRadius: 999 }} />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4" style={{ width: "72%" }} />
          <div className="skeleton h-3" style={{ width: "50%" }} />
        </div>
      </div>
      {/* Price */}
      <div className="px-4 pb-3">
        <div className="skeleton h-7" style={{ width: "40%", borderRadius: 10 }} />
      </div>
      {/* Button */}
      <div className="px-4 pb-4">
        <div className="skeleton h-11 w-full" style={{ borderRadius: 16 }} />
      </div>
    </div>
  );
}

/** Horizontal JustIn feed card skeleton */
export function JustInCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className="glass shrink-0 overflow-hidden flex flex-col"
      style={{
        borderRadius: 22,
        width: wide ? "68%" : "32%",
        minWidth: 180,
      }}
    >
      {/* Image */}
      <div className="skeleton aspect-[3/4] w-full" style={{ borderRadius: 0 }} />
      {/* Info row */}
      <div className="p-3 flex items-center gap-2">
        <div className="skeleton w-8 h-8 shrink-0" style={{ borderRadius: 999 }} />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton h-3.5" style={{ width: "70%" }} />
          <div className="skeleton h-3" style={{ width: "45%" }} />
        </div>
      </div>
      {/* Button */}
      <div className="px-3 pb-3">
        <div className="skeleton h-10 w-full" style={{ borderRadius: 14 }} />
      </div>
    </div>
  );
}
