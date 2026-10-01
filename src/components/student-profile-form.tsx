import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter the full name").max(120),
  phone: z.string().trim().max(30),
  date_of_birth: z.string().trim().max(10),
  citizenship: z.enum(["", "singapore_citizen", "permanent_resident", "foreigner"]),
  address: z.string().trim().max(300),
  postal_code: z.string().trim().max(12),
  emergency_name: z.string().trim().max(120),
  emergency_phone: z.string().trim().max(30),
  referral_source: z.string().trim().max(120),
});

type Profile = z.infer<typeof schema>;
const empty: Profile = { full_name: "", phone: "", date_of_birth: "", citizenship: "", address: "", postal_code: "", emergency_name: "", emergency_phone: "", referral_source: "" };

const field = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function StudentProfileForm({ userId, email, heading = "Student details" }: { userId: string; email?: string; heading?: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Profile>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["student-profile", userId],
    queryFn: async () => (await supabase.from("profiles").select("full_name,phone,date_of_birth,citizenship,address,postal_code,emergency_name,emergency_phone,referral_source").eq("id", userId).maybeSingle()).data,
  });

  useEffect(() => {
    if (data) setForm({
      full_name: data.full_name ?? "", phone: data.phone ?? "", date_of_birth: data.date_of_birth ?? "",
      citizenship: (data.citizenship as Profile["citizenship"]) ?? "", address: data.address ?? "", postal_code: data.postal_code ?? "",
      emergency_name: data.emergency_name ?? "", emergency_phone: data.emergency_phone ?? "", referral_source: data.referral_source ?? "",
    });
  }, [data]);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setForm({ ...form, [k]: e.target.value }); setSaved(false); };
  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))); return; }
    setErrors({}); setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: r.data.full_name, phone: r.data.phone || null, date_of_birth: r.data.date_of_birth || null,
      citizenship: r.data.citizenship || null, address: r.data.address || null, postal_code: r.data.postal_code || null,
      emergency_name: r.data.emergency_name || null, emergency_phone: r.data.emergency_phone || null, referral_source: r.data.referral_source || null,
    }).eq("id", userId);
    setBusy(false);
    if (error) { setErrors({ form: "Couldn't save. Please try again." }); return; }
    setSaved(true);
    void qc.invalidateQueries({ queryKey: ["student-profile", userId] });
    void qc.invalidateQueries({ queryKey: ["admin-students"] });
  };

  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading details…</p>;

  return (
    <form onSubmit={submit} noValidate className="mt-6 rounded-lg border border-border bg-card p-6 md:p-8">
      <h2 className="font-serif text-3xl text-primary">{heading}</h2>
      {email && <p className="mt-1 text-sm text-muted-foreground">{email}</p>}

      <p className="eyebrow mt-6">Personal details</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><Input placeholder="Full name (as in NRIC/passport)" value={form.full_name} onChange={set("full_name")} />{err("full_name")}</div>
        <div><Input type="date" aria-label="Date of birth" value={form.date_of_birth} onChange={set("date_of_birth")} />{err("date_of_birth")}</div>
        <div><Input placeholder="Mobile number" value={form.phone} onChange={set("phone")} />{err("phone")}</div>
        <select aria-label="Citizenship" className={field} value={form.citizenship} onChange={set("citizenship")}>
          <option value="">Citizenship…</option>
          <option value="singapore_citizen">Singapore Citizen</option>
          <option value="permanent_resident">Permanent Resident</option>
          <option value="foreigner">Foreigner</option>
        </select>
      </div>

      <p className="eyebrow mt-7">Address</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_160px]">
        <div><Input placeholder="Block / street / unit" value={form.address} onChange={set("address")} />{err("address")}</div>
        <div><Input placeholder="Postal code" value={form.postal_code} onChange={set("postal_code")} />{err("postal_code")}</div>
      </div>

      <p className="eyebrow mt-7">Emergency contact</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div><Input placeholder="Contact name" value={form.emergency_name} onChange={set("emergency_name")} />{err("emergency_name")}</div>
        <div><Input placeholder="Contact phone" value={form.emergency_phone} onChange={set("emergency_phone")} />{err("emergency_phone")}</div>
      </div>

      <p className="eyebrow mt-7">How did you hear about us?</p>
      <div className="mt-3"><Input placeholder="e.g. Google, a friend, SkillsFuture" value={form.referral_source} onChange={set("referral_source")} />{err("referral_source")}</div>

      {err("form")}
      <div className="mt-6 flex items-center gap-4">
        <Button disabled={busy} className="h-11 rounded-full bg-brand-gold px-8 text-brand-navy hover:bg-brand-gold/85">{busy ? "Saving…" : "Save details"}</Button>
        {saved && <span className="flex items-center gap-1.5 text-sm text-brand-gold"><CheckCircle2 className="size-4" /> Saved</span>}
      </div>
    </form>
  );
}
