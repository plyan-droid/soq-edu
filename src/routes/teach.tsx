import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/teach")({
  head: () => ({
    meta: [
      { title: "Teach at SOQ | Become a Trainer" },
      { name: "description", content: "Apply to become a trainer at SOQ International Academy in AI, business, beauty, wellness or retail." },
      { property: "og:title", content: "Become an SOQ Trainer" },
      { property: "og:description", content: "Share your expertise with SOQ learners in Singapore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeachPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  expertise: z.string().trim().min(2).max(200),
  experience: z.string().trim().min(10, "Tell us a bit more (10+ characters)").max(3000),
  portfolio_url: z.string().trim().max(300).optional(),
});
const field = "h-12 rounded-md border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring";

function TeachPage() {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr("");
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const p = schema.safeParse(raw);
    if (!p.success) { setErr(p.error.issues[0]?.message ?? "Please check the form."); return; }
    setBusy(true);
    const { error } = await supabase.from("trainer_applications").insert({ ...p.data, phone: p.data.phone || null, portfolio_url: p.data.portfolio_url || null, user_id: user?.id ?? null });
    setBusy(false);
    if (error) { setErr("Couldn't send your application. Please try again."); return; }
    setDone(true);
  };
  return (
    <>
      <PageHero eyebrow="Teach with us" title="Become an SOQ trainer." intro="Share your industry experience with learners in AI, business, beauty, wellness and retail. Our team reviews every application." />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="space-y-5 text-sm leading-7 text-muted-foreground">
          <h2 className="font-serif text-3xl text-primary">What we look for</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Hands-on industry experience in your field</li>
            <li>Relevant certifications (e.g. ACTA/ACLP for WSQ courses, CIDESCO/ITEC for beauty)</li>
            <li>A clear, patient teaching style</li>
          </ul>
          <p>Approved trainers get a Verified SOQ badge in the Community.</p>
        </div>
        {done ? (
          <div className="rounded-lg bg-brand-cream p-8"><CheckCircle2 className="size-10 text-brand-gold" /><h2 className="mt-4 font-serif text-3xl text-primary">Application received</h2><p className="mt-2 text-muted-foreground">Thank you. Our team will review it and contact you within 5 working days.</p></div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 rounded-lg bg-brand-cream p-7">
            <label className="grid gap-2 text-sm font-medium">Full name<input name="full_name" required maxLength={120} className={field} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" required defaultValue={user?.email ?? ""} className={field} /></label>
              <label className="grid gap-2 text-sm font-medium">Mobile<input name="phone" maxLength={40} className={field} /></label>
            </div>
            <label className="grid gap-2 text-sm font-medium">Area of expertise<input name="expertise" required maxLength={200} placeholder="e.g. Eyelash extension, Generative AI marketing" className={field} /></label>
            <label className="grid gap-2 text-sm font-medium">Experience & certifications<textarea name="experience" required rows={5} maxLength={3000} className="rounded-md border border-input bg-background p-4 outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="grid gap-2 text-sm font-medium">Portfolio / LinkedIn (optional)<input name="portfolio_url" maxLength={300} className={field} /></label>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button disabled={busy} className="h-12 rounded-full">{busy ? "Sending…" : "Send application"}</Button>
          </form>
        )}
      </section>
    </>
  );
}
