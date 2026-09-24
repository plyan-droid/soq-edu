import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/components/site-settings";
import { demoLogin, demoDestination, DEMO_ROLES, type DemoRole } from "@/lib/demo-login.functions";

export function useDemoLogin() {
  const fn = useServerFn(demoLogin);
  return async (role: DemoRole) => {
    const r = await fn({ data: { role } });
    if (!r.ok) throw new Error(r.error);
    await supabase.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token });
    window.location.assign(demoDestination[role]);
  };
}

export function DemoLoginButtons() {
  const { data } = useQuery(settingsQuery);
  const go = useDemoLogin();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if ((data as Record<string, unknown> | undefined)?.["demo_login"] !== true) return null;
  return (
    <div className="mt-8 rounded-lg border border-dashed border-brand-gold/60 p-4">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo login (1 click)</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {DEMO_ROLES.map(r => (
          <Button key={r} size="sm" variant="outline" className="rounded-full capitalize" disabled={!!busy}
            onClick={async () => { setBusy(r); setErr(null); try { await go(r); } catch (e) { setErr((e as Error).message); setBusy(null); } }}>
            {busy === r ? "Signing in…" : r}
          </Button>
        ))}
      </div>
      {err && <p className="mt-2 text-center text-xs text-destructive">{err}</p>}
    </div>
  );
}
