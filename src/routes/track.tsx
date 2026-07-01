import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SearchX, Phone as PhoneIcon } from "lucide-react";
import { WhatsAppIcon } from "../components/icons/WhatsAppIcon";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useI18n } from "../lib/i18n";
import { getJobByToken, getSettings, type Job } from "../lib/storage";
import { STATUSES, STATUS_ICONS, getStatusLabel, StatusBadge } from "../lib/ui";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Repair — Mak Electronics" },
      { name: "description", content: "Track your phone repair status with your Job Token." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { tr, lang } = useI18n();
  const [token, setToken] = useState("");
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const settings = getSettings();

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const found = getJobByToken(token.trim());
      setJob(found ?? null);
      setLoading(false);
    }, 500);
  };

  const activeIdx = job ? STATUSES.indexOf(job.status) : -1;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 px-4 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="label-caps">{lang === "bn" ? "রিপেয়ার ট্র্যাকার" : "Repair Tracker"}</div>
            <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${lang === "bn" ? "bn" : ""}`}>{tr("trackerTitle")}</h1>
            <p className={`mt-2 text-sm text-text-secondary ${lang === "bn" ? "bn" : ""}`}>
              {lang === "bn" ? "আপনার জব টোকেন লিখে রিপেয়ার অবস্থা দেখুন।" : "Enter your job token to see live repair status."}
            </p>
          </div>

          <form onSubmit={search} className="glass p-4 flex flex-col sm:flex-row gap-3">
            <input
              className="glass-input flex-1"
              placeholder={tr("trackerHint")}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "..." : (<><Search size={16} /> {tr("search")}</>)}
            </button>
          </form>

          <div className="mt-4 text-xs text-text-muted text-center">
            {lang === "bn" ? "ডেমো টোকেন:" : "Try demo tokens:"} JOB-1001, JOB-1002, JOB-1003
          </div>

          {job === null && (
            <div className="glass p-6 mt-6 text-center fade-up">
              <SearchX size={36} className="mx-auto mb-2 text-text-muted" />
              <p className={lang === "bn" ? "bn" : ""}>{tr("notFound")}</p>
            </div>
          )}

          {job && (
            <div className="glass p-6 mt-6 fade-up">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="label-caps">Token</div>
                  <div className="text-xl font-bold tracking-tight">{job.token}</div>
                </div>
                <StatusBadge status={job.status} lang={lang} />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <div className="label-caps">{tr("customer")}</div>
                  <div className="font-semibold mt-1">{job.customerName.split(" ")[0]}</div>
                </div>
                <div>
                  <div className="label-caps">{tr("device")}</div>
                  <div className="font-semibold mt-1">{job.device}</div>
                </div>
                <div>
                  <div className="label-caps">{tr("issue")}</div>
                  <div className="font-semibold mt-1">{job.issue}</div>
                </div>
                <div>
                  <div className="label-caps">{tr("estCompletion")}</div>
                  <div className="font-semibold mt-1">{job.estimatedDate}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-6">
                <div className="label-caps mb-3">{tr("status")}</div>
                <div className="flex justify-between gap-0 overflow-x-auto no-scrollbar pb-2">
                  {STATUSES.map((s, i) => {
                    const done = i <= activeIdx;
                    const active = i === activeIdx;
                    const Icon = STATUS_ICONS[s];
                    return (
                      <div key={s} className="flex flex-col items-center flex-1 min-w-[58px] relative">
                        {i > 0 && (
                          <div className={`absolute top-5 right-1/2 left-[-50%] h-0.5 -translate-y-1/2 ${i <= activeIdx ? "bg-accent-blue" : "bg-black/10"}`} />
                        )}
                        <div
                          className={`w-10 h-10 rounded-full grid place-items-center relative z-10 ${
                            active ? "bg-accent-blue text-white pulse-dot shadow-[0_0_0_4px_rgba(240,138,110,0.25)]"
                            : done ? "bg-accent-green text-white"
                            : "bg-black/5 text-text-muted"
                          }`}
                        >
                          <Icon size={18} strokeWidth={2.2} />
                        </div>
                        <div className={`text-[10px] mt-2 text-center font-semibold ${done ? "text-text-primary" : "text-text-muted"}`}>
                          {getStatusLabel(s, lang)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {job.techNote && (
                <div className="glass-soft p-4 mt-6">
                  <div className="label-caps mb-1">{tr("techNote")}</div>
                  <p className="text-sm">{job.techNote}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <a href={`tel:${settings.phone}`} className="btn-glass flex-1"><PhoneIcon size={16} /> {tr("callNow")}</a>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="btn-primary flex-1"><WhatsAppIcon size={16} /> WhatsApp</a>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
