import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
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
      { name: "description", content: "Sign in to your SOQ student account with a one-time email code or your password." },
      { property: "og:title", content: "SOQ Student Sign In" },
      { property: "og:description", content: "Access your SOQ student portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

type Step = "email" | "code" | "password" | "signup";
const emailSchema = z.string().trim().email().max(200);

function Login() {
  const { mode: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(initial === "signup" ? "signup" : "email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const done = () => void navigate({ to: "/student-portal" });

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault(); setMsg(null);
    const p = emailSchema.safeParse(email);
    if (!p.success) { setMsg("Please enter a valid email."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: p.data, options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/student-portal` } });
    setBusy(false);
    if (error && !/signups not allowed|not found/i.test(error.message)) { setMsg(error.message); return; }
    setCode(Array(6).fill("")); setStep("code");
    setTimeout(() => boxes.current[0]?.focus(), 50);
  };

  const verify = async (digits: string) => {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: digits, type: "email" });
    setBusy(false);
    if (error) { setMsg("That code didn't work. Check it or try again."); return; }
    done();
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    const next = [...code];
    if (clean.length > 1) { clean.slice(0, 6).split("").forEach((d, j) => { if (i + j < 6) next[i + j] = d; }); }
    else next[i] = clean;
    setCode(next);
    const joined = next.join("");
    if (clean && i < 5) boxes.current[Math.min(i + clean.length, 5)]?.focus();
    if (joined.length === 6) void verify(joined);
  };

  const signInPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMsg(error.message); else done();
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/student-portal` } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
    else done();
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { setMsg("Google sign-in failed. Please try again."); return; }
    if (r.redirected) return;
    done();
  };

  const link = "text-primary underline underline-offset-2 hover:text-brand-gold";
  const gold = "mt-2 h-11 rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85";

  return (
    <section className="bg-secondary">
      <div className="mx-auto max-w-md px-5 py-20">
        <div className="rounded-lg border border-border bg-card p-8">
          <p className="font-script text-3xl text-brand-gold">Student portal</p>
          <h1 className="mt-2 font-serif text-4xl text-primary">
            {step === "signup" ? "Create your account" : step === "code" ? "Check your email" : "Welcome back"}
          </h1>

          {step === "email" && (<>
            <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a one-time sign-in code.</p>
            <form onSubmit={sendCode} className="mt-6 grid gap-3">
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              <Button disabled={busy} className={gold}>{busy ? "Sending…" : "Email me a code"}</Button>
            </form>
            <button type="button" className={`mt-4 text-sm ${link}`} onClick={() => { setMsg(null); setStep("password"); }}>Sign in with password instead</button>
            <div className="my-5 text-center text-xs uppercase tracking-wider text-muted-foreground">or</div>
            <Button type="button" variant="outline" className="h-11 w-full rounded-full" onClick={google}>Continue with Google</Button>
          </>)}

          {step === "code" && (<>
            <p className="mt-4 text-sm text-foreground/80">If you have an account with us, we've sent an email to <strong>{email.trim()}</strong>. Click the link inside or enter the code below.</p>
            <div className="mt-6 flex justify-center gap-2">
              {code.map((d, i) => (
                <input key={i} ref={el => { boxes.current[i] = el; }} value={d} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Digit ${i + 1}`} disabled={busy}
                  onChange={e => setDigit(i, e.target.value)}
                  onKeyDown={e => { if (e.key === "Backspace" && !code[i] && i > 0) boxes.current[i - 1]?.focus(); }}
                  className="h-12 w-11 rounded-md border border-input bg-background text-center text-lg font-semibold outline-none focus:border-brand-gold" />
              ))}
            </div>
            <p className="mt-6 text-sm text-foreground/80">
              You can also <button type="button" className={link} onClick={() => void sendCode()}>resend the code</button>, <button type="button" className={link} onClick={() => { setMsg(null); setStep("email"); }}>use another email</button> or <button type="button" className={link} onClick={() => { setMsg(null); setStep("password"); }}>sign in using your password</button>.
            </p>
          </>)}

          {step === "password" && (<>
            <p className="mt-2 text-sm text-muted-foreground">Sign in with your email and password.</p>
            <form onSubmit={signInPassword} className="mt-6 grid gap-3">
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
              <Button disabled={busy} className={gold}>Sign in</Button>
            </form>
            <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
              <button type="button" className={link} onClick={() => { setMsg(null); setStep("email"); }}>Email me a code instead</button>
              <button type="button" className={link} onClick={async () => {
                if (!email.trim()) { alert("Type your email above first."); return; }
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
                alert(error ? error.message : "If an account exists for this email, we've sent a link to set a new password.");
              }}>Forgot password?</button>
            </div>
          </>)}

          {step === "signup" && (<>
            <p className="mt-2 text-sm text-muted-foreground">Use the email address you enrolled with so we can link your courses.</p>
            <form onSubmit={signUp} className="mt-6 grid gap-3">
              <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password (8+ characters)" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
              <Button disabled={busy} className={gold}>Create account</Button>
            </form>
            <div className="my-5 text-center text-xs uppercase tracking-wider text-muted-foreground">or</div>
            <Button type="button" variant="outline" className="h-11 w-full rounded-full" onClick={google}>Continue with Google</Button>
          </>)}

          {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            {step === "signup"
              ? <>Already have an account? <button type="button" className="font-semibold text-brand-gold" onClick={() => { setMsg(null); setStep("email"); }}>Sign in</button></>
              : <>First time here? <button type="button" className="font-semibold text-brand-gold" onClick={() => { setMsg(null); setStep("signup"); }}>Create an account</button></>}
          </p>
        </div>
      </div>
    </section>
  );
}
