import { useEffect, useState } from "react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { contact } from "@/lib/site-content";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(6, "Please enter a valid phone number").max(30),
  citizenship: z.enum(["singapore_citizen", "permanent_resident", "foreigner"]),
  preferred_intake: z.string().trim().max(100),
  message: z.string().trim().max(2000),
});

export function CourseApplyForm({ slug, title }: { slug: string; title: string }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", citizenship: "singapore_citizen", preferred_intake: "", message: "" });
  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("full_name,email,phone,citizenship").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setForm(f => ({
        ...f,
        full_name: f.full_name || data.full_name || "",
        email: f.email || data.email || user.email || "",
        phone: f.phone || data.phone || "",
        citizenship: (data.citizenship as typeof f.citizenship) || f.citizenship,
      }));
    });
  }, [user]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map(i => [String(i.path[0]), i.message]))); return; }
    setErrors({}); setBusy(true);
    const { error } = await supabase.from("course_applications").insert({ course_slug: slug, ...r.data, preferred_intake: r.data.preferred_intake || null, message: r.data.message || null });
    setBusy(false);
    if (error) { setErrors({ form: "Sorry, we couldn't send your application. Please try again or WhatsApp us." }); return; }
    setDone(r.data.full_name.split(" ")[0] ?? "");
  };

  if (done !== null) return (
    <div id="apply" className="rounded-lg border border-brand-gold bg-brand-gold-soft/40 p-8 text-center">
      <CheckCircle2 className="mx-auto size-12 text-brand-gold" />
      <h2 className="mt-4 font-serif text-4xl text-primary">Thank you{done ? `, ${done}` : ""}!</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">We've received your application for <strong className="text-foreground">{title}</strong>. An SOQ course adviser will contact you within 1–2 working days to confirm your intake, funding eligibility and next steps.</p>
      <Button asChild variant="outline" className="mt-6 rounded-full"><a href={contact.whatsapp}>Need it sooner? WhatsApp us</a></Button>
    </div>
  );

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;
  return (
    <form id="apply" onSubmit={submit} noValidate className="rounded-lg border border-border bg-card p-7 md:p-9">
      <p className="eyebrow">Apply now</p>
      <h2 className="mt-2 font-serif text-4xl text-primary">Apply for this course</h2>
      <p className="mt-2 text-sm text-muted-foreground">Leave your details and an adviser will confirm the schedule, fees and funding with you. No payment needed now.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div><Input placeholder="Full name (as in NRIC/passport)" value={form.full_name} onChange={set("full_name")} />{err("full_name")}</div>
        <div><Input type="email" placeholder="Email" value={form.email} onChange={set("email")} />{err("email")}</div>
        <div><Input type="tel" placeholder="Mobile number" value={form.phone} onChange={set("phone")} />{err("phone")}</div>
        <select aria-label="Citizenship" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.citizenship} onChange={set("citizenship")}>
          <option value="singapore_citizen">Singapore Citizen</option>
          <option value="permanent_resident">Permanent Resident</option>
          <option value="foreigner">Foreigner</option>
        </select>
        <Input className="sm:col-span-2" placeholder="Preferred intake / month (optional)" value={form.preferred_intake} onChange={set("preferred_intake")} />
        <Textarea className="sm:col-span-2" placeholder="Questions or notes (optional)" maxLength={2000} value={form.message} onChange={set("message")} />
      </div>
      {err("form")}
      <Button disabled={busy} className="mt-6 h-12 rounded-full bg-brand-gold px-8 text-brand-navy hover:bg-brand-gold/85">{busy ? "Sending…" : "Submit application"}</Button>
    </form>
  );
}
