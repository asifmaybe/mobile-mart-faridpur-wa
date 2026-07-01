import { useMemo, useState } from "react";
import { Printer, Trash2 } from "lucide-react";
import {
  addReceipt, calculateReceiptTotals, deleteReceipt, generateReceiptNo,
  getReceipts, getSettings,
  type Receipt, type ReceiptItem,
} from "../../lib/storage";
import { showToast } from "../../lib/ui";
import { useStorageRefresh } from "./useStorageRefresh";
import { ReceiptItemsPanel, emptyItem, openReceiptPrint, buildWhatsAppText } from "./ReceiptItemsPanel";

const todayISO = () => new Date().toISOString().slice(0, 10);

export function ReceiptMakerView({ tr, lang }: { tr: (k: any) => string; lang: "en" | "bn" }) {
  useStorageRefresh();
  const settings = getSettings();
  const [receiptNo] = useState(generateReceiptNo());
  const [date, setDate] = useState(todayISO());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [device, setDevice] = useState("");
  const [jobToken, setJobToken] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [resetTick, setResetTick] = useState(0);

  const totals = useMemo(() => calculateReceiptTotals(items, discount, taxRate), [items, discount, taxRate]);
  const receipts = useMemo(() => getReceipts(), [resetTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setItems([emptyItem()]);
    setCustomerName(""); setCustomerPhone(""); setDevice(""); setJobToken("");
    setDiscount(0); setTaxRate(0); setNotes("");
    setResetTick((t) => t + 1);
  };

  const buildReceipt = (): Receipt => ({
    id: receiptNo + "-" + Date.now(),
    receiptNo, date, customerName, customerPhone, device, jobToken,
    items, ...totals, taxRate, notes,
    createdAt: new Date().toISOString(),
  });

  const saveAndPrint = () => {
    if (!customerName.trim() || items.length === 0 || items.every((i) => !i.description.trim())) {
      showToast(lang === "bn" ? "কাস্টমার ও আইটেম দিন" : "Add customer & items", "error");
      return;
    }
    const r = buildReceipt();
    addReceipt(r);
    showToast(lang === "bn" ? "রিসিট সেভ হয়েছে" : "Receipt saved");
    openReceiptPrint(r);
    reset();
  };

  const shareWhatsApp = () => {
    if (!customerPhone.trim()) {
      showToast(lang === "bn" ? "ফোন নম্বর দিন" : "Add phone number", "error");
      return;
    }
    const r = buildReceipt();
    const phone = customerPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppText(r))}`, "_blank");
  };

  void settings;

  return (
    <div className="space-y-4">
      <h1 className="hidden md:block text-2xl font-bold">{tr("receiptMakerTitle")}</h1>

      <div className="glass p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold">{tr("newReceipt")}</h2>
          <span className="glass-pill px-3 py-1 text-xs font-bold">{receiptNo}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-caps mb-1.5 block">{tr("date")}</label>
            <input type="date" className="glass-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("jobTokenOptional")}</label>
            <input className="glass-input" value={jobToken} onChange={(e) => setJobToken(e.target.value)} placeholder="JOB-XXXX" />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("fullName")}</label>
            <input className="glass-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{tr("phone")}</label>
            <input className="glass-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-caps mb-1.5 block">{tr("device")}</label>
            <input className="glass-input" value={device} onChange={(e) => setDevice(e.target.value)} />
          </div>
        </div>

        <ReceiptItemsPanel
          items={items} setItems={setItems}
          discount={discount} setDiscount={setDiscount}
          taxRate={taxRate} setTaxRate={setTaxRate}
          notes={notes} setNotes={setNotes}
          totals={totals}
          onSaveAndPrint={saveAndPrint}
          onShareWhatsApp={shareWhatsApp}
          tr={tr} lang={lang}
        />
      </div>

      <div className="glass p-4 md:p-6">
        <h2 className="font-bold mb-3">{tr("receiptHistory")}</h2>
        {receipts.length === 0 ? (
          <p className="text-text-muted text-sm py-6 text-center">{tr("noReceipts")}</p>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted">
                  <th className="font-semibold py-2 pr-3">{tr("receiptNo")}</th>
                  <th className="font-semibold py-2 pr-3">{tr("date")}</th>
                  <th className="font-semibold py-2 pr-3">{tr("customer")}</th>
                  <th className="font-semibold py-2 pr-3 text-right">{tr("grandTotal")}</th>
                  <th className="font-semibold py-2 pr-3 text-right admin-only text-accent-purple">{tr("margin")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-t border-black/5">
                    <td className="py-2 pr-3 font-bold">{r.receiptNo}</td>
                    <td className="py-2 pr-3 text-text-muted">{r.date}</td>
                    <td className="py-2 pr-3">{r.customerName || "—"}</td>
                    <td className="py-2 pr-3 text-right font-semibold">৳{r.grandTotal.toFixed(2)}</td>
                    <td className="py-2 pr-3 text-right admin-only text-accent-green font-semibold">৳{r.totalMargin.toFixed(2)}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => openReceiptPrint(r)} className="btn-glass !py-1.5 !px-2 text-xs mr-1"><Printer size={12} /></button>
                      <button onClick={() => { if (confirm(tr("confirmDelete"))) { deleteReceipt(r.id); setResetTick((t) => t + 1); } }} className="btn-danger !py-1.5 !px-2 text-xs"><Trash2 size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
