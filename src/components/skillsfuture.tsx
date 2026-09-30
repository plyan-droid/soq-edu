import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { money } from "@/lib/cart";

const title = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const priceOf = (s: string) => Number(String((courses.find(c => c.slug === s) as { price?: unknown } | undefined)?.price ?? "0").replace(/[^0-9.]/g, "")) || 0;
type Claim = { id: string; course_slug: string; course_fee: number; sfc_amount: number; status: string; claim_ref: string | null; student_email: string; user_id: string | null };
/** Credit counts as used unless the claim was rejected. */
export const usedCredit = (claims: Claim[]) => claims.filter(c => c.status !== "rejected").reduce((s, c) => s + Number(c.sfc_amount), 0);
const STATUS: Record<string, string> = { submitted: "Waiting for SOQ", approved: "Approved", paid: "Paid out", rejected: "Rejected" };

export function MySkillsFuture({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const key = ["my-sfc", userId];
  const { data } = useQuery({ queryKey: key, queryFn: async () => {
    const [b, c] = await Promise.all([
      supabase.from("sfc_balances").select("balance,verified_at").eq("user_id", userId).maybeSingle(),
      supabase.from("sfc_claims").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    return { balance: b.data ? Number(b.data.balance) : null, verified: !!b.data?.verified_at, claims: (c.data ?? []) as Claim[] };
  } });
  const [bal, setBal] = useState("");
  const [f, setF] = useState({ course: courses[0]!.slug, amount: "", ref: "" });
  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const balance = data?.balance ?? null;
  const left = balance === null ? null : Math.max(0, balance - usedCredit(data?.claims ?? []));
  const fee = priceOf(f.course);

  const saveBal = async () => {
    const n = Number(bal); if (!(n >= 0) || n > 100000) { toast.error("Enter your credit balance in dollars"); return; }
    const { error } = await supabase.from("sfc_balances").upsert({ user_id: userId, email, balance: n, updated_at: new Date().toISOString() });
    if (error) toast.error("Couldn't save your balance"); else { setBal(""); refresh(); }
  };
  const apply = async () => {
    const amt = Number(f.amount);
    if (!(amt > 0)) { toast.error("Enter how much credit to use"); return; }
    if (amt > fee) { toast.error("You can't use more credit than the course fee"); return; }
    if (left !== null && amt > left) { toast.error(`You only have ${money(left)} credit left`); return; }
    const { error } = await supabase.from("sfc_claims").insert({ user_id: userId, student_email: email, course_slug: f.course, course_fee: fee, sfc_amount: amt, claim_ref: f.ref.trim().slice(0, 60) || null, status: "submitted" });
    if (error) toast.error("Couldn't send your claim"); else { toast.success("Sent. SOQ will check it with SkillsFuture."); setF({ ...f, amount: "", ref: "" }); refresh(); }
  };

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
      <h2 className="flex items-center gap-2 font-serif text-3xl text-primary"><Wallet className="size-6 text-brand-gold" /> My SkillsFuture Credit</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="rounded-md bg-brand-cream p-4">
            <p className="text-sm text-muted-foreground">Credit left</p>
            <p className="font-serif text-4xl text-primary">{left === null ? "—" : money(left)}</p>
            {balance !== null && <p className={`text-xs font-medium ${data?.verified ? "text-primary" : "text-muted-foreground"}`}>{data?.verified ? "Verified by SOQ" : "Self-reported · waiting for SOQ to verify"}</p>}
            {balance !== null && <p className="text-xs text-muted-foreground">From {money(balance)} · {money(usedCredit(data?.claims ?? []))} used or waiting</p>}
          </div>
          <label className="block text-sm">{balance === null ? "Your balance on MySkillsFuture (S$)" : "Update your balance (S$)"}
            <div className="mt-1 flex gap-2"><Input type="number" min={0} value={bal} onChange={e => setBal(e.target.value)} placeholder="e.g. 500" /><Button variant="outline" onClick={() => void saveBal()}>Save</Button></div></label>
          <p className="text-xs text-muted-foreground">Check your balance at myskillsfuture.gov.sg. SOQ confirms every claim before it counts.</p>
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h3 className="font-serif text-2xl text-primary">Use credit on a course</h3>
          <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.course} onChange={e => setF({ ...f, course: e.target.value })}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Credit to use (S$)<Input type="number" min={0} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></label>
            <label className="block text-sm">Claim number (optional)<Input value={f.ref} onChange={e => setF({ ...f, ref: e.target.value })} placeholder="From MySkillsFuture" /></label>
          </div>
          <p className="text-sm">Course fee {money(fee)} · You pay <b>{money(Math.max(0, fee - (Number(f.amount) || 0)))}</b></p>
          <Button className="rounded-full" onClick={() => void apply()}>Apply credit</Button>
          {(data?.claims.length ?? 0) > 0 && <ul className="divide-y divide-border border-t border-border text-sm">{data!.claims.map(c => (
            <li key={c.id} className="flex justify-between gap-3 py-2"><span>{title(c.course_slug)}<span className="block text-xs text-muted-foreground">{money(Number(c.sfc_amount))} credit</span></span><span className={`text-xs ${c.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>{STATUS[c.status] ?? c.status}</span></li>))}</ul>}
        </div>
      </div>
    </section>
  );
}

/* Admin: each student's balance and credit left */
export function SfcBalancesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["sfc-balances"], queryFn: async () => {
    const [b, c] = await Promise.all([supabase.from("sfc_balances").select("*"), supabase.from("sfc_claims").select("*")]);
    return { balances: b.data ?? [], claims: (c.data ?? []) as Claim[] };
  } });
  const [edit, setEdit] = useState<Record<string, string>>({});
  const rows = (data?.balances ?? []).map(b => {
    const used = usedCredit((data?.claims ?? []).filter(c => c.user_id === b.user_id || c.student_email.toLowerCase() === b.email.toLowerCase()));
    return { ...b, used, left: Math.max(0, Number(b.balance) - used) };
  }).sort((a, b) => a.email.localeCompare(b.email));
  const save = async (id: string) => {
    const n = Number(edit[id]); if (!(n >= 0)) return;
    const { error } = await supabase.from("sfc_balances").update({ balance: n, updated_at: new Date().toISOString() }).eq("user_id", id);
    if (error) toast.error(error.message); else { setEdit(e => ({ ...e, [id]: "" })); void qc.invalidateQueries({ queryKey: ["sfc-balances"] }); }
  };
  const verify = async (id: string, on: boolean) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("sfc_balances").update({ verified_at: on ? new Date().toISOString() : null, verified_by: on ? u.user?.id ?? null : null }).eq("user_id", id);
    if (error) toast.error(error.message); else void qc.invalidateQueries({ queryKey: ["sfc-balances"] });
  };
  return (
    <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="font-serif text-2xl text-primary">Credit left per student</h3>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No student has entered a balance yet.</p> :
        <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Student</th><th>Balance</th><th>Used / waiting</th><th>Left</th><th>Verified</th><th>Correct balance</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.user_id} className="border-t border-border"><td className="py-2">{r.email}</td><td>{money(Number(r.balance))}</td><td>{money(r.used)}</td><td className="font-semibold">{money(r.left)}</td><td>{r.verified_at ? <button className="text-xs text-primary underline" onClick={() => void verify(r.user_id, false)}>Verified {new Date(r.verified_at).toLocaleDateString("en-GB")}</button> : <Button size="sm" variant="outline" onClick={() => void verify(r.user_id, true)}>Verify</Button>}</td>
            <td><div className="flex gap-1"><Input className="h-8 w-24" type="number" value={edit[r.user_id] ?? ""} onChange={e => setEdit(x => ({ ...x, [r.user_id]: e.target.value }))} /><Button size="sm" variant="outline" onClick={() => void save(r.user_id)}>Save</Button></div></td></tr>)}</tbody></table>}
    </div>
  );
}
