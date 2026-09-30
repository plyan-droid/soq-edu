import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { money } from "@/lib/cart";
import { SfcBalancesAdmin } from "@/components/skillsfuture";

const title = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const priceOf = (s: string) => Number(String((courses.find(c => c.slug === s) as { price?: unknown } | undefined)?.price ?? "0").replace(/[^0-9.]/g, "")) || 0;
const Box = ({ children }: { children: React.ReactNode }) => <div className="space-y-4 rounded-lg border border-border bg-card p-5">{children}</div>;
const H = ({ children }: { children: React.ReactNode }) => <h3 className="font-serif text-2xl text-primary">{children}</h3>;
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
const CourseSelect = ({ value, onChange, only }: { value: string; onChange: (v: string) => void; only?: (t: string) => boolean }) => (
  <select className={`${sel} w-full`} value={value} onChange={e => onChange(e.target.value)}>{courses.filter(c => !only || only(c.title)).map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
);
const diplomas = courses.filter(c => /diploma/i.test(c.title));

/* ---------- Diploma admissions pipeline ---------- */
const STAGES = [["applied", "Applied"], ["screening", "Screening"], ["offer", "Offer sent"], ["accepted", "Accepted"], ["rejected", "Not admitted"]] as const;
export function AdmissionsPipeline() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admissions"], queryFn: async () => (await supabase.from("admissions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: apps = [] } = useQuery({ queryKey: ["dip-apps"], queryFn: async () => ((await supabase.from("course_applications").select("*").order("created_at", { ascending: false })).data ?? []).filter(a => /diploma/i.test(title(a.course_slug))) });
  const [f, setF] = useState({ full_name: "", email: "", phone: "", course_slug: diplomas[0]?.slug ?? courses[0]!.slug });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admissions"] });
  const add = async (row: typeof f & { application_id?: string }) => {
    const { error } = await supabase.from("admissions").insert(row);
    if (error) toast.error(error.message); else { toast.success("Added to pipeline"); void refresh(); }
  };
  const move = async (id: string, stage: string) => { await supabase.from("admissions").update({ stage, updated_at: new Date().toISOString() }).eq("id", id); void refresh(); };
  const imported = new Set(data.map(d => d.application_id));
  const waiting = apps.filter(a => !imported.has(a.id));
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Box><H>Add applicant</H>
          <Input placeholder="Full name" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
          <Input placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <Input placeholder="Mobile" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
          <CourseSelect value={f.course_slug} onChange={v => setF({ ...f, course_slug: v })} only={t => /diploma/i.test(t)} />
          <Button className="rounded-full" disabled={!f.full_name || !f.email} onClick={() => void add(f)}>Add</Button>
        </Box>
        <Box><H>Diploma applications from the website</H>
          {waiting.length === 0 ? <p className="text-sm text-muted-foreground">No new diploma applications.</p> :
            <ul className="divide-y divide-border text-sm">{waiting.slice(0, 10).map(a => <li key={a.id} className="flex items-center justify-between gap-2 py-2"><span><b>{a.full_name}</b> · {title(a.course_slug)}</span><Button size="sm" variant="outline" onClick={() => void add({ full_name: a.full_name, email: a.email, phone: a.phone, course_slug: a.course_slug, application_id: a.id })}>Add to pipeline</Button></li>)}</ul>}
        </Box>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        {STAGES.map(([s, l]) => (
          <div key={s} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{l} ({data.filter(d => d.stage === s).length})</p>
            <div className="space-y-2">{data.filter(d => d.stage === s).map(d => (
              <div key={d.id} className="rounded-md bg-card p-2 text-xs shadow-sm">
                <p className="font-semibold">{d.full_name}</p><p className="text-muted-foreground">{title(d.course_slug)}</p><p className="text-muted-foreground">{d.email}</p>
                <div className="mt-2 flex gap-1"><select className="h-7 flex-1 rounded border border-input bg-background text-xs" value={d.stage} onChange={e => void move(d.id, e.target.value)}>{STAGES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
                  <button aria-label="Remove" onClick={async () => { await supabase.from("admissions").delete().eq("id", d.id); void refresh(); }}><Trash2 className="size-3.5 text-muted-foreground" /></button></div>
              </div>))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Module exemptions (RPL / credit transfer) ---------- */
export function ExemptionsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["exemptions"], queryFn: async () => (await supabase.from("exemptions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ student_email: "", course_slug: courses[0]!.slug, module: "", kind: "RPL", fee_reduction: "", evidence: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["exemptions"] });
  const save = async () => {
    const { error } = await supabase.from("exemptions").insert({ ...f, fee_reduction: Number(f.fee_reduction) || 0 });
    if (error) toast.error(error.message); else { setF({ ...f, module: "", fee_reduction: "", evidence: "" }); void refresh(); }
  };
  const approvedTotal = (email: string, slug: string) => data.filter(d => d.student_email === email && d.course_slug === slug && d.status === "approved").reduce((s, d) => s + Number(d.fee_reduction), 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <Box><H>New exemption request</H>
        <Input placeholder="Student email" value={f.student_email} onChange={e => setF({ ...f, student_email: e.target.value })} />
        <CourseSelect value={f.course_slug} onChange={v => setF({ ...f, course_slug: v })} />
        <Input placeholder="Module name" value={f.module} onChange={e => setF({ ...f, module: e.target.value })} />
        <select className={`${sel} w-full`} value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="RPL">Recognition of prior learning (RPL)</option><option value="Credit transfer">Credit transfer</option></select>
        <Input type="number" placeholder="Fee reduction (S$)" value={f.fee_reduction} onChange={e => setF({ ...f, fee_reduction: e.target.value })} />
        <Textarea placeholder="Evidence (certificate, work history, link)" value={f.evidence} onChange={e => setF({ ...f, evidence: e.target.value })} />
        <Button className="rounded-full" disabled={!f.student_email || !f.module} onClick={() => void save()}>Save request</Button>
      </Box>
      <Box><H>Requests</H>
        {data.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet.</p> :
          <ul className="divide-y divide-border text-sm">{data.map(d => {
            const fee = priceOf(d.course_slug); const off = approvedTotal(d.student_email, d.course_slug);
            return <li key={d.id} className="space-y-1 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><span><b>{d.student_email}</b> · {d.kind} · {d.module}</span><span className="text-xs uppercase text-muted-foreground">{d.status}</span></div>
              <p className="text-muted-foreground">{title(d.course_slug)} · reduces fee by {money(Number(d.fee_reduction))}{d.status === "approved" && fee ? ` · new fee ${money(Math.max(0, fee - off))}` : ""}</p>
              {d.evidence && <p className="text-xs">{d.evidence}</p>}
              <div className="flex gap-2">{d.status === "pending" ? <><Button size="sm" onClick={async () => { await supabase.from("exemptions").update({ status: "approved" }).eq("id", d.id); void refresh(); }}>Approve</Button><Button size="sm" variant="outline" onClick={async () => { await supabase.from("exemptions").update({ status: "rejected" }).eq("id", d.id); void refresh(); }}>Reject</Button></> : <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("exemptions").update({ status: "pending" }).eq("id", d.id); void refresh(); }}>Undo</Button>}</div>
            </li>; })}</ul>}
      </Box>
    </div>
  );
}

/* ---------- SkillsFuture Credit tracking ---------- */
export function SfcClaims() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["sfc"], queryFn: async () => (await supabase.from("sfc_claims").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ student_email: "", course_slug: courses[0]!.slug, course_fee: String(priceOf(courses[0]!.slug)), sfc_amount: "", claim_ref: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["sfc"] });
  const save = async () => {
    const fee = Number(f.course_fee) || 0, amt = Number(f.sfc_amount) || 0;
    if (amt > fee) { toast.error("Credit used can't be more than the course fee"); return; }
    const { error } = await supabase.from("sfc_claims").insert({ ...f, course_fee: fee, sfc_amount: amt });
    if (error) toast.error(error.message); else { setF({ ...f, student_email: "", sfc_amount: "", claim_ref: "" }); void refresh(); }
  };
  const { data: payments = [] } = useQuery({ queryKey: ["sfc-payments"], queryFn: async () => (await supabase.from("bank_payments").select("id,email,total,reference,status,created_at").order("created_at", { ascending: false }).limit(500)).data ?? [] });
  const [filter, setFilter] = useState<string>("submitted");
  const [settle, setSettle] = useState<{ id: string; ref: string; date: string; note: string } | null>(null);
  const update = async (id: string, patch: { status?: string; payment_id?: string | null; claim_ref?: string; settled_on?: string | null; staff_note?: string | null }) => { const { error } = await supabase.from("sfc_claims").update(patch).eq("id", id); if (error) toast.error(error.message); void refresh(); };
  const sum = (st: string) => data.filter(d => d.status === st).reduce((s, d) => s + Number(d.sfc_amount), 0);
  const shown = filter === "all" ? data : data.filter(d => d.status === filter);
  const LABEL: Record<string, string> = { submitted: "Waiting", approved: "Approved", paid: "Paid out", rejected: "Rejected", all: "All" };
  const confirmPaid = async () => {
    if (!settle) return;
    if (!settle.ref.trim()) { toast.error("Enter the SkillsFuture claim reference"); return; }
    await update(settle.id, { status: "paid", claim_ref: settle.ref.trim(), settled_on: settle.date || new Date().toISOString().slice(0, 10), staff_note: settle.note.trim() || null });
    setSettle(null); toast.success("Claim settled");
  };
  return (
    <>
    <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
      <Box><H>Record SkillsFuture Credit</H>
        <Input placeholder="Student email" value={f.student_email} onChange={e => setF({ ...f, student_email: e.target.value })} />
        <CourseSelect value={f.course_slug} onChange={v => setF({ ...f, course_slug: v, course_fee: String(priceOf(v)) })} />
        <label className="block text-sm">Course fee (S$)<Input type="number" value={f.course_fee} onChange={e => setF({ ...f, course_fee: e.target.value })} /></label>
        <label className="block text-sm">Credit used (S$)<Input type="number" value={f.sfc_amount} onChange={e => setF({ ...f, sfc_amount: e.target.value })} /></label>
        <Input placeholder="Claim reference (from MySkillsFuture)" value={f.claim_ref} onChange={e => setF({ ...f, claim_ref: e.target.value })} />
        <p className="text-sm text-muted-foreground">Student pays: <b>{money(Math.max(0, (Number(f.course_fee) || 0) - (Number(f.sfc_amount) || 0)))}</b></p>
        <Button className="rounded-full" disabled={!f.student_email} onClick={() => void save()}>Save</Button>
      </Box>
      <Box><H>Settle claims</H>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["submitted", "approved", "paid", "rejected"] as const).map(st => (
            <button key={st} onClick={() => setFilter(st)} className={`rounded-md border p-3 text-left ${filter === st ? "border-primary bg-muted" : "border-border"}`}>
              <p className="text-xs uppercase text-muted-foreground">{LABEL[st]} · {data.filter(d => d.status === st).length}</p>
              <p className="font-semibold">{money(sum(st))}</p>
            </button>))}
        </div>
        <button className="text-xs underline" onClick={() => setFilter("all")}>Show all claims</button>
        {shown.length === 0 ? <p className="text-sm text-muted-foreground">No {LABEL[filter]?.toLowerCase()} claims.</p> :
          <ul className="divide-y divide-border border-t border-border text-sm">{shown.map(d => {
            const pays = Number(d.course_fee) - Number(d.sfc_amount);
            const opts = payments.filter(p => p.email.toLowerCase() === d.student_email.toLowerCase());
            return (
            <li key={d.id} className="grid gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><b>{d.student_email}</b><div className="text-xs text-muted-foreground">{title(d.course_slug)} · fee {money(Number(d.course_fee))} · credit {money(Number(d.sfc_amount))} · learner pays <b>{money(pays)}</b></div>
                  {(d.claim_ref || d.settled_on || d.staff_note) && <div className="text-xs text-muted-foreground">{d.claim_ref && <>Ref {d.claim_ref}</>}{d.settled_on && <> · settled {new Date(d.settled_on).toLocaleDateString("en-GB")}</>}{d.staff_note && <> · {d.staff_note}</>}</div>}</div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{LABEL[d.status] ?? d.status}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Linked payment" className="h-8 max-w-[16rem] rounded border border-input bg-background text-xs" value={d.payment_id ?? ""} onChange={e => void update(d.id, { payment_id: e.target.value || null })}>
                  <option value="">{opts.length ? "Link to a payment…" : "No payments for this email"}</option>
                  {opts.map(p => <option key={p.id} value={p.id}>{p.reference} · {money(Number(p.total))} · {p.status}</option>)}
                </select>
                {d.status === "submitted" && <><Button size="sm" onClick={() => void update(d.id, { status: "approved" })}>Approve</Button><Button size="sm" variant="outline" onClick={() => void update(d.id, { status: "rejected" })}>Reject</Button></>}
                {d.status === "approved" && <Button size="sm" onClick={() => setSettle({ id: d.id, ref: d.claim_ref ?? "", date: new Date().toISOString().slice(0, 10), note: "" })}>Mark paid out</Button>}
                {d.status !== "submitted" && <Button size="sm" variant="ghost" onClick={() => void update(d.id, { status: "submitted", settled_on: null })}>Reopen</Button>}
              </div>
              {settle?.id === d.id && <div className="grid gap-2 rounded-md bg-muted p-3 sm:grid-cols-3">
                <label className="text-xs">SkillsFuture claim ref *<Input value={settle.ref} onChange={e => setSettle({ ...settle, ref: e.target.value })} /></label>
                <label className="text-xs">Date received<Input type="date" value={settle.date} onChange={e => setSettle({ ...settle, date: e.target.value })} /></label>
                <label className="text-xs">Note<Input value={settle.note} onChange={e => setSettle({ ...settle, note: e.target.value })} /></label>
                <div className="flex gap-2 sm:col-span-3"><Button size="sm" onClick={() => void confirmPaid()}>Confirm paid out</Button><Button size="sm" variant="ghost" onClick={() => setSettle(null)}>Cancel</Button></div>
              </div>}
            </li>); })}</ul>}
      </Box>
    </div>
    <SfcBalancesAdmin />
    </>
  );
}

/* ---------- WhatsApp reminders ---------- */
const TEMPLATES = {
  class: "Hi {name}, a reminder from SOQ International Academy: your {course} class is on {when}. See you there!",
  payment: "Hi {name}, a friendly reminder from SOQ International Academy that your payment for {course} is due on {when}. Thank you!",
  document: "Hi {name}, SOQ International Academy here. Please send us your documents for {course} by {when}. Thank you!",
};
export function WhatsAppReminders() {
  const [kind, setKind] = useState<keyof typeof TEMPLATES>("class");
  const [f, setF] = useState({ name: "", phone: "", course: courses[0]!.slug, when: "" });
  const [text, setText] = useState("");
  const msg = text || TEMPLATES[kind].replace("{name}", f.name || "there").replace("{course}", title(f.course)).replace("{when}", f.when || "[date]");
  const phone = f.phone.replace(/\D/g, "").replace(/^(?=[89]\d{7}$)/, "65");
  return (
    <Box><H>WhatsApp reminders</H>
      <p className="text-sm text-muted-foreground">Fill in the details, then click to open WhatsApp with the message ready to send.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <select className={sel} value={kind} onChange={e => { setKind(e.target.value as keyof typeof TEMPLATES); setText(""); }}><option value="class">Class reminder</option><option value="payment">Payment reminder</option><option value="document">Documents reminder</option></select>
        <Input placeholder="Student name" value={f.name} onChange={e => { setF({ ...f, name: e.target.value }); setText(""); }} />
        <Input placeholder="Mobile, e.g. 9123 4567" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
        <Input placeholder="Date & time, e.g. Mon 6 Oct, 7pm" value={f.when} onChange={e => { setF({ ...f, when: e.target.value }); setText(""); }} />
        <div className="md:col-span-2"><CourseSelect value={f.course} onChange={v => { setF({ ...f, course: v }); setText(""); }} /></div>
      </div>
      <Textarea rows={4} value={msg} onChange={e => setText(e.target.value)} />
      <Button asChild className="rounded-full" disabled={!phone}><a href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><MessageCircle /> Open in WhatsApp</a></Button>
    </Box>
  );
}

/* ---------- CRM leads import ---------- */
function parseCsv(t: string) {
  const lines = t.split(/\r?\n/).filter(l => l.trim());
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.slice(0, -1).map(c => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  const head = split(lines[0] ?? "").map(h => h.toLowerCase());
  const col = (...k: string[]) => head.findIndex(h => k.some(x => h.includes(x)));
  const [n, e, p, i] = [col("name"), col("email"), col("phone", "mobile", "number"), col("interest", "course", "note")];
  return lines.slice(1).map(split).map(r => ({ name: r[n] ?? "", email: r[e] || null, phone: r[p] || null, interest: r[i] || null })).filter(r => r.name);
}
export function LeadsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["leads"], queryFn: async () => (await supabase.from("leads").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [csv, setCsv] = useState(""); const [source, setSource] = useState("Privyr"); const [q, setQ] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["leads"] });
  const run = async () => {
    const rows = parseCsv(csv).map(r => ({ ...r, source }));
    if (!rows.length) { toast.error("No rows found. The first line must be headings like Name, Email, Phone."); return; }
    const { error } = await supabase.from("leads").insert(rows);
    if (error) toast.error(error.message); else { toast.success(`${rows.length} leads imported`); setCsv(""); void refresh(); }
  };
  const shown = data.filter(d => !q || `${d.name} ${d.email} ${d.phone} ${d.interest}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
      <Box><H>Import leads</H>
        <p className="text-sm text-muted-foreground">Export from Privyr (or any spreadsheet) as CSV. The first line needs headings such as Name, Email, Phone, Interest.</p>
        <select className={`${sel} w-full`} value={source} onChange={e => setSource(e.target.value)}><option>Privyr</option><option>Facebook</option><option>Website</option><option>Walk-in</option><option>Other</option></select>
        <Input type="file" accept=".csv,text/csv" onChange={async e => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} />
        <Textarea rows={6} value={csv} onChange={e => setCsv(e.target.value)} placeholder={"Name,Email,Phone,Interest\nJane Tan,jane@example.com,91234567,Eyelash extension"} />
        <Button className="rounded-full" onClick={() => void run()}>Import</Button>
      </Box>
      <Box><div className="flex items-center justify-between gap-2"><H>Leads ({data.length})</H><Input className="max-w-xs" placeholder="Search" value={q} onChange={e => setQ(e.target.value)} /></div>
        {shown.length === 0 ? <p className="text-sm text-muted-foreground">No leads yet.</p> :
          <ul className="divide-y divide-border text-sm">{shown.map(d => {
            const ph = (d.phone ?? "").replace(/\D/g, "").replace(/^(?=[89]\d{7}$)/, "65");
            return <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span><b>{d.name}</b> · {d.email ?? "no email"} · {d.phone ?? "no phone"}<span className="block text-xs text-muted-foreground">{d.source}{d.interest ? ` · ${d.interest}` : ""}</span></span>
              <span className="flex items-center gap-2">
                {ph && <a className="text-primary" aria-label="WhatsApp" href={`https://wa.me/${ph}?text=${encodeURIComponent(`Hi ${d.name}, this is SOQ International Academy following up on your enquiry.`)}`} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /></a>}
                <select className="h-8 rounded border border-input bg-background text-xs" value={d.status} onChange={async e => { await supabase.from("leads").update({ status: e.target.value }).eq("id", d.id); void refresh(); }}><option value="new">New</option><option value="contacted">Contacted</option><option value="applied">Applied</option><option value="enrolled">Enrolled</option><option value="lost">Lost</option></select>
                <button aria-label="Delete" onClick={async () => { await supabase.from("leads").delete().eq("id", d.id); void refresh(); }}><Trash2 className="size-4 text-muted-foreground" /></button>
              </span></li>; })}</ul>}
      </Box>
    </div>
  );
}

/* ---------- Government / accounting connections (placeholders) ---------- */
const LINKS = [
  ["WhatsApp Business", "Bring real customer conversations into Staff → Messages and reply from the inbox. The sample conversations are not real messages.", "Connect SOQ's WhatsApp Business account in Lovable, then choose this project under Incoming messages after the receiver has been set up. No messages are sent automatically."],
  ["TPGateway (SSG)", "Send course runs, enrolments, attendance and assessments to SkillsFuture Singapore.", "SOQ's TPGateway API access and digital certificate from SSG."],
  ["Grant checks", "Check a learner's funding eligibility and submit grant claims automatically.", "SSG grant API access (comes with TPGateway)."],
  ["Singpass / Corppass", "Let learners sign in and fill in forms with MyInfo; companies sign in with Corppass.", "A Singpass partner app registration under SOQ's UEN."],
  ["Xero", "Send paid invoices and PayNow receipts to SOQ's accounts.", "Access to SOQ's Xero organisation."],
];
export function IntegrationsStatus() {
  return (
    <div className="grid gap-4 md:grid-cols-2">{LINKS.map(([n, what, need]) => (
      <Box key={n}><div className="flex items-center justify-between"><H>{n}</H><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Not connected</span></div>
        <p className="text-sm">{what}</p><p className="text-sm text-muted-foreground"><b>Needed from SOQ:</b> {need}</p></Box>))}
    </div>
  );
}
