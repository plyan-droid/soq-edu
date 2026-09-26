import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DEMO_ROLES = ["admin", "staff", "instructor", "student", "organization"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export const demoLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ role: z.enum(DEMO_ROLES) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: flag } = await supabaseAdmin.from("site_settings").select("value").eq("key", "demo_login").maybeSingle();
    if (flag?.value !== true) return { ok: false as const, error: "Demo login is switched off." };

    const email = `${data.role}@demo.com`;
    const password = `SoqDemo-${data.role}-2026!`;
    const dbRole = data.role === "instructor" ? "trainer" : data.role;
    const name = `Demo ${data.role[0]!.toUpperCase()}${data.role.slice(1)}`;

    const { data: prof } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
    let id = prof?.id;
    if (!id) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
      if (error || !created.user) return { ok: false as const, error: error?.message ?? "Could not create demo account" };
      id = created.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(id, { password, email_confirm: true });
    }
    await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: dbRole as never }, { onConflict: "user_id,role", ignoreDuplicates: true });

    const res = await fetch(`${process.env["SUPABASE_URL"]}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env["SUPABASE_PUBLISHABLE_KEY"]! },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { ok: false as const, error: `Sign-in failed (${res.status})` };
    const s = (await res.json()) as { access_token: string; refresh_token: string };
    return { ok: true as const, access_token: s.access_token, refresh_token: s.refresh_token };
  });

export const demoDestination: Record<DemoRole, string> = {
  admin: "/portal-admin", staff: "/portal-admin", instructor: "/trainer", student: "/student-portal", organization: "/business-portal",
};
