import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { TrainerApplyForm } from "@/components/trainer-apply-form";
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

function TeachPage() {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
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
          <p>Please attach your CV and any certificates — it helps us review faster.</p>
          <p>Approved trainers get a Verified SOQ badge in the Community.</p>
        </div>
        {done ? (
          <div className="rounded-lg bg-brand-cream p-8"><CheckCircle2 className="size-10 text-brand-gold" /><h2 className="mt-4 font-serif text-3xl text-primary">Application received</h2><p className="mt-2 text-muted-foreground">Thank you. Our team will review it and contact you within 5 working days.</p></div>
        ) : (
          <div className="rounded-lg bg-brand-cream p-7"><TrainerApplyForm userId={user?.id ?? null} defaultEmail={user?.email ?? ""} onDone={() => setDone(true)} /></div>
        )}
      </section>
    </>
  );
}
