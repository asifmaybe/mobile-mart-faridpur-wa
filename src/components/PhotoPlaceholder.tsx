import { Image as ImageIcon } from "lucide-react";

export function PhotoPlaceholder({ url, alt, className = "" }: { url: string; alt: string; className?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`w-full h-full grid place-items-center bg-white/40 ${className}`}>
      <ImageIcon size={32} strokeWidth={1.75} className="text-text-muted/60" />
    </div>
  );
}
