import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/learning";

type Booking = { id: string; session_id: string; student_id: string; student_name: string; status: string };
type Pending = Booking & { live_sessions: { title: string; starts_at: string; trainer_id: string } };

const statusText: Record<string, string> = { requested: "Waiting for trainer to confirm", confirmed: "Seat confirmed", declined: "Trainer couldn't fit you in", cancelled: "You cancelled" };

/** Student: request a seat on a trainer's offered date, see status, cancel. */
export function SessionBookButton({ sessionId, userId, startsAt }: { sessionId: string; userId: string; startsAt: string }) {
  const qc = useQueryClient();
  const key = ["my-booking", sessionId, userId];
  const { data: b } = useQuery({ queryKey: key, queryFn: async () => ((await supabase.from("session_bookings").select("*").eq("session_id", sessionId).eq("student_id", userId).maybeSingle()).data ?? null) as Booking | null });
  const past = new Date(startsAt).getTime() < Date.now();
  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const request = async () => {
    let error;
    if (b) ({ error } = await supabase.from("session_bookings").update({ status: "requested" }).eq("id", b.id));
    else {
      const { data: p } = await supabase.from("profiles").select("full_name,email").eq("id", userId).maybeSingle();
      ({ error } = await supabase.from("session_bookings").insert({ session_id: sessionId, student_id: userId, student_name: p?.full_name || p?.email || "Student" }));
    }
    if (error) return void toast.error(error.message);
    toast.success("Request sent. Your trainer will confirm."); refresh();
  };
  const cancel = async () => { if (!b) return; const { error } = await supabase.from("session_bookings").update({ status: "cancelled" }).eq("id", b.id); if (error) toast.error(error.message); refresh(); };
  if (past && !b) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      {b && <span className={`rounded-full px-2 py-0.5 ${b.status === "confirmed" ? "bg-brand-gold/25 text-primary" : "bg-secondary text-muted-foreground"}`}>{statusText[b.status] ?? b.status}</span>}
      {!past && (!b || b.status === "cancelled") && <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => void request()}>Request a seat</Button>}
      {!past && b && (b.status === "requested" || b.status === "confirmed") && <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => void cancel()}>Cancel</Button>}
    </div>
  );
}

async function decide(id: string, status: "confirmed" | "declined") {
  const { error } = await supabase.from("session_bookings").update({ status }).eq("id", id);
  if (error) toast.error(error.message); else toast.success(status === "confirmed" ? "Seat confirmed" : "Request declined");
}

/** Trainer: bookings for one session with confirm/decline. */
export function SessionRequests({ sessionId }: { sessionId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["session-bookings", sessionId], queryFn: async () => ((await supabase.from("session_bookings").select("*").eq("session_id", sessionId).in("status", ["requested", "confirmed"]).order("created_at")).data ?? []) as Booking[] });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["session-bookings"] }); void qc.invalidateQueries({ queryKey: ["pending-bookings"] }); };
  const confirmed = data.filter(b => b.status === "confirmed").length;
  if (data.length === 0) return <p className="mt-1 text-xs text-muted-foreground">No seat requests yet.</p>;
  return (
    <div className="mt-2 space-y-1 text-xs">
      <p className="font-medium">{confirmed} confirmed</p>
      {data.map(b => <div key={b.id} className="flex items-center justify-between gap-2"><span>{b.student_name}</span>{b.status === "requested" ? <span className="flex gap-2"><Button size="sm" className="h-6 rounded-full px-2 text-xs" onClick={async () => { await decide(b.id, "confirmed"); refresh(); }}>Confirm</Button><Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={async () => { await decide(b.id, "declined"); refresh(); }}>Decline</Button></span> : <span className="text-muted-foreground">Confirmed</span>}</div>)}
    </div>
  );
}

/** Trainer: every pending seat request across their upcoming classes. */
export function PendingSeatRequests({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["pending-bookings", userId], queryFn: async () => ((await supabase.from("session_bookings").select("*, live_sessions!inner(title,starts_at,trainer_id)").eq("status", "requested").eq("live_sessions.trainer_id", userId).gte("live_sessions.starts_at", new Date().toISOString()).order("created_at")).data ?? []) as unknown as Pending[] });
  if (data.length === 0) return null;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["pending-bookings"] }); void qc.invalidateQueries({ queryKey: ["session-bookings"] }); };
  return (
    <div className="rounded-lg border border-brand-gold bg-secondary p-4 text-sm">
      <p className="font-medium text-primary">Seat requests to confirm ({data.length})</p>
      <ul className="mt-2 space-y-2">{data.map(b => (
        <li key={b.id} className="flex flex-wrap items-center justify-between gap-2"><span><b>{b.student_name}</b> · {b.live_sessions.title} · {fmtDateTime(b.live_sessions.starts_at)}</span>
          <span className="flex gap-2"><Button size="sm" className="h-7 rounded-full text-xs" onClick={async () => { await decide(b.id, "confirmed"); refresh(); }}>Confirm</Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={async () => { await decide(b.id, "declined"); refresh(); }}>Decline</Button></span></li>))}</ul>
    </div>
  );
}
