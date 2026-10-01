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
import { addApplicant, type ApplicantInput } from "@/lib/applicants.functions";
import { useAllCourses } from "@/lib/course-overrides";
import { bannerSrc, fileToBanner, BANNER_W, BANNER_H } from "@/lib/form-banner";

const title = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const Box = ({ children }: { children: React.ReactNode }) => <div className="space-y-4 rounded-lg border border-border bg-card p-5">{children}</div>;
const H = ({ children }: { children: React.ReactNode }) => <h3 className="font-serif text-2xl text-primary">{children}</h3>;
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
const fmt = (d: string) => new Date(d).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" });

/* ---------- Spreadsheet import (CSV file → preview → import all) ---------- */
const COLS = ["full_name", "email", "phone", "course", "nationality", "citizenship", "id_type", "id_number", "date_of_birth", "address", "qualification", "sales_manager"] as const;
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell.trim()); cell = ""; if (row.some(Boolean)) rows.push(row); row = []; }
    else cell += ch;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}
type Parsed = { line: number; name: string; email: string; courseTitle: string; data?: ApplicantInput | undefined; problems: string[]; result?: string | undefined };

export function ManualEnrol() {
  const add = useServerFn(addApplicant);
  const all = useAllCourses(true);
  const [file, setFile] = useState(""); const [rows, setRows] = useState<Parsed[]>([]);
  const [enrolNow, setEnrolNow] = useState(true); const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const template = () => {
    const csv = `${COLS.join(",")}\nJane Tan,jane@example.com,+65 91234567,${all[0]?.slug ?? "course-code"},SINGAPORE CITIZEN,SC,NRIC,S1234567A,15-04-1990,"123 Orchard Road, #04-01",Diploma,Jeff Lim\n`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "soq-applicants-template.csv"; a.click();
  };

  const load = async (f: File) => {
    setFile(f.name);
    const grid = parseCsv(await f.text());
    if (grid.length < 2) { setRows([]); toast.error("The file has no student rows"); return; }
    const head = grid[0]!.map(h => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
    const idx = (k: string) => head.indexOf(k);
    setRows(grid.slice(1).map((r, i) => {
      const g = (k: string) => (idx(k) >= 0 ? r[idx(k)] ?? "" : "");
      const p: string[] = [];
      const cRaw = g("course") || g("course_slug");
      const course = all.find(c => c.slug === cRaw.toLowerCase() || c.title.toLowerCase() === cRaw.toLowerCase());
      if (!course) p.push(cRaw ? `unknown course "${cRaw}"` : "course missing");
      const email = g("email").toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) p.push("email invalid");
      const name = g("full_name") || g("name");
      if (name.length < 2) p.push("name missing");
      if (g("phone").replace(/\D/g, "").length < 6) p.push("phone missing");
      const cz = g("citizenship").toUpperCase();
      const citizenship = cz === "SC" || cz.includes("CITIZEN") ? "singapore_citizen" : cz === "PR" || cz.includes("PERMANENT") ? "permanent_resident" : cz ? "foreigner" : null;
      if (!citizenship) p.push("citizenship missing");
      const idt = g("id_type").toUpperCase();
      if (!["NRIC", "FIN", "PASSPORT"].includes(idt)) p.push("ID type must be NRIC, FIN or PASSPORT");
      if (g("id_number").length < 3) p.push("ID number missing");
      const d = g("date_of_birth") || g("dob");
      const m1 = d.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/); const m2 = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const dob = m2 ? d : m1 ? `${m1[3]}-${m1[2]!.padStart(2, "0")}-${m1[1]!.padStart(2, "0")}` : "";
      if (!dob) p.push("date of birth must be dd-mm-yyyy");
      if (!g("nationality")) p.push("nationality missing");
      if (g("address").length < 3) p.push("address missing");
      if (!g("qualification")) p.push("qualification missing");
      return {
        line: i + 2, name, email, courseTitle: course?.title ?? cRaw, problems: p,
        data: p.length ? undefined : {
          course_slug: course!.slug, full_name: name, phone: g("phone"), nationality: g("nationality").toUpperCase(),
          citizenship: citizenship!, id_type: idt as "NRIC", id_number: g("id_number").toUpperCase(), date_of_birth: dob,
          email, address: g("address"), qualification: g("qualification"), sales_manager: g("sales_manager"),
          newsletter: false, enrol_now: true, notes: "Imported from spreadsheet",
        },
      };
    }));
  };

  const ready = rows.filter(r => r.data && !r.result);
  const importAll = async () => {
    setBusy(true);
    const next = [...rows];
    for (const r of next) {
      if (!r.data || r.result) continue;
      try { const res = await add({ data: { ...r.data, enrol_now: enrolNow } }); r.result = `Saved${res.created ? " · new account" : ""}${res.enrolled ? " · enrolled" : ""}`; }
      catch (e) { r.result = `Failed: ${e instanceof Error ? e.message : "error"}`; }
      setRows([...next]);
    }
    setBusy(false);
    toast.success("Import finished");
    void qc.invalidateQueries({ queryKey: ["admin-applications"] }); void qc.invalidateQueries({ queryKey: ["admin-app-accounts"] }); void qc.invalidateQueries({ queryKey: ["admin-students"] });
  };

  return (
    <Box>
      <H>Import from spreadsheet</H>
      <p className="text-sm text-muted-foreground">Choose a CSV file saved from Excel or Google Sheets. Each row becomes an applicant, with an account created for new emails. Not sure of the columns? Download the template first.</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Choose file from computer
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
        </label>
        <Button variant="outline" className="rounded-full" onClick={template}>Download template</Button>
        {file && <span className="text-sm text-muted-foreground">{file}</span>}
      </div>
      {rows.length > 0 && (
        <>
          <p className="text-sm"><b>{rows.filter(r => r.data).length}</b> ready · <b>{rows.filter(r => !r.data).length}</b> need fixing in the file</p>
          <div className="max-h-80 overflow-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-muted"><tr>{["Row", "Name", "Email", "Course", "Status"].map(h => <th key={h} className="p-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>{rows.map(r => (
                <tr key={r.line} className="border-t border-border align-top">
                  <td className="p-2">{r.line}</td><td className="p-2">{r.name || "—"}</td><td className="p-2">{r.email || "—"}</td><td className="p-2">{r.courseTitle || "—"}</td>
                  <td className={`p-2 text-xs ${r.problems.length || r.result?.startsWith("Failed") ? "text-destructive" : "text-muted-foreground"}`}>{r.result ?? (r.problems.length ? r.problems.join("; ") : "Ready")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enrolNow} onChange={e => setEnrolNow(e.target.checked)} /> Enrol straight away</label>
            <Button disabled={busy || ready.length === 0} className="rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85" onClick={() => void importAll()}>{busy ? "Importing…" : `Import ${ready.length} applicant${ready.length === 1 ? "" : "s"}`}</Button>
          </div>
        </>
      )}
    </Box>
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
  const [f, setF] = useState({ title: "", slug: "", intro: "", banner: "" }); const [fields, setFields] = useState<Field[]>([{ label: "Full name", type: "text", required: true }, { label: "Email", type: "email", required: true }]);
  const [view, setView] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["forms-admin"], queryFn: async () => (await supabase.from("custom_forms").select("*").order("created_at")).data ?? [] });
  const { data: resp = [] } = useQuery({ enabled: !!view, queryKey: ["form-resp", view], queryFn: async () => (await supabase.from("form_responses").select("*").eq("form_id", view!).order("created_at", { ascending: false })).data ?? [] });
  const save = async () => {
    const { error } = await supabase.from("custom_forms").insert({ title: f.title, slug: f.slug.toLowerCase(), intro: f.intro, fields, banner: f.banner || null });
    if (error) return void toast.error(error.message.includes("slug") ? "Page address must be 2–60 lowercase letters, numbers or dashes, and unused." : error.message);
    setF({ title: "", slug: "", intro: "", banner: "" }); void qc.invalidateQueries({ queryKey: ["forms-admin"] }); toast.success("Form published");
  };
  const upd = (i: number, p: Partial<Field>) => setFields(fields.map((x, j) => j === i ? { ...x, ...p } : x));
  const preview = bannerSrc(f.banner);
  return <div className="space-y-6"><Box><H>Build a form</H>
    <div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Form title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /><Input placeholder="Page address, e.g. open-house-rsvp" value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} /></div>
    <Textarea placeholder="Intro text" value={f.intro} onChange={e => setF({ ...f, intro: e.target.value })} />
    <div className="space-y-2">
      <p className="text-sm font-medium">Banner picture <span className="font-normal text-muted-foreground">(optional)</span></p>
      {preview && <div className="relative"><img src={preview} alt="Banner preview" className="aspect-[3/1] w-full rounded-md object-cover" /><Button size="sm" variant="secondary" className="absolute right-2 top-2" onClick={() => setF({ ...f, banner: "" })}>Remove</Button></div>}
      <label className="inline-flex h-10 cursor-pointer items-center rounded-full border border-input px-5 text-sm hover:bg-muted">
        {preview ? "Change picture" : "Upload picture"}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; if (file.size > 10 * 1024 * 1024) return void toast.error("Picture must be under 10 MB"); try { setF({ ...f, banner: await fileToBanner(file) }); } catch { toast.error("Couldn't read that picture"); } }} />
      </label>
      <p className="text-xs text-muted-foreground">Best size: {BANNER_W} × {BANNER_H} px (wide, 3:1). JPG, PNG or WebP. Larger pictures are cropped to fit automatically.</p>
    </div>
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
  const [selected, setSelected] = useState("");
  const [issued, setIssued] = useState<{ name: string; course: string; code: string; date: string } | null>(null);
  const [issuing, setIssuing] = useState(false);
  const { data: eligible = [] } = useQuery({ queryKey: ["certificate-eligible"], queryFn: async () => {
    const [enrolments, existing, profiles] = await Promise.all([
      supabase.from("enrollments").select("student_id,course_slug,progress,status"),
      supabase.from("certificates").select("student_id,course_slug,status"),
      supabase.from("profiles").select("id,full_name,email"),
    ]);
    const error = enrolments.error ?? existing.error ?? profiles.error;
    if (error) throw error;
    const people = new Map((profiles.data ?? []).map(p => [p.id, p]));
    const completed = (enrolments.data ?? []).filter(e => e.progress >= 100 || e.status === "completed").map(e => ({ student_id: e.student_id, course_slug: e.course_slug }));
    return [...new Map(completed.map(row => [`${row.student_id}:${row.course_slug}`, row])).values()]
      .filter(row => !(existing.data ?? []).some(c => c.student_id === row.student_id && c.course_slug === row.course_slug))
      .map(row => ({ ...row, name: people.get(row.student_id)?.full_name || people.get(row.student_id)?.email || "", email: people.get(row.student_id)?.email || "" }))
      .filter(row => row.name);
  } });
  const d = f ?? data ?? null;
  if (!d) return null;
  const set = (k: keyof D, v: string) => setF({ ...d, [k]: v });
  const sample = { name: "Jane Tan", course: courses[0]!.title, code: "SOQ-SAMPLE", date: new Date().toISOString() };
  const save = async () => {
    const { error } = await supabase.from("certificate_design").update({ heading: d.heading, subtitle: d.subtitle, body: d.body, signatory: d.signatory, signatory_title: d.signatory_title, accent: d.accent, template: d.template, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    setF(null);
    void qc.invalidateQueries({ queryKey: ["cert-design"] });
    toast.success("Certificate design saved");
  };
  const issue = async () => {
    const target = eligible.find(row => `${row.student_id}:${row.course_slug}` === selected);
    if (!target) return;
    setIssuing(true);
    if (f) {
      const { error } = await supabase.from("certificate_design").update({ heading: d.heading, subtitle: d.subtitle, body: d.body, signatory: d.signatory, signatory_title: d.signatory_title, accent: d.accent, template: d.template, updated_at: new Date().toISOString() }).eq("id", 1);
      if (error) { setIssuing(false); return void toast.error(error.message); }
      setF(null); void qc.invalidateQueries({ queryKey: ["cert-design"] });
    }
    const { data: cert, error } = await supabase.rpc("issue_completed_certificate", { _student_id: target.student_id, _course_slug: target.course_slug });
    setIssuing(false);
    if (error || !cert || typeof cert !== "object" || Array.isArray(cert)) return void toast.error(error?.message ?? "Couldn't issue certificate");
    const result = cert as { name: string; course_slug: string; code: string; date: string };
    setIssued({ name: result.name, course: title(result.course_slug), code: result.code, date: result.date });
    setSelected("");
    void qc.invalidateQueries({ queryKey: ["certificate-eligible"] });
    void qc.invalidateQueries({ queryKey: ["admin-certs"] });
    toast.success(`Certificate ${result.code} issued`);
  };
  return <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]"><Box><H>Certificate designer</H>
    <div><p className="mb-2 text-sm font-medium">Template</p><div className="flex flex-wrap gap-2">{TEMPLATES.map(([k, l]) => <Button key={k} size="sm" variant={d.template === k ? "default" : "outline"} onClick={() => set("template", k)}>{l}</Button>)}</div></div>
    <label className="block text-sm">Heading<Input value={d.heading} onChange={e => set("heading", e.target.value)} /></label>
    <label className="block text-sm">Line under the academy name<Input value={d.subtitle} onChange={e => set("subtitle", e.target.value)} /></label>
    <label className="block text-sm">Wording<Textarea value={d.body} onChange={e => set("body", e.target.value)} /></label><p className="text-xs text-muted-foreground">Use {"{name}"} and {"{course}"} — they're filled in for each student.</p>
    <label className="block text-sm">Signatory name<Input value={d.signatory} onChange={e => set("signatory", e.target.value)} placeholder="Signed by" /></label><label className="block text-sm">Signatory title<Input value={d.signatory_title} onChange={e => set("signatory_title", e.target.value)} placeholder="Their title" /></label>
    <p className="text-xs text-muted-foreground">The SOQ logo appears on every template. Confirm the authorised signatory before issuing certificates. Sample PDFs are marked as samples.</p>
    <label className="flex items-center gap-2 text-sm">Accent colour <input type="color" value={d.accent} onChange={e => set("accent", e.target.value)} /></label>
    <div className="flex flex-wrap gap-2"><Button className="rounded-full" onClick={() => void save()}>Save design</Button><Button variant="outline" className="rounded-full" onClick={() => void downloadCertificatePdf(d, sample).catch(() => toast.error("Couldn't create the sample PDF"))}>Download sample PDF</Button></div>
    <div className="border-t border-border pt-5"><H>Issue a certificate</H><p className="mt-2 text-sm text-muted-foreground">Select a learner with recorded course completion. Certificate quiz passes issue codes automatically. Existing certificates, including revoked ones, cannot be duplicated here.</p>
      <select aria-label="Eligible learner and course" className={`${sel} mt-3 w-full`} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Select learner and course…</option>{eligible.map(row => <option key={`${row.student_id}:${row.course_slug}`} value={`${row.student_id}:${row.course_slug}`}>{row.name} ({row.email}) · {title(row.course_slug)}</option>)}</select>
      <Button className="mt-3" disabled={!selected || issuing} onClick={() => void issue()}>{issuing ? "Issuing…" : "Issue certificate"}</Button>
      {eligible.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No eligible completions awaiting a certificate.</p>}
      {issued && <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm"><p>Issued: <strong>{issued.code}</strong> · {issued.name}</p><Button variant="outline" onClick={() => void downloadCertificatePdf(d, issued).catch(() => toast.error("Couldn't create the PDF"))}>Download issued PDF</Button></div>}
    </div></Box>
    <CertificateView design={d} {...(issued ?? sample)} /></div>;
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
