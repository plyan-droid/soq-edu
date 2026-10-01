import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAllCourses } from "@/lib/course-overrides";
import { addApplicant } from "@/lib/applicants.functions";
import { DIAL_CODES, NATIONALITIES, QUALIFICATIONS, SALES_MANAGERS, APP_STAGES } from "@/lib/applicant-options";
import { ManualEnrol } from "@/components/staff-phase3";

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
type App = { id: string; course_slug: string; full_name: string; email: string; phone: string; citizenship: string | null; nationality: string | null; preferred_intake: string | null; message: string | null; status: string; source: string; sales_manager: string | null; created_at: string };
const isDiploma = (t: string) => /diploma/i.test(t);

export function ApplicationsHub({ onOpenStudent }: { onOpenStudent: (id: string) => void }) {
  const qc = useQueryClient();
  const courses = useAllCourses(true);
  const titleOf = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
  const [kind, setKind] = useState<"all" | "diploma" | "course">("all");
  const [stage, setStage] = useState("open");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState(false);

  const { data = [], isPending } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => ((await supabase.from("course_applications").select("*").order("created_at", { ascending: false }).limit(500)).data ?? []) as App[],
  });
  const { data: accounts } = useQuery({
    queryKey: ["admin-app-accounts", data.length], enabled: data.length > 0,
    queryFn: async () => {
      const { data: ps } = await supabase.from("profiles").select("id,email");
      const { data: en } = await supabase.from("enrollments").select("student_id,course_slug,progress");
      return { byEmail: new Map((ps ?? []).map(p => [p.email.toLowerCase(), p.id as string])), en: en ?? [] };
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-applications"] }); void qc.invalidateQueries({ queryKey: ["admin-app-accounts"] }); void qc.invalidateQueries({ queryKey: ["admin-students"] }); };
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("course_applications").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };
  const approveEnrol = async (a: App) => {
    const pid = accounts?.byEmail.get(a.email.toLowerCase());
    if (!pid) { await setStatus(a.id, "approved"); toast.message(`Approved. ${a.email} has no account yet — use "New applicant / enrol" with their details to create one and enrol them.`); return; }
    const { data: ex } = await supabase.from("enrollments").select("id").eq("student_id", pid).eq("course_slug", a.course_slug).maybeSingle();
    if (!ex) { const { error } = await supabase.from("enrollments").insert({ student_id: pid, course_slug: a.course_slug, status: "active", start_date: new Date().toISOString().slice(0, 10) }); if (error) { toast.error(error.message); return; } }
    await setStatus(a.id, "enrolled"); toast.success(`${a.full_name} is enrolled`);
  };

  const term = q.trim().toLowerCase();
  const rows = data.filter(a => {
    const d = isDiploma(titleOf(a.course_slug));
    if (kind === "diploma" && !d) return false;
    if (kind === "course" && d) return false;
    if (stage === "open" && (a.status === "enrolled" || a.status === "closed")) return false;
    if (stage !== "open" && stage !== "all" && a.status !== stage) return false;
    return !term || a.full_name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term) || a.phone.includes(term) || titleOf(a.course_slug).toLowerCase().includes(term);
  });
  const count = (s: string) => data.filter(a => a.status === s).length;

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
        Every application from the website (short courses and diplomas) lands here, plus anyone staff add by hand. Move each one through <b className="text-foreground">New → Contacted → Screening → Offer sent → Approved</b>, then <b className="text-foreground">Approve &amp; enrol</b> gives them their place: the course appears in their student portal and on trainer class lists. <b className="text-foreground">Closed</b> means they didn't go ahead.
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button className="rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85" onClick={() => setAdding(true)}><UserPlus /> New applicant / enrol</Button>
        <Button variant="outline" className="rounded-full" onClick={() => setBulk(b => !b)}>{bulk ? "Hide spreadsheet import" : "Import from spreadsheet"}</Button>
        <Input className="ml-auto max-w-xs" placeholder="Search name, email, phone or course…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search applications" />
      </div>
      {bulk && <ManualEnrol />}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Course type">
        {([["all", "All"], ["diploma", "Diplomas"], ["course", "Short & certificate courses"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} className="rounded-full" onClick={() => setKind(k)}>{l}</Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Stage">
        {[["open", "Open"], ...APP_STAGES, ["all", "Everything"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setStage(k!)} className={`rounded-md border px-3 py-1.5 text-xs font-medium ${stage === k ? "border-brand-gold bg-brand-gold-soft/60 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {l}{k !== "open" && k !== "all" ? ` (${count(k!)})` : ""}
          </button>
        ))}
      </div>

      {isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">No applications here.</p> : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr>{["Date", "Name", "Contact", "Course", "Notes", "Stage", "Progress"].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map(a => {
              const pid = accounts?.byEmail.get(a.email.toLowerCase());
              const prog = pid ? accounts?.en.find(e => e.student_id === pid && e.course_slug === a.course_slug)?.progress : undefined;
              return (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap p-3">{new Date(a.created_at).toLocaleDateString("en-SG")}<div className="text-xs text-muted-foreground">{a.source === "staff" ? "Added by staff" : "Website"}</div></td>
                  <td className="p-3">
                    {pid ? <button type="button" className="text-left font-medium text-primary underline underline-offset-2" onClick={() => onOpenStudent(pid)}>{a.full_name}</button> : <span className="font-medium">{a.full_name}</span>}
                    <div className="text-xs text-muted-foreground">{pid ? "Has an account" : "No account yet"}{a.nationality ? ` · ${a.nationality}` : a.citizenship ? ` · ${a.citizenship.replace(/_/g, " ")}` : ""}</div>
                  </td>
                  <td className="p-3"><a className="underline" href={`mailto:${a.email}`}>{a.email}</a><div>{a.phone}</div></td>
                  <td className="p-3">{titleOf(a.course_slug)}{isDiploma(titleOf(a.course_slug)) && <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">Diploma</span>}</td>
                  <td className="max-w-64 p-3">{a.preferred_intake}<div className="text-xs text-muted-foreground">{a.message}</div>{a.sales_manager && <div className="text-xs text-muted-foreground">Sales: {a.sales_manager}</div>}</td>
                  <td className="p-3">
                    <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={a.status} onChange={e => void setStatus(a.id, e.target.value)} aria-label={`Stage for ${a.full_name}`}>{APP_STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                    {a.status !== "enrolled" && a.status !== "closed" && <Button size="sm" className="mt-2 block rounded-full" onClick={() => void approveEnrol(a)}>Approve &amp; enrol</Button>}
                  </td>
                  <td className="p-3">{prog !== undefined ? `${prog}%` : "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
      {adding && <ApplicantForm courses={courses.map(c => ({ slug: c.slug, title: c.title }))} onClose={() => setAdding(false)} onDone={() => { setAdding(false); refresh(); }} />}
    </div>
  );
}

const blank = { course_slug: "", full_name: "", dial: "65", mobile: "", nationality: "", citizenship: "", id_type: "", id_number: "", dob: "", email: "", address: "", qualification: "", sales_manager: "", newsletter: false, truth: false, terms: false, enrol_now: true, notes: "" };

function ApplicantForm({ courses, onClose, onDone }: { courses: { slug: string; title: string }[]; onClose: () => void; onDone: () => void }) {
  const add = useServerFn(addApplicant);
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const sorted = useMemo(() => [...courses].sort((a, b) => a.title.localeCompare(b.title)), [courses]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    const digits = f.mobile.replace(/\D/g, "");
    if (!f.course_slug) er.course_slug = "Choose a course";
    if (f.full_name.trim().length < 2) er.full_name = "Enter the full name as per NRIC";
    if (f.dial === "65" ? !/^[89]\d{7}$/.test(digits) : digits.length < 6) er.mobile = f.dial === "65" ? "Singapore numbers start with 8 or 9 and have 8 digits" : "Enter a valid mobile number";
    if (!f.nationality) er.nationality = "Select nationality";
    if (!f.citizenship) er.citizenship = "Select citizenship";
    if (!f.id_type) er.id_type = "Select ID type";
    if (f.id_number.trim().length < 3) er.id_number = "Enter the ID number";
    const m = f.dob.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m || Number.isNaN(Date.parse(`${m[3]}-${m[2]}-${m[1]}`))) er.dob = "Use dd-mm-yyyy";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) er.email = "Enter a valid email";
    if (f.address.trim().length < 3) er.address = "Enter the address";
    if (!f.qualification) er.qualification = "Select highest qualification";
    if (!f.truth) er.truth = "Please confirm the details are correct";
    if (!f.terms) er.terms = "The Terms and Data Protection Policy must be accepted";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const r = await add({ data: {
        course_slug: f.course_slug, full_name: f.full_name, phone: `+${f.dial} ${digits}`, nationality: f.nationality,
        citizenship: (f.citizenship === "SC" ? "singapore_citizen" : f.citizenship === "PR" ? "permanent_resident" : "foreigner"),
        id_type: f.id_type as "NRIC", id_number: f.id_number.toUpperCase(), date_of_birth: `${m![3]}-${m![2]}-${m![1]}`, email: f.email,
        address: f.address, qualification: f.qualification, sales_manager: f.sales_manager, newsletter: f.newsletter, enrol_now: f.enrol_now, notes: f.notes,
      } });
      toast.success(`${f.full_name} saved${r.created ? " — new account created" : ""}${r.enrolled ? " and enrolled" : ""}`);
      onDone();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); }
    setBusy(false);
  };
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">{t}</span>{children}</label>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" role="dialog" aria-modal="true" aria-label="New applicant">
      <form onSubmit={submit} noValidate className="h-full w-full max-w-2xl overflow-y-auto bg-background p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Applications &amp; enrolment</p><h2 className="mt-1 font-workspace text-2xl font-semibold text-primary">New applicant / enrol</h2></div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X /></Button>
        </div>
        <p className="mt-3 rounded-md border border-brand-gold bg-brand-gold-soft/40 p-3 text-sm">An account will be automatically created for the applicant once this form is submitted. To access their account, they click <b>Forgot password</b> on the login page to set a password.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><L t="Course or diploma"><select className={sel} value={f.course_slug} onChange={set("course_slug")}><option value="">— Please select —</option>{sorted.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></L>{err("course_slug")}</div>
          <div className="sm:col-span-2"><L t="Full name (must be per NRIC for training grant application)"><Input value={f.full_name} onChange={set("full_name")} /></L>{err("full_name")}</div>
          <div className="sm:col-span-2"><L t="Contact no. (mobile)"><div className="flex gap-2"><select className="h-10 w-44 rounded-md border border-input bg-background px-2 text-sm" value={f.dial} onChange={set("dial")} aria-label="Country code">{DIAL_CODES.map(d => <option key={d.name} value={d.code}>{d.name} (+{d.code})</option>)}</select><Input type="tel" inputMode="numeric" value={f.mobile} onChange={set("mobile")} placeholder={f.dial === "65" ? "8 digits, starts with 8 or 9" : "Mobile number"} /></div></L>{err("mobile")}</div>
          <div className="sm:col-span-2"><L t="Nationality (mandatory for training grant application)"><select className={sel} value={f.nationality} onChange={set("nationality")}><option value="">— Please select —</option>{NATIONALITIES.map(n => <option key={n}>{n}</option>)}</select></L><p className="mt-1 text-xs text-muted-foreground">Singapore Citizens, PRs and LTVP+ holders must pick the right option — it affects funding.</p>{err("nationality")}</div>
          <div><L t="Citizenship"><select className={sel} value={f.citizenship} onChange={set("citizenship")}><option value="">— Please select —</option><option>SC</option><option>PR</option><option>Others</option></select></L>{err("citizenship")}</div>
          <div><L t="ID type"><select className={sel} value={f.id_type} onChange={set("id_type")}><option value="">— Please select —</option><option>NRIC</option><option>FIN</option><option>PASSPORT</option></select></L>{err("id_type")}</div>
          <div><L t="ID number (NRIC/FIN)"><Input value={f.id_number} onChange={set("id_number")} /></L>{err("id_number")}</div>
          <div><L t="Date of birth (dd-mm-yyyy)"><Input value={f.dob} onChange={set("dob")} placeholder="dd-mm-yyyy" /></L>{err("dob")}</div>
          <div className="sm:col-span-2"><L t="Email (login username)"><Input type="email" value={f.email} onChange={set("email")} /></L>{err("email")}</div>
          <div className="sm:col-span-2"><L t="Address 1"><Input value={f.address} onChange={set("address")} /></L>{err("address")}</div>
          <div><L t="Highest qualification"><select className={sel} value={f.qualification} onChange={set("qualification")}><option value="">— Please select —</option>{QUALIFICATIONS.map(x => <option key={x}>{x}</option>)}</select></L>{err("qualification")}</div>
          <div><L t="Sales manager"><select className={sel} value={f.sales_manager} onChange={set("sales_manager")}><option value="">— Please select —</option>{SALES_MANAGERS.map(x => <option key={x}>{x}</option>)}</select></L></div>
          <div className="sm:col-span-2"><L t="Staff notes (optional)"><Textarea rows={2} maxLength={2000} value={f.notes} onChange={set("notes")} /></L></div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <label className="flex gap-3"><input type="checkbox" className="mt-1" checked={f.newsletter} onChange={set("newsletter")} />I would like to receive newsletters, promotions, offers and alerts of my favourite course's new run dates via email.</label>
          <label className="flex gap-3"><input type="checkbox" className="mt-1" checked={f.truth} onChange={set("truth")} /><span>By submitting this form, I confirm that all information provided is true, accurate and complete, and that I have double-checked the details. I acknowledge that SOQ International Academy will use the email address and contact details provided for course-related communications, and that incorrect or incomplete details may mean I miss course confirmations and reminders.</span></label>{err("truth")}
          <label className="flex gap-3"><input type="checkbox" className="mt-1" checked={f.terms} onChange={set("terms")} /><span>I have read and agree to SOQ International Academy's <a className="underline" href="https://soq.edu.sg/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</a> and <a className="underline" href="https://soq.edu.sg/data-policy" target="_blank" rel="noreferrer">Data Protection Policy</a>, and consent to the collection, use and disclosure of my personal data in accordance with the PDPA for course administration and related purposes.</span></label>{err("terms")}
          <label className="flex gap-3 rounded-md border border-border bg-card p-3"><input type="checkbox" className="mt-1" checked={f.enrol_now} onChange={set("enrol_now")} /><span><b>Enrol straight away</b> — tick to give them a place now. Untick to only record the application as New.</span></label>
        </div>

        <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-2 border-t border-border bg-background px-6 py-4 sm:-mx-8 sm:px-8">
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>Cancel</Button>
          <Button disabled={busy} className="rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85">{busy ? "Saving…" : f.enrol_now ? "Save & enrol" : "Save application"}</Button>
        </div>
      </form>
    </div>
  );
}
