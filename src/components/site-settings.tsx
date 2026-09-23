import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Settings = { announcement?: { text: string; link?: string; on: boolean }; appearance?: { navy?: string; gold?: string }; general?: { timezone?: string } };

export const settingsQuery = {
  queryKey: ["site-settings"],
  queryFn: async (): Promise<Settings> => {
    const { data } = await supabase.from("site_settings").select("key,value");
    return Object.fromEntries((data ?? []).map(r => [r.key, r.value])) as Settings;
  },
  staleTime: 60_000,
};

const hex = (v?: string) => (v && /^#[0-9a-f]{6}$/i.test(v) ? v : undefined);

/** Shows the staff announcement bar and applies staff-chosen brand colours. */
export function SiteSettingsLayer() {
  const { data } = useQuery(settingsQuery);
  const navy = hex(data?.appearance?.navy);
  const gold = hex(data?.appearance?.gold);
  useEffect(() => {
    const root = document.documentElement.style;
    if (navy) { root.setProperty("--brand-navy", navy); root.setProperty("--primary", navy); } else { root.removeProperty("--brand-navy"); root.removeProperty("--primary"); }
    if (gold) root.setProperty("--brand-gold", gold); else root.removeProperty("--brand-gold");
  }, [navy, gold]);
  const a = data?.announcement;
  if (!a?.on || !a.text) return null;
  const safe = a.link && /^(https?:\/\/|\/)/.test(a.link) ? a.link : undefined;
  return (
    <div className="bg-brand-navy px-5 py-2 text-center text-sm text-primary-foreground">
      {safe ? <a href={safe} className="underline-offset-2 hover:underline">{a.text}</a> : a.text}
    </div>
  );
}
