import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/components/site-settings";
import { useAuth } from "@/hooks/use-auth";

type M = { enabled?: boolean; title?: string; message?: string; ends_on?: string };

export function MaintenanceGate({ children }: { children: ReactNode }) {
  const { data } = useQuery(settingsQuery);
  const { isAdmin, loading } = useAuth();
  const { pathname } = useLocation();
  const [keyOk, setKeyOk] = useState(false);
  const m = (data as Record<string, unknown> | undefined)?.["maintenance"] as M | undefined;

  useEffect(() => {
    if (!m?.enabled) return;
    const k = new URLSearchParams(window.location.search).get("key");
    if (k) localStorage.setItem("soq-mkey", k);
    const stored = localStorage.getItem("soq-mkey");
    if (!stored) return;
    // The key is only readable by staff, so check it on the server side via an exact-match call.
    void supabase.rpc("check_maintenance_key" as never, { _key: stored } as never).then(({ data: ok }) => setKeyOk(ok === true));
  }, [m?.enabled]);

  const open = !m?.enabled || isAdmin || keyOk || pathname.startsWith("/login") || pathname.startsWith("/reset-password") || pathname.startsWith("/demo-login");
  if (open || loading) return <>{children}</>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-navy px-5 text-center text-primary-foreground">
      <div className="max-w-lg">
        <p className="font-script text-3xl text-brand-gold">SOQ International Academy</p>
        <h1 className="mt-4 font-serif text-5xl">{m?.title || "We'll be right back"}</h1>
        <p className="mt-4 text-lg text-primary-foreground/75">{m?.message}</p>
        {m?.ends_on && <p className="mt-4 text-sm text-brand-gold">Expected back by {new Date(m.ends_on).toLocaleString("en-SG")}</p>}
      </div>
    </div>
  );
}
