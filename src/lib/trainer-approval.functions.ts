import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Staff approve a trainer application: links/creates their account and grants the trainer role immediately. */
export const approveTrainer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: isAdmin }, { data: isStaff }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "staff" as never }),
    ]);
    if (!isAdmin && !isStaff) throw new Error("Staff only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error } = await supabaseAdmin.from("trainer_applications").select("id,user_id,email,full_name").eq("id", data.id).maybeSingle();
    if (error || !app) throw new Error("Application not found");

    let userId = app.user_id as string | null;
    let created = false;
    if (!userId) {
      const email = app.email.trim().toLowerCase();
      const { data: existing } = await supabaseAdmin.from("profiles").select("id").ilike("email", email).maybeSingle();
      userId = existing?.id ?? null;
      if (!userId) {
        const pw = crypto.randomUUID() + crypto.randomUUID();
        const { data: u, error: cErr } = await supabaseAdmin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { full_name: app.full_name } });
        if (cErr || !u.user) throw new Error(cErr?.message ?? "Could not create the account");
        userId = u.user.id; created = true;
      }
    }
    const { error: rErr } = await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "trainer" }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (rErr) throw new Error(rErr.message);
    const { error: uErr } = await supabaseAdmin.from("trainer_applications").update({ status: "approved", user_id: userId }).eq("id", app.id);
    if (uErr) throw new Error(uErr.message);
    return { created };
  });
