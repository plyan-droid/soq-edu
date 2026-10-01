import { ListSkeleton } from "@/components/start-here";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrainerApplyForm } from "@/components/trainer-apply-form";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { approveTrainer } from "@/lib/trainer-approval.functions";
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
  if (!data) return <ListSkeleton />;
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
type TrainerApp = { id: string; full_name: string; email: string; phone: string | null; expertise: string; experience: string; portfolio_url: string | null; status: string; created_at: string; user_id: string | null;
  cv_path: string | null; certs_path: string | null; years_experience: number | null; qualifications: string | null; teaching_mode: string | null; availability: string | null; languages: string | null; courses_interest: string | null; staff_note: string | null };
export function TrainerApplications() {
  const qc = useQueryClient();
  const approveTrainerFn = useServerFn(approveTrainer);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");
  const [msg, setMsg] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["admin-trainers"], queryFn: async () => ((await supabase.from("trainer_applications").select("*").order("created_at", { ascending: false })).data ?? []) as TrainerApp[] });
  const setStatus = async (a: TrainerApp, status: string) => {
    if (status === "approved") {
      try {
        const r = await approveTrainerFn({ data: { id: a.id } });
        setMsg(r.created ? `${a.full_name} is approved. An account was created for ${a.email} with Trainer Dashboard access — they can set a password with "Forgot password" on the login page.` : `${a.full_name} is approved and can now open the Trainer Dashboard.`);
      } catch (e) { setMsg(`Couldn't approve: ${(e as Error).message}`); return; }
    } else {
      const { error } = await supabase.from("trainer_applications").update({ status }).eq("id", a.id);
      if (error) { setMsg(`Couldn't update: ${error.message}`); return; }
      setMsg(null);
    }
    void qc.invalidateQueries({ queryKey: ["admin-trainers"] }); void qc.invalidateQueries({ queryKey: ["admin-trainers-waiting"] });
  };
  const saveNote = async (id: string, staff_note: string) => { await supabase.from("trainer_applications").update({ staff_note }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-trainers"] }); setMsg("Note saved."); };
  const openFile = async (path: string) => {
    const { data: s, error } = await supabase.storage.from("trainer-cvs").createSignedUrl(path, 120);
    if (error || !s) { setMsg("Couldn't open the file."); return; }
    window.open(s.signedUrl, "_blank", "noopener");
  };
  const shown = filter === "all" ? data : data.filter(a => a.status === filter);
  const row = (k: string, v: React.ReactNode) => v ? <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className="whitespace-pre-line text-sm">{v}</dd></div> : null;
  return (
    <div>
      <p className="mt-4 text-sm text-muted-foreground">People who want to teach at SOQ apply on the website's <a href="/teach" target="_blank" rel="noreferrer" className="underline">Teach at SOQ</a> page (linked from the homepage and footer). Their applications land here. Click a name to see the full details, CV and certificates.</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {["pending", "approved", "rejected", "all"].map(f => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="rounded-full capitalize" onClick={() => setFilter(f)}>{f === "pending" ? "Waiting" : f} ({f === "all" ? data.length : data.filter(a => a.status === f).length})</Button>)}
        <Button size="sm" className="ml-auto rounded-full" onClick={() => setAdding(v => !v)}>{adding ? "Cancel" : "+ Add trainer application"}</Button>
      </div>
      {msg && <p className="mt-3 rounded-md bg-secondary p-3 text-sm">{msg}</p>}
      {adding && <div className="mt-4 rounded-lg border border-border bg-card p-5"><TrainerApplyForm staff onDone={n => { setMsg(`Application for ${n} added.`); setAdding(false); void qc.invalidateQueries({ queryKey: ["admin-trainers"] }); }} /></div>}
      {!shown.length ? <p className="mt-6 text-muted-foreground">No applications here.</p> :
      <div className="mt-5 grid gap-3">{shown.map(a => (
        <div key={a.id} className="rounded-lg border border-border bg-card">
          <button onClick={() => setOpen(open === a.id ? null : a.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left">
            <div className="min-w-48 flex-1"><p className="font-medium text-primary underline-offset-2 hover:underline">{a.full_name}</p><p className="text-xs text-muted-foreground">{a.expertise}{a.years_experience != null ? ` · ${a.years_experience} yrs` : ""} · applied {date(a.created_at)}</p></div>
            {a.cv_path && <span className="rounded bg-muted px-2 py-0.5 text-xs">CV attached</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${a.status === "approved" ? "bg-primary text-primary-foreground" : a.status === "pending" ? "bg-brand-gold-soft text-primary" : "bg-muted text-muted-foreground"}`}>{a.status === "pending" ? "Waiting" : a.status}</span>
          </button>
          {open === a.id && <div className="grid gap-5 border-t border-border p-4 md:grid-cols-[1fr_260px]">
            <dl className="grid gap-3 sm:grid-cols-2">
              {row("Email", <a className="underline" href={`mailto:${a.email}`}>{a.email}</a>)}
              {row("Mobile", a.phone)}
              {row("Languages", a.languages)}
              {row("Teaching mode", a.teaching_mode)}
              {row("Availability", a.availability)}
              {row("Courses of interest", a.courses_interest)}
              <div className="sm:col-span-2">{row("Qualifications", a.qualifications)}</div>
              <div className="sm:col-span-2">{row("Experience", a.experience)}</div>
              {row("Portfolio", a.portfolio_url && <a className="underline" href={a.portfolio_url.startsWith("http") ? a.portfolio_url : `https://${a.portfolio_url}`} target="_blank" rel="noreferrer">Open link</a>)}
              {row("Account", a.user_id ? "Has an SOQ account" : "No account yet")}
            </dl>
            <div className="grid content-start gap-3">
              <div className="flex flex-wrap gap-2">
                {a.cv_path ? <Button size="sm" variant="outline" onClick={() => void openFile(a.cv_path!)}>Open CV</Button> : <span className="text-xs text-muted-foreground">No CV attached</span>}
                {a.certs_path && <Button size="sm" variant="outline" onClick={() => void openFile(a.certs_path!)}>Open certificates</Button>}
              </div>
              <textarea defaultValue={a.staff_note ?? ""} onBlur={e => { if (e.target.value !== (a.staff_note ?? "")) void saveNote(a.id, e.target.value); }} rows={3} placeholder="Staff notes (saved when you click away)" className="rounded-md border border-input bg-background p-2 text-sm" />
              {a.status === "pending" ? <div className="flex gap-2"><Button size="sm" className="rounded-full" onClick={() => void setStatus(a, "approved")}>Approve</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => void setStatus(a, "rejected")}>Reject</Button></div>
                : <button className="text-left text-xs underline" onClick={() => void setStatus(a, "pending")}>Move back to Waiting</button>}
            </div>
          </div>}
        </div>))}</div>}
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
  if (!data) return <ListSkeleton />;
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
        <tr key={u.id} className="border-t border-border"><td className={td}>{u.full_name ?? "—"}</td><td className={td}>{u.email}</td><td className={td}>{date(u.created_at)}</td><td className={td}>{[top ? "Admin" : admin && "Staff", trainer && "Trainer", org && "Organisation"].filter(Boolean).join(", ") || "Student"}</td>
          <td className={`${td} flex flex-wrap gap-2`}>
            <Button size="sm" variant="outline" onClick={() => void toggle(u, "trainer", trainer)}>{trainer ? "Remove trainer" : "Make trainer"}</Button>
            {u.id !== selfId && !top && <Button size="sm" variant="outline" onClick={() => void toggle(u, "staff", admin)}>{admin ? "Remove staff" : "Make staff"}</Button>}
            {u.id !== selfId && <Button size="sm" variant="outline" onClick={() => void toggle(u, "admin", top)}>{top ? "Remove Admin" : "Make Admin"}</Button>}
            <Button size="sm" variant="outline" onClick={() => void toggle(u, "organization", org)}>{org ? "Remove organisation" : "Make organisation"}</Button>
            <Button size="sm" variant="ghost" onClick={() => void reset(u)}>Send password reset</Button>
          </td></tr>); })}</Table>
    </div>
  );
}

/* ---------- Trainer course drafts ---------- */
type Draft = { id: string; trainer_id: string; title: string; category: string; summary: string; duration: string | null; mode: string | null; price: string | null; outcomes: string[]; status: string; staff_note: string | null; created_at: string;
  badge: string | null; level: string | null; requirements: string | null; sections: { title: string; items: string[] }[] | null; faqs: { q: string; a: string }[] | null; image_key: string | null; intake_start: string | null; intake_apply_by: string | null; intake_time: string | null; published_slug: string | null };
export function CourseDraftsReview() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-drafts"], queryFn: async () => ((await supabase.from("course_drafts").select("*").neq("status", "draft").order("created_at", { ascending: false })).data ?? []) as unknown as Draft[] });
  const [open, setOpen] = useState<string | null>(null);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-drafts"] }); void qc.invalidateQueries({ queryKey: ["course-overrides"] }); };
  const sendBack = async (d: Draft) => {
    const note = prompt("Note for the trainer (what to change)?") ?? "";
    await supabase.from("course_drafts").update({ status: "rejected", staff_note: note }).eq("id", d.id); refresh();
  };
  const publish = async (d: Draft) => {
    const { createLiveCourse } = await import("@/lib/course-publish");
    const { emptyCourse } = await import("@/components/course-form");
    const r = await createLiveCourse({ ...emptyCourse(), title: d.title, category: d.category, summary: d.summary, price: d.price ?? "", duration: d.duration ?? "", mode: d.mode ?? "", badge: d.badge ?? "",
      level: d.level ?? "", requirements: d.requirements ?? "", outcomes: d.outcomes.join("\n"), sections: d.sections ?? [], faqs: d.faqs ?? [], image_key: d.image_key ?? "",
      intake_start: d.intake_start ?? "", intake_apply_by: d.intake_apply_by ?? "", intake_time: d.intake_time ?? "" });
    if (r.error || !r.slug) { alert(r.error ?? "Could not publish"); return; }
    await supabase.from("course_drafts").update({ status: "approved", staff_note: null, published_slug: r.slug }).eq("id", d.id);
    await supabase.from("trainer_courses").insert({ trainer_id: d.trainer_id, course_slug: r.slug });
    refresh();
  };
  if (!data.length) return <p className="mt-6 text-muted-foreground">No courses submitted by trainers yet.</p>;
  return <Table head={["Submitted", "Course", "Details", "Status"]}>{data.map(d => (
    <tr key={d.id} className="border-t border-border align-top">
      <td className={td}>{date(d.created_at)}</td>
      <td className={td}><p className="font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.category}</p></td>
      <td className={`${td} max-w-md text-xs`}><p className="whitespace-pre-line">{d.summary}</p><p className="mt-2">{[d.price, d.duration, d.mode, d.badge, d.level].filter(Boolean).join(" · ")}</p>
        {d.intake_start && <p className="mt-1">First intake {date(d.intake_start)}{d.intake_time ? ` · ${d.intake_time}` : ""}</p>}
        <button className="mt-2 underline" onClick={() => setOpen(open === d.id ? null : d.id)}>{open === d.id ? "Hide full course" : "Show full course"}</button>
        {open === d.id && <div className="mt-2 space-y-2">
          {d.requirements && <p><b>Entry requirements:</b> {d.requirements}</p>}
          {d.outcomes.length > 0 && <div><b>Outcomes</b><ul className="list-disc pl-4">{d.outcomes.map(o => <li key={o}>{o}</li>)}</ul></div>}
          {(d.sections ?? []).map(s => <div key={s.title}><b>{s.title}</b><ul className="list-disc pl-4">{s.items.map(i => <li key={i}>{i}</li>)}</ul></div>)}
          {(d.faqs ?? []).map(x => <p key={x.q}><b>{x.q}</b> {x.a}</p>)}
        </div>}</td>
      <td className={td}><p className="capitalize">{d.status === "approved" ? "Published" : d.status}</p>{d.staff_note && <p className="text-xs text-muted-foreground">{d.staff_note}</p>}
        {d.published_slug && <a href={`/courses/${d.published_slug}`} target="_blank" rel="noreferrer" className="text-xs underline">View course page</a>}
        {d.status === "submitted" && <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" onClick={() => void publish(d)}>Approve & publish</Button><Button size="sm" variant="outline" onClick={() => void sendBack(d)}>Send back</Button></div>}</td>
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
      <div className="mt-4 grid gap-4 sm:grid-cols-3">{[["Paid orders", String(paid.length)], ["Revenue", `$${revenue.toFixed(2)}`], ["Refunded", String(data.filter(o => o.status === "refunded").length)]].map(([l, v]) => <div key={l} className="rounded-lg border border-border bg-card p-4"><p className="text-sm text-muted-foreground">{l}</p><p className="font-serif text-3xl text-primary">{v}</p></div>)}</div>
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
  if (!data) return <ListSkeleton />;
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
