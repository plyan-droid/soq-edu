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
  const { data = [] } = useQuery({ queryKey: ["admin-trainers"], queryFn: async () => ((await supabase.from("trainer_applications").select("*").order("created_at", { ascending: false })).data ?? []) as TrainerApp[] });
  const setStatus = async (id: string, status: string) => { await supabase.from("trainer_applications").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-trainers"] }); };
  if (!data.length) return <p className="mt-6 text-muted-foreground">No trainer applications yet. The form is at /teach.</p>;
  return <Table head={["Date", "Applicant", "Expertise", "Experience", "Status"]}>{data.map(a => (
    <tr key={a.id} className="border-t border-border">
      <td className={td}>{date(a.created_at)}</td>
      <td className={td}>{a.full_name}<div><a className="underline" href={`mailto:${a.email}`}>{a.email}</a></div><div>{a.phone}</div>{a.portfolio_url && <a className="text-xs underline" href={a.portfolio_url.startsWith("http") ? a.portfolio_url : `https://${a.portfolio_url}`} target="_blank" rel="noreferrer">Portfolio</a>}</td>
      <td className={td}>{a.expertise}</td>
      <td className={`${td} max-w-sm whitespace-pre-line text-xs`}>{a.experience}</td>
      <td className={td}><select className={sel} value={a.status} onChange={e => void setStatus(a.id, e.target.value)}>{["pending", "approved", "rejected"].map(s => <option key={s}>{s}</option>)}</select>{a.status === "approved" && <p className="mt-1 text-xs text-muted-foreground">Give them the Verified tick under Community members.</p>}</td>
    </tr>))}</Table>;
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
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: users }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      return { users: (users ?? []) as UserRow[], admins: new Set((roles ?? []).filter(r => r.role === "admin").map(r => r.user_id)) };
    },
  });
  const toggle = async (u: UserRow, isAdmin: boolean) => {
    if (isAdmin) { if (!confirm(`Remove staff access from ${u.email}?`)) return; await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin"); }
    else { if (!confirm(`Give ${u.email} full staff access?`)) return; await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" }); }
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
  };
  if (!data) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  const shown = data.users.filter(u => `${u.email} ${u.full_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <Input className="mt-5 max-w-sm" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} />
      <Table head={["Name", "Email", "Joined", "Role", ""]}>{shown.map(u => { const admin = data.admins.has(u.id); return (
        <tr key={u.id} className="border-t border-border"><td className={td}>{u.full_name ?? "—"}</td><td className={td}>{u.email}</td><td className={td}>{date(u.created_at)}</td><td className={td}>{admin ? "Staff" : "Student"}</td>
          <td className={td}>{u.id !== selfId && <Button size="sm" variant="outline" onClick={() => void toggle(u, admin)}>{admin ? "Remove staff" : "Make staff"}</Button>}</td></tr>); })}</Table>
    </div>
  );
}
