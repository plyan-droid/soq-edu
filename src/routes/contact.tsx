import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { contact } from "@/lib/site-content";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact & Course Advice | SOQ" }, { name: "description", content: "Contact SOQ International Academy for course advice, funding guidance and corporate training enquiries." }, { property: "og:title", content: "Contact SOQ International Academy" }, { property: "og:description", content: "Speak with an SOQ course adviser in Singapore." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ContactPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email").max(200),
  phone: z.string().trim().max(40).optional(),
  topic: z.enum(["course_advice", "funding", "corporate", "current_student", "other"]),
  message: z.string().trim().min(5, "Please write a short message").max(5000),
});
const field = "h-12 rounded-md border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring";

function ContactPage() {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr("");
    const p = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!p.success) { setErr(p.error.issues[0]?.message ?? "Please check the form."); return; }
    setBusy(true);
    const { error } = await supabase.from("support_tickets").insert({ ...p.data, phone: p.data.phone || null, user_id: user?.id ?? null });
    setBusy(false);
    if (error) { setErr("Couldn't send your message. Please WhatsApp or call us instead."); return; }
    setDone(true);
  };
  return (
    <>
      <PageHero eyebrow="Contact" title="Let’s find your next course." intro="Tell us what you want to achieve. Our advisers can help with programme fit, schedules, funding and registration." />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="grid gap-4">
          <a href={contact.whatsapp} className="flex items-start gap-4 rounded-lg border border-border p-6"><MessageCircle className="mt-1 size-6 text-brand-gold" /><div><strong className="text-primary">WhatsApp us</strong><p className="mt-1 text-sm text-muted-foreground">+65 8718 2308</p></div></a>
          <a href={`tel:${contact.phone.replaceAll(" ", "")}`} className="flex items-start gap-4 rounded-lg border border-border p-6"><Phone className="mt-1 size-6 text-brand-gold" /><div><strong className="text-primary">Call us</strong><p className="mt-1 text-sm text-muted-foreground">{contact.phone}</p></div></a>
          <a href={`mailto:${contact.email}`} className="flex items-start gap-4 rounded-lg border border-border p-6"><Mail className="mt-1 size-6 text-brand-gold" /><div><strong className="text-primary">Email us</strong><p className="mt-1 text-sm text-muted-foreground">{contact.email}</p></div></a>
          <div className="flex items-start gap-4 rounded-lg border border-border p-6"><MapPin className="mt-1 size-6 text-brand-gold" /><div><strong className="text-primary">Visit the academy</strong><p className="mt-1 text-sm leading-6 text-muted-foreground">{contact.address}<br />Walk-ins welcome.</p></div></div>
        </div>
        {done ? (
          <div className="rounded-lg bg-brand-cream p-8"><CheckCircle2 className="size-10 text-brand-gold" /><h2 className="mt-4 font-serif text-3xl text-primary">Message received</h2><p className="mt-2 text-muted-foreground">Thank you. An adviser will reply within 1–2 working days. For anything urgent, WhatsApp us.</p></div>
        ) : (
          <form className="rounded-lg bg-brand-cream p-7" onSubmit={submit}>
            <h2 className="font-serif text-4xl text-primary">Send us a message</h2>
            <p className="mt-3 text-sm text-muted-foreground">We usually reply within 1–2 working days.</p>
            <div className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">Your name<input name="full_name" required maxLength={120} className={field} /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required defaultValue={user?.email ?? ""} className={field} /></label>
                <label className="grid gap-2 text-sm font-medium">Mobile (optional)<input name="phone" maxLength={40} className={field} /></label>
              </div>
              <label className="grid gap-2 text-sm font-medium">Topic<select name="topic" className={field} defaultValue="course_advice"><option value="course_advice">Course advice</option><option value="funding">Funding & SkillsFuture</option><option value="corporate">Corporate training</option><option value="current_student">I'm a current student</option><option value="other">Something else</option></select></label>
              <label className="grid gap-2 text-sm font-medium">Message<textarea name="message" required rows={5} maxLength={5000} className="rounded-md border border-input bg-background p-4 outline-none focus:ring-2 focus:ring-ring" /></label>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button type="submit" disabled={busy} className="h-12 rounded-full">{busy ? "Sending…" : "Send message"}</Button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
