import { Home, Users, TrendingUp, Package } from "lucide-react";
import { StartHere, ListSkeleton } from "@/components/start-here";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell, type WorkspaceSection } from "@/components/workspace-shell";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";

type Member = { id: string; member_email: string; member_role: string };
type RosterRow = { member_email: string; full_name: string | null; course_slug: string | null; progress: number | null; status: string | null };
type Package = { name: string; student_seats: number; instructor_seats: number; expires_on: string | null };
type TeamCertificate = { student_id: string | null; student_name: string; course_slug: string; code: string; issued_on: string; status: string };
const courseName = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const date = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

function useBusiness(userId: string) {
  return useQuery({ queryKey: ["business", userId], queryFn: async () => {
    const [m, p, r] = await Promise.all([
      supabase.from("org_members").select("id,member_email,member_role").eq("org_id", userId),
      supabase.from("org_packages").select("name,student_seats,instructor_seats,expires_on").eq("org_id", userId).maybeSingle(),
      supabase.rpc("org_roster"),
    ]);
    if (m.error || p.error || r.error) throw new Error(m.error?.message ?? p.error?.message ?? r.error?.message);
    return { members: (m.data ?? []) as Member[], pkg: p.data as Package | null, roster: (r.data ?? []) as RosterRow[] };
  } });
}

function BusinessOverview({ userId, onNavigate }: { userId: string; onNavigate: (id: string) => void }) {
  const { data, isPending, error } = useBusiness(userId);
  if (isPending) return <p className="py-8 text-muted-foreground">Loading your business…</p>;
  if (error || !data) return <p role="alert" className="py-8 text-destructive">Couldn't load your business information.</p>;
  const learners = data.members.filter(m => m.member_role === "student");
  const teachers = data.members.filter(m => m.member_role === "instructor");
  const enrolments = data.roster.filter(r => r.course_slug && learners.some(m => m.member_email === r.member_email));
  const avg = enrolments.length ? Math.round(enrolments.reduce((sum, r) => sum + (r.progress ?? 0), 0) / enrolments.length) : 0;
  const expired = data.pkg?.expires_on && data.pkg.expires_on < new Date().toISOString().slice(0, 10);
  return <div className="mt-6 space-y-8">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Student seats", `${learners.length} / ${data.pkg?.student_seats ?? "—"}`],
      ["Instructor seats", `${teachers.length} / ${data.pkg?.instructor_seats ?? "—"}`],
      ["Course enrolments", String(enrolments.length)],
      ["Average progress", enrolments.length ? `${avg}%` : "—"],
    ].map(([label, value]) => <div key={label} className="border-t-2 border-brand-gold bg-secondary p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-serif text-4xl text-primary">{value}</p></div>)}</div>
    <section className="border-t border-border pt-6"><h2 className="font-serif text-2xl text-primary">{data.pkg?.name ?? "No package assigned"}</h2><p className="mt-1 text-sm text-muted-foreground">{data.pkg ? data.pkg.expires_on ? `${expired ? "Expired" : "Valid until"} ${date(data.pkg.expires_on)}` : "No expiry date" : "Ask SOQ staff to set up your business package before adding members."}</p>
      <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => onNavigate("members")}>Manage team</Button><Button variant="outline" onClick={() => onNavigate("progress")}>View learning progress</Button><Button asChild variant="outline"><Link to="/businesses">Explore business training</Link></Button></div>
    </section>
    <section className="border-t border-border pt-6"><h2 className="font-serif text-2xl text-primary">Recent learner progress</h2>{enrolments.length ? <ul className="mt-4 divide-y divide-border">{enrolments.slice(0, 6).map((r, i) => <li key={`${r.member_email}-${r.course_slug}-${i}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{r.full_name || r.member_email} · {courseName(r.course_slug ?? "")}</span><strong>{r.progress ?? 0}%</strong></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">No linked course enrolments yet.</p>}</section>
  </div>;
}

function Team({ userId, role }: { userId: string; role: "student" | "instructor" }) {
  const qc = useQueryClient();
  const { data, isPending, error } = useBusiness(userId);
  const [email, setEmail] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (isPending) return <p className="py-8 text-muted-foreground">Loading team…</p>;
  if (error || !data) return <p role="alert" className="py-8 text-destructive">Couldn't load your team.</p>;
  const members = data.members.filter(m => m.member_role === role);
  const cap = role === "student" ? data.pkg?.student_seats ?? 0 : data.pkg?.instructor_seats ?? 0;
  const expired = !!data.pkg?.expires_on && data.pkg.expires_on < new Date().toISOString().slice(0, 10);
  const refresh = () => void qc.invalidateQueries({ queryKey: ["business", userId] });
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error: err } = await supabase.rpc("org_add_member", { _email: email.trim().toLowerCase(), _role: role });
    setBusy(false);
    if (err) toast.error(err.message); else { setEmail(""); refresh(); toast.success("Member added"); }
  };
  const addBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const addresses = [...new Set(bulk.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean))];
    if (!addresses.length || addresses.some(s => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) return void toast.error("Enter valid email addresses, separated by commas or new lines.");
    setBusy(true);
    let added = 0;
    for (const address of addresses) {
      const { error: err } = await supabase.rpc("org_add_member", { _email: address, _role: role });
      if (err) { toast.error(`${address}: ${err.message}`); break; }
      added++;
    }
    setBusy(false); refresh();
    if (added) toast.success(`${added} ${role}${added === 1 ? "" : "s"} added`);
    if (added === addresses.length) { setBulk(""); setShowBulk(false); }
    else setBulk(addresses.slice(added).join("\n"));
  };
  return <div className="mt-6 space-y-7">
    <div className="border-b border-border pb-5"><p className="text-sm text-muted-foreground">{members.length} of {cap} {role} seats used{expired ? " · Package expired" : ""}</p><div className="mt-2 h-2 w-full max-w-lg bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${cap ? Math.min(100, members.length / cap * 100) : 0}%` }} /></div></div>
    <form onSubmit={e => void add(e)} className="flex max-w-xl flex-wrap gap-2"><Input type="email" required aria-label={`${role} email`} placeholder={`${role === "student" ? "Student" : "Instructor"} email address`} value={email} onChange={e => setEmail(e.target.value)} className="min-w-48 flex-1" /><Button type="submit" disabled={!data.pkg || expired || members.length >= cap || busy}>Add {role}</Button></form>
    <div><Button type="button" variant="link" className="p-0" onClick={() => setShowBulk(!showBulk)}>{showBulk ? "Hide bulk add" : "Add several by email"}</Button>{showBulk && <form onSubmit={e => void addBulk(e)} className="mt-3 max-w-xl space-y-2"><label htmlFor={`bulk-${role}`} className="text-sm font-medium">Email addresses (one per line or comma-separated)</label><textarea id={`bulk-${role}`} value={bulk} onChange={e => setBulk(e.target.value)} className="min-h-28 w-full rounded-md border border-input bg-background p-3 text-sm" placeholder="person1@example.com&#10;person2@example.com" /><Button type="submit" disabled={!data.pkg || expired || members.length >= cap || busy}>Add team members</Button><p className="text-xs text-muted-foreground">Package seat limits are checked for every member. Adding someone links their existing SOQ account by email; it does not create an account or send an invitation.</p></form>}</div>
    {!data.pkg && <p className="text-sm text-muted-foreground">SOQ staff must assign a package before you can add team members.</p>}
    {members.length ? <ul className="divide-y divide-border border-t border-border">{members.map(member => {
      const rows = data.roster.filter(r => r.member_email === member.member_email && r.course_slug);
      return <li key={member.id} className="flex flex-wrap items-start justify-between gap-3 py-4"><div><p className="font-medium">{data.roster.find(r => r.member_email === member.member_email)?.full_name || member.member_email}</p><p className="text-xs text-muted-foreground">{member.member_email}</p>{rows.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{rows.length} course enrolment{rows.length === 1 ? "" : "s"}</p>}</div><Button size="sm" variant="outline" onClick={async () => { const { error: err } = await supabase.from("org_members").delete().eq("id", member.id).eq("org_id", userId); if (err) toast.error(err.message); else refresh(); }}>Remove</Button></li>;
    })}</ul> : <p className="text-sm text-muted-foreground">No {role}s added yet.</p>}
  </div>;
}

function TeamProgress({ userId }: { userId: string }) {
  const { data, isPending, error } = useBusiness(userId);
  if (isPending) return <p className="py-8 text-muted-foreground">Loading progress…</p>;
  if (error || !data) return <p role="alert" className="py-8 text-destructive">Couldn't load progress.</p>;
  const learners = data.members.filter(m => m.member_role === "student");
  return <div className="mt-6 space-y-7">{learners.length ? learners.map(m => {
    const rows = data.roster.filter(r => r.member_email === m.member_email && r.course_slug);
    return <section key={m.id} className="border-t border-border pt-5"><h2 className="font-serif text-2xl text-primary">{data.roster.find(r => r.member_email === m.member_email)?.full_name || m.member_email}</h2><p className="text-xs text-muted-foreground">{m.member_email}</p>{rows.length ? <ul className="mt-4 space-y-4">{rows.map((r, i) => <li key={`${r.course_slug}-${i}`}><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{courseName(r.course_slug ?? "")}</span><span>{r.progress ?? 0}% · {r.status ?? "Active"}</span></div><div className="mt-2 h-2 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, Math.max(0, r.progress ?? 0))}%` }} /></div></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No linked course enrolments. The learner must register using this email address.</p>}</section>;
  }) : <p className="text-sm text-muted-foreground">Add students to your team to track their learning.</p>}</div>;
}

function TeamCertificates({ userId }: { userId: string }) {
  const { data, isPending, error } = useQuery({ queryKey: ["business-certificates", userId], queryFn: async () => {
    const members = await supabase.from("org_members").select("member_email,member_role").eq("org_id", userId);
    if (members.error) throw members.error;
    const emails = (members.data ?? []).filter(m => m.member_role === "student").map(m => m.member_email);
    if (!emails.length) return [] as TeamCertificate[];
    const people = await supabase.from("profiles").select("id,email").in("email", emails);
    if (people.error) throw people.error;
    const ids = (people.data ?? []).map(p => p.id);
    if (!ids.length) return [] as TeamCertificate[];
    const certs = await supabase.from("certificates").select("student_id,student_name,course_slug,code,issued_on,status").in("student_id", ids).order("issued_on", { ascending: false });
    if (certs.error) throw certs.error;
    return certs.data as TeamCertificate[];
  } });
  if (isPending) return <ListSkeleton />;
  if (error) return <p role="alert" className="py-8 text-destructive">Couldn't load team certificates.</p>;
  return <div className="mt-6">{data?.length ? <ul className="divide-y divide-border border-t border-border">{data.map(c => <li key={c.code} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><div><p className="font-medium">{c.student_name} · {courseName(c.course_slug)}</p><p className="text-muted-foreground">{c.code} · {date(c.issued_on)} · {c.status}</p></div><Button asChild size="sm" variant="outline"><Link to="/verify-certificate" search={{ code: c.code }}>Verify</Link></Button></li>)}</ul> : <p className="text-sm text-muted-foreground">No certificates have been issued for your linked students yet.</p>}</div>;
}

export function BusinessWorkspace({ userId }: { userId: string }) {
  const [active, setActive] = useState("start");
  const sections: WorkspaceSection[] = [
    { name: "Home", icon: Home, items: [{ id: "start", label: "Home", content: <StartHere role="business" userId={userId} onNavigate={setActive} greeting="Manage your team's training in one place." /> }] },
    { name: "Team", icon: Users, items: [{ id: "members", label: "Employees", content: <Team userId={userId} role="student" /> }, { id: "instructors", label: "In-house instructors", content: <Team userId={userId} role="instructor" /> }] },
    { name: "Progress", icon: TrendingUp, items: [{ id: "progress", label: "Course progress", content: <TeamProgress userId={userId} /> }, { id: "certificates", label: "Certificates", content: <TeamCertificates userId={userId} /> }] },
    { name: "Package", icon: Package, items: [{ id: "package", label: "Package & seats", content: <BusinessOverview userId={userId} onNavigate={setActive} /> }] },
  ];
  return <WorkspaceShell title="Business workspace" sections={sections} active={active} onChange={setActive} aliases={{ overview: "start" }} />;
}