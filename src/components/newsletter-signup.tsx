import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().trim().email().max(200);

export function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { setState("error"); setMsg("Please enter a valid email."); return; }
    setState("busy");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: parsed.data.toLowerCase(), source });
    if (error && !error.message.includes("duplicate")) { setState("error"); setMsg("Couldn't sign you up. Please try again."); return; }
    setState("done"); setMsg("Thanks! You're on the list.");
  };
  return (
    <form onSubmit={submit} className="mt-6">
      <h2 className="text-sm font-semibold">Course news & intakes</h2>
      {state === "done" ? <p className="mt-3 text-sm text-brand-gold">{msg}</p> : (
        <div className="mt-3 flex gap-2">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" aria-label="Email for newsletter" className="h-10 min-w-0 flex-1 rounded-full border border-primary-foreground/25 bg-transparent px-4 text-sm placeholder:text-primary-foreground/50 outline-none focus:border-brand-gold" />
          <button disabled={state === "busy"} className="h-10 rounded-full bg-brand-gold px-4 text-sm font-semibold text-brand-navy">Join</button>
        </div>
      )}
      {state === "error" && <p className="mt-2 text-xs text-brand-gold">{msg}</p>}
    </form>
  );
}
