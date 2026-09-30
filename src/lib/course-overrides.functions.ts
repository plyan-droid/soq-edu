import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type CourseOverride = {
  slug: string; title: string | null; summary: string | null; price: string | null; duration: string | null;
  mode: string | null; badge: string | null; outcomes: string[] | null; sections: { title: string; items: string[] }[] | null; updated_at: string;
  category: string | null; custom: boolean; hidden: boolean;
};

export const getCourseOverrides = createServerFn({ method: "GET" }).handler(async (): Promise<CourseOverride[]> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
  const { data, error } = await sb.from("course_overrides").select("slug,title,summary,price,duration,mode,badge,outcomes,sections,updated_at,category,custom,hidden");
  if (error) { console.error("course_overrides", error.message); return []; }
  return (data ?? []) as unknown as CourseOverride[];
});
