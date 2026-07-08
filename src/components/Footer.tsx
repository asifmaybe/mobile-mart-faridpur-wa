import { getSettings } from "../lib/storage";
import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";
import { Link } from "@tanstack/react-router";
import { Smartphone, Phone, MapPin, Mail } from "lucide-react";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";

export function Footer() {
  const { tr, lang } = useI18n();
  const [s, setS] = useState<any>(null);

  useEffect(() => {
    const refresh = async () => setS(await getSettings());
    refresh();
    window.addEventListener("repairshop:change", refresh);
    return () => window.removeEventListener("repairshop:change", refresh);
  }, []);

  if (!s) return null;
  const name = s.shopName;
  return (
    <footer className="mt-16 px-4 pb-8">
      <div className="mx-auto max-w-6xl glass p-6 md:p-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl grid place-items-center" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)" }}>
                <Smartphone size={18} color="#FFFFFF" strokeWidth={2.2} />
              </div>
              <div className="font-bold">{name}</div>
            </div>
            <p className="text-sm text-text-secondary">
              {lang === "bn" ? "বিশ্বস্ত মোবাইল ও অ্যাকসেসরিজ শপ।" : "Premium mobile shop, trusted service."}
            </p>
          </div>
          <div>
            <div className="label-caps mb-3">{tr("services")}</div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link to="/" className="hover:text-text-primary">{tr("home")}</Link></li>
              <li><Link to="/phones" className="hover:text-text-primary">{tr("phones")}</Link></li>
              <li><Link to="/accessories" className="hover:text-text-primary">{tr("accessories")}</Link></li>
              <li><Link to="/admin" className="hover:text-text-primary">{tr("adminLogin")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="label-caps mb-3">{tr("contactUs")}</div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-center gap-2"><Phone size={14} /> <a href={`tel:${s.phone}`} className="hover:text-text-primary">{s.phone}</a></li>
              <li className="flex items-center gap-2"><WhatsAppIcon size={14} color="#25D366" /> <a href={`https://wa.me/${s.whatsapp}`} className="hover:text-text-primary">WhatsApp</a></li>
              <li className="flex items-center gap-2"><Mail size={14} /> <a href={`mailto:${s.email}`} className="hover:text-text-primary">{s.email}</a></li>
              <li className={`flex items-start gap-2 ${lang === "bn" ? "bn" : ""}`}><MapPin size={14} className="mt-0.5 shrink-0" /> <span>{lang === "bn" ? s.addressBn : s.address}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/40 text-center text-xs text-text-muted">
          © 2026 {name}.
        </div>
      </div>
    </footer>
  );
}
