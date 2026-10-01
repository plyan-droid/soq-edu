import { StartHere, StaffOperationsReport, PageSkeleton } from "@/components/start-here";
import { WorkspaceNav, WorkspaceTabs, useToolParam } from "@/components/workspace-shell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Trash2, Home, GraduationCap, BookOpen, Wallet, MessageSquare, Settings, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { courseTitle, type Enrollment, type Task } from "@/components/student-dashboard";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CertificatesAdmin, Reports, ReviewModeration, Subscribers, TrainerApplications, CourseDraftsReview, UsersAdmin, Sales, DiscountCodes, PagesEditor, TemplatesEditor, SettingsHub } from "@/components/staff-tools";
import { StaffMessages } from "@/components/staff-messages";
import { StudentProfileForm } from "@/components/student-profile-form";
import { BankPayments, NoticeboardAdmin, BundlesAdmin, FormBuilder, CertificateDesigner, LoginHistory, AIWriter, ReferralsAdmin } from "@/components/staff-phase3";
import { StaffRequests, StudentOverview, OrgMembersAdmin } from "@/components/staff-phase5";
import { ExemptionsAdmin, SfcClaims, WhatsAppReminders, LeadsAdmin, IntegrationsStatus } from "@/components/staff-phase4";
import { LiveClassesOversight, TutorSlotsOversight, CommunityModeration, OrganisationsAdmin, EventsAdmin, LearningOversight } from "@/components/staff-oversight";
import { CoursesAndIntakes } from "@/components/course-manager";
import { ApplicationsHub } from "@/components/applications-hub";

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
  { name: "Learners", icon: GraduationCap, items: [["students", "Students"], ["applications", "Applications & enrolment"], ["orgs", "Organisations"], ["learning", "Learning oversight"], ["exemptions", "Exemptions"], ["certificates", "Certificates"]] },
  { name: "Courses", icon: BookOpen, items: [["intakes", "Courses & intakes"], ["live-classes", "Live classes & 1-to-1"], ["events", "Events"], ["trainers", "Trainer applications"], ["drafts", "Trainer courses"], ["reviews", "Reviews"], ["bundles", "Bundles"], ["certdesign", "Certificate design"]] },
  { name: "Money", icon: Wallet, items: [["sales", "Sales"], ["payments", "PayNow & instalments"], ["sfc", "SkillsFuture Credit"], ["codes", "Discount codes"], ["referrals", "Referrals"]] },
  { name: "Messages", icon: MessageSquare, items: [["inbox", "Inbox"], ["moderation", "Community moderation"], ["community", "Community members"], ["newsletter", "Newsletter"], ["notices", "Noticeboard"], ["whatsapp", "WhatsApp reminders"], ["leads", "Leads"]] },
  { name: "Settings", icon: Settings, items: [["templates", "Message templates"], ["forms", "Forms"], ["logins", "Login history"], ["ai", "AI writer"]] },
  { name: "Owner", icon: Crown, items: [["users", "Users & roles"], ["pages", "Site pages"], ["gov", "Gov & Xero"], ["settings", "Settings"]] },
] as const;
type AdminSection = (typeof adminSections)[number];
type AdminTool = AdminSection["items"][number][0];

function Admin() {
  const { isAdmin, isTopAdmin, loading, user } = useAuth();
  const [studentId, setStudentId] = useState<string>("");
  const [activeTool, setToolState] = useState<AdminTool>("start");
  const isTool = (t: string | null): t is AdminTool => !!t && adminSections.some(s => s.items.some(([id]) => id === t));
  const setActiveTool = useToolParam(id => isTool(id), id => setToolState(id as AdminTool)) as (id: AdminTool) => void;
  const ownerToolIds = new Set<string>(adminSections.find(s => s.name === "Owner")!.items.map(i => i[0] as string));
  const visibleSections = isTopAdmin ? adminSections : adminSections.filter(s => s.name !== "Owner");
  const dashboardTitle = isTopAdmin ? "Admin Dashboard" : "Staff Dashboard";
  const ownerLocked = !isTopAdmin && ownerToolIds.has(activeTool as string);
  const currentSection = visibleSections.find(section => section.items.some(([id]) => id === activeTool)) ?? visibleSections[0];
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
        <WorkspaceNav title={dashboardTitle} sections={visibleSections} section={currentSection.name} onChange={id => setActiveTool(id as AdminTool)} />
        <main className="min-w-0">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{dashboardTitle}</p>
            <h1 className="mt-1 font-workspace text-3xl font-semibold text-primary sm:text-4xl">{currentSection.name}</h1>
            <WorkspaceTabs items={currentSection.items} active={activeTool} onChange={id => setActiveTool(id as AdminTool)} />
          </div>
          <div className="min-w-0 pt-3">
            {ownerLocked ? <div className="rounded-lg border border-border bg-card p-8"><h2 className="font-serif text-2xl text-primary">Owner only</h2><p className="mt-2 text-muted-foreground">This area is for SOQ owner accounts. Ask an admin if you need something here.</p></div> : (<div className="contents">
        <TabsContent value="start"><StartHere role="staff" userId={user?.id ?? ""} owner={isTopAdmin} onNavigate={id => setActiveTool(id as AdminTool)} greeting={isTopAdmin ? "Review the work awaiting a decision across SOQ." : "Start with the work awaiting your team today."} /></TabsContent>
        <TabsContent value="reports"><Reports /><StaffOperationsReport userId={user?.id ?? ""} owner={isTopAdmin} /></TabsContent>
        <TabsContent value="live-classes"><LiveClassesOversight /></TabsContent>
        <TabsContent value="events"><EventsAdmin /></TabsContent>
        <TabsContent value="students">
          <p className="mt-4 text-muted-foreground">Every student account is listed here in alphabetical order. Type a name, email or student ID to narrow the list, then pick a student to manage their details and courses.</p>
          <StudentDirectory students={students} studentId={studentId} onPick={setStudentId} />
          {studentId && <StudentProfileForm userId={studentId} email={students.find(s => s.id === studentId)?.email} />}
          {studentId && <StudentOverview studentId={studentId} />}
          {studentId && <StudentEditor studentId={studentId} />}
        </TabsContent>
        <TabsContent value="applications"><ApplicationsHub onOpenStudent={id => { setStudentId(id); setActiveTool("students"); }} /></TabsContent>
        <TabsContent value="intakes"><CoursesAndIntakes /></TabsContent>
        <TabsContent value="certificates"><CertificatesAdmin /></TabsContent>
        <TabsContent value="trainers"><TrainerApplications /></TabsContent>
        <TabsContent value="drafts"><CourseDraftsReview /></TabsContent>
        <TabsContent value="inbox"><StaffMessages /></TabsContent>
        <TabsContent value="moderation"><CommunityModeration /></TabsContent>
        <TabsContent value="reviews"><ReviewModeration /></TabsContent>
        <TabsContent value="community"><CommunityMembers /></TabsContent>
        <TabsContent value="newsletter"><Subscribers /></TabsContent>
        <TabsContent value="users"><div className="mt-4 grid gap-6 lg:grid-cols-2"><StaffRequests /><OrgMembersAdmin /></div><UsersAdmin selfId={user?.id} /></TabsContent>
        <TabsContent value="sales"><Sales /></TabsContent>
        <TabsContent value="codes"><DiscountCodes /></TabsContent>
        <TabsContent value="pages"><PagesEditor /></TabsContent>
        <TabsContent value="templates"><TemplatesEditor /></TabsContent>
        <TabsContent value="settings"><SettingsHub /></TabsContent>
        <TabsContent value="orgs"><OrganisationsAdmin /></TabsContent>
        <TabsContent value="learning"><LearningOversight /></TabsContent>
        <TabsContent value="payments"><BankPayments /></TabsContent>

        <TabsContent value="notices"><NoticeboardAdmin /></TabsContent>
        <TabsContent value="bundles"><BundlesAdmin /></TabsContent>
        <TabsContent value="forms"><FormBuilder /></TabsContent>
        <TabsContent value="certdesign"><CertificateDesigner /></TabsContent>
        <TabsContent value="logins"><LoginHistory /></TabsContent>
        <TabsContent value="ai"><AIWriter /></TabsContent>
        <TabsContent value="referrals"><ReferralsAdmin /></TabsContent>
        <TabsContent value="exemptions"><ExemptionsAdmin /></TabsContent>
        <TabsContent value="sfc"><SfcClaims /></TabsContent>
        <TabsContent value="whatsapp"><WhatsAppReminders /></TabsContent>
        <TabsContent value="leads"><LeadsAdmin /></TabsContent>
        <TabsContent value="gov"><IntegrationsStatus /></TabsContent>
        </div>)}
          </div>
        </main>
      </Tabs>
    </div>
  );
}

/** Page numbers with 0 marking an ellipsis gap, e.g. 1 2 … 8 9 10 … 20. */
function pageList(cur: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter(n => n >= 1 && n <= total));
  const nums = [...set].sort((a, b) => a - b); const out: number[] = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1]! > 1) out.push(0); out.push(n); });
  return out;
}

function StudentDirectory({ students, studentId, onPick }: { students: Profile[]; studentId: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 50;
  const selected = students.find(s => s.id === studentId);
  const term = q.trim().toLowerCase();
  const sorted = [...students].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email, "en", { sensitivity: "base" }));
  const matches = term ? sorted.filter(s => (s.full_name ?? "").toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.id.toLowerCase().startsWith(term)) : sorted;
  const pages = Math.max(1, Math.ceil(matches.length / perPage));
  const current = Math.min(page, pages);
  const shown = matches.slice((current - 1) * perPage, current * perPage);

  return (
    <div className="mt-6">
      {selected ? (
        <div className="flex max-w-xl items-center justify-between gap-3 rounded-md border border-brand-gold bg-brand-gold-soft/40 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{selected.full_name || selected.email}</p>
            <p className="truncate text-xs text-muted-foreground">{selected.email} · ID {selected.id.slice(0, 8)}</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => { onPick(""); setQ(""); setPage(1); }}>Change</Button>
        </div>
      ) : (
        <>
          <Input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Type a student's name, email or ID…" aria-label="Search students" className="max-w-md" />
          {term && <p className="mt-2 text-xs text-muted-foreground">{matches.length} {matches.length === 1 ? "student matches" : "students match"} "{q}"</p>}
          {matches.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No students match "{q}".</p>
          ) : (
            <>
              <ul className="mt-3 max-w-3xl divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
                {shown.map(s => (
                  <li key={s.id}>
                    <button type="button" className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-brand-gold-soft/40" onClick={() => onPick(s.id)}>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-primary">{s.full_name || s.email}</span>
                        <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.id.slice(0, 8)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex max-w-3xl items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {current} of {pages} · {matches.length} {matches.length === 1 ? "student" : "students"}</p>
                <div className="flex flex-wrap items-center gap-1">
                  <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(current - 1)}>&lt;</Button>
                  {pageList(current, pages).map((n, i) => n === 0 ? <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">…</span> : (
                    <Button key={n} size="icon" variant="outline" aria-label={`Page ${n}`} aria-current={n === current ? "page" : undefined} className={`size-8 rounded-full text-xs ${n === current ? "border-brand-gold bg-brand-gold text-brand-navy hover:bg-brand-gold/85" : ""}`} onClick={() => setPage(n)}>{n}</Button>
                  ))}
                  <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Next page" disabled={current >= pages} onClick={() => setPage(current + 1)}>&gt;</Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
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
