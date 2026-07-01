import { getSettings } from "./storage";

/** Build a wa.me URL using the shop's WhatsApp number from settings. */
export function shopWhatsAppLink(message: string): string {
  const num = (getSettings().whatsapp || "").replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function bdt(n: number): string {
  return "৳" + Math.round(n).toLocaleString("en-IN");
}
