import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { courseTitle } from "@/components/student-dashboard";

const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
const date = (d: string) => new Date(d).toLocaleDateString("en-SG");

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{head.map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{children}</tbody></table>
    </div>
  );
}
const td = "p-3 align-top";

/* ---------- Reports ---------- */
export function Reports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const count = async (t: "course_applications" | "enrollments" | "course_reviews" | "support_tickets" | "trainer_applications" | "newsletter_subscribers" | "certificates" | "profiles" | "posts") => (await supabase.from(t).select("*", { count: "exact", head: true })).count ?? 0;
      const [apps, enr, rev, tix, tr, subs, certs, users, posts] = await Promise.all(["course_applications", "enrollments", "course_reviews", "support_tickets", "trainer_applications", "newsletter_subscribers", "certificates", "profiles", "posts"].map(t => count(t as never)));
      const { data: byCourse } = await supabase.from("course_applications").select("course_slug,status");
      return { apps, enr, rev, tix, tr, subs, certs, users, posts, byCourse: byCourse ?? [] };
    },
  });
  if (!data) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  const tally = new Map<string, number>();
  data.byCourse.forEach(r => tally.set(r.course_slug, (tally.get(r.course_slug) ?? 0) + 1));
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const enrolled = data.byCourse.filter(r => r.status === "enrolled").length;
  const stats = [["Accounts", data.users], ["Course applications", data.apps], ["Applied → enrolled", data.apps ? `${Math.round((enrolled / data.apps) * 100)}%` : "–"], ["Active enrolments", data.enr], ["Certificates issued", data.certs], ["Course reviews", data.rev], ["Support messages", data.tix], ["Trainer applications", data.tr], ["Newsletter subscribers", data.subs], ["Community posts", data.posts]];
  return (
    <div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{stats.map(([l, v]) => <div key={l} className="rounded-lg border border-border bg-card p-5"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-serif text-3xl text-primary">{v}</p></div>)}</div>
      <h3 className="mt-10 font-serif text-2xl text-primary">Most-applied courses</h3>
      {top.length === 0 ? <p className="mt-2 text-muted-foreground">No applications yet.</p> : <div className="mt-4 grid gap-2">{top.map(([slug, n]) => <div key={slug} className="flex items-center gap-3 text-sm"><span className="w-72 truncate">{courseTitle(slug)}</span><span className="h-3 rounded-full bg-brand-gold" style={{ width: `${(n / (top[0]?.[1] ?? 1)) * 50}%` }} /><span>{n}</span></div>)}</div>}
    </div>
  );
}

/* ---------- Trainer applications ---------- */
type TrainerApp = { id: string; full_name: string; email: string; phone: string | null; expertise: string; experience: string; portfolio_url: string | null; status: string; created_at: string };
export function TrainerApplications() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["admin-trainers"], queryFn: async () => ((await supabase.from("trainer_applications").select("*").order("created_at", { ascending: false })).data ?? []) as (TrainerApp & { user_id: string | null })[] });
  const setStatus = async (a: TrainerApp & { user_id: string | null }, status: string) => {
    const { error } = await supabase.from("trainer_applications").update({ status }).eq("id", a.id);
    if (error) { setMsg(`Couldn't update: ${error.message}`); return; }
    if (status === "approved" && a.user_id) {
      const r = await supabase.from("user_roles").insert({ user_id: a.user_id, role: "trainer" as never });
      setMsg(r.error && !r.error.message.includes("duplicate") ? `Approved, but couldn't open the Trainer Dashboard for them: ${r.error.message}` : `${a.full_name} is approved and can now open the Trainer Dashboard.`);
    } else if (status === "approved") setMsg(`${a.full_name} is approved. They applied without an account, so ask them to sign up, then use "Make trainer" under Users & roles.`);
    else setMsg(null);
    void qc.invalidateQueries({ queryKey: ["admin-trainers"] });
  };
  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "").trim();
    const { error } = await supabase.from("trainer_applications").insert({ full_name: g("full_name"), email: g("email"), phone: g("phone") || null, expertise: g("expertise"), experience: g("experience"), portfolio_url: g("portfolio_url") || null, status: g("status") || "pending" });
    setBusy(false);
    if (error) { setMsg(`Couldn't save: ${error.message}`); return; }
    setMsg(`Application for ${g("full_name")} added.`); setAdding(false); void qc.invalidateQueries({ queryKey: ["admin-trainers"] });
  };
  const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button size="sm" className="rounded-full" onClick={() => setAdding(v => !v)}>{adding ? "Cancel" : "+ Add trainer application"}</Button>
        <span className="text-sm text-muted-foreground">{data.filter(a => a.status === "pending").length} waiting for review · Public form at /teach</span>
      </div>
      {msg && <p className="mt-3 rounded-md bg-secondary p-3 text-sm">{msg}</p>}
      {adding && (
        <form onSubmit={add} className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
          <input name="full_name" required minLength={2} placeholder="Full name" className={inp} />
          <input name="email" type="email" required placeholder="Email" className={inp} />
          <input name="phone" placeholder="Mobile (optional)" className={inp} />
          <input name="expertise" required minLength={2} placeholder="Expertise, e.g. Lash extension, AI marketing" className={inp} />
          <textarea name="experience" required minLength={20} rows={3} placeholder="Teaching / industry experience and qualifications" className={`${inp} sm:col-span-2`} />
          <input name="portfolio_url" placeholder="Portfolio or LinkedIn link (optional)" className={inp} />
          <select name="status" className={inp} defaultValue="pending"><option value="pending">Pending review</option><option value="approved">Approved</option></select>
          <Button type="submit" disabled={busy} className="rounded-full sm:col-span-2">{busy ? "Saving..." : "Save application"}</Button>
        </form>
      )}
      {!data.length ? <p className="mt-6 text-muted-foreground">No trainer applications yet.</p> :
      <Table head={["Date", "Applicant", "Expertise", "Experience", "Decision"]}>{data.map(a => (
        <tr key={a.id} className="border-t border-border">
          <td className={td}>{date(a.created_at)}</td>
          <td className={td}>{a.full_name}<div><a className="underline" href={`mailto:${a.email}`}>{a.email}</a></div><div>{a.phone}</div>{a.portfolio_url && <a className="text-xs underline" href={a.portfolio_url.startsWith("http") ? a.portfolio_url : `https://${a.portfolio_url}`} target="_blank" rel="noreferrer">Portfolio</a>}</td>
          <td className={td}>{a.expertise}</td>
          <td className={`${td} max-w-sm whitespace-pre-line text-xs`}>{a.experience}</td>
          <td className={td}>
            {a.status === "pending" ? <div className="flex gap-2"><Button size="sm" className="rounded-full" onClick={() => void setStatus(a, "approved")}>Approve</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => void setStatus(a, "rejected")}>Reject</Button></div>
              : <div><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "approved" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{a.status}</span><button className="ml-2 text-xs underline" onClick={() => void setStatus(a, "pending")}>Undo</button></div>}
          </td>
        </tr>))}</Table>}
    </div>
  );
}

/* ---------- Support inbox ---------- */
type Ticket = { id: string; full_name: string; email: string; phone: string | null; topic: string; message: string; status: string; created_at: string };
export function SupportInbox() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("open");
  const { data = [] } = useQuery({ queryKey: ["admin-tickets"], queryFn: async () => ((await supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(300)).data ?? []) as Ticket[] });
  const setStatus = async (id: string, status: string) => { await supabase.from("support_tickets").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-tickets"] }); };
  const shown = filter === "all" ? data : data.filter(t => t.status === filter);
  return (
    <div>
      <div className="mt-5 flex gap-2">{["open", "in_progress", "resolved", "all"].map(f => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(f)}>{f.replace("_", " ")} ({f === "all" ? data.length : data.filter(t => t.status === f).length})</Button>)}</div>
      {shown.length === 0 ? <p className="mt-6 text-muted-foreground">Nothing here. Messages from the Contact page appear in this inbox.</p> :
        <Table head={["Date", "From", "Topic", "Message", "Status"]}>{shown.map(t => (
          <tr key={t.id} className="border-t border-border">
            <td className={td}>{date(t.created_at)}</td>
            <td className={td}>{t.full_name}<div><a className="underline" href={`mailto:${t.email}?subject=${encodeURIComponent("Re: your SOQ enquiry")}`}>{t.email}</a></div><div>{t.phone}</div></td>
            <td className={td}>{t.topic}</td>
            <td className={`${td} max-w-md whitespace-pre-line`}>{t.message}</td>
            <td className={td}><select className={sel} value={t.status} onChange={e => void setStatus(t.id, e.target.value)}>{["open", "in_progress", "resolved"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></td>
          </tr>))}</Table>}
    </div>
  );
}

/* ---------- Review moderation ---------- */
type Review = { id: string; course_slug: string; reviewer_name: string; rating: number; body: string; hidden: boolean; created_at: string };
export function ReviewModeration() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-reviews"], queryFn: async () => ((await supabase.from("course_reviews").select("*").order("created_at", { ascending: false })).data ?? []) as Review[] });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-reviews"] }); };
  const toggle = async (r: Review) => { await supabase.from("course_reviews").update({ hidden: !r.hidden }).eq("id", r.id); refresh(); };
  const del = async (id: string) => { if (!confirm("Delete this review?")) return; await supabase.from("course_reviews").delete().eq("id", id); refresh(); };
  if (!data.length) return <p className="mt-6 text-muted-foreground">No reviews yet. Signed-in learners can review from each course page.</p>;
  return <Table head={["Date", "Course", "Reviewer", "Rating", "Review", ""]}>{data.map(r => (
    <tr key={r.id} className={`border-t border-border ${r.hidden ? "opacity-50" : ""}`}>
      <td className={td}>{date(r.created_at)}</td><td className={td}>{courseTitle(r.course_slug)}</td><td className={td}>{r.reviewer_name}</td><td className={td}>{"★".repeat(r.rating)}</td>
      <td className={`${td} max-w-md`}>{r.body}</td>
      <td className={`${td} whitespace-nowrap`}><Button size="sm" variant="outline" onClick={() => void toggle(r)}>{r.hidden ? "Show" : "Hide"}</Button> <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => void del(r.id)}><Trash2 className="size-4" /></Button></td>
    </tr>))}</Table>;
}

/* ---------- Certificates ---------- */
type Cert = { id: string; code: string; student_name: string; course_slug: string; issued_on: string; status: string; student_id: string | null };
export function CertificatesAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-certs"], queryFn: async () => ((await supabase.from("certificates").select("*").order("created_at", { ascending: false })).data ?? []) as Cert[] });
  const { data: students = [] } = useQuery({ queryKey: ["admin-students"], queryFn: async () => ((await supabase.from("profiles").select("id,email,full_name").order("email")).data ?? []) as { id: string; email: string; full_name: string | null }[] });
  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [studentId, setStudentId] = useState(""); const [issued, setIssued] = useState(new Date().toISOString().slice(0, 10));
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-certs"] }); };
  const issue = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim() || !slug) return;
    await supabase.from("certificates").insert({ student_name: name.trim().slice(0, 120), course_slug: slug, issued_on: issued, student_id: studentId || null });
    setName(""); setSlug(""); setStudentId(""); refresh();
  };
  const toggle = async (c: Cert) => { await supabase.from("certificates").update({ status: c.status === "valid" ? "revoked" : "valid" }).eq("id", c.id); refresh(); };
  return (
    <div>
      <form onSubmit={issue} className="mt-5 grid gap-3 rounded-lg bg-brand-cream p-5 md:grid-cols-5">
        <select className={sel} value={studentId} onChange={e => { setStudentId(e.target.value); const s = students.find(x => x.id === e.target.value); if (s) setName(s.full_name ?? ""); }}><option value="">Link to account (optional)</option>{students.map(s => <option key={s.id} value={s.id}>{s.email}</option>)}</select>
        <Input placeholder="Name on certificate" value={name} onChange={e => setName(e.target.value)} required maxLength={120} />
        <select className={sel} value={slug} onChange={e => setSlug(e.target.value)} required><option value="">Course…</option>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
        <Input type="date" value={issued} onChange={e => setIssued(e.target.value)} />
        <Button className="rounded-full">Issue certificate</Button>
      </form>
      {data.length === 0 ? <p className="mt-6 text-muted-foreground">No certificates issued yet. Each one gets a code that anyone can check on the Verify certificate page.</p> :
        <Table head={["Code", "Name", "Course", "Issued", "Status", ""]}>{data.map(c => (
          <tr key={c.id} className="border-t border-border"><td className={`${td} font-mono`}>{c.code}</td><td className={td}>{c.student_name}</td><td className={td}>{courseTitle(c.course_slug)}</td><td className={td}>{date(c.issued_on)}</td><td className={td}>{c.status}</td><td className={td}><Button size="sm" variant="outline" onClick={() => void toggle(c)}>{c.status === "valid" ? "Revoke" : "Restore"}</Button></td></tr>
        ))}</Table>}
    </div>
  );
}

/* ---------- Newsletter ---------- */
type Sub = { id: string; email: string; source: string | null; created_at: string };
export function Subscribers() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-subs"], queryFn: async () => ((await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false })).data ?? []) as Sub[] });
  const del = async (id: string) => { await supabase.from("newsletter_subscribers").delete().eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-subs"] }); };
  const csv = () => {
    const blob = new Blob(["email,source,joined\n" + data.map(s => `${s.email},${s.source ?? ""},${s.created_at.slice(0, 10)}`).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "soq-subscribers.csv"; a.click();
  };
  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><p className="text-sm text-muted-foreground">{data.length} subscribers from the footer sign-up.</p>{data.length > 0 && <><Button size="sm" variant="outline" className="rounded-full" onClick={csv}><Download className="size-4" /> Download list</Button><Button size="sm" variant="outline" className="rounded-full" asChild><a href={`mailto:?bcc=${data.map(s => s.email).join(",")}&subject=${encodeURIComponent("SOQ course news")}`}>Email everyone</a></Button></>}</div>
      {data.length > 0 && <Table head={["Email", "Source", "Joined", ""]}>{data.map(s => <tr key={s.id} className="border-t border-border"><td className={td}>{s.email}</td><td className={td}>{s.source}</td><td className={td}>{date(s.created_at)}</td><td className={td}><Button size="sm" variant="ghost" aria-label="Remove" onClick={() => void del(s.id)}><Trash2 className="size-4" /></Button></td></tr>)}</Table>}
    </div>
  );
}

/* ---------- Users & roles ---------- */
type UserRow = { id: string; email: string; full_name: string | null; created_at: string };
export function UsersAdmin({ selfId }: { selfId?: string | undefined }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "staff" | "trainer" | "student">("all");
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: users }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const r = roles ?? [];
      return { users: (users ?? []) as UserRow[], admins: new Set(r.filter(x => x.role === "admin" || (x.role as string) === "staff").map(x => x.user_id)), tops: new Set(r.filter(x => x.role === "admin").map(x => x.user_id)), orgs: new Set(r.filter(x => (x.role as string) === "organization").map(x => x.user_id)), trainers: new Set(r.filter(x => x.role === "trainer").map(x => x.user_id)) };
    },
  });
  const toggle = async (u: UserRow, role: "admin" | "trainer" | "staff" | "organization", has: boolean) => {
    const label = role === "admin" ? "Admin (full)" : role;
    if (has) { if (!confirm(`Remove ${label} access from ${u.email}?`)) return; const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role as never); if (error) alert(error.message); }
    else { if (!confirm(`Give ${u.email} ${label} access?`)) return; const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: role as never }); if (error) alert(error.message.includes("security") ? "Only Admin can change roles." : error.message); }
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  const reset = async (u: UserRow) => {
    if (!confirm(`Send a password reset email to ${u.email}?`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(u.email, { redirectTo: `${window.location.origin}/reset-password` });
    alert(error ? error.message : `Reset link sent to ${u.email}.`);
  };
  if (!data) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  const roleOf = (id: string) => data.admins.has(id) ? "staff" : data.trainers.has(id) ? "trainer" : "student";
  const counts = { all: data.users.length, staff: data.users.filter(u => roleOf(u.id) === "staff").length, trainer: data.users.filter(u => roleOf(u.id) === "trainer").length, student: data.users.filter(u => roleOf(u.id) === "student").length };
  const shown = data.users.filter(u => (filter === "all" || (filter === "staff" ? data.admins.has(u.id) : filter === "trainer" ? data.trainers.has(u.id) : roleOf(u.id) === "student")) && `${u.email} ${u.full_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {([["all", "Everyone"], ["staff", "Staff"], ["trainer", "Trainers"], ["student", "Students"]] as const).map(([k, l]) => <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(k)}>{l} ({counts[k]})</Button>)}
        <Input className="ml-auto max-w-sm" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <Table head={["Name", "Email", "Joined", "Role", ""]}>{shown.map(u => { const admin = data.admins.has(u.id); const top = data.tops.has(u.id); const trainer = data.trainers.has(u.id); const org = data.orgs.has(u.id); return (
        <tr key={u.id} className="border-t border-border"><td className={td}>{u.full_name ?? "—"}</td><td className={td}>{u.email}</td><td className={td}>{date(u.created_at)}</td><td className={td}>{[top ? "Admin" : admin && "Staff", trainer && "Trainer", org && "Organization"].filter(Boolean).join(", ") || "Student"}</td>
          <td className={`${td} flex flex-wrap gap-2`}>
            <Button size="sm" variant="outline" onClick={() => void toggle(u, "trainer", trainer)}>{trainer ? "Remove trainer" : "Make trainer"}</Button>
            {u.id !== selfId && !top && <Button size="sm" variant="outline" onClick={() => void toggle(u, "staff", admin)}>{admin ? "Remove staff" : "Make staff"}</Button>}
            {u.id !== selfId && <Button size="sm" variant="outline" onClick={() => void toggle(u, "admin", top)}>{top ? "Remove Admin" : "Make Admin"}</Button>}
            <Button size="sm" variant="outline" onClick={() => void toggle(u, "organization", org)}>{org ? "Remove organization" : "Make organization"}</Button>
            <Button size="sm" variant="ghost" onClick={() => void reset(u)}>Send password reset</Button>
          </td></tr>); })}</Table>
    </div>
  );
}

/* ---------- Trainer course drafts ---------- */
type Draft = { id: string; trainer_id: string; title: string; category: string; summary: string; duration: string | null; mode: string | null; price: string | null; outcomes: string[]; status: string; staff_note: string | null; created_at: string };
export function CourseDraftsReview() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-drafts"], queryFn: async () => ((await supabase.from("course_drafts").select("*").neq("status", "draft").order("created_at", { ascending: false })).data ?? []) as Draft[] });
  const decide = async (d: Draft, status: string) => {
    const note = status === "rejected" ? prompt("Note for the trainer (what to change)?") ?? "" : null;
    await supabase.from("course_drafts").update({ status, staff_note: note }).eq("id", d.id);
    void qc.invalidateQueries({ queryKey: ["admin-drafts"] });
  };
  if (!data.length) return <p className="mt-6 text-muted-foreground">No courses submitted by trainers yet.</p>;
  return <Table head={["Submitted", "Course", "Details", "Status"]}>{data.map(d => (
    <tr key={d.id} className="border-t border-border">
      <td className={td}>{date(d.created_at)}</td>
      <td className={td}><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.category}</p></td>
      <td className={`${td} max-w-md text-xs`}><p className="whitespace-pre-line">{d.summary}</p><p className="mt-2">{[d.duration, d.mode, d.price].filter(Boolean).join(" · ")}</p>{d.outcomes.length > 0 && <ul className="mt-2 list-disc pl-4">{d.outcomes.map(o => <li key={o}>{o}</li>)}</ul>}</td>
      <td className={td}><p className="capitalize">{d.status}</p>{d.staff_note && <p className="text-xs text-muted-foreground">{d.staff_note}</p>}
        {d.status === "submitted" && <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => void decide(d, "approved")}>Approve</Button><Button size="sm" variant="outline" onClick={() => void decide(d, "rejected")}>Send back</Button></div>}</td>
    </tr>))}</Table>;
}

/* ---------- Sales (mock payments) ---------- */
type OrderRow = { id: string; full_name: string; email: string; items: { title: string; price: number }[]; subtotal: number; discount_code: string | null; discount_amount: number; total: number; status: string; payment_ref: string; created_at: string };
export function Sales() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: async () => ((await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500)).data ?? []) as unknown as OrderRow[] });
  const paid = data.filter(o => o.status === "paid");
  const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
  const setStatus = async (id: string, status: string) => { await supabase.from("orders").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-orders"] }); };
  return (
    <div>
      <p className="mt-4 rounded-md bg-brand-gold-soft px-4 py-2 text-sm">Test mode — these are pretend payments, no money is taken.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{[["Paid orders", String(paid.length)], ["Revenue (test)", `$${revenue.toFixed(2)}`], ["Refunded", String(data.filter(o => o.status === "refunded").length)]].map(([l, v]) => <div key={l} className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="font-serif text-3xl text-primary">{v}</p></div>)}</div>
      {data.length === 0 ? <p className="mt-6 text-muted-foreground">No orders yet.</p> : <Table head={["Date", "Buyer", "Courses", "Total", "Status"]}>{data.map(o => (
        <tr key={o.id} className="border-t border-border"><td className={td}>{date(o.created_at)}<div className="text-xs text-muted-foreground">{o.payment_ref}</div></td><td className={td}>{o.full_name}<div className="text-xs">{o.email}</div></td>
          <td className={`${td} text-xs`}>{o.items.map(i => i.title).join(", ")}</td>
          <td className={td}>${Number(o.total).toFixed(2)}{o.discount_code && <div className="text-xs text-muted-foreground">{o.discount_code} −${Number(o.discount_amount).toFixed(2)}</div>}</td>
          <td className={td}><select className={sel} value={o.status} onChange={e => void setStatus(o.id, e.target.value)}>{["paid", "refunded", "cancelled"].map(s => <option key={s}>{s}</option>)}</select></td></tr>))}</Table>}
    </div>
  );
}

/* ---------- Discount codes ---------- */
type Code = { code: string; percent_off: number; active: boolean; expires_on: string | null; max_uses: number | null; used_count: number };
export function DiscountCodes() {
  const qc = useQueryClient();
  const [f, setF] = useState({ code: "", pct: "10", exp: "", max: "" });
  const { data = [] } = useQuery({ queryKey: ["admin-codes"], queryFn: async () => ((await supabase.from("discount_codes").select("*").order("created_at", { ascending: false })).data ?? []) as Code[] });
  const inv = () => void qc.invalidateQueries({ queryKey: ["admin-codes"] });
  const add = async () => {
    const code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,30}$/.test(code)) return void alert("Use 3–30 letters, numbers or dashes.");
    const { error } = await supabase.from("discount_codes").insert({ code, percent_off: Math.min(100, Math.max(1, Number(f.pct) || 10)), expires_on: f.exp || null, max_uses: f.max ? Number(f.max) : null });
    if (error) return void alert(error.message);
    setF({ code: "", pct: "10", exp: "", max: "" }); inv();
  };
  return (
    <div>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <Input className="w-40" placeholder="CODE" value={f.code} onChange={e => setF({ ...f, code: e.target.value })} />
        <label className="text-xs">% off<Input className="w-24" type="number" value={f.pct} onChange={e => setF({ ...f, pct: e.target.value })} /></label>
        <label className="text-xs">Expires<Input className="w-40" type="date" value={f.exp} onChange={e => setF({ ...f, exp: e.target.value })} /></label>
        <label className="text-xs">Max uses<Input className="w-28" type="number" value={f.max} onChange={e => setF({ ...f, max: e.target.value })} /></label>
        <Button onClick={() => void add()}>Create code</Button>
      </div>
      {data.length > 0 && <Table head={["Code", "% off", "Expires", "Used", "Status", ""]}>{data.map(c => (
        <tr key={c.code} className="border-t border-border"><td className={`${td} font-mono`}>{c.code}</td><td className={td}>{c.percent_off}%</td><td className={td}>{c.expires_on ?? "Never"}</td><td className={td}>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
          <td className={td}><Button size="sm" variant="outline" onClick={async () => { await supabase.from("discount_codes").update({ active: !c.active }).eq("code", c.code); inv(); }}>{c.active ? "Active — turn off" : "Off — turn on"}</Button></td>
          <td className={td}><button aria-label="Delete" onClick={async () => { if (confirm(`Delete ${c.code}?`)) { await supabase.from("discount_codes").delete().eq("code", c.code); inv(); } }}><Trash2 className="size-4 text-muted-foreground" /></button></td></tr>))}</Table>}
    </div>
  );
}

/* ---------- Page editor ---------- */
type PageRow = { slug: string; title: string; body: string; published: boolean };
export function PagesEditor() {
  const qc = useQueryClient();
  const blank: PageRow = { slug: "", title: "", body: "", published: false };
  const [f, setF] = useState<PageRow>(blank);
  const [editing, setEditing] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["admin-pages"], queryFn: async () => ((await supabase.from("site_pages").select("slug,title,body,published").order("slug")).data ?? []) as PageRow[] });
  const save = async () => {
    const slug = f.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,60}$/.test(slug) || !f.title.trim()) return void alert("Add a title and a web address using lowercase letters, numbers and dashes.");
    const { error } = await supabase.from("site_pages").upsert({ ...f, slug, updated_at: new Date().toISOString() });
    if (error) return void alert(error.message);
    setF(blank); setEditing(false); void qc.invalidateQueries({ queryKey: ["admin-pages"] });
  };
  return (
    <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Address: /p/</span><Input disabled={editing} placeholder="open-day" value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} /></div>
        <Input placeholder="Page title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <textarea className="min-h-72 w-full rounded-md border border-input bg-background p-3 font-mono text-sm" placeholder={"Write the page. Use ## for headings, - for bullet points, > for quotes. A YouTube link on its own line plays a video."} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.published} onChange={e => setF({ ...f, published: e.target.checked })} /> Published (visible to everyone)</label>
        <div className="flex gap-2"><Button onClick={() => void save()}>Save page</Button>{editing && <Button variant="ghost" onClick={() => { setF(blank); setEditing(false); }}>New page</Button>}</div>
      </div>
      <ul className="space-y-2">{data.length === 0 ? <p className="text-sm text-muted-foreground">No pages yet.</p> : data.map(p => (
        <li key={p.slug} className="rounded-md border border-border p-3 text-sm"><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">/p/{p.slug} · {p.published ? "Published" : "Draft"}</p>
          <div className="mt-1 flex gap-3 text-xs"><button className="underline" onClick={() => { setF(p); setEditing(true); }}>Edit</button><a className="underline" href={`/p/${p.slug}`} target="_blank" rel="noreferrer">View</a>
            <button className="underline" onClick={async () => { if (confirm("Delete this page?")) { await supabase.from("site_pages").delete().eq("slug", p.slug); void qc.invalidateQueries({ queryKey: ["admin-pages"] }); } }}>Delete</button></div></li>))}</ul>
    </div>
  );
}

/* ---------- Notification templates ---------- */
type Tpl = { key: string; label: string; subject: string; body: string };
export function TemplatesEditor() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-templates"], queryFn: async () => ((await supabase.from("notification_templates").select("key,label,subject,body").order("label")).data ?? []) as Tpl[] });
  const [edits, setEdits] = useState<Record<string, Tpl>>({});
  const save = async (t: Tpl) => { await supabase.from("notification_templates").update({ subject: t.subject, body: t.body, updated_at: new Date().toISOString() }).eq("key", t.key); void qc.invalidateQueries({ queryKey: ["admin-templates"] }); alert("Saved"); };
  return (
    <div className="mt-5 space-y-5">
      <p className="text-sm text-muted-foreground">Wording for messages SOQ sends. Words in {"{{double braces}}"} are filled in automatically, e.g. {"{{name}}"}, {"{{course}}"}. Emails aren't sent automatically yet — these are ready for when email sending is switched on.</p>
      {data.map(t0 => { const t = edits[t0.key] ?? t0; return (
        <div key={t.key} className="space-y-2 rounded-lg border border-border bg-card p-5">
          <p className="font-medium">{t.label}</p>
          <Input value={t.subject} onChange={e => setEdits({ ...edits, [t.key]: { ...t, subject: e.target.value } })} />
          <textarea className="min-h-32 w-full rounded-md border border-input bg-background p-3 text-sm" value={t.body} onChange={e => setEdits({ ...edits, [t.key]: { ...t, body: e.target.value } })} />
          <Button size="sm" onClick={() => void save(t)}>Save</Button>
        </div>); })}
    </div>
  );
}

/* ---------- Settings hub ---------- */
export function SettingsHub() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: async () => Object.fromEntries(((await supabase.from("site_settings").select("key,value")).data ?? []).map(r => [r.key, r.value])) as Record<string, any> });
  const [a, setA] = useState<{ text: string; link: string; on: boolean } | null>(null);
  const [c, setC] = useState<{ navy: string; gold: string } | null>(null);
  const [tz, setTz] = useState<string | null>(null);
  if (!data) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  const ann = a ?? { text: "", link: "", on: false, ...(data['announcement'] ?? {}) };
  const col = c ?? { navy: "#1b2a4a", gold: "#d4a94a", ...(data['appearance'] ?? {}) };
  const zone = tz ?? data['general']?.timezone ?? "Asia/Singapore";
  const put = async (key: string, value: unknown) => { const { error } = await supabase.from("site_settings").upsert({ key, value: value as never, updated_at: new Date().toISOString() }); if (error) return void alert(error.message); void qc.invalidateQueries({ queryKey: ["site-settings"] }); alert("Saved"); };
  const box = "space-y-3 rounded-lg border border-border bg-card p-5";
  return (
    <div className="mt-5 grid gap-6 lg:grid-cols-2">
      <div className={box}><p className="font-serif text-2xl text-primary">Announcement bar</p><p className="text-sm text-muted-foreground">A strip across the top of every page, e.g. "New intake opens 1 March".</p>
        <Input placeholder="Message" value={ann.text} onChange={e => setA({ ...ann, text: e.target.value })} />
        <Input placeholder="Link (optional), e.g. /calendar" value={ann.link} onChange={e => setA({ ...ann, link: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ann.on} onChange={e => setA({ ...ann, on: e.target.checked })} /> Show on site</label>
        <Button onClick={() => void put("announcement", ann)}>Save</Button></div>
      <div className={box}><p className="font-serif text-2xl text-primary">Brand colours</p><p className="text-sm text-muted-foreground">Changes the navy and gold used across the site.</p>
        <label className="flex items-center gap-3 text-sm"><input type="color" value={col.navy} onChange={e => setC({ ...col, navy: e.target.value })} /> Navy</label>
        <label className="flex items-center gap-3 text-sm"><input type="color" value={col.gold} onChange={e => setC({ ...col, gold: e.target.value })} /> Gold</label>
        <div className="flex gap-2"><Button onClick={() => void put("appearance", col)}>Save colours</Button><Button variant="ghost" onClick={() => { setC(null); void put("appearance", {}); }}>Restore original</Button></div></div>
      <div className={box}><p className="font-serif text-2xl text-primary">General</p>
        <label className="text-sm">Timezone<select className={`${sel} mt-1 w-full`} value={zone} onChange={e => setTz(e.target.value)}>{["Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Jakarta", "Asia/Hong_Kong", "UTC"].map(z => <option key={z}>{z}</option>)}</select></label>
        <Button onClick={() => void put("general", { timezone: zone })}>Save</Button></div>
      <div className={box}><p className="font-serif text-2xl text-primary">Payments</p><p className="text-sm text-muted-foreground">Checkout is in test mode — no money is taken. Real card payments can be switched on later.</p></div>
      <SecuritySettings data={data} put={put} box={box} />
    </div>
  );
}

function SecuritySettings({ data, put, box }: { data: Record<string, any>; put: (k: string, v: unknown) => Promise<void>; box: string }) {
  const [path, setPath] = useState<string>(data["admin_path"] ?? "admin");
  const [m, setM] = useState<{ enabled: boolean; title: string; message: string; ends_on: string }>({ enabled: false, title: "", message: "", ends_on: "", ...(data["maintenance"] ?? {}) });
  const [key, setKey] = useState<string>(typeof data["maintenance_key"] === "string" ? data["maintenance_key"] : "");
  const demo = data["demo_login"] === true;
  return (<>
    <div className={box}><p className="font-serif text-2xl text-primary">Demo login</p>
      <p className="text-sm text-muted-foreground">Shows "Demo login (1 click)" buttons on the Log in page. <b>Switch off before the site goes live</b> — otherwise anyone can sign in as staff.</p>
      <p className="text-sm">Status: <b>{demo ? "On" : "Off"}</b></p>
      <Button variant={demo ? "destructive" : "default"} onClick={() => void put("demo_login", !demo)}>{demo ? "Switch off" : "Switch on"}</Button></div>
    <div className={box}><p className="font-serif text-2xl text-primary">Admin path</p>
      <p className="text-sm text-muted-foreground">Staff can also reach the admin sign-in at soq.edu.sg/<b>{path || "…"}</b>. Lowercase letters and numbers only. /admin always works too.</p>
      <Input value={path} onChange={e => setPath(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))} />
      <Button disabled={path.length < 3} onClick={() => void put("admin_path", path)}>Save path</Button></div>
    <div className={`${box} lg:col-span-2`}><p className="font-serif text-2xl text-primary">Maintenance mode</p>
      <p className="text-sm text-muted-foreground">Visitors see a "back soon" page. Signed-in staff still see the site. Others can get in with <code>?key=YOURKEY</code> on any link. Set the key <b>before</b> switching on.</p>
      <Input placeholder="Title" value={m.title} onChange={e => setM({ ...m, title: e.target.value })} />
      <Input placeholder="Message" value={m.message} onChange={e => setM({ ...m, message: e.target.value })} />
      <label className="text-sm">Expected back by (optional)<Input type="datetime-local" value={m.ends_on} onChange={e => setM({ ...m, ends_on: e.target.value })} /></label>
      <div className="flex gap-2"><Input placeholder="Access key (8+ characters)" value={key} onChange={e => setKey(e.target.value)} /><Button variant="outline" disabled={key.length < 8} onClick={() => void put("maintenance_key", key)}>Save key</Button></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={m.enabled} onChange={e => setM({ ...m, enabled: e.target.checked })} /> Maintenance mode on</label>
      <Button onClick={() => void put("maintenance", m)}>Save maintenance settings</Button></div>
  </>);
}
