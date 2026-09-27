import { ListSkeleton } from "@/components/start-here";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/learning";
import { courseTitle } from "@/components/student-dashboard";

const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";
const selSm = "h-8 rounded-md border border-input bg-background px-2 text-xs";
const date = (d: string) => new Date(d).toLocaleDateString("en-SG");

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm"><thead className="bg-muted"><tr>{head.map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead><tbody>{children}</tbody></table>
    </div>
  );
}
const td = "p-3 align-top";

async function toastErr(e: unknown, ok: string) {
  const { toast } = await import("sonner");
  if (e) toast.error((e as Error).message); else toast.success(ok);
}

/* ---------- Live classes & 1-to-1 oversight ---------- */
type LiveSession = { id: string; course_slug: string; title: string; starts_at: string; duration_min: number; meeting_url: string | null; status: string };
type SB = { id: string; session_id: string; student_name: string; status: string; created_at: string; live_sessions: { title: string; starts_at: string; course_slug: string } };
type Slot = { id: string; trainer_id: string; trainer_name: string; topic: string; starts_at: string; duration_min: number; price: number; booked_by: string | null; booked_name: string | null; booked_note: string | null };
type TutorListing = { user_id: string; display_name: string; headline: string; subjects: string[]; visible: boolean; photo_url: string | null };

export function LiveClassesOversight() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-live-sessions"] }); void qc.invalidateQueries({ queryKey: ["admin-bookings"] }); };
  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-live-sessions"],
    queryFn: async () => ((await supabase.from("live_sessions").select("*").order("starts_at", { ascending: false }).limit(200)).data ?? []) as LiveSession[],
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => ((await supabase.from("session_bookings").select("*, live_sessions(title,starts_at,course_slug)").order("created_at", { ascending: false }).limit(200)).data ?? []) as unknown as SB[],
  });
  const decide = async (id: string, status: "confirmed" | "declined") => {
    const { error } = await supabase.from("session_bookings").update({ status }).eq("id", id);
    await toastErr(error, status === "confirmed" ? "Seat confirmed" : "Request declined"); refresh();
  };
  const setSessionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("live_sessions").update({ status }).eq("id", id);
    await toastErr(error, "Class updated"); refresh();
  };
  if (!sessions) return <ListSkeleton />;
  const pending = bookings.filter(b => b.status === "requested");
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Every live class across the site, with seat bookings. You can confirm or decline a request on behalf of the trainer.</p>
      {pending.length > 0 && <div className="mt-4 rounded-lg border border-brand-gold bg-secondary p-4 text-sm"><p className="font-medium text-primary">Seat requests waiting ({pending.length})</p>
        <ul className="mt-2 space-y-2">{pending.map(b => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-2"><span><b>{b.student_name}</b> · {b.live_sessions.title} ({courseTitle(b.live_sessions.course_slug)}) · {fmtDateTime(b.live_sessions.starts_at)}</span>
            <span className="flex gap-2"><Button size="sm" className="h-7 rounded-full text-xs" onClick={() => void decide(b.id, "confirmed")}>Confirm</Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void decide(b.id, "declined")}>Decline</Button></span></li>))}</ul></div>}
      <h3 className="mt-8 font-serif text-2xl text-primary">Live classes</h3>
      {sessions.length === 0 ? <p className="mt-2 text-muted-foreground">No live classes scheduled yet.</p> : (
        <Table head={["Course", "Class", "When", "Link", "Status"]}>{sessions.map(s => (
          <tr key={s.id} className="border-t border-border">
            <td className={td}>{courseTitle(s.course_slug)}</td>
            <td className={td}>{s.title}<div className="text-xs text-muted-foreground">{s.duration_min} min</div></td>
            <td className={td}>{fmtDateTime(s.starts_at)}</td>
            <td className={`${td} text-xs`}>{s.meeting_url ? <a className="underline" href={s.meeting_url} target="_blank" rel="noreferrer">Meeting link</a> : "On site"}</td>
            <td className={td}><select className={selSm} value={s.status} onChange={e => void setSessionStatus(s.id, e.target.value)}>{["scheduled", "completed", "cancelled"].map(x => <option key={x}>{x}</option>)}</select></td>
          </tr>))}</Table>)}
      <h3 className="mt-10 font-serif text-2xl text-primary">All seat bookings</h3>
      {bookings.length === 0 ? <p className="mt-2 text-muted-foreground">No seat bookings yet.</p> : (
        <Table head={["Student", "Class", "When", "Requested", "Status"]}>{bookings.map(b => (
          <tr key={b.id} className="border-t border-border">
            <td className={td}>{b.student_name}</td>
            <td className={td}>{b.live_sessions.title}<div className="text-xs text-muted-foreground">{courseTitle(b.live_sessions.course_slug)}</div></td>
            <td className={td}>{fmtDateTime(b.live_sessions.starts_at)}</td>
            <td className={td}>{date(b.created_at)}</td>
            <td className={td}><select className={selSm} value={b.status} onChange={e => void decide2(b.id, e.target.value, refresh)}>{["requested", "confirmed", "declined", "cancelled"].map(x => <option key={x}>{x}</option>)}</select></td>
          </tr>))}</Table>)}
    </div>
  );
}
async function decide2(id: string, status: string, refresh: () => void) {
  const { error } = await supabase.from("session_bookings").update({ status }).eq("id", id);
  await toastErr(error, "Booking updated"); refresh();
}

export function TutorSlotsOversight() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-slots"] }); void qc.invalidateQueries({ queryKey: ["admin-tutors"] }); };
  const { data: slots = [] } = useQuery({
    queryKey: ["admin-slots"],
    queryFn: async () => ((await supabase.from("meeting_slots").select("*").order("starts_at", { ascending: false }).limit(200)).data ?? []) as Slot[],
  });
  const { data: tutors = [] } = useQuery({
    queryKey: ["admin-tutors"],
    queryFn: async () => ((await supabase.from("tutor_profiles").select("user_id,display_name,headline,subjects,visible,photo_url").order("display_name")).data ?? []) as TutorListing[],
  });
  const setVisible = async (userId: string, visible: boolean) => {
    const { error } = await supabase.from("tutor_profiles").update({ visible }).eq("user_id", userId);
    await toastErr(error, visible ? "Tutor listing shown" : "Tutor listing hidden"); refresh();
  };
  if (!slots) return <ListSkeleton />;
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Public 1-to-1 tutor listings and their bookable time slots.</p>
      <h3 className="mt-6 font-serif text-2xl text-primary">Tutor listings</h3>
      {tutors.length === 0 ? <p className="mt-2 text-muted-foreground">No tutor profiles yet.</p> : (
        <Table head={["Tutor", "Headline", "Subjects", "Public"]}>{tutors.map(t => (
          <tr key={t.user_id} className="border-t border-border">
            <td className={td}>{t.display_name}</td>
            <td className={`${td} text-xs`}>{t.headline}</td>
            <td className={`${td} text-xs`}>{t.subjects.join(", ")}</td>
            <td className={td}><select className={selSm} value={t.visible ? "visible" : "hidden"} onChange={e => void setVisible(t.user_id, e.target.value === "visible")}><option value="visible">Shown</option><option value="hidden">Hidden</option></select></td>
          </tr>))}</Table>)}
      <h3 className="mt-10 font-serif text-2xl text-primary">1-to-1 slots</h3>
      {slots.length === 0 ? <p className="mt-2 text-muted-foreground">No time slots offered yet.</p> : (
        <Table head={["Tutor", "Topic", "When", "Price", "Booked by"]}>{slots.map(s => (
          <tr key={s.id} className="border-t border-border">
            <td className={td}>{s.trainer_name}</td>
            <td className={td}>{s.topic}</td>
            <td className={td}>{fmtDateTime(s.starts_at)}<div className="text-xs text-muted-foreground">{s.duration_min} min</div></td>
            <td className={td}>S${Number(s.price).toFixed(0)}</td>
            <td className={td}>{s.booked_name ?? <span className="text-muted-foreground">Available</span>}</td>
          </tr>))}</Table>)}
    </div>
  );
}

/* ---------- Community moderation ---------- */
type Post = { id: string; title: string; body: string; hidden: boolean; created_at: string; community_profiles: { username: string; display_name: string } | null };
type Comment = { id: string; body: string; hidden: boolean; created_at: string; community_profiles: { username: string; display_name: string } | null };
type MemberProfile = { id: string; username: string; display_name: string; verified: boolean; member_type: string };

export function CommunityModeration() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-posts"] }); void qc.invalidateQueries({ queryKey: ["admin-comments"] }); void qc.invalidateQueries({ queryKey: ["admin-member-profiles"] }); };
  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => ((await supabase.from("posts").select("*, community_profiles(username,display_name)").order("created_at", { ascending: false }).limit(100)).data ?? []) as unknown as Post[],
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => ((await supabase.from("post_comments").select("*, community_profiles(username,display_name)").order("created_at", { ascending: false }).limit(100)).data ?? []) as unknown as Comment[],
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-member-profiles"],
    queryFn: async () => ((await supabase.from("community_profiles").select("id,username,display_name,verified,member_type").order("username")).data ?? []) as MemberProfile[],
  });
  const toggle = async (table: "posts" | "post_comments", id: string, hidden: boolean) => {
    const { error } = await supabase.from(table).update({ hidden }).eq("id", id);
    await toastErr(error, hidden ? "Hidden from members" : "Restored"); refresh();
  };
  const setVerified = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("community_profiles").update({ verified, verified_at: verified ? new Date().toISOString() : null, verified_by: verified ? (await supabase.auth.getUser()).data.user?.id : null }).eq("id", id);
    await toastErr(error, verified ? "Badge granted" : "Badge removed"); refresh();
  };
  if (!posts) return <ListSkeleton />;
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Hide or restore community posts and comments, and manage the verified member badge.</p>
      <h3 className="mt-6 font-serif text-2xl text-primary">Posts</h3>
      {posts.length === 0 ? <p className="mt-2 text-muted-foreground">No posts yet.</p> : (
        <Table head={["Post", "Author", "Posted", "Visible"]}>{posts.map(p => (
          <tr key={p.id} className="border-t border-border">
            <td className={td}>{p.title}<div className="max-w-md truncate text-xs text-muted-foreground">{p.body}</div></td>
            <td className={td}>{p.community_profiles?.display_name ?? "—"}</td>
            <td className={td}>{date(p.created_at)}</td>
            <td className={td}><select className={selSm} value={p.hidden ? "hidden" : "visible"} onChange={e => void toggle("posts", p.id, e.target.value === "hidden")}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></td>
          </tr>))}</Table>)}
      <h3 className="mt-10 font-serif text-2xl text-primary">Comments</h3>
      {comments.length === 0 ? <p className="mt-2 text-muted-foreground">No comments yet.</p> : (
        <Table head={["Comment", "Author", "Posted", "Visible"]}>{comments.map(c => (
          <tr key={c.id} className="border-t border-border">
            <td className={`${td} max-w-md`}>{c.body}</td>
            <td className={td}>{c.community_profiles?.display_name ?? "—"}</td>
            <td className={td}>{date(c.created_at)}</td>
            <td className={td}><select className={selSm} value={c.hidden ? "hidden" : "visible"} onChange={e => void toggle("post_comments", c.id, e.target.value === "hidden")}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></td>
          </tr>))}</Table>)}
      <h3 className="mt-10 font-serif text-2xl text-primary">Verified badges</h3>
      {profiles.length === 0 ? <p className="mt-2 text-muted-foreground">No member profiles yet.</p> : (
        <Table head={["Member", "Type", "Verified"]}>{profiles.map(p => (
          <tr key={p.id} className="border-t border-border">
            <td className={td}>{p.display_name}<div className="text-xs text-muted-foreground">@{p.username}</div></td>
            <td className={td}>{p.member_type}</td>
            <td className={td}><select className={selSm} value={p.verified ? "yes" : "no"} onChange={e => void setVerified(p.id, e.target.value === "yes")}><option value="yes">Verified</option><option value="no">Not verified</option></select></td>
          </tr>))}</Table>)}
    </div>
  );
}

/* ---------- Organisations ---------- */
type OrgPkg = { org_id: string; name: string; student_seats: number; instructor_seats: number; expires_on: string | null };
type OrgUser = { id: string; email: string; full_name: string | null };

export function OrganisationsAdmin() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-org-packages"] }); void qc.invalidateQueries({ queryKey: ["admin-org-users"] }); };
  const { data: packages = [] } = useQuery({
    queryKey: ["admin-org-packages"],
    queryFn: async () => ((await supabase.from("org_packages").select("*").order("org_id")).data ?? []) as OrgPkg[],
  });
  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-org-users"],
    queryFn: async () => {
      const roles = ((await supabase.from("user_roles").select("user_id").eq("role", "organization")).data ?? []).map(r => r.user_id);
      if (roles.length === 0) return [] as OrgUser[];
      return ((await supabase.from("profiles").select("id,email,full_name").in("id", roles)).data ?? []) as OrgUser[];
    },
  });
  const [f, setF] = useState({ org: "", name: "", students: "5", instructors: "1", expires: "" });
  const create = async () => {
    if (!f.org || !f.name) return;
    const { error } = await supabase.from("org_packages").insert({ org_id: f.org, name: f.name, student_seats: Number(f.students) || 0, instructor_seats: Number(f.instructors) || 0, expires_on: f.expires || null });
    await toastErr(error, "Package created"); if (!error) { setF({ ...f, name: "" }); refresh(); }
  };
  const update = async (orgId: string, patch: Partial<OrgPkg>) => {
    const { error } = await supabase.from("org_packages").update(patch).eq("org_id", orgId);
    await toastErr(error, "Package updated"); refresh();
  };
  if (!packages) return <ListSkeleton />;
  const orgName = (id: string) => orgs.find(o => o.id === id)?.full_name || orgs.find(o => o.id === id)?.email || "Unknown organisation";
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Training packages for business accounts — seats and expiry.</p>
      <div className="mt-4 rounded-lg border border-border bg-card p-6">
        <h3 className="font-serif text-xl text-primary">Create a package</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <select className={`${sel} min-w-64 flex-1`} value={f.org} onChange={e => setF({ ...f, org: e.target.value })}><option value="">Choose a business account…</option>{orgs.map(o => <option key={o.id} value={o.id}>{o.full_name ? `${o.full_name} — ` : ""}{o.email}</option>)}</select>
          <Input className="w-56" placeholder="Package name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} aria-label="Package name" />
          <Input className="w-24" type="number" min={0} placeholder="Seats" value={f.students} onChange={e => setF({ ...f, students: e.target.value })} aria-label="Student seats" />
          <Input className="w-24" type="number" min={0} placeholder="Tutors" value={f.instructors} onChange={e => setF({ ...f, instructors: e.target.value })} aria-label="Instructor seats" />
          <Input className="w-40" type="date" value={f.expires} onChange={e => setF({ ...f, expires: e.target.value })} aria-label="Expires on" />
          <Button className="rounded-full" onClick={() => void create()}>Create</Button>
        </div>
      </div>
      {packages.length === 0 ? <p className="mt-6 text-muted-foreground">No packages yet.</p> : (
        <Table head={["Organisation", "Package", "Student seats", "Instructor seats", "Expires on"]}>{packages.map(p => (
          <tr key={p.org_id} className="border-t border-border">
            <td className={td}>{orgName(p.org_id)}</td>
            <td className={td}>{p.name}</td>
            <td className={td}><Input className="h-8 w-20" type="number" min={0} defaultValue={p.student_seats} onBlur={e => { const v = Number(e.target.value); if (v !== p.student_seats) void update(p.org_id, { student_seats: v }); }} aria-label="Student seats" /></td>
            <td className={td}><Input className="h-8 w-20" type="number" min={0} defaultValue={p.instructor_seats} onBlur={e => { const v = Number(e.target.value); if (v !== p.instructor_seats) void update(p.org_id, { instructor_seats: v }); }} aria-label="Instructor seats" /></td>
            <td className={td}>{p.expires_on ?? "—"}</td>
          </tr>))}</Table>)}
    </div>
  );
}

/* ---------- Events ---------- */
type EventRow = { id: string; title: string; description: string; starts_at: string; location: string; online_url: string | null; capacity: number };
type Signup = { event_id: string; name: string; created_at: string };

export function EventsAdmin() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-events"] }); void qc.invalidateQueries({ queryKey: ["admin-signups"] }); };
  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => ((await supabase.from("events").select("*").order("starts_at", { ascending: false }).limit(100)).data ?? []) as EventRow[],
  });
  const { data: signups = [] } = useQuery({
    queryKey: ["admin-signups"],
    queryFn: async () => ((await supabase.from("event_signups").select("event_id,name,created_at").order("created_at", { ascending: false }).limit(500)).data ?? []) as Signup[],
  });
  const [f, setF] = useState({ title: "", description: "", starts: "", location: "", url: "", capacity: "50" });
  const create = async () => {
    if (!f.title || !f.starts || !f.location) return;
    const { error } = await supabase.from("events").insert({ title: f.title, description: f.description, starts_at: new Date(f.starts).toISOString(), location: f.location, online_url: f.url || null, capacity: Number(f.capacity) || 50 });
    await toastErr(error, "Event created"); if (!error) { setF({ ...f, title: "", description: "", starts: "" }); refresh(); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    await toastErr(error, "Event deleted"); refresh();
  };
  if (!events) return <ListSkeleton />;
  const count = (id: string) => signups.filter(s => s.event_id === id).length;
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Public events on the site — create, edit capacity and see who has signed up.</p>
      <div className="mt-4 rounded-lg border border-border bg-card p-6">
        <h3 className="font-serif text-xl text-primary">Create an event</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input placeholder="Event title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} aria-label="Event title" />
          <Input type="datetime-local" value={f.starts} onChange={e => setF({ ...f, starts: e.target.value })} aria-label="Starts at" />
          <Input placeholder="Location or online" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} aria-label="Location" />
          <Input placeholder="Online link (optional)" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} aria-label="Online link" />
          <Input type="number" min={1} placeholder="Capacity" value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} aria-label="Capacity" />
          <Input placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} aria-label="Description" />
        </div>
        <Button className="mt-4 rounded-full" onClick={() => void create()}>Create event</Button>
      </div>
      {events.length === 0 ? <p className="mt-6 text-muted-foreground">No events yet.</p> : (
        <Table head={["Event", "When", "Location", "Sign-ups", ""]}>{events.map(ev => (
          <tr key={ev.id} className="border-t border-border">
            <td className={td}>{ev.title}<div className="max-w-sm truncate text-xs text-muted-foreground">{ev.description}</div>{count(ev.id) > 0 && <div className="text-xs text-muted-foreground">{signups.filter(s => s.event_id === ev.id).map(s => s.name).join(", ")}</div>}</td>
            <td className={td}>{fmtDateTime(ev.starts_at)}</td>
            <td className={td}>{ev.location}</td>
            <td className={td}>{count(ev.id)} / {ev.capacity}</td>
            <td className={td}><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void remove(ev.id)}>Delete</Button></td>
          </tr>))}</Table>)}
    </div>
  );
}

/* ---------- Learning oversight ---------- */
type Asg = { id: string; course_slug: string; title: string; due_at: string | null; max_score: number };
type Sub = { id: string; assignment_id: string; student_name: string; body: string; link: string | null; score: number | null; feedback: string | null; status: string; created_at: string };
type Quiz = { id: string; course_slug: string; title: string; pass_mark: number; gives_certificate: boolean };
type Attempt = { id: string; quiz_id: string; student_id: string; score: number; passed: boolean; created_at: string };
type Att = { session_id: string; student_id: string; status: string; live_sessions: { title: string; starts_at: string; course_slug: string } };

export function LearningOversight() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-assignments"] }); void qc.invalidateQueries({ queryKey: ["admin-quizzes"] }); void qc.invalidateQueries({ queryKey: ["admin-attendance"] }); };
  const { data: asgs = [] } = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: async () => {
      const rows = ((await supabase.from("assignments").select("*").order("due_at", { ascending: false }).limit(100)).data ?? []) as Asg[];
      return rows;
    },
  });
  const { data: subs = [] } = useQuery({
    queryKey: ["admin-assignments"],
    select: () => undefined,
  });
  const { data: quizList = [] } = useQuery({
    queryKey: ["admin-quizzes"],
    queryFn: async () => {
      const quizzes = ((await supabase.from("quizzes").select("*").order("course_slug")).data ?? []) as Quiz[];
      const attempts = ((await supabase.from("quiz_attempts").select("id,quiz_id,student_id,score,passed,created_at").limit(500)).data ?? []) as Attempt[];
      return { quizzes, attempts };
    },
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["admin-attendance"],
    queryFn: async () => ((await supabase.from("attendance").select("session_id,student_id,status,live_sessions(title,starts_at,course_slug)").limit(500)).data ?? []) as unknown as Att[],
  });
  const grade = async (id: string, patch: Partial<Sub>) => {
    const { error } = await supabase.from("assignment_submissions").update(patch).eq("id", id);
    await toastErr(error, "Submission graded"); refresh();
  };
  if (!asgs) return <ListSkeleton />;
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Assignments and submissions across all courses — view work, record a score and feedback.</p>
      {asgs.length === 0 ? <p className="mt-2 text-muted-foreground">No assignments set yet.</p> : (
        <div className="mt-5 space-y-3">{asgs.map(a => <AssignmentCard key={a.id} a={a} onGrade={grade} />)}</div>)}
      <h3 className="mt-10 font-serif text-2xl text-primary">Quizzes</h3>
      {quizList?.quizzes?.length ? (
        <Table head={["Course", "Quiz", "Pass mark", "Attempts", "Passes"]}>{quizList.quizzes.map(q => (
          <tr key={q.id} className="border-t border-border">
            <td className={td}>{courseTitle(q.course_slug)}</td>
            <td className={td}>{q.title}</td>
            <td className={td}>{q.pass_mark}%</td>
            <td className={td}>{quizList.attempts.filter(x => x.quiz_id === q.id).length}</td>
            <td className={td}>{quizList.attempts.filter(x => x.quiz_id === q.id && x.passed).length}</td>
          </tr>))}</Table>) : <p className="mt-2 text-muted-foreground">No quizzes yet.</p>}
      <h3 className="mt-10 font-serif text-2xl text-primary">Attendance</h3>
      {attendance.length === 0 ? <p className="mt-2 text-muted-foreground">No attendance recorded yet.</p> : (() => {
        const bySession = new Map<string, Att[]>();
        attendance.forEach(r => { const list = bySession.get(r.session_id) ?? []; list.push(r); bySession.set(r.session_id, list); });
        return (
          <Table head={["Class", "When", "Present", "Absent", "Excused"]}>{[...bySession.entries()].map(([sid, rows]) => (
            <tr key={sid} className="border-t border-border">
              <td className={td}>{rows[0].live_sessions?.title ?? "Class"}<div className="text-xs text-muted-foreground">{courseTitle(rows[0].live_sessions?.course_slug ?? "")}</div></td>
              <td className={td}>{rows[0].live_sessions ? fmtDateTime(rows[0].live_sessions.starts_at) : "—"}</td>
              <td className={td}>{rows.filter(r => r.status === "present").length}</td>
              <td className={td}>{rows.filter(r => r.status === "absent").length}</td>
              <td className={td}>{rows.filter(r => r.status === "excused").length}</td>
            </tr>))}</Table>);
      })()}
    </div>
  );
}

function AssignmentCard({ a, onGrade }: { a: Asg; onGrade: (id: string, patch: Partial<Sub>) => Promise<void> }) {
  const { data = [] } = useQuery({
    queryKey: ["admin-submissions", a.id],
    queryFn: async () => ((await supabase.from("assignment_submissions").select("*").eq("assignment_id", a.id).order("created_at", { ascending: false })).data ?? []) as Sub[],
  });
  const [open, setOpen] = useState(false);
  const graded = data.filter(s => s.score !== null).length;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(o => !o)}>
        <span><b>{a.title}</b><div className="text-xs text-muted-foreground">{courseTitle(a.course_slug)} · due {a.due_at ? date(a.due_at) : "no due date"} · max {a.max_score}</div></span>
        <span className="text-xs text-muted-foreground">{data.length === 0 ? "No submissions" : `${graded}/${data.length} graded`} {open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {data.length === 0 ? <p className="text-xs text-muted-foreground">No submissions yet.</p> : data.map(s => (
            <div key={s.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><b>{s.student_name}</b><span className="text-xs text-muted-foreground">{s.status}{s.score !== null ? ` · scored ${s.score}/${a.max_score}` : ""}</span></div>
              <p className="mt-2 whitespace-pre-wrap text-xs">{s.body}</p>
              {s.link && <a className="mt-1 block text-xs underline" href={s.link} target="_blank" rel="noreferrer">Attached link</a>}
              <div className="mt-2 flex flex-wrap gap-2">
                <Input className="h-8 w-24" type="number" min={0} max={a.max_score} placeholder="Score" defaultValue={s.score ?? ""} onBlur={e => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== s.score) void onGrade(s.id, { score: v, status: v !== null ? "graded" : s.status }); }} aria-label="Score" />
                <Input className="h-8 flex-1" placeholder="Feedback" defaultValue={s.feedback ?? ""} onBlur={e => { if (e.target.value !== (s.feedback ?? "")) void onGrade(s.id, { feedback: e.target.value }); }} aria-label="Feedback" />
              </div>
            </div>))}
        </div>
      )}
    </div>
  );
}
