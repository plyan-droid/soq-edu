import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const applicantSchema = z.object({
  course_slug: z.string().trim().min(1).max(200),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  nationality: z.string().trim().min(1).max(60),
  citizenship: z.enum(["singapore_citizen", "permanent_resident", "foreigner"]),
  id_type: z.enum(["NRIC", "FIN", "PASSPORT"]),
  id_number: z.string().trim().min(3).max(30),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email: z.string().trim().toLowerCase().email().max(255),
  address: z.string().trim().min(3).max(300),
  qualification: z.string().trim().min(1).max(80),
  sales_manager: z.string().trim().max(60).optional().default(""),
  newsletter: z.boolean(),
  enrol_now: z.boolean(),
  notes: z.string().trim().max(2000).optional().default(""),
});
export type ApplicantInput = z.input<typeof applicantSchema>;

/** Staff add an applicant: creates the account if needed, saves their details, records the application, optionally enrols. */
export const addApplicant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => applicantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!staff) throw new Error("Staff only");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let created = false;
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").ilike("email", data.email).maybeSingle();
    let userId = existing?.id as string | undefined;
    if (!userId) {
      const pw = crypto.randomUUID() + crypto.randomUUID();
      const { data: u, error } = await supabaseAdmin.auth.admin.createUser({ email: data.email, password: pw, email_confirm: true, user_metadata: { full_name: data.full_name } });
      if (error || !u.user) throw new Error(error?.message ?? "Could not create the account");
      userId = u.user.id; created = true;
    }
    const profile = { full_name: data.full_name, phone: data.phone, nationality: data.nationality, citizenship: data.citizenship, id_type: data.id_type, id_number: data.id_number, date_of_birth: data.date_of_birth, address: data.address, qualification: data.qualification };
    await supabaseAdmin.from("profiles").update(profile).eq("id", userId);
    if (data.newsletter) await supabaseAdmin.from("newsletter_subscribers").upsert({ email: data.email, source: "staff-applicant" }, { onConflict: "email", ignoreDuplicates: true });

    let enrolled = false;
    if (data.enrol_now) {
      const { data: ex } = await supabaseAdmin.from("enrollments").select("id").eq("student_id", userId).eq("course_slug", data.course_slug).maybeSingle();
      if (!ex) {
        const { error } = await supabaseAdmin.from("enrollments").insert({ student_id: userId, course_slug: data.course_slug, status: "active", start_date: new Date().toISOString().slice(0, 10) });
        if (error) throw new Error(error.message);
      }
      enrolled = true;
    }
    const { error: appErr } = await supabaseAdmin.from("course_applications").insert({
      course_slug: data.course_slug, full_name: data.full_name, email: data.email, phone: data.phone, citizenship: data.citizenship,
      nationality: data.nationality, id_type: data.id_type, id_number: data.id_number, date_of_birth: data.date_of_birth, address: data.address,
      qualification: data.qualification, sales_manager: data.sales_manager || null, newsletter: data.newsletter, message: data.notes || null,
      source: "staff", status: enrolled ? "enrolled" : "new",
    });
    if (appErr) throw new Error(appErr.message);
    return { userId, created, enrolled };
  });
