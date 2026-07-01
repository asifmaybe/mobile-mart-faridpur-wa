import { useState } from "react";
import { Plus, Trash2, Printer, Search, X } from "lucide-react";
import { WhatsAppIcon } from "../icons/WhatsAppIcon";
import { getInventory, type InventoryPart, type Receipt, type ReceiptItem, type ReceiptTotals, getSettings } from "../../lib/storage";
import { Modal } from "../../lib/ui";

export function emptyItem(): ReceiptItem {
  return { partId: null, description: "", qty: 1, costPrice: 0, unitPrice: 0, lineTotal: 0, lineMargin: 0 };
}
export function recompute(it: ReceiptItem): ReceiptItem {
  const lineTotal = +(it.qty * it.unitPrice).toFixed(2);
  const lineMargin = +(it.qty * (it.unitPrice - it.costPrice)).toFixed(2);
  return { ...it, lineTotal, lineMargin };
}

export function ReceiptItemsPanel({
  items, setItems, discount, setDiscount, taxRate, setTaxRate, notes, setNotes,
  totals, onSaveAndPrint, onShareWhatsApp, tr, lang, saveLabel, showNotes = true,
}: {
  items: ReceiptItem[];
  setItems: (fn: (prev: ReceiptItem[]) => ReceiptItem[]) => void;
  discount: number; setDiscount: (n: number) => void;
  taxRate: number; setTaxRate: (n: number) => void;
  notes: string; setNotes: (s: string) => void;
  totals: ReceiptTotals;
  onSaveAndPrint: () => void;
  onShareWhatsApp: () => void;
  tr: (k: any) => string;
  lang: "en" | "bn";
  saveLabel?: string;
  showNotes?: boolean;
}) {
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <ReceiptItemsList
        items={items} setItems={setItems} notes={notes} setNotes={setNotes}
        showNotes={showNotes} tr={tr} lang={lang}
        pickerIdx={pickerIdx} setPickerIdx={setPickerIdx}
      />
      <div className="space-y-3">
        <ReceiptSummaryCard
          discount={discount} setDiscount={setDiscount}
          taxRate={taxRate} setTaxRate={setTaxRate}
          totals={totals} onSaveAndPrint={onSaveAndPrint} onShareWhatsApp={onShareWhatsApp}
          tr={tr} lang={lang} saveLabel={saveLabel} sticky
        />
      </div>
      {pickerIdx !== null && (
        <PartPickerModal onClose={() => setPickerIdx(null)} onPick={(p) => {
          const part = p;
          setItems((arr) => arr.map((it, i) => i === pickerIdx ? recompute({ ...it, partId: part.partId, description: `${part.name} (${part.compatibleBrand} ${part.compatibleModel})`.trim(), costPrice: part.costPrice, unitPrice: part.sellingPrice }) : it));
          setPickerIdx(null);
        }} tr={tr} lang={lang} />
      )}
    </div>
  );
}

export function ReceiptItemsList({
  items, setItems, notes, setNotes, showNotes = true, tr, lang,
  pickerIdx: extPickerIdx, setPickerIdx: extSetPickerIdx,
}: {
  items: ReceiptItem[];
  setItems: (fn: (prev: ReceiptItem[]) => ReceiptItem[]) => void;
  notes: string; setNotes: (s: string) => void;
  showNotes?: boolean;
  tr: (k: any) => string;
  lang: "en" | "bn";
  pickerIdx?: number | null;
  setPickerIdx?: (n: number | null) => void;
}) {
  const [localPicker, setLocalPicker] = useState<number | null>(null);
  const pickerIdx = extPickerIdx !== undefined ? extPickerIdx : localPicker;
  const setPickerIdx = extSetPickerIdx ?? setLocalPicker;
  const standalone = extPickerIdx === undefined;

  const setItem = (idx: number, patch: Partial<ReceiptItem>) =>
    setItems((arr) => arr.map((it, i) => (i === idx ? recompute({ ...it, ...patch }) : it)));
  const addRow = () => setItems((a) => [...a, emptyItem()]);
  const removeRow = (idx: number) => setItems((a) => a.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="label-caps">{tr("items")}</div>
          <button onClick={addRow} type="button" className="btn-glass !py-2 !px-3 text-xs"><Plus size={12} /> {tr("addItem")}</button>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="glass-soft p-3 space-y-2 relative">
              <button type="button" onClick={() => removeRow(idx)} aria-label="Remove" className="absolute top-2 right-2 w-7 h-7 grid place-items-center rounded-md text-accent-red hover:bg-accent-red/10 transition-colors z-10">
                <Trash2 size={14} />
              </button>
              <div className="grid grid-cols-12 gap-2 items-start pr-9">
                <div className="col-span-12 sm:col-span-5">
                  <label className="label-caps mb-1 block">{tr("description")}</label>
                  <div className="flex gap-1">
                    <input className="glass-input" value={it.description} onChange={(e) => setItem(idx, { description: e.target.value })} />
                    <button type="button" onClick={() => setPickerIdx(idx)} title={tr("selectFromInventory")} className="glass-pill px-3 grid place-items-center"><Search size={14} /></button>
                  </div>
                  {it.partId && <div className="text-[10px] text-accent-purple mt-1 font-semibold">{it.partId}</div>}
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="label-caps mb-1 block">{tr("qty")}</label>
                  <input type="number" min={1} className="glass-input" value={it.qty} onChange={(e) => setItem(idx, { qty: Math.max(1, +e.target.value || 0) })} />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label-caps mb-1 block">Price</label>
                  <input type="number" min={0} className="glass-input" value={it.unitPrice} onChange={(e) => setItem(idx, { unitPrice: Math.max(0, +e.target.value || 0), costPrice: Math.max(0, +e.target.value || 0) })} />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <label className="label-caps mb-1 block">Total</label>
                  <div className="glass-input flex items-center font-bold text-sm whitespace-nowrap overflow-hidden">৳{it.lineTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {showNotes && (
        <div>
          <label className="label-caps mb-1.5 block">{tr("notes")}</label>
          <textarea rows={2} className="glass-input resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}
      {standalone && pickerIdx !== null && (
        <PartPickerModal onClose={() => setPickerIdx(null)} onPick={(p) => {
          setItem(pickerIdx, { partId: p.partId, description: `${p.name} (${p.compatibleBrand} ${p.compatibleModel})`.trim(), costPrice: p.costPrice, unitPrice: p.sellingPrice });
          setPickerIdx(null);
        }} tr={tr} lang={lang} />
      )}
    </div>
  );
}

export function ReceiptSummaryCard({
  discount, setDiscount, taxRate, setTaxRate, totals,
  onSaveAndPrint, onShareWhatsApp, tr, lang, saveLabel, sticky = false,
  hideWhatsApp = false,
}: {
  discount: number; setDiscount: (n: number) => void;
  taxRate: number; setTaxRate: (n: number) => void;
  totals: ReceiptTotals;
  onSaveAndPrint: () => void;
  onShareWhatsApp?: () => void;
  tr: (k: any) => string;
  lang: "en" | "bn";
  saveLabel?: string;
  sticky?: boolean;
  hideWhatsApp?: boolean;
}) {
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "due">("paid");
  void taxRate; void setTaxRate;
  return (
    <div className={`glass p-4 space-y-3${sticky ? " lg:sticky lg:top-4" : ""}`}>
      <h3 className="font-bold">{lang === "bn" ? "সারাংশ" : "Summary"}</h3>
      <div>
        <label className="label-caps mb-1.5 block">{tr("discount")}</label>
        <input type="number" min={0} className="glass-input" value={discount} onChange={(e) => setDiscount(Math.max(0, +e.target.value || 0))} />
      </div>
      <div>
        <label className="label-caps mb-1.5 block">{lang === "bn" ? "পেমেন্ট স্ট্যাটাস" : "Payment Status"}</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setPaymentStatus("paid")} className={`glass-pill py-2 text-sm font-semibold transition ${paymentStatus === "paid" ? "bg-accent-green/20 text-accent-green ring-1 ring-accent-green/40" : "text-text-muted"}`}>{lang === "bn" ? "পরিশোধিত" : "Paid"}</button>
          <button type="button" onClick={() => setPaymentStatus("due")} className={`glass-pill py-2 text-sm font-semibold transition ${paymentStatus === "due" ? "bg-accent-red/20 text-accent-red ring-1 ring-accent-red/40" : "text-text-muted"}`}>{lang === "bn" ? "বাকি" : "Due"}</button>
        </div>
      </div>
      <div className="space-y-1.5 text-sm pt-2 border-t border-black/10">
        <Row label={tr("subtotal")} value={totals.subtotal} />
        <Row label={tr("discount")} value={-totals.discount} />
        <div className="flex justify-between items-center pt-2 border-t border-black/10">
          <span className="font-bold">{tr("grandTotal")}</span>
          <span className="text-xl font-extrabold" style={{ background: "linear-gradient(135deg,#7C6FE8,#5847C7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>৳{totals.grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-text-muted">{lang === "bn" ? "স্ট্যাটাস" : "Status"}</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${paymentStatus === "paid" ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"}`}>
            {paymentStatus === "paid" ? (lang === "bn" ? "পরিশোধিত" : "PAID") : (lang === "bn" ? "বাকি" : "DUE")}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-2 print-hide">
        <button type="button" onClick={onSaveAndPrint} className="btn-primary w-full">{saveLabel ?? (lang === "bn" ? "সংরক্ষণ" : "Save")}</button>
        {!hideWhatsApp && onShareWhatsApp && (
          <button type="button" onClick={onShareWhatsApp} className="btn-glass w-full"><WhatsAppIcon size={16} color="#25D366" /> {tr("shareWhatsApp")}</button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>৳{value.toFixed(2)}</span>
    </div>
  );
}

function PartPickerModal({ onClose, onPick, tr, lang }: { onClose: () => void; onPick: (p: InventoryPart) => void; tr: (k: any) => string; lang: "en" | "bn" }) {
  const [q, setQ] = useState("");
  const inv = getInventory();
  const filtered = inv.filter((p) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.compatibleBrand.toLowerCase().includes(s) || p.compatibleModel.toLowerCase().includes(s);
  });
  return (
    <Modal open onClose={onClose} title={tr("selectFromInventory")}>
      <input autoFocus className="glass-input mb-3" placeholder={lang === "bn" ? "নাম, ব্র্যান্ড, মডেল..." : "Search name, brand, model..."} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">{lang === "bn" ? "কিছু পাওয়া যায়নি" : "No matches"}</p>
        ) : filtered.map((p) => (
          <button key={p.partId} onClick={() => onPick(p)} className="glass-soft p-3 w-full text-left hover:bg-white/60 transition">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm">{p.name}</div>
                <div className="text-xs text-text-muted">{p.compatibleBrand} {p.compatibleModel} • {p.quantity} {tr("currentStock")}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold">৳{p.sellingPrice}</div>
                <div className="text-[10px] text-text-muted">cost ৳{p.costPrice}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="btn-glass w-full mt-3"><X size={14} /> {tr("cancel")}</button>
    </Modal>
  );
}

export function openReceiptPrint(r: Receipt) {
  const settings = getSettings();
  const w = window.open("", "_blank", "width=480,height=700");
  if (!w) return;
  const rows = r.items.filter((i) => i.description.trim()).map((i) => `
    <tr>
      <td>${escapeHtml(i.description)}</td>
      <td style="text-align:center">${i.qty}</td>
      <td style="text-align:right">৳${i.unitPrice.toFixed(2)}</td>
      <td style="text-align:right">৳${i.lineTotal.toFixed(2)}</td>
    </tr>`).join("");
  w.document.write(`<html><head><title>${r.receiptNo}</title>
    <style>
      body{font-family:'Courier New',monospace;padding:20px;color:#000;max-width:380px;margin:0 auto}
      h1{text-align:center;font-size:18px;margin:4px 0}
      .meta{text-align:center;font-size:11px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0}
      th,td{padding:4px 2px;border-bottom:1px dashed #999}
      th{text-align:left;font-size:11px}
      .totals{margin-top:8px;font-size:13px}
      .totals div{display:flex;justify-content:space-between;padding:2px 0}
      .grand{font-weight:bold;font-size:15px;border-top:2px solid #000;padding-top:6px;margin-top:4px}
      .foot{text-align:center;font-size:11px;margin-top:14px;border-top:1px dashed #999;padding-top:8px}
    </style></head><body>
    <h1>${escapeHtml(settings.shopName)}</h1>
    <div class="meta">${escapeHtml(settings.address)}<br/>${escapeHtml(settings.phone)}</div>
    <div style="display:flex;justify-content:space-between;font-size:11px">
      <span><b>${r.receiptNo}</b></span><span>${r.date}</span>
    </div>
    ${r.customerName ? `<div style="font-size:12px;margin-top:6px">${escapeHtml(r.customerName)}${r.customerPhone ? " • " + escapeHtml(r.customerPhone) : ""}</div>` : ""}
    ${r.device ? `<div style="font-size:12px">${escapeHtml(r.device)}</div>` : ""}
    ${r.jobToken ? `<div style="font-size:11px;color:#555">Job: ${escapeHtml(r.jobToken)}</div>` : ""}
    <table>
      <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal</span><span>৳${r.subtotal.toFixed(2)}</span></div>
      ${r.discount > 0 ? `<div><span>Discount</span><span>-৳${r.discount.toFixed(2)}</span></div>` : ""}
      ${r.tax > 0 ? `<div><span>Tax (${r.taxRate}%)</span><span>৳${r.tax.toFixed(2)}</span></div>` : ""}
      <div class="grand"><span>TOTAL</span><span>৳${r.grandTotal.toFixed(2)}</span></div>
    </div>
    ${r.notes ? `<div style="font-size:11px;margin-top:10px"><i>${escapeHtml(r.notes)}</i></div>` : ""}
    <div class="foot">Thank you!<br/>${escapeHtml(settings.website)}</div>
    <script>window.print();<\/script></body></html>`);
  w.document.close();
}

export function buildWhatsAppText(r: Receipt) {
  const settings = getSettings();
  return [
    `${settings.shopName} — Receipt ${r.receiptNo}`,
    `Date: ${r.date}`,
    r.customerName ? `Customer: ${r.customerName}` : "",
    r.device ? `Device: ${r.device}` : "",
    "",
    ...r.items.filter((i) => i.description.trim()).map((i) =>
      `• ${i.description} × ${i.qty} = ৳${i.lineTotal.toFixed(0)}`,
    ),
    "",
    `Subtotal: ৳${r.subtotal.toFixed(0)}`,
    r.discount > 0 ? `Discount: -৳${r.discount.toFixed(0)}` : "",
    r.tax > 0 ? `Tax: ৳${r.tax.toFixed(0)}` : "",
    `Grand Total: ৳${r.grandTotal.toFixed(0)}`,
    r.notes ? `\nNote: ${r.notes}` : "",
    ``,
    `— ${settings.shopName}`,
  ].filter(Boolean).join("\n");
}

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
