import { ListSkeleton } from "@/components/start-here";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { money } from "@/lib/cart";

const title = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const Box = ({ children }: { children: React.ReactNode }) => <div className="space-y-3 rounded-lg border border-border bg-card p-5">{children}</div>;
const H = ({ children }: { children: React.ReactNode }) => <h3 className="font-serif text-2xl text-primary">{children}</h3>;
const d = (s: string) => new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

/* ---------- Staff access requests ---------- */
export function StaffRequests() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["staff-requests"], queryFn: async () => (await supabase.from("staff_requests").select("*").order("created_at", { ascending: false })).data ?? [] });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["staff-requests"] }); void qc.invalidateQueries({ queryKey: ["admin-users"] }); };
  const decide = async (r: (typeof data)[number], ok: boolean) => {
    if (ok) {
      const { error } = await supabase.from("user_roles").insert({ user_id: r.user_id, role: "staff" as never });
      if (error && !/duplicate/i.test(error.message)) { toast.error(error.message); return; }
    }
    await supabase.from("staff_requests").update({ status: ok ? "approved" : "rejected" }).eq("id", r.id);
    toast.success(ok ? `${r.email} is now staff` : "Request rejected"); refresh();
  };
  return (
    <Box><H>Staff access requests ({data.filter(r => r.status === "pending").length} waiting)</H>
      <p className="text-sm text-muted-foreground">People ask for staff access from their student portal. Approving gives them full staff access.</p>
      {data.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet.</p> :
        <ul className="divide-y divide-border text-sm">{data.map(r => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span><b>{r.full_name || r.email}</b> · {r.email}<span className="block text-xs text-muted-foreground">{d(r.created_at)}{r.reason ? ` · ${r.reason}` : ""}</span></span>
            {r.status === "pending" ? <span className="flex gap-2"><Button size="sm" className="rounded-full" onClick={() => void decide(r, true)}>Approve</Button><Button size="sm" variant="outline" className="rounded-full" onClick={() => void decide(r, false)}>Reject</Button></span>
              : <span className="text-xs uppercase text-muted-foreground">{r.status}</span>}
          </li>))}</ul>}
    </Box>
  );
}

/* ---------- Student can ask for staff access ---------- */
export function RequestStaffAccess({ userId, email, name }: { userId: string; email: string; name?: string | null }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false); const [reason, setReason] = useState("");
  const { data: mine } = useQuery({ queryKey: ["my-staff-request", userId], queryFn: async () => (await supabase.from("staff_requests").select("status").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()).data });
  if (mine?.status === "pending") return <p className="text-sm text-muted-foreground">Your staff access request is waiting for approval.</p>;
  if (!open) return <button className="text-sm text-primary underline" onClick={() => setOpen(true)}>SOQ staff member? Request staff access</button>;
  return (
    <div className="max-w-md space-y-2">
      <Textarea placeholder="Your role at SOQ" value={reason} onChange={e => setReason(e.target.value)} />
      <Button size="sm" className="rounded-full" onClick={async () => {
        const { error } = await supabase.from("staff_requests").insert({ user_id: userId, email, full_name: name ?? null, reason: reason || null });
        if (error) toast.error(error.message); else { toast.success("Request sent"); setOpen(false); void qc.invalidateQueries({ queryKey: ["my-staff-request", userId] }); }
      }}>Send request</Button>
    </div>
  );
}

/* ---------- One student: progress + payments ---------- */
export function StudentOverview({ studentId }: { studentId: string }) {
  const { data } = useQuery({
    queryKey: ["student-overview", studentId],
    queryFn: async () => {
      const [e, o, b, i] = await Promise.all([
        supabase.from("enrollments").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("user_id", studentId).order("created_at", { ascending: false }),
        supabase.from("bank_payments").select("*").eq("user_id", studentId).order("created_at", { ascending: false }),
        supabase.from("instalments").select("*").eq("user_id", studentId).order("due_date"),
      ]);
      return { enr: e.data ?? [], orders: o.data ?? [], bank: b.data ?? [], inst: i.data ?? [] };
    },
  });
  if (!data) return <ListSkeleton />;
  const paid = data.orders.filter(x => x.status === "paid").reduce((s, x) => s + Number(x.total), 0) + data.bank.filter(x => x.status === "approved").reduce((s, x) => s + Number(x.total), 0);
  const owing = data.inst.filter(x => !x.paid).reduce((s, x) => s + Number(x.amount), 0);
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Box><H>Course progress</H>
        {data.enr.length === 0 ? <p className="text-sm text-muted-foreground">Not enrolled in any course.</p> :
          <ul className="space-y-3 text-sm">{data.enr.map(x => (
            <li key={x.id}><div className="flex justify-between"><b>{title(x.course_slug)}</b><span className="text-muted-foreground">{x.progress}% · {x.status}</span></div>
              <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${x.progress}%` }} /></div></li>))}</ul>}
      </Box>
      <Box><H>Payments</H>
        <p className="text-sm">Paid: <b>{money(paid)}</b> · Still owing on instalments: <b>{money(owing)}</b></p>
        <ul className="divide-y divide-border text-sm">
          {data.orders.map(x => <li key={x.id} className="flex justify-between py-2"><span>Card checkout · {d(x.created_at)}</span><span>{money(Number(x.total))} · {x.status}</span></li>)}
          {data.bank.map(x => <li key={x.id} className="flex justify-between py-2"><span>{x.method} ({x.plan}) · {d(x.created_at)}</span><span>{money(Number(x.total))} · {x.status}</span></li>)}
          {data.inst.map(x => <li key={x.id} className="flex justify-between py-2 text-muted-foreground"><span>Instalment {x.seq} due {d(x.due_date)}</span><span>{money(Number(x.amount))} · {x.paid ? "paid" : "unpaid"}</span></li>)}
        </ul>
        {data.orders.length + data.bank.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
      </Box>
    </div>
  );
}

/* ---------- Organization: manage instructors & students within package ---------- */
export function OrgRoster() {
  const qc = useQueryClient();
  const [email, setEmail] = useState(""); const [role, setRole] = useState<"student" | "instructor">("student");
  const { data: roster = [] } = useQuery({ queryKey: ["org-roster"], queryFn: async () => ((await supabase.rpc("org_roster" as never)).data ?? []) as { member_email: string; full_name: string | null; course_slug: string | null; progress: number | null; status: string | null }[] });
  const { data: members = [] } = useQuery({ queryKey: ["org-members-own"], queryFn: async () => ((await supabase.from("org_members" as never).select("id, member_email, member_role")).data ?? []) as unknown as { id: string; member_email: string; member_role: string }[] });
  const { data: pkg } = useQuery({ queryKey: ["org-package"], queryFn: async () => ((await supabase.from("org_packages" as never).select("*").maybeSingle()).data ?? null) as { name: string; student_seats: number; instructor_seats: number; expires_on: string | null } | null });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["org-roster"] }); void qc.invalidateQueries({ queryKey: ["org-members-own"] }); };
  const used = (r: string) => members.filter(m => m.member_role === r).length;
  const expired = !!pkg?.expires_on && new Date(pkg.expires_on) < new Date(new Date().toDateString());
  const add = async () => {
    const { error } = await supabase.rpc("org_add_member" as never, { _email: email, _role: role } as never);
    if (error) toast.error(error.message); else { toast.success("Member added"); setEmail(""); refresh(); }
  };
  const remove = async (id: string) => { const { error } = await supabase.from("org_members" as never).delete().eq("id", id); if (error) toast.error(error.message); else refresh(); };
  const list = (r: "student" | "instructor") => members.filter(m => m.member_role === r);
  const course = (e: string) => roster.filter(x => x.member_email === e && x.course_slug).map(x => `${title(x.course_slug!)} · ${x.progress ?? 0}%`).join(", ");
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-10 lg:px-8">
      <Box><H>Organization package</H>
        {!pkg ? <p className="text-sm text-muted-foreground">No package yet. Ask SOQ staff to set up your seats.</p> :
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p><b>{pkg.name}</b><span className="block text-muted-foreground">{pkg.expires_on ? `${expired ? "Expired" : "Valid until"} ${d(pkg.expires_on)}` : "No expiry"}</span></p>
            <p>Students: <b>{used("student")} / {pkg.student_seats}</b></p>
            <p>Instructors: <b>{used("instructor")} / {pkg.instructor_seats}</b></p>
          </div>}
      </Box>
      <Box><H>Add a member</H>
        <p className="text-sm text-muted-foreground">Add by email. They sign up (or sign in) with the same email to appear with their progress.</p>
        <div className="flex flex-wrap gap-2">
          <input className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={role} onChange={e => setRole(e.target.value as "student")}><option value="student">Student</option><option value="instructor">Instructor</option></select>
          <Button className="rounded-full" disabled={!email.includes("@") || !pkg || expired} onClick={() => void add()}>Add</Button>
        </div>
      </Box>
      {(["student", "instructor"] as const).map(r => (
        <Box key={r}><H>{r === "student" ? "Students" : "Instructors"} ({list(r).length})</H>
          {list(r).length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> :
            <ul className="divide-y divide-border text-sm">{list(r).map(m => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><b>{roster.find(x => x.member_email === m.member_email)?.full_name || m.member_email}</b> · {m.member_email}{r === "student" && <span className="block text-xs text-muted-foreground">{course(m.member_email) || "Not enrolled yet"}</span>}</span>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => void remove(m.id)}>Remove</Button>
              </li>))}</ul>}
        </Box>))}
    </div>
  );
}

function OrgPackageAdmin() {
  const [org, setOrg] = useState(""); const [name, setName] = useState("Standard");
  const [s, setS] = useState(10); const [i, setI] = useState(2); const [exp, setExp] = useState("");
  const save = async () => {
    const { data: p } = await supabase.from("profiles").select("id").ilike("email", org.trim()).maybeSingle();
    if (!p) { toast.error("No account with that organization email"); return; }
    const { error } = await supabase.from("org_packages" as never).upsert({ org_id: p.id, name, student_seats: s, instructor_seats: i, expires_on: exp || null, updated_at: new Date().toISOString() } as never);
    if (error) toast.error(error.message); else toast.success("Package saved");
  };
  const inp = "h-10 rounded-md border border-input bg-background px-3 text-sm";
  return (
    <Box><H>Organization packages</H>
      <p className="text-sm text-muted-foreground">Set how many students and instructors a company can add itself, and until when.</p>
      <input className={`${inp} w-full`} placeholder="Organization account email" value={org} onChange={e => setOrg(e.target.value)} />
      <div className="grid gap-2 sm:grid-cols-4">
        <label className="text-xs">Package name<input className={`${inp} w-full`} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="text-xs">Student seats<input type="number" className={`${inp} w-full`} value={s} onChange={e => setS(+e.target.value)} /></label>
        <label className="text-xs">Instructor seats<input type="number" className={`${inp} w-full`} value={i} onChange={e => setI(+e.target.value)} /></label>
        <label className="text-xs">Expires on<input type="date" className={`${inp} w-full`} value={exp} onChange={e => setExp(e.target.value)} /></label>
      </div>
      <Button className="rounded-full" onClick={() => void save()}>Save package</Button>
    </Box>
  );
}

export function OrgMembersAdmin() {
  const qc = useQueryClient();
  const [org, setOrg] = useState(""); const [emails, setEmails] = useState("");
  const add = async () => {
    const { data: p } = await supabase.from("profiles").select("id").ilike("email", org.trim()).maybeSingle();
    if (!p) { toast.error("No account with that organization email"); return; }
    const rows = emails.split(/[\s,]+/).filter(e => e.includes("@")).map(member_email => ({ org_id: p.id, member_email: member_email.toLowerCase() }));
    const { error } = await supabase.from("org_members" as never).upsert(rows as never, { ignoreDuplicates: true } as never);
    if (error) toast.error(error.message); else { toast.success(`${rows.length} linked`); setEmails(""); void qc.invalidateQueries(); }
  };
  return (
    <div className="space-y-6"><OrgPackageAdmin />
    <Box><H>Organization employees</H>
      <p className="text-sm text-muted-foreground">Link a company account to the employees it sponsors. The company then sees their course progress in its portal. The account must have the Organization role (Users & roles).</p>
      <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Organization account email" value={org} onChange={e => setOrg(e.target.value)} />
      <Textarea placeholder="Employee emails, one per line" value={emails} onChange={e => setEmails(e.target.value)} />
      <Button className="rounded-full" onClick={() => void add()}>Link employees</Button>
    </Box></div>
  );
}
