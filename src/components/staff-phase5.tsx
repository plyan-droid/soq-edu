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
      const { error } = await supabase.from("user_roles").insert({ user_id: r.user_id, role: "admin" });
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
  if (!data) return <p className="mt-6 text-muted-foreground">Loading…</p>;
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
