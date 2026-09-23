import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).optional() }),
  head: () => ({
    meta: [
      { title: "Student Sign In | SOQ International Academy" },
      { name: "description", content: "Sign in or create your SOQ student account to view your courses, deadlines and assessments." },
      { property: "og:title", content: "SOQ Student Sign In" },
      { property: "og:description", content: "Access your SOQ student portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { mode: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initial ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/student-portal` } });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
      else void navigate({ to: "/student-portal" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else void navigate({ to: "/student-portal" });
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { setMsg("Google sign-in failed. Please try again."); return; }
    if (r.redirected) return;
    void navigate({ to: "/student-portal" });
  };

  return (
    <section className="bg-secondary">
      <div className="mx-auto max-w-md px-5 py-20">
        <div className="rounded-lg border border-border bg-card p-8">
          <p className="font-script text-3xl text-brand-gold">Student portal</p>
          <h1 className="mt-2 font-serif text-4xl text-primary">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use the email address you enrolled with so we can link your courses.</p>
          <Button type="button" variant="outline" className="mt-6 h-11 w-full rounded-full" onClick={google}>Continue with Google</Button>
          <div className="my-5 text-center text-xs uppercase tracking-wider text-muted-foreground">or</div>
          <form onSubmit={submit} className="grid gap-3">
            {mode === "signup" && <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />}
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
            <Button disabled={busy} className="mt-2 h-11 rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85">{mode === "signin" ? "Sign in" : "Create account"}</Button>
          </form>
          {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}
          <button type="button" className="mt-6 text-sm text-primary underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "New student? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </section>
  );
}
