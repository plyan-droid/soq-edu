import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Set a new password | SOQ International Academy" },
    { name: "description", content: "Choose a new password for your SOQ student portal account." },
    { property: "og:title", content: "Set a new password | SOQ International Academy" },
    { property: "og:description", content: "Choose a new password for your SOQ student portal account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) { toast.error("The two passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error(error.message.includes("session") ? "This link has expired. Ask for a new one from the Log in page." : error.message);
    else { toast.success("Password updated"); void nav({ to: "/student-portal" }); }
  };
  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-serif text-4xl text-primary">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Open this page from the link in your email, then choose a new password.</p>
        <form onSubmit={save} className="mt-6 grid gap-3">
          <Input type="password" minLength={8} placeholder="New password (8+ characters)" value={pw} onChange={e => setPw(e.target.value)} required />
          <Input type="password" minLength={8} placeholder="Type it again" value={pw2} onChange={e => setPw2(e.target.value)} required />
          <Button disabled={busy} className="rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85">Save password</Button>
        </form>
      </section>
    </SiteLayout>
  );
}
