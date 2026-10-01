import { ListSkeleton } from "@/components/start-here";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_CATEGORIES, categoryLabel, eventImage, imageOptions, timeRange, type EventItem } from "@/lib/events";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/learning";
import { courseTitle } from "@/components/student-dashboard";
import { StaffSessionPlans } from "@/components/session-plans";

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
function pageList(cur: number, total: number): number[] {
  const set = new Set([1, total, cur - 1, cur, cur + 1].filter(n => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b); const out: number[] = [];
  sorted.forEach((n, i) => { if (i && n - sorted[i - 1]! > 1) out.push(0); out.push(n); });
  return out;
}
function Pager({ page, total, count, noun, onPage }: { page: number; total: number; count: number; noun: string; onPage: (n: number) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">Page {page} of {total} · {count} {noun}</p>
      <nav className="flex flex-wrap items-center gap-1" aria-label={`${noun} pages`}>
        <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>&lt;</Button>
        {pageList(page, total).map((n, i) => n === 0 ? <span key={`g${i}`} className="px-1 text-xs text-muted-foreground">…</span> : (
          <Button key={n} size="icon" variant="outline" aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined} className={`size-8 rounded-full text-xs ${n === page ? "border-brand-gold bg-brand-gold text-brand-navy hover:bg-brand-gold/85" : ""}`} onClick={() => onPage(n)}>{n}</Button>
        ))}
        <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Next page" disabled={page >= total} onClick={() => onPage(page + 1)}>&gt;</Button>
      </nav>
    </div>
  );
}
type Post = { id: string; title: string; body: string; hidden: boolean; created_at: string; community_profiles: { username: string; display_name: string } | null };
type Comment = { id: string; post_id: string; body: string; hidden: boolean; created_at: string; community_profiles: { username: string; display_name: string } | null };
type MemberProfile = { id: string; username: string; display_name: string; verified: boolean; member_type: string };

export function CommunityModeration() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-posts"] }); void qc.invalidateQueries({ queryKey: ["admin-comments"] }); void qc.invalidateQueries({ queryKey: ["admin-member-profiles"] }); };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => ((await supabase.from("posts").select("*, community_profiles(username,display_name)").gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(100)).data ?? []) as unknown as Post[],
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => ((await supabase.from("post_comments").select("*, community_profiles(username,display_name)").gte("created_at", weekAgo).order("created_at", { ascending: false }).limit(100)).data ?? []) as unknown as Comment[],
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
    const uid = verified ? (await supabase.auth.getUser()).data.user?.id ?? null : null;
    const { error } = await supabase.from("community_profiles").update({ verified, verified_at: verified ? new Date().toISOString() : null, verified_by: uid }).eq("id", id);
    await toastErr(error, verified ? "Badge granted" : "Badge removed"); refresh();
  };
  const [q, setQ] = useState("");
  const [mtype, setMtype] = useState("all");
  const [page, setPage] = useState(1);
  const [pPage, setPPage] = useState(1);
  const [cPage, setCPage] = useState(1);
  const PER = 50;
  const shown = profiles.filter(p => (mtype === "all" || p.member_type === mtype) && (`${p.display_name} ${p.username}`.toLowerCase().includes(q.toLowerCase())));
  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const mp = Math.min(page, pages);
  const pPages = Math.max(1, Math.ceil(posts.length / PER)); const pp = Math.min(pPage, pPages);
  const cPages = Math.max(1, Math.ceil(comments.length / PER)); const cp = Math.min(cPage, cPages);
  const link = "font-medium text-primary underline-offset-2 hover:underline";
  if (!posts) return <ListSkeleton />;
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Posts and comments from the past 7 days. Hide or restore them here, manage the verified member badge, or open a post in a new tab to hide or delete it directly on the community page.</p>
      <h3 className="mt-6 font-serif text-2xl text-primary">Posts (past week)</h3>
      {posts.length === 0 ? <p className="mt-2 text-muted-foreground">No posts in the past week.</p> : (
        <Table head={["Post", "Author", "Posted", "Visible"]}>{posts.slice((pp - 1) * PER, pp * PER).map(p => (
          <tr key={p.id} className="border-t border-border">
            <td className={td}><a href={`/community/post/${p.id}`} target="_blank" rel="noopener noreferrer" className={link}>{p.title} ↗</a><div className="max-w-md truncate text-xs text-muted-foreground">{p.body}</div></td>
            <td className={td}>{p.community_profiles?.display_name ?? "—"}</td>
            <td className={td}>{date(p.created_at)}</td>
            <td className={td}><select className={selSm} value={p.hidden ? "hidden" : "visible"} onChange={e => void toggle("posts", p.id, e.target.value === "hidden")}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></td>
          </tr>))}</Table>)}
      <Pager page={pp} total={pPages} count={posts.length} noun={posts.length === 1 ? "post" : "posts"} onPage={setPPage} />
      <h3 className="mt-10 font-serif text-2xl text-primary">Comments (past week)</h3>
      {comments.length === 0 ? <p className="mt-2 text-muted-foreground">No comments in the past week.</p> : (
        <Table head={["Comment", "Author", "Posted", "Visible"]}>{comments.slice((cp - 1) * PER, cp * PER).map(c => (
          <tr key={c.id} className="border-t border-border">
            <td className={`${td} max-w-md`}><a href={`/community/post/${c.post_id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.body}</a></td>
            <td className={td}>{c.community_profiles?.display_name ?? "—"}</td>
            <td className={td}>{date(c.created_at)}</td>
            <td className={td}><select className={selSm} value={c.hidden ? "hidden" : "visible"} onChange={e => void toggle("post_comments", c.id, e.target.value === "hidden")}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></td>
          </tr>))}</Table>)}
      <Pager page={cp} total={cPages} count={comments.length} noun={comments.length === 1 ? "comment" : "comments"} onPage={setCPage} />
      <h3 className="mt-10 font-serif text-2xl text-primary">Members & verified badges</h3>
      <p className="mt-1 text-sm text-muted-foreground">Every community member, sorted A to Z, 50 per page. Search by name to find someone fast. Give the Verified SOQ badge only to checked trainers and partner businesses.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm" placeholder="Search name or @username" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
        <select className={selSm} value={mtype} onChange={e => { setMtype(e.target.value); setPage(1); }}>
          <option value="all">All types</option><option value="trainer">Trainers</option><option value="business">Business</option><option value="student">Students</option><option value="alumni">Alumni</option><option value="member">Members</option>
        </select>
        <span className="self-center text-xs text-muted-foreground">{shown.length} of {profiles.length}</span>
      </div>
      {shown.length === 0 ? <p className="mt-2 text-muted-foreground">No matching members.</p> : (
        <Table head={["Member", "Type", "Verified"]}>{shown.slice((mp - 1) * PER, mp * PER).map(p => (
          <tr key={p.id} className="border-t border-border">
            <td className={td}><a href={`/community/u/${p.username}`} target="_blank" rel="noopener noreferrer" className={link}>{p.display_name}</a><div className="text-xs text-muted-foreground">@{p.username}</div></td>
            <td className={td}>{p.member_type}</td>
            <td className={td}><select className={selSm} value={p.verified ? "yes" : "no"} onChange={e => void setVerified(p.id, e.target.value === "yes")}><option value="yes">Verified</option><option value="no">Not verified</option></select></td>
          </tr>))}</Table>)}
      <Pager page={mp} total={pages} count={shown.length} noun={shown.length === 1 ? "member" : "members"} onPage={setPage} />
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
type EventRow = EventItem;
type Signup = { event_id: string; name: string; created_at: string; user_id: string };
const blankEv = { title: "", description: "", starts: "", ends: "", location: "10 Anson Road, International Plaza, Singapore", url: "", capacity: "30", category: "workshop", speaker: "", speaker_role: "", image_key: "", agenda: "", is_private: false };
const toLocal = (d: string | null) => d ? new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

export function EventsAdmin() {
  const qc = useQueryClient();
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-events"] }); void qc.invalidateQueries({ queryKey: ["admin-signups"] }); void qc.invalidateQueries({ queryKey: ["events"] }); };
  const { data: events } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => ((await supabase.from("events").select("*").order("starts_at", { ascending: false }).limit(200)).data ?? []) as EventRow[],
  });
  const { data: signups = [] } = useQuery({
    queryKey: ["admin-signups"],
    queryFn: async () => ((await supabase.from("event_signups").select("event_id,name,created_at,user_id").order("created_at").limit(1000)).data ?? []) as Signup[],
  });
  const [f, setF] = useState(blankEv);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [view, setView] = useState<"upcoming" | "past" | "calendar">("upcoming");
  const [roster, setRoster] = useState<string | null>(null);
  const save = async () => {
    if (!f.title.trim() || !f.starts || !f.location.trim()) { (await import("sonner")).toast.error("Add a title, start time and location"); return; }
    const row = { title: f.title.trim(), description: f.description, starts_at: new Date(f.starts).toISOString(), ends_at: f.ends ? new Date(f.ends).toISOString() : null, location: f.location, online_url: f.url || null, capacity: Number(f.capacity) || 30, category: f.category, speaker: f.speaker || null, speaker_role: f.speaker_role || null, image_key: f.image_key || null, agenda: f.agenda || null, is_private: f.is_private };
    let error;
    if (editing) ({ error } = await supabase.from("events").update(row).eq("id", editing));
    else { const uid = (await supabase.auth.getUser()).data.user?.id ?? ""; ({ error } = await supabase.from("events").insert({ ...row, created_by: uid })); }
    await toastErr(error, editing ? "Event updated" : "Event created");
    if (!error) { setF(blankEv); setEditing(null); setOpen(false); refresh(); }
  };
  const edit = (ev: EventRow) => { setEditing(ev.id); setOpen(true); setMore(!!(ev.ends_at || ev.online_url || ev.speaker || ev.image_key || ev.agenda)); setF({ title: ev.title, description: ev.description, starts: toLocal(ev.starts_at), ends: toLocal(ev.ends_at), location: ev.location, url: ev.online_url ?? "", capacity: String(ev.capacity), category: ev.category, speaker: ev.speaker ?? "", speaker_role: ev.speaker_role ?? "", image_key: ev.image_key ?? "", agenda: ev.agenda ?? "", is_private: !!ev.is_private }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (id: string) => {
    if (!confirm("Delete this event and its sign-up list?")) return;
    await supabase.from("event_signups").delete().eq("event_id", id);
    const { error } = await supabase.from("events").delete().eq("id", id);
    await toastErr(error, "Event deleted"); refresh();
  };
  const exportCsv = (ev: EventRow) => {
    const rows = [["Name", "Signed up"], ...signups.filter(s => s.event_id === ev.id).map(s => [s.name, date(s.created_at)])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }));
    a.download = `${ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-signups.csv`; a.click();
  };
  if (!events) return <ListSkeleton />;
  const now = Date.now();
  const list = events.filter(e => (new Date(e.starts_at).getTime() >= now) === (view === "upcoming"));
  if (view === "upcoming") list.reverse();
  const count = (id: string) => signups.filter(s => s.event_id === id).length;
  const upcoming = events.filter(e => new Date(e.starts_at).getTime() >= now);
  const seatsTaken = upcoming.reduce((n, e) => n + count(e.id), 0);
  const seatsTotal = upcoming.reduce((n, e) => n + e.capacity, 0);
  const lbl = "text-xs font-medium text-muted-foreground";
  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">Plan open houses, workshops and talks. Everything here appears on the public <a href="/events" target="_blank" rel="noreferrer" className="text-primary underline">Events page</a>.</p>
        <Button className="rounded-full" onClick={() => { setOpen(!open || !!editing); setEditing(null); setF(blankEv); setMore(false); }}>{open && !editing ? "Close" : "+ New event"}</Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[["Upcoming events", upcoming.length], ["Seats reserved", seatsTaken], ["Seats filled", seatsTotal ? `${Math.round(seatsTaken / seatsTotal * 100)}%` : "—"]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-border bg-card p-4"><p className={lbl}>{l}</p><p className="mt-1 text-2xl font-semibold text-primary">{v}</p></div>))}
      </div>
      {open && <div className="mt-5 rounded-lg border border-brand-gold/40 bg-card p-6">
        <h3 className="font-serif text-xl text-primary">{editing ? "Edit event" : "New event"}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={lbl}>Title</span><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={150} /></label>
          <label><span className={lbl}>Type</span><select className={`${sel} w-full`} value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{EVENT_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label><span className={lbl}>Seats</span><Input type="number" min={1} value={f.capacity} onChange={e => setF({ ...f, capacity: e.target.value })} /></label>
          <label><span className={lbl}>Starts</span><Input type="datetime-local" value={f.starts} onChange={e => setF({ ...f, starts: e.target.value })} /></label>
          <label><span className={lbl}>Location</span><Input value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></label>
          <label className="sm:col-span-2"><span className={lbl}>Description</span><Textarea value={f.description} onChange={e => setF({ ...f, description: e.target.value })} rows={2} /></label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={f.is_private} onChange={e => setF({ ...f, is_private: e.target.checked })} />Private event — hide from the website, homepage and Community (staff only)</label>
        </div>
        <button type="button" onClick={() => setMore(!more)} className="mt-3 text-sm font-medium text-primary underline underline-offset-2">{more ? "Hide extra details" : "More details — end time, online link, speaker, photo, agenda"}</button>
        {more && <div className="mt-3 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <label><span className={lbl}>Ends (optional)</span><Input type="datetime-local" value={f.ends} onChange={e => setF({ ...f, ends: e.target.value })} /></label>
          <label><span className={lbl}>Online link (makes it an online event)</span><Input value={f.url} onChange={e => setF({ ...f, url: e.target.value })} placeholder="https://" /></label>
          <label><span className={lbl}>Speaker</span><Input value={f.speaker} onChange={e => setF({ ...f, speaker: e.target.value })} /></label>
          <label><span className={lbl}>Speaker role</span><Input value={f.speaker_role} onChange={e => setF({ ...f, speaker_role: e.target.value })} placeholder="e.g. Academic Director" /></label>
          <label className="sm:col-span-2"><span className={lbl}>Cover photo</span>
            <div className="flex items-center gap-3"><img src={eventImage(f.image_key)} alt="" className="size-12 rounded object-cover" />
              <select className={`${sel} flex-1`} value={f.image_key} onChange={e => setF({ ...f, image_key: e.target.value })}><option value="">Default photo</option>{imageOptions.map(o => <option key={o.key} value={o.key}>{o.title}</option>)}</select></div></label>
          <label className="sm:col-span-2"><span className={lbl}>Agenda (one line per item, optional)</span><Textarea value={f.agenda} onChange={e => setF({ ...f, agenda: e.target.value })} rows={3} placeholder={"10:00 Welcome\n10:30 Demo"} /></label>
        </div>}
        <div className="mt-4 flex gap-2"><Button className="rounded-full" onClick={() => void save()}>{editing ? "Save changes" : "Create event"}</Button><Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); setF(blankEv); }}>Cancel</Button></div>
      </div>}
      <div className="mt-6 flex gap-2">{(["upcoming", "past", "calendar"] as const).map(v => <button key={v} onClick={() => setView(v)} className={`rounded-full border px-4 py-1.5 text-sm ${view === v ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{v === "upcoming" ? "Upcoming" : v === "past" ? "Past" : "Calendar"}</button>)}</div>
      {view === "calendar" ? <EventCalendar events={events} count={count} onEdit={edit} /> : list.length === 0 ? <p className="mt-6 text-muted-foreground">No {view} events.</p> : (
        <div className="mt-4 space-y-3">{list.map(ev => {
          const n = count(ev.id); const names = signups.filter(s => s.event_id === ev.id);
          return <div key={ev.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start gap-4">
              <img src={eventImage(ev.image_key)} alt="" className="size-16 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-brand-gold">{categoryLabel(ev.category)}{ev.online_url ? " · Online" : ""}</p>
                <p className="font-medium text-primary">{ev.title}{ev.is_private && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Private</span>}</p>
                <p className="text-xs text-muted-foreground">{timeRange(ev.starts_at, ev.ends_at)} · {ev.online_url ? "Online" : ev.location}{ev.speaker ? ` · ${ev.speaker}` : ""}</p>
                <div className="mt-2 flex items-center gap-2"><div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, n / ev.capacity * 100)}%` }} /></div><span className="text-xs">{n}/{ev.capacity} reserved</span></div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => setRoster(roster === ev.id ? null : ev.id)}>Sign-ups ({n})</Button>
                <Button size="sm" variant="outline" onClick={() => edit(ev)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(ev.id)}>Delete</Button>
              </div>
            </div>
            {roster === ev.id && <div className="mt-3 rounded-md bg-secondary p-3">
              {names.length === 0 ? <p className="text-sm text-muted-foreground">No sign-ups yet.</p> : <>
                <ol className="list-decimal space-y-0.5 pl-5 text-sm">{names.map(s => <li key={s.user_id}>{s.name} <span className="text-xs text-muted-foreground">· {date(s.created_at)}</span></li>)}</ol>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => exportCsv(ev)}>Download list (CSV)</Button></>}
            </div>}
          </div>;
        })}</div>)}
    </div>
  );
}

function EventCalendar({ events, count, onEdit }: { events: EventRow[]; count: (id: string) => number; onEdit: (e: EventRow) => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [pick, setPick] = useState<string | null>(null);
  const first = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const byDay = events.reduce<Record<string, EventRow[]>>((m, e) => { (m[key(new Date(e.starts_at))] ??= []).push(e); return m; }, {});
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const sel = events.find(e => e.id === pick);
  const today = key(new Date());
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button size="sm" variant="outline" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>&lt;</Button>
          <p className="font-serif text-xl text-primary">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          <Button size="sm" variant="outline" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>&gt;</Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <p key={d}>{d}</p>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">{cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = key(new Date(month.getFullYear(), month.getMonth(), d)); const list = byDay[k] ?? [];
          return <div key={i} className={`min-h-20 rounded-md border p-1 text-left ${k === today ? "border-brand-gold" : "border-border"}`}>
            <p className="text-xs text-muted-foreground">{d}</p>
            {list.map(e => <button key={e.id} onClick={() => setPick(e.id)} className={`mt-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[11px] ${pick === e.id ? "bg-primary text-primary-foreground" : e.is_private ? "bg-muted text-foreground" : "bg-brand-gold-soft text-primary"}`}>{new Date(e.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} {e.title}</button>)}
          </div>;
        })}</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        {!sel ? <p className="text-sm text-muted-foreground">Pick an event to see its date, speaker, venue and RSVPs.</p> : <>
          <p className="text-xs text-brand-gold">{categoryLabel(sel.category)}{sel.is_private ? " · Private" : ""}</p>
          <p className="mt-1 font-serif text-xl text-primary">{sel.title}</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-xs text-muted-foreground">When</dt><dd>{timeRange(sel.starts_at, sel.ends_at)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Speaker</dt><dd>{sel.speaker ? `${sel.speaker}${sel.speaker_role ? `, ${sel.speaker_role}` : ""}` : "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Venue</dt><dd>{sel.online_url ? "Online" : sel.location}</dd></div>
            <div><dt className="text-xs text-muted-foreground">RSVPs</dt><dd>{count(sel.id)} / {sel.capacity} seats reserved</dd></div>
          </dl>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => onEdit(sel)}>Edit event</Button>
        </>}
      </div>
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
  const { data: quizList = { quizzes: [], attempts: [] } } = useQuery({
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
  const { data: links = [] } = useQuery({
    queryKey: ["admin-trainer-links"],
    queryFn: async () => {
      const tc = ((await supabase.from("trainer_courses").select("trainer_id,course_slug")).data ?? []) as { trainer_id: string; course_slug: string }[];
      const ids = [...new Set(tc.map(t => t.trainer_id))];
      const profs = ids.length ? (((await supabase.from("profiles").select("id,full_name,email").in("id", ids)).data ?? []) as { id: string; full_name: string | null; email: string }[]) : [];
      const name = new Map(profs.map(p => [p.id, p.full_name || p.email]));
      return tc.map(t => ({ ...t, name: name.get(t.trainer_id) ?? "Trainer" }));
    },
  });
  const [trainer, setTrainer] = useState("");
  const [course, setCourse] = useState("");
  const trainersFor = (slug: string) => links.filter(l => l.course_slug === slug).map(l => l.name).join(", ") || "No trainer assigned";
  const trainerOptions = [...new Map(links.map(l => [l.trainer_id, l.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const allSlugs = [...new Set([...asgs.map(a => a.course_slug), ...(quizList?.quizzes ?? []).map(q => q.course_slug), ...attendance.map(a => a.live_sessions?.course_slug).filter(Boolean) as string[]])].sort((a, b) => courseTitle(a).localeCompare(courseTitle(b)));
  const show = (slug: string | undefined | null) => !!slug && (!course || slug === course) && (!trainer || links.some(l => l.trainer_id === trainer && l.course_slug === slug));
  const grade = async (id: string, patch: Partial<Sub>) => {
    const { error } = await supabase.from("assignment_submissions").update(patch).eq("id", id);
    await toastErr(error, "Submission graded"); refresh();
  };
  if (!asgs) return <ListSkeleton />;
  const shownAsgs = asgs.filter(a => show(a.course_slug));
  const shownQuizzes = (quizList?.quizzes ?? []).filter(q => show(q.course_slug));
  const shownAtt = attendance.filter(r => show(r.live_sessions?.course_slug));
  const selCls = "h-10 rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div>
      <p className="mt-4 text-muted-foreground">Assignments, quizzes and attendance across all courses, with the trainer for each course. Filter by trainer or course.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <select aria-label="Filter by trainer" className={selCls} value={trainer} onChange={e => setTrainer(e.target.value)}>
          <option value="">All trainers</option>{trainerOptions.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </select>
        <select aria-label="Filter by course" className={`${selCls} max-w-xs`} value={course} onChange={e => setCourse(e.target.value)}>
          <option value="">All courses</option>{allSlugs.map(s => <option key={s} value={s}>{courseTitle(s)}</option>)}
        </select>
        {(trainer || course) && <button className="text-sm text-primary underline" onClick={() => { setTrainer(""); setCourse(""); }}>Clear filters</button>}
      </div>
      <h3 className="mt-8 font-serif text-2xl text-primary">Assignments</h3>
      {shownAsgs.length === 0 ? <p className="mt-2 text-muted-foreground">No assignments match.</p> : (
        <div className="mt-5 space-y-3">{shownAsgs.map(a => <AssignmentCard key={a.id} a={a} trainers={trainersFor(a.course_slug)} onGrade={grade} />)}</div>)}
      <h3 className="mt-10 font-serif text-2xl text-primary">Quizzes</h3>
      {shownQuizzes.length ? (
        <Table head={["Course", "Trainer", "Quiz", "Pass mark", "Attempts", "Passes"]}>{shownQuizzes.map(q => (
          <tr key={q.id} className="border-t border-border">
            <td className={td}>{courseTitle(q.course_slug)}</td>
            <td className={td}>{trainersFor(q.course_slug)}</td>
            <td className={td}>{q.title}</td>
            <td className={td}>{q.pass_mark}%</td>
            <td className={td}>{quizList.attempts.filter(x => x.quiz_id === q.id).length}</td>
            <td className={td}>{quizList.attempts.filter(x => x.quiz_id === q.id && x.passed).length}</td>
          </tr>))}</Table>) : <p className="mt-2 text-muted-foreground">No quizzes match.</p>}
      <h3 className="mt-10 font-serif text-2xl text-primary">Attendance</h3>
      {shownAtt.length === 0 ? <p className="mt-2 text-muted-foreground">No attendance matches.</p> : (() => {
        const bySession = new Map<string, Att[]>();
        shownAtt.forEach(r => { const list = bySession.get(r.session_id) ?? []; list.push(r); bySession.set(r.session_id, list); });
        return (
          <Table head={["Class", "When", "Present", "Absent", "Excused"]}>{[...bySession.entries()].map(([sid, rows]) => {
            const meta = rows[0]?.live_sessions ?? null;
            return (
            <tr key={sid} className="border-t border-border">
              <td className={td}>{meta?.title ?? "Class"}<div className="text-xs text-muted-foreground">{meta ? `${courseTitle(meta.course_slug)} · ${trainersFor(meta.course_slug)}` : ""}</div></td>
              <td className={td}>{meta ? fmtDateTime(meta.starts_at) : "—"}</td>
              <td className={td}>{rows.filter(r => r.status === "present").length}</td>
              <td className={td}>{rows.filter(r => r.status === "absent").length}</td>
              <td className={td}>{rows.filter(r => r.status === "excused").length}</td>
            </tr>);
          })}</Table>);
      })()}
      <StaffSessionPlans />
    </div>
  );
}

function AssignmentCard({ a, trainers, onGrade }: { a: Asg; trainers: string; onGrade: (id: string, patch: Partial<Sub>) => Promise<void> }) {
  const { data = [] } = useQuery({
    queryKey: ["admin-submissions", a.id],
    queryFn: async () => ((await supabase.from("assignment_submissions").select("*").eq("assignment_id", a.id).order("created_at", { ascending: false })).data ?? []) as Sub[],
  });
  const [open, setOpen] = useState(false);
  const graded = data.filter(s => s.score !== null).length;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen(o => !o)}>
        <span><b>{a.title}</b><div className="text-xs text-muted-foreground">{courseTitle(a.course_slug)} · {trainers} · due {a.due_at ? date(a.due_at) : "no due date"} · max {a.max_score}</div></span>
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
