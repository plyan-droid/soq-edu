import { StartHere, PageSkeleton } from "@/components/start-here";
import { WorkspaceNav, WorkspaceTabs, useToolParam } from "@/components/workspace-shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Trash2, Home, GraduationCap, BookOpen, Wallet, MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { courseTitle, type Enrollment, type Task } from "@/components/student-dashboard";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CertificatesAdmin, Reports, ReviewModeration, Subscribers, SupportInbox, TrainerApplications, CourseDraftsReview, UsersAdmin, Sales, DiscountCodes, PagesEditor, TemplatesEditor, SettingsHub } from "@/components/staff-tools";
import { ManualEnrol, BankPayments, WaitlistAdmin, NoticeboardAdmin, BundlesAdmin, FormBuilder, CertificateDesigner, LoginHistory, AIWriter, ReferralsAdmin } from "@/components/staff-phase3";
import { StaffRequests, StudentOverview, OrgMembersAdmin } from "@/components/staff-phase5";
import { AdmissionsPipeline, ExemptionsAdmin, SfcClaims, WhatsAppReminders, LeadsAdmin, IntegrationsStatus } from "@/components/staff-phase4";

export const Route = createFileRoute("/portal-admin")({
  head: () => ({
    meta: [
      { title: "Staff Admin | SOQ Student Portal" },
      { name: "description", content: "SOQ staff tools for managing student enrolments, progress, deadlines and assessments." },
      { property: "og:title", content: "SOQ Staff Admin" },
      { property: "og:description", content: "Manage student enrolments and assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Profile = { id: string; email: string; full_name: string | null };
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";

const adminSections = [
  { name: "Home", icon: Home, items: [["start", "Today"], ["reports", "Reports"]] },
  { name: "Learners", icon: GraduationCap, items: [["students", "Students"], ["applications", "Course applications"], ["admissions", "Diploma admissions"], ["enrol", "Enrol students"], ["waitlist", "Waitlists"], ["exemptions", "Exemptions"], ["certificates", "Certificates"]] },
  { name: "Courses", icon: BookOpen, items: [["intakes", "Intakes"], ["trainers", "Trainer applications"], ["drafts", "Trainer courses"], ["reviews", "Reviews"], ["bundles", "Bundles"], ["certdesign", "Certificate design"]] },
  { name: "Money", icon: Wallet, items: [["sales", "Sales"], ["payments", "PayNow & instalments"], ["sfc", "SkillsFuture Credit"], ["codes", "Discount codes"], ["referrals", "Referrals"]] },
  { name: "Messages", icon: MessageSquare, items: [["inbox", "Support inbox"], ["community", "Community members"], ["newsletter", "Newsletter"], ["notices", "Noticeboard"], ["whatsapp", "WhatsApp reminders"], ["leads", "Leads"]] },
  { name: "Settings", icon: Settings, items: [["users", "Users & roles"], ["pages", "Pages"], ["templates", "Message templates"], ["forms", "Forms"], ["logins", "Login history"], ["ai", "AI writer"], ["gov", "Gov & Xero links"], ["settings", "Settings"]] },
] as const;
type AdminSection = (typeof adminSections)[number];
type AdminTool = AdminSection["items"][number][0];

function Admin() {
  const { isAdmin, loading, user } = useAuth();
  const [studentId, setStudentId] = useState<string>("");
  const [activeTool, setToolState] = useState<AdminTool>("start");
  const isTool = (t: string | null): t is AdminTool => !!t && adminSections.some(s => s.items.some(([id]) => id === t));
  const setActiveTool = useToolParam(id => isTool(id), id => setToolState(id as AdminTool)) as (id: AdminTool) => void;
  const currentSection = adminSections.find(section => section.items.some(([id]) => id === activeTool)) ?? adminSections[0];
  const currentLabel = currentSection.items.find(([id]) => id === activeTool)?.[1] ?? "Reports";
  const { data: students = [] } = useQuery({
    queryKey: ["admin-students"], enabled: isAdmin,
    queryFn: async () => ((await supabase.from("profiles").select("id,email,full_name").order("email")).data ?? []) as Profile[],
  });
  if (loading) return <PageSkeleton />;
  if (!isAdmin) return <div className="mx-auto max-w-7xl px-5 py-24"><h1 className="font-serif text-4xl text-primary">Staff only</h1><p className="mt-2 text-muted-foreground">This page is for SOQ staff accounts.</p><Button asChild className="mt-5 rounded-full"><Link to="/student-portal">Back to portal</Link></Button></div>;

  return (
    <div className="mx-auto max-w-[92rem] px-5 pb-28 pt-6 lg:px-8 lg:py-10">
      <Tabs value={activeTool} onValueChange={value => setActiveTool(value as AdminTool)} className="grid min-w-0 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <WorkspaceNav title="Staff workspace" sections={adminSections} section={currentSection.name} onChange={id => setActiveTool(id as AdminTool)} />
        <main className="min-w-0">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Staff workspace</p>
            <h1 className="mt-1 font-serif text-4xl font-semibold text-primary sm:text-5xl">{currentSection.name}</h1>
            <WorkspaceTabs items={currentSection.items} active={activeTool} onChange={id => setActiveTool(id as AdminTool)} />
          </div>
          <div className="min-w-0 pt-3">
        <TabsContent value="start"><StartHere role="staff" userId={user?.id ?? ""} onNavigate={id => setActiveTool(id as AdminTool)} greeting="Here's what needs your attention today. Anything urgent is shown first." /></TabsContent>
        <TabsContent value="reports"><Reports /></TabsContent>
        <TabsContent value="students">
          <Button asChild variant="outline" className="mt-4 rounded-full"><Link to="/staff-courses">Edit course content (syllabus, fees, outcomes)</Link></Button>
          <p className="mt-4 text-muted-foreground">Students appear here after they create an account. Choose one to manage their courses.</p>
          <select className={`${sel} mt-6 w-full max-w-md`} value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">Select a student…</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name ? `${s.full_name} — ` : ""}{s.email}</option>)}
          </select>
          {studentId && <StudentOverview studentId={studentId} />}
          {studentId && <StudentEditor studentId={studentId} />}
        </TabsContent>
        <TabsContent value="applications"><Applications /></TabsContent>
        <TabsContent value="intakes"><IntakesEditor /></TabsContent>
        <TabsContent value="certificates"><CertificatesAdmin /></TabsContent>
        <TabsContent value="trainers"><TrainerApplications /></TabsContent>
        <TabsContent value="drafts"><CourseDraftsReview /></TabsContent>
        <TabsContent value="inbox"><SupportInbox /></TabsContent>
        <TabsContent value="reviews"><ReviewModeration /></TabsContent>
        <TabsContent value="community"><CommunityMembers /></TabsContent>
        <TabsContent value="newsletter"><Subscribers /></TabsContent>
        <TabsContent value="users"><div className="mt-4 grid gap-6 lg:grid-cols-2"><StaffRequests /><OrgMembersAdmin /></div><UsersAdmin selfId={user?.id} /></TabsContent>
        <TabsContent value="sales"><Sales /></TabsContent>
        <TabsContent value="codes"><DiscountCodes /></TabsContent>
        <TabsContent value="pages"><PagesEditor /></TabsContent>
        <TabsContent value="templates"><TemplatesEditor /></TabsContent>
        <TabsContent value="settings"><SettingsHub /></TabsContent>
        <TabsContent value="enrol"><ManualEnrol /></TabsContent>
        <TabsContent value="payments"><BankPayments /></TabsContent>
        <TabsContent value="waitlist"><WaitlistAdmin /></TabsContent>
        <TabsContent value="notices"><NoticeboardAdmin /></TabsContent>
        <TabsContent value="bundles"><BundlesAdmin /></TabsContent>
        <TabsContent value="forms"><FormBuilder /></TabsContent>
        <TabsContent value="certdesign"><CertificateDesigner /></TabsContent>
        <TabsContent value="logins"><LoginHistory /></TabsContent>
        <TabsContent value="ai"><AIWriter /></TabsContent>
        <TabsContent value="referrals"><ReferralsAdmin /></TabsContent>
        <TabsContent value="admissions"><AdmissionsPipeline /></TabsContent>
        <TabsContent value="exemptions"><ExemptionsAdmin /></TabsContent>
        <TabsContent value="sfc"><SfcClaims /></TabsContent>
        <TabsContent value="whatsapp"><WhatsAppReminders /></TabsContent>
        <TabsContent value="leads"><LeadsAdmin /></TabsContent>
        <TabsContent value="gov"><IntegrationsStatus /></TabsContent>
          </div>
        </main>
      </Tabs>
    </div>
  );
}

function StudentEditor({ studentId }: { studentId: string }) {
  const qc = useQueryClient();
  const key = ["admin-student", studentId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const enr = ((await supabase.from("enrollments").select("*").eq("student_id", studentId).order("created_at")).data ?? []) as Enrollment[];
      const ids = enr.map(e => e.id);
      const tasks = ids.length ? (((await supabase.from("course_tasks").select("*").in("enrollment_id", ids).order("due_at")).data ?? []) as Task[]) : [];
      return { enr, tasks };
    },
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const [slug, setSlug] = useState(courses[0]?.slug ?? "");
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");

  const addEnrollment = async () => {
    await supabase.from("enrollments").insert({ student_id: studentId, course_slug: slug, start_date: start || null, end_date: end || null });
    refresh();
  };

  return (
    <div className="mt-8 grid gap-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-primary">Enrol in a course</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select className={`${sel} min-w-72 flex-1`} value={slug} onChange={e => setSlug(e.target.value)}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
          <Input type="date" className="w-44" value={start} onChange={e => setStart(e.target.value)} aria-label="Start date" />
          <Input type="date" className="w-44" value={end} onChange={e => setEnd(e.target.value)} aria-label="End date" />
          <Button className="rounded-full" onClick={addEnrollment}>Add course</Button>
        </div>
      </div>
      {data?.enr.map(e => <EnrollmentCard key={e.id} e={e} tasks={data.tasks.filter(t => t.enrollment_id === e.id)} onChange={refresh} />)}
    </div>
  );
}

function EnrollmentCard({ e, tasks, onChange }: { e: Enrollment; tasks: Task[]; onChange: () => void }) {
  const [progress, setProgress] = useState(e.progress);
  const [kind, setKind] = useState("assessment"); const [title, setTitle] = useState(""); const [due, setDue] = useState("");
  const save = async (patch: Partial<Enrollment>) => { await supabase.from("enrollments").update(patch).eq("id", e.id); onChange(); };
  const addTask = async () => {
    if (!title || !due) return;
    await supabase.from("course_tasks").insert({ enrollment_id: e.id, kind, title, due_at: new Date(due).toISOString() });
    setTitle(""); setDue(""); onChange();
  };
  const updateTask = async (id: string, patch: Partial<Task>) => { await supabase.from("course_tasks").update(patch).eq("id", id); onChange(); };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl text-primary">{courseTitle(e.course_slug)}</h3>
        <div className="flex items-center gap-2">
          <select className={sel} value={e.status} onChange={ev => void save({ status: ev.target.value })}>
            {["active", "completed", "withdrawn"].map(s => <option key={s}>{s}</option>)}
          </select>
          <Button variant="ghost" size="icon" aria-label="Remove course" onClick={async () => { await supabase.from("enrollments").delete().eq("id", e.id); onChange(); }}><Trash2 /></Button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm">Progress</span>
        <input type="range" min={0} max={100} step={5} value={progress} onChange={ev => setProgress(Number(ev.target.value))} onPointerUp={() => void save({ progress })} className="flex-1 accent-brand-gold" />
        <span className="w-12 text-right font-medium">{progress}%</span>
      </div>
      <ul className="mt-5 divide-y divide-border">{tasks.map(t => (
        <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
          <span className="w-24 text-xs uppercase tracking-wider text-muted-foreground">{t.kind}</span>
          <span className="flex-1">{t.title} · {new Date(t.due_at).toLocaleString("en-SG")}</span>
          <select className={sel} value={t.status} onChange={ev => void updateTask(t.id, { status: ev.target.value })}>{["upcoming", "done", "missed"].map(s => <option key={s}>{s}</option>)}</select>
          <Input className="w-36" placeholder="Result" defaultValue={t.result ?? ""} onBlur={ev => ev.target.value !== (t.result ?? "") && void updateTask(t.id, { result: ev.target.value || null })} />
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={async () => { await supabase.from("course_tasks").delete().eq("id", t.id); onChange(); }}><Trash2 /></Button>
        </li>
      ))}</ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <select className={sel} value={kind} onChange={ev => setKind(ev.target.value)}>{["assessment", "deadline", "class"].map(k => <option key={k}>{k}</option>)}</select>
        <Input className="min-w-56 flex-1" placeholder="e.g. Practical assessment" value={title} onChange={ev => setTitle(ev.target.value)} />
        <Input type="datetime-local" className="w-56" value={due} onChange={ev => setDue(ev.target.value)} />
        <Button variant="outline" className="rounded-full" onClick={addTask}>Add item</Button>
      </div>
    </div>
  );
}

type Application = { id: string; course_slug: string; full_name: string; email: string; phone: string; citizenship: string | null; preferred_intake: string | null; message: string | null; status: string; created_at: string };

function Applications() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => ((await supabase.from("course_applications").select("*").order("created_at", { ascending: false }).limit(200)).data ?? []) as Application[],
  });
  const { data: prog = {} } = useQuery({
    queryKey: ["admin-app-progress", data.map(a => a.id).join()], enabled: data.length > 0,
    queryFn: async () => {
      const { data: ps } = await supabase.from("profiles").select("id,email");
      const { data: en } = await supabase.from("enrollments").select("student_id,course_slug,progress");
      const byEmail = new Map((ps ?? []).map(p => [p.email.toLowerCase(), p.id]));
      const out: Record<string, number | undefined> = {};
      for (const a of data) { const id = byEmail.get(a.email.toLowerCase()); out[a.id] = en?.find(e => e.student_id === id && e.course_slug === a.course_slug)?.progress; }
      return out;
    },
  });
  const setStatus = async (id: string, status: string) => { await supabase.from("course_applications").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-applications"] }); };
  const approveEnrol = async (a: Application) => {
    const { data: p } = await supabase.from("profiles").select("id").ilike("email", a.email.trim()).maybeSingle();
    if (!p) { await setStatus(a.id, "approved"); alert(`Approved. ${a.email} has no account yet — ask them to sign up with this email, then click "Approve & enrol" again to give them their place.`); return; }
    const { data: ex } = await supabase.from("enrollments").select("id").eq("student_id", p.id).eq("course_slug", a.course_slug).maybeSingle();
    if (!ex) { const { error } = await supabase.from("enrollments").insert({ student_id: p.id, course_slug: a.course_slug, status: "active", start_date: new Date().toISOString().slice(0, 10) }); if (error) { alert(error.message); return; } }
    await setStatus(a.id, "enrolled"); void qc.invalidateQueries({ queryKey: ["admin-app-progress"] });
  };
  return (
    <div className="mt-14">
      <h2 className="font-serif text-4xl text-primary">Course applications ({data.filter(a => a.status === "new").length} new)</h2>
      {data.length === 0 ? <p className="mt-3 text-muted-foreground">No applications yet.</p> : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr>{["Date", "Name", "Contact", "Course", "Intake / notes", "Status", "Progress"].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.map(a => (
              <tr key={a.id} className="border-t border-border align-top">
                <td className="p-3 whitespace-nowrap">{new Date(a.created_at).toLocaleDateString("en-SG")}</td>
                <td className="p-3">{a.full_name}<div className="text-xs text-muted-foreground">{a.citizenship?.replace(/_/g, " ")}</div></td>
                <td className="p-3"><a className="underline" href={`mailto:${a.email}`}>{a.email}</a><div>{a.phone}</div></td>
                <td className="p-3">{courseTitle(a.course_slug)}</td>
                <td className="p-3 max-w-64">{a.preferred_intake}<div className="text-xs text-muted-foreground">{a.message}</div></td>
                <td className="p-3"><select className={sel} value={a.status} onChange={e => void setStatus(a.id, e.target.value)}>{["new", "contacted", "approved", "enrolled", "closed"].map(s => <option key={s}>{s}</option>)}</select>{a.status !== "enrolled" && <Button size="sm" className="mt-2 block rounded-full" onClick={() => void approveEnrol(a)}>Approve &amp; enrol</Button>}</td>
                <td className="p-3">{prog[a.id] !== undefined ? `${prog[a.id]}%` : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Member = { id: string; username: string; display_name: string; member_type: string; verified: boolean };

function CommunityMembers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => ((await supabase.from("community_profiles").select("id,username,display_name,member_type,verified").order("created_at", { ascending: false }).limit(500)).data ?? []) as Member[],
  });
  const toggle = async (m: Member) => {
    const { error } = await supabase.from("community_profiles").update({ verified: !m.verified }).eq("id", m.id);
    if (error) alert(error.message);
    void qc.invalidateQueries({ queryKey: ["admin-members"] });
  };
  const list = data.filter(m => `${m.username} ${m.display_name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mt-14">
      <h2 className="font-serif text-4xl text-primary">Community members</h2>
      <p className="mt-2 text-muted-foreground">Verify real SOQ trainers and business partners. Only verified members get the "Verified SOQ" badge.</p>
      <Input className="mt-4 max-w-md" placeholder="Search name or username" value={q} onChange={e => setQ(e.target.value)} />
      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted"><tr>{["Member", "Label", "Status", ""].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{list.map(m => (
            <tr key={m.id} className="border-t border-border">
              <td className="p-3">{m.display_name}<div className="text-xs text-muted-foreground">@{m.username}</div></td>
              <td className="p-3 capitalize">{m.member_type}</td>
              <td className="p-3">{m.verified ? "Verified" : "Not verified"}</td>
              <td className="p-3 text-right"><Button size="sm" variant={m.verified ? "outline" : "default"} className="rounded-full" onClick={() => void toggle(m)}>{m.verified ? "Remove verification" : "Verify"}</Button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

type IntakeRow = { id: string; course_slug: string; start_date: string; end_date: string | null; apply_by: string | null; session_time: string | null; status: string };

function IntakesEditor() {
  const qc = useQueryClient();
  const [f, setF] = useState({ course_slug: courses[0]?.slug ?? "", start_date: "", end_date: "", apply_by: "", session_time: "" });
  const { data = [] } = useQuery({
    queryKey: ["admin-intakes"],
    queryFn: async () => ((await supabase.from("course_intakes").select("*").order("start_date")).data ?? []) as IntakeRow[],
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-intakes"] }); void qc.invalidateQueries({ queryKey: ["intakes"] }); };
  const add = async () => {
    if (!f.start_date) return;
    const { error } = await supabase.from("course_intakes").insert({ course_slug: f.course_slug, start_date: f.start_date, end_date: f.end_date || null, apply_by: f.apply_by || null, session_time: f.session_time || null, status: "confirmed" });
    if (error) alert(error.message); else { setF({ ...f, start_date: "", end_date: "", apply_by: "" }); refresh(); }
  };
  const setStatus = async (id: string, status: string) => { await supabase.from("course_intakes").update({ status }).eq("id", id); refresh(); };
  const del = async (id: string) => { await supabase.from("course_intakes").delete().eq("id", id); refresh(); };
  return (
    <div className="mt-14">
      <h2 className="font-serif text-4xl text-primary">Course calendar intakes</h2>
      <p className="mt-2 text-muted-foreground">These dates appear on the public Course Calendar page.</p>
      <div className="mt-5 grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-6">
        <select className={`${sel} md:col-span-2`} value={f.course_slug} onChange={e => setF({ ...f, course_slug: e.target.value })}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
        <label className="text-xs text-muted-foreground">Start<Input type="date" value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">End<Input type="date" value={f.end_date} onChange={e => setF({ ...f, end_date: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">Apply by<Input type="date" value={f.apply_by} onChange={e => setF({ ...f, apply_by: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">Class time<Input placeholder="9.30am - 4.30pm" value={f.session_time} onChange={e => setF({ ...f, session_time: e.target.value })} /></label>
        <Button className="rounded-full md:col-span-6 md:justify-self-start" onClick={() => void add()}>Add intake</Button>
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted"><tr>{["Course", "Dates", "Apply by", "Time", "Status", ""].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{data.map(i => (
            <tr key={i.id} className="border-t border-border">
              <td className="p-3">{courseTitle(i.course_slug)}</td>
              <td className="p-3 whitespace-nowrap">{i.start_date}{i.end_date ? ` → ${i.end_date}` : ""}</td>
              <td className="p-3">{i.apply_by ?? "—"}</td>
              <td className="p-3">{i.session_time ?? "—"}</td>
              <td className="p-3"><select className={sel} value={i.status} onChange={e => void setStatus(i.id, e.target.value)}>{["tentative", "confirmed", "full", "cancelled"].map(s => <option key={s}>{s}</option>)}</select></td>
              <td className="p-3"><Button size="icon" variant="ghost" onClick={() => void del(i.id)}><Trash2 /></Button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
