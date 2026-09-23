import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { supabase } from "@/integrations/supabase/client";
import { courseTitle } from "@/components/student-dashboard";

export const Route = createFileRoute("/verify-certificate")({
  head: () => ({
    meta: [
      { title: "Verify an SOQ Certificate" },
      { name: "description", content: "Check that a certificate issued by SOQ International Academy is genuine using its certificate code." },
      { property: "og:title", content: "Verify an SOQ Certificate" },
      { property: "og:description", content: "Employers and learners can confirm SOQ certificates online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyPage,
});

type Cert = { code: string; student_name: string; course_slug: string; issued_on: string; status: string };

function VerifyPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Cert | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().slice(0, 40); if (!c) return;
    setBusy(true);
    const { data } = await supabase.rpc("verify_certificate", { _code: c });
    setBusy(false);
    setResult((data as Cert[] | null)?.[0] ?? null);
  };
  return (
    <>
      <PageHero eyebrow="Certificates" title="Verify a certificate." intro="Enter the certificate code printed on an SOQ certificate to confirm it is genuine." />
      <section className="mx-auto max-w-2xl px-5 py-16">
        <form onSubmit={check} className="flex gap-3">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. SOQ-1A2B3C4D5E" aria-label="Certificate code" className="h-12 flex-1 rounded-full border border-input bg-background px-5 uppercase outline-none focus:ring-2 focus:ring-ring" />
          <Button disabled={busy} className="h-12 rounded-full px-6">{busy ? "Checking…" : "Verify"}</Button>
        </form>
        {result === null && <div className="mt-8 flex gap-3 rounded-lg border border-border p-6"><XCircle className="size-6 shrink-0 text-destructive" /><p>No certificate found with that code. Check the code, or contact SOQ for help.</p></div>}
        {result && (
          <div className="mt-8 rounded-lg border border-border bg-brand-cream p-7">
            <div className="flex items-center gap-3">{result.status === "valid" ? <BadgeCheck className="size-8 text-brand-gold" /> : <XCircle className="size-8 text-destructive" />}<h2 className="font-serif text-3xl text-primary">{result.status === "valid" ? "Genuine certificate" : "Certificate revoked"}</h2></div>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Awarded to</dt><dd className="font-medium">{result.student_name}</dd></div>
              <div><dt className="text-muted-foreground">Course</dt><dd className="font-medium">{courseTitle(result.course_slug)}</dd></div>
              <div><dt className="text-muted-foreground">Issued on</dt><dd className="font-medium">{new Date(result.issued_on).toLocaleDateString("en-SG", { dateStyle: "long" })}</dd></div>
              <div><dt className="text-muted-foreground">Code</dt><dd className="font-mono">{result.code}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </>
  );
}
