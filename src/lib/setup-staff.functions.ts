import { createServerFn } from "@tanstack/react-start";

// Temporary one-off: creates the staff test account. Removed after use.
export const setupStaff = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const email = "creative@morpheuslabs.io";
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users.find(u => u.email === email);
  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: "1234567", email_confirm: true, user_metadata: { full_name: "SOQ Staff" } });
    if (error) return { ok: false, error: error.message };
    user = data.user;
  }
  for (const role of ["admin", "trainer"] as const) {
    await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role }, { onConflict: "user_id,role" });
  }
  return { ok: true, id: user.id };
});
