import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useI18n } from "../lib/i18n";
import { addAppointment, generateApptRef, getSettings } from "../lib/storage";
import { Modal, showToast } from "../lib/ui";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Appointment — Mak Electronics" },
      { name: "description", content: "Book your phone repair appointment online." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    brand: typeof search.brand === "string" ? search.brand : undefined,
    model: typeof search.model === "string" ? search.model : undefined,
    problem: typeof search.problem === "string" ? search.problem : undefined,
  }),
  component: BookPage,
});

const BRANDS = ["Samsung", "iPhone", "Xiaomi", "Oppo", "Vivo", "Realme", "OnePlus", "Symphony", "Tecno", "Infinix", "Nokia", "Other"];
const PROBLEMS_EN = ["Screen Replacement", "Battery Replacement", "Charging Port", "Water Damage", "Camera Repair", "Speaker / Mic", "Software / Unlock", "Network / Signal", "Button Repair", "Back Panel", "Other"];
const PROBLEMS_BN = ["স্ক্রিন রিপ্লেসমেন্ট", "ব্যাটারি রিপ্লেসমেন্ট", "চার্জিং পোর্ট", "পানির ক্ষতি", "ক্যামেরা", "স্পিকার / মাইক", "সফটওয়্যার / আনলক", "নেটওয়ার্ক", "বাটন", "ব্যাক প্যানেল", "অন্যান্য"];

function BookPage() {
  const { tr, lang } = useI18n();
  const settings = getSettings();
  const sp = Route.useSearch();
  const [form, setForm] = useState({
    customerName: "", customerPhone: "",
    brand: BRANDS.includes(sp.brand ?? "") ? (sp.brand as string) : "Samsung",
    model: sp.model ?? "",
    problem: PROBLEMS_EN.includes(sp.problem ?? "") ? (sp.problem as string) : PROBLEMS_EN[0],
    preferredDate: new Date().toISOString().slice(0, 10), notes: "",
  });
  const [ref, setRef] = useState<string | null>(null);

  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9+\-\s]{10,}$/.test(form.customerPhone)) {
      showToast(lang === "bn" ? "সঠিক ফোন নম্বর দিন" : "Enter a valid phone number", "error");
      return;
    }
    const r = generateApptRef();
    addAppointment({ ref: r, ...form, createdAt: new Date().toISOString() });
    setRef(r);
    setForm({ ...form, customerName: "", customerPhone: "", model: "", notes: "" });
  };

  const PROBLEMS = lang === "bn" ? PROBLEMS_BN : PROBLEMS_EN;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 px-4 pb-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-8">
            <div className="label-caps">{lang === "bn" ? "বুকিং" : "Appointment"}</div>
            <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${lang === "bn" ? "bn" : ""}`}>{tr("bookTitle")}</h1>
          </div>

          <form onSubmit={submit} className="glass p-6 space-y-4">
            <div>
              <label className="label-caps mb-2 block">{tr("fullName")} *</label>
              <input className="glass-input" required value={form.customerName} onChange={(e) => setF("customerName", e.target.value)} />
            </div>
            <div>
              <label className="label-caps mb-2 block">{tr("phone")} *</label>
              <input className="glass-input" required type="tel" value={form.customerPhone} onChange={(e) => setF("customerPhone", e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-caps mb-2 block">{tr("brand")}</label>
                <select className="glass-input" value={form.brand} onChange={(e) => setF("brand", e.target.value)}>
                  {BRANDS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label-caps mb-2 block">{tr("model")} *</label>
                <input className="glass-input" required value={form.model} onChange={(e) => setF("model", e.target.value)} placeholder="A54, 13 Pro..." />
              </div>
            </div>
            <div>
              <label className="label-caps mb-2 block">{tr("problem")}</label>
              <select className="glass-input" value={form.problem} onChange={(e) => setF("problem", e.target.value)}>
                {PROBLEMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label-caps mb-2 block">{tr("preferredDate")}</label>
              <input type="date" className="glass-input" value={form.preferredDate} onChange={(e) => setF("preferredDate", e.target.value)} />
            </div>
            <div>
              <label className="label-caps mb-2 block">{tr("notes")}</label>
              <textarea rows={3} className="glass-input resize-none" value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
            </div>
            <button type="submit" className="btn-primary w-full">{tr("submit")} <ArrowRight size={16} /></button>
            <div className="text-center text-xs text-text-muted pt-2">
              {lang === "bn" ? "অথবা সরাসরি WhatsApp করুন" : "Or message us directly on WhatsApp"} — {" "}
              <a href={`https://wa.me/${settings.whatsapp}`} className="text-accent-blue underline">+{settings.whatsapp}</a>
            </div>
          </form>
        </div>
      </main>

      <Modal open={!!ref} onClose={() => setRef(null)} title={lang === "bn" ? "অ্যাপয়েন্টমেন্ট নিশ্চিত!" : "Appointment Confirmed!"}>
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto mb-3 text-accent-green" />
          <p className={`text-sm text-text-secondary ${lang === "bn" ? "bn" : ""}`}>{tr("bookSuccess")}</p>
          <div className="my-4 glass-soft p-4 inline-block">
            <div className="label-caps">Reference</div>
            <div className="text-2xl font-bold tracking-tight mt-1">{ref}</div>
          </div>
          <p className={`text-xs text-text-muted mt-2 ${lang === "bn" ? "bn" : ""}`}>
            {lang === "bn" ? "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।" : "We'll contact you shortly to confirm."}
          </p>
          <button onClick={() => setRef(null)} className="btn-primary mt-5 w-full">{lang === "bn" ? "ঠিক আছে" : "Done"}</button>
        </div>
      </Modal>
      <Footer />
    </div>
  );
}
