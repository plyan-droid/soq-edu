import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { money } from "@/lib/cart";
import { aiWrite } from "@/lib/ai-writer.functions";
import { CertificateView, downloadCertificatePdf, TEMPLATES, useCertDesign, type CertDesign } from "@/components/certificate";

const title = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const Box = ({ children }: { children: React.ReactNode }) => <div className="space-y-4 rounded-lg border border-border bg-card p-5">{children}</div>;
const H = ({ children }: { children: React.ReactNode }) => <h3 className="font-serif text-2xl text-primary">{children}</h3>;
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
const fmt = (d: string) => new Date(d).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" });

/* ---------- Manual enrol + CSV import ---------- */
export function ManualEnrol() {
  const [email, setEmail] = useState(""); const [slug, setSlug] = useState(courses[0]!.slug);
  const [csv, setCsv] = useState(""); const [log, setLog] = useState<string[]>([]);
  const enrol = async (em: string, sl: string) => {
    const { data: p } = await supabase.from("profiles").select("id").ilike("email", em.trim()).maybeSingle();
    if (!p) return `${em}: no account with this email — ask them to sign up first`;
    if (!courses.some(c => c.slug === sl)) return `${em}: unknown course "${sl}"`;
    const { data: ex } = await supabase.from("enrollments").select("id").eq("student_id", p.id).eq("course_slug", sl).maybeSingle();
    if (ex) return `${em}: already enrolled in ${title(sl)}`;
    const { error } = await supabase.from("enrollments").insert({ student_id: p.id, course_slug: sl, status: "active", start_date: new Date().toISOString().slice(0, 10) });
    return error ? `${em}: ${error.message}` : `${em}: enrolled in ${title(sl)} ✓`;
  };
  const runCsv = async () => {
    const rows = csv.split("\n").map(r => r.split(",").map(x => x.trim())).filter(r => r[0] && r[0].includes("@"));
    const out: string[] = [];
    for (const [em, sl] of rows) out.push(await enrol(em!, sl ?? ""));
    setLog(out);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Box><H>Enrol one student</H>
        <Input placeholder="Student email" value={email} onChange={e => setEmail(e.target.value)} />
        <select className={`${sel} w-full`} value={slug} onChange={e => setSlug(e.target.value)}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
        <Button className="rounded-full" onClick={async () => setLog([await enrol(email, slug)])}>Enrol</Button>
      </Box>
      <Box><H>Import from spreadsheet (CSV)</H>
        <p className="text-sm text-muted-foreground">One student per line: <code>email,course-code</code>. Course codes are the last part of the course page address, e.g. <code>{courses[0]!.slug}</code>.</p>
        <Textarea rows={6} value={csv} onChange={e => setCsv(e.target.value)} placeholder={`jane@example.com,${courses[0]!.slug}`} />
        <div className="flex gap-2"><Input type="file" accept=".csv,text/csv" onChange={async e => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} /><Button className="rounded-full" onClick={() => void runCsv()}>Import</Button></div>
      </Box>
      {log.length > 0 && <ul className="rounded-lg border border-border bg-muted/40 p-4 text-sm lg:col-span-2">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
    </div>
  );
}

/* ---------- PayNow / bank transfer approvals + instalments ---------- */
export function BankPayments() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["bank-payments"], queryFn: async () => (await supabase.from("bank_payments").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: inst = [] } = useQuery({ queryKey: ["instalments"], queryFn: async () => (await supabase.from("instalments").select("*").order("due_date")).data ?? [] });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["bank-payments"] }); void qc.invalidateQueries({ queryKey: ["instalments"] }); };
  const approve = async (id: string) => { const { error } = await supabase.rpc("approve_bank_payment", { _id: id }); if (error) toast.error(error.message); else toast.success("Approved — student enrolled"); refresh(); };
  const reject = async (id: string) => { await supabase.from("bank_payments").update({ status: "rejected" }).eq("id", id); refresh(); };
  const togglePaid = async (id: string, paid: boolean) => { await supabase.from("instalments").update({ paid, paid_at: paid ? new Date().toISOString() : null }).eq("id", id); refresh(); };
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6">
      <Box><H>PayNow & bank transfers</H>
        <p className="text-sm text-muted-foreground">Check the money has arrived in SOQ's bank account, then approve. Approving enrols the student and sets up any instalments.</p>
        {data.length === 0 ? <p className="text-sm text-muted-foreground">No transfers yet.</p> : (
          <ul className="divide-y divide-border">{data.map(p => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div><p className="font-medium">{p.full_name} · {p.email}</p>
                <p className="text-muted-foreground">{(p.items as { title: string }[]).map(i => i.title).join(", ")}</p>
                <p className="text-muted-foreground">{p.method === "paynow" ? "PayNow" : "Bank transfer"} · ref <strong>{p.reference}</strong> · {p.plan === "full" ? "paid in full" : `${p.plan} monthly instalments`} · {fmt(p.created_at)}</p></div>
              <div className="flex items-center gap-2"><span className="font-serif text-xl text-primary">{money(Number(p.total))}</span>
                {p.status === "pending" ? <><Button size="sm" className="rounded-full" onClick={() => void approve(p.id)}>Approve</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => void reject(p.id)}>Reject</Button></> : <span className={`rounded-full px-3 py-1 text-xs ${p.status === "approved" ? "bg-brand-gold-soft text-primary" : "bg-muted"}`}>{p.status}</span>}</div>
            </li>))}</ul>)}
      </Box>
      <Box><H>Instalments</H>
        {inst.length === 0 ? <p className="text-sm text-muted-foreground">No instalment plans yet.</p> : (
          <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>Student</th><th>#</th><th>Due</th><th>Amount</th><th>Paid</th></tr></thead>
            <tbody>{inst.map(i => { const p = data.find(x => x.id === i.payment_id); const late = !i.paid && i.due_date < today; return (
              <tr key={i.id} className="border-t border-border"><td className="py-2">{p?.full_name ?? "—"}</td><td>{i.seq}</td><td className={late ? "font-medium text-destructive" : ""}>{i.due_date}{late && " (overdue)"}</td><td>{money(Number(i.amount))}</td>
                <td><input type="checkbox" checked={i.paid} onChange={e => void togglePaid(i.id, e.target.checked)} /></td></tr>); })}</tbody></table>)}
      </Box>
    </div>
  );
}

/* ---------- Waitlist ---------- */
export function WaitlistAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["waitlist"], queryFn: async () => (await supabase.from("course_waitlist").select("*").order("created_at")).data ?? [] });
  const set = async (id: string, status: string) => { await supabase.from("course_waitlist").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["waitlist"] }); };
  const bySlug = Object.entries(data.reduce<Record<string, typeof data>>((a, w) => { (a[w.course_slug] ??= []).push(w); return a; }, {}));
  return <Box><H>Course waitlists</H>
    {bySlug.length === 0 ? <p className="text-sm text-muted-foreground">Nobody is waiting yet. Visitors join from the "Join the waitlist" link on each course page.</p> :
      bySlug.map(([slug, list]) => <div key={slug}><p className="font-medium text-primary">{title(slug)} <span className="text-muted-foreground">({list.filter(w => w.status === "waiting").length} waiting)</span></p>
        <ol className="mt-2 divide-y divide-border text-sm">{list.map((w, i) => <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{i + 1}. {w.name} · {w.email}{w.phone && ` · ${w.phone}`}</span>
          <select className={sel} value={w.status} onChange={e => void set(w.id, e.target.value)}>{["waiting", "offered", "enrolled", "removed"].map(s => <option key={s}>{s}</option>)}</select></li>)}</ol></div>)}
  </Box>;
}

/* ---------- Noticeboard ---------- */
export function NoticeboardAdmin() {
  const qc = useQueryClient(); const [f, setF] = useState({ title: "", body: "", ends_on: "", pinned: false });
  const { data = [] } = useQuery({ queryKey: ["site-notices"], queryFn: async () => (await supabase.from("site_notices").select("*").order("created_at", { ascending: false })).data ?? [] });
  const r = () => void qc.invalidateQueries({ queryKey: ["site-notices"] });
  const add = async () => { if (!f.title.trim()) return; await supabase.from("site_notices").insert({ title: f.title, body: f.body, pinned: f.pinned, ends_on: f.ends_on || null }); setF({ title: "", body: "", ends_on: "", pinned: false }); r(); };
  return <Box><H>Site noticeboard</H><p className="text-sm text-muted-foreground">Notices show on the Noticeboard page and at the top of every student's portal.</p>
    <Input placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
    <Textarea placeholder="Message" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
    <div className="flex flex-wrap items-center gap-4 text-sm"><label>Show until <Input type="date" className="inline-block w-auto" value={f.ends_on} onChange={e => setF({ ...f, ends_on: e.target.value })} /></label><label className="flex items-center gap-2"><input type="checkbox" checked={f.pinned} onChange={e => setF({ ...f, pinned: e.target.checked })} /> Pin to top</label><Button className="rounded-full" onClick={() => void add()}>Post notice</Button></div>
    <ul className="divide-y divide-border text-sm">{data.map(n => <li key={n.id} className="flex justify-between gap-2 py-2"><span><strong>{n.pinned && "📌 "}{n.title}</strong> — {n.body.slice(0, 80)}{n.ends_on && <em className="text-muted-foreground"> (until {n.ends_on})</em>}</span><button aria-label="Delete" onClick={async () => { await supabase.from("site_notices").delete().eq("id", n.id); r(); }}><Trash2 className="size-4" /></button></li>)}</ul>
  </Box>;
}

/* ---------- Bundles ---------- */
export function BundlesAdmin() {
  const qc = useQueryClient(); const [f, setF] = useState({ name: "", description: "", price: "", slugs: [] as string[] });
  const { data = [] } = useQuery({ queryKey: ["bundles-admin"], queryFn: async () => (await supabase.from("course_bundles").select("*").order("created_at")).data ?? [] });
  const r = () => void qc.invalidateQueries({ queryKey: ["bundles-admin"] });
  const add = async () => { if (!f.name || f.slugs.length < 2 || !f.price) return void toast.error("Give a name, a price and at least 2 courses."); await supabase.from("course_bundles").insert({ name: f.name, description: f.description, price: Number(f.price), slugs: f.slugs }); setF({ name: "", description: "", price: "", slugs: [] }); r(); };
  return <Box><H>Course bundles</H><p className="text-sm text-muted-foreground">Bundles appear on the Course Bundles page and can be added to the cart as one item.</p>
    <div className="grid gap-3 sm:grid-cols-3"><Input placeholder="Bundle name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /><Input placeholder="Bundle price (S$)" type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /><Input placeholder="Short description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
    <div className="grid max-h-56 gap-1 overflow-y-auto rounded-md border border-border p-3 text-sm sm:grid-cols-2">{courses.map(c => <label key={c.slug} className="flex items-center gap-2"><input type="checkbox" checked={f.slugs.includes(c.slug)} onChange={e => setF({ ...f, slugs: e.target.checked ? [...f.slugs, c.slug] : f.slugs.filter(s => s !== c.slug) })} />{c.title}</label>)}</div>
    <Button className="rounded-full" onClick={() => void add()}>Create bundle</Button>
    <ul className="divide-y divide-border text-sm">{data.map(b => <li key={b.id} className="flex items-center justify-between gap-2 py-2"><span><strong>{b.name}</strong> · {money(Number(b.price))} · {b.slugs.map(title).join(", ")}</span>
      <span className="flex items-center gap-3"><label className="flex items-center gap-1"><input type="checkbox" checked={b.active} onChange={async e => { await supabase.from("course_bundles").update({ active: e.target.checked }).eq("id", b.id); r(); }} /> On sale</label><button aria-label="Delete" onClick={async () => { await supabase.from("course_bundles").delete().eq("id", b.id); r(); }}><Trash2 className="size-4" /></button></span></li>)}</ul>
  </Box>;
}

/* ---------- Form builder ---------- */
type Field = { label: string; type: "text" | "email" | "textarea" | "select"; required: boolean; options?: string };
export function FormBuilder() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", slug: "", intro: "" }); const [fields, setFields] = useState<Field[]>([{ label: "Full name", type: "text", required: true }, { label: "Email", type: "email", required: true }]);
  const [view, setView] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["forms-admin"], queryFn: async () => (await supabase.from("custom_forms").select("*").order("created_at")).data ?? [] });
  const { data: resp = [] } = useQuery({ enabled: !!view, queryKey: ["form-resp", view], queryFn: async () => (await supabase.from("form_responses").select("*").eq("form_id", view!).order("created_at", { ascending: false })).data ?? [] });
  const save = async () => {
    const { error } = await supabase.from("custom_forms").insert({ title: f.title, slug: f.slug.toLowerCase(), intro: f.intro, fields });
    if (error) return void toast.error(error.message.includes("slug") ? "Page address must be 2–60 lowercase letters, numbers or dashes, and unused." : error.message);
    setF({ title: "", slug: "", intro: "" }); void qc.invalidateQueries({ queryKey: ["forms-admin"] }); toast.success("Form published");
  };
  const upd = (i: number, p: Partial<Field>) => setFields(fields.map((x, j) => j === i ? { ...x, ...p } : x));
  return <div className="space-y-6"><Box><H>Build a form</H>
    <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Form title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /><Input placeholder="Page address, e.g. open-house-rsvp" value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} /></div>
    <Textarea placeholder="Intro text" value={f.intro} onChange={e => setF({ ...f, intro: e.target.value })} />
    {fields.map((x, i) => <div key={i} className="flex flex-wrap items-center gap-2"><Input className="w-48" value={x.label} onChange={e => upd(i, { label: e.target.value })} />
      <select className={sel} value={x.type} onChange={e => upd(i, { type: e.target.value as Field["type"] })}><option value="text">Short answer</option><option value="email">Email</option><option value="textarea">Long answer</option><option value="select">Drop-down</option></select>
      {x.type === "select" && <Input className="w-56" placeholder="Choices, separated by commas" value={x.options ?? ""} onChange={e => upd(i, { options: e.target.value })} />}
      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={x.required} onChange={e => upd(i, { required: e.target.checked })} /> Required</label>
      <button aria-label="Remove field" onClick={() => setFields(fields.filter((_, j) => j !== i))}><Trash2 className="size-4" /></button></div>)}
    <div className="flex gap-2"><Button variant="outline" className="rounded-full" onClick={() => setFields([...fields, { label: "New question", type: "text", required: false }])}>+ Add question</Button><Button className="rounded-full" onClick={() => void save()}>Publish form</Button></div>
  </Box>
    <Box><H>Your forms</H><ul className="divide-y divide-border text-sm">{data.map(x => <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span><strong>{x.title}</strong> · <a className="underline" href={`/f/${x.slug}`} target="_blank" rel="noreferrer">/f/{x.slug}</a></span>
      <span className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setView(view === x.id ? null : x.id)}>Responses</Button><button aria-label="Delete" onClick={async () => { await supabase.from("custom_forms").delete().eq("id", x.id); void qc.invalidateQueries({ queryKey: ["forms-admin"] }); }}><Trash2 className="size-4" /></button></span></li>)}</ul>
      {view && (resp.length === 0 ? <p className="text-sm text-muted-foreground">No responses yet.</p> : <ul className="space-y-2 text-sm">{resp.map(r => <li key={r.id} className="rounded-md bg-muted/40 p-3"><p className="text-xs text-muted-foreground">{fmt(r.created_at)}</p>{Object.entries(r.data as Record<string, string>).map(([k, v]) => <p key={k}><strong>{k}:</strong> {v}</p>)}</li>)}</ul>)}
    </Box></div>;
}

type D = CertDesign;
/* ---------- Certificate designer ---------- */
export function CertificateDesigner() {
  const qc = useQueryClient();
  const { data } = useCertDesign();
  const [f, setF] = useState<D | null>(null);
  const d = f ?? data ?? null;
  if (!d) return null;
  const set = (k: keyof D, v: string) => setF({ ...d, [k]: v });
  const sample = { name: "Jane Tan", course: courses[0]!.title, code: "SOQ-SAMPLE", date: new Date().toISOString() };
  const save = async () => { await supabase.from("certificate_design").update({ heading: d.heading, subtitle: d.subtitle, body: d.body, signatory: d.signatory, signatory_title: d.signatory_title, accent: d.accent, template: d.template, updated_at: new Date().toISOString() }).eq("id", 1); void qc.invalidateQueries({ queryKey: ["cert-design"] }); toast.success("Certificate design saved"); };
  return <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]"><Box><H>Certificate designer</H>
    <div><p className="mb-2 text-sm font-medium">Template</p><div className="flex gap-2">{TEMPLATES.map(([k, l]) => <button key={k} onClick={() => set("template", k)} className={`rounded-full border px-4 py-1.5 text-sm ${d.template === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{l}</button>)}</div></div>
    <label className="block text-sm">Heading<Input value={d.heading} onChange={e => set("heading", e.target.value)} /></label>
    <label className="block text-sm">Line under the academy name<Input value={d.subtitle} onChange={e => set("subtitle", e.target.value)} /></label>
    <label className="block text-sm">Wording<Textarea value={d.body} onChange={e => set("body", e.target.value)} /></label><p className="text-xs text-muted-foreground">Use {"{name}"} and {"{course}"} — they're filled in for each student.</p>
    <Input value={d.signatory} onChange={e => set("signatory", e.target.value)} placeholder="Signed by" /><Input value={d.signatory_title} onChange={e => set("signatory_title", e.target.value)} placeholder="Their title" />
    <label className="flex items-center gap-2 text-sm">Accent colour <input type="color" value={d.accent} onChange={e => set("accent", e.target.value)} /></label>
    <div className="flex flex-wrap gap-2"><Button className="rounded-full" onClick={() => void save()}>Save design</Button><Button variant="outline" className="rounded-full" onClick={() => void downloadCertificatePdf(d, sample)}>Download sample PDF</Button></div></Box>
    <CertificateView design={d} {...sample} /></div>;
}

/* ---------- Login history ---------- */
export function LoginHistory() {
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({ queryKey: ["login-events"], queryFn: async () => (await supabase.from("login_events").select("*").order("created_at", { ascending: false }).limit(300)).data ?? [] });
  const device = (ua: string | null) => !ua ? "—" : /iPhone|Android/i.test(ua) ? "Phone" : /iPad/i.test(ua) ? "Tablet" : "Computer";
  const rows = data.filter(r => (r.email ?? "").toLowerCase().includes(q.toLowerCase()));
  return <Box><H>Login history</H><Input placeholder="Search by email" value={q} onChange={e => setQ(e.target.value)} />
    <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>When</th><th>Email</th><th>Device</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.id} className="border-t border-border"><td className="py-2">{fmt(r.created_at)}</td><td>{r.email}</td><td title={r.user_agent ?? ""}>{device(r.user_agent)}</td></tr>)}</tbody></table>
    {rows.length === 0 && <p className="text-sm text-muted-foreground">No logins recorded yet. Logins are recorded from now on.</p>}</Box>;
}

/* ---------- AI writer ---------- */
export function AIWriter() {
  const write = useServerFn(aiWrite);
  const [kind, setKind] = useState("course description"); const [brief, setBrief] = useState(""); const [out, setOut] = useState(""); const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { setOut((await write({ data: { kind, brief } })).text); } catch (e) { toast.error((e as Error).message); } setBusy(false); };
  return <Box><H>AI writer</H><p className="text-sm text-muted-foreground">Describe what you need and get a first draft in SOQ's voice. Always check facts, fees and dates before using it.</p>
    <select className={sel} value={kind} onChange={e => setKind(e.target.value)}>{["course description", "noticeboard post", "email to students", "WhatsApp message", "social media post", "FAQ answer"].map(k => <option key={k}>{k}</option>)}</select>
    <Textarea rows={4} value={brief} onChange={e => setBrief(e.target.value)} placeholder="e.g. Announce the new lash lifting intake in March, weekend classes, SkillsFuture eligible" />
    <Button disabled={busy || brief.trim().length < 5} className="rounded-full" onClick={() => void go()}>{busy ? "Writing…" : "Write draft"}</Button>
    {out && <><Textarea rows={10} value={out} onChange={e => setOut(e.target.value)} /><Button variant="outline" className="rounded-full" onClick={() => { void navigator.clipboard.writeText(out); toast.success("Copied"); }}>Copy</Button></>}</Box>;
}

/* ---------- Referrals ---------- */
export function ReferralsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["referrals"], queryFn: async () => (await supabase.from("referrals").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: codes = [] } = useQuery({ queryKey: ["ref-codes"], queryFn: async () => (await supabase.from("referral_codes").select("user_id,code")).data ?? [] });
  const { data: profs = [] } = useQuery({ queryKey: ["ref-profs"], queryFn: async () => (await supabase.from("profiles").select("id,email")).data ?? [] });
  const em = (id: string) => profs.find(p => p.id === id)?.email ?? id.slice(0, 8);
  return <Box><H>Referrals</H><p className="text-sm text-muted-foreground">Students share their link from the Refer a Friend page. When a referred friend's payment is approved the status becomes "enrolled". Mark "rewarded" once you've given the reward.</p>
    <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>Referred by</th><th>Code</th><th>New student</th><th>Date</th><th>Status</th></tr></thead>
      <tbody>{data.map(r => <tr key={r.id} className="border-t border-border"><td className="py-2">{em(r.referrer_id)}</td><td>{codes.find(c => c.user_id === r.referrer_id)?.code}</td><td>{r.referred_email}</td><td>{new Date(r.created_at).toLocaleDateString("en-SG")}</td>
        <td><select className={sel} value={r.status} onChange={async e => { await supabase.from("referrals").update({ status: e.target.value }).eq("id", r.id); void qc.invalidateQueries({ queryKey: ["referrals"] }); }}>{["signed_up", "enrolled", "rewarded"].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>
    {data.length === 0 && <p className="text-sm text-muted-foreground">No referrals yet.</p>}</Box>;
}
