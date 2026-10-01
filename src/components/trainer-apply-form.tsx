import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter the full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(200),
  phone: z.string().trim().max(40).optional(),
  expertise: z.string().trim().min(2, "Enter the area of expertise").max(200),
  years_experience: z.coerce.number().int().min(0).max(60).optional(),
  qualifications: z.string().trim().max(1000).optional(),
  courses_interest: z.string().trim().max(500).optional(),
  teaching_mode: z.string().trim().max(40).optional(),
  availability: z.string().trim().max(300).optional(),
  languages: z.string().trim().max(200).optional(),
  experience: z.string().trim().min(10, "Tell us a bit more about the experience (10+ characters)").max(3000),
  portfolio_url: z.string().trim().max(300).optional(),
});
const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"];
const field = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const lbl = "grid gap-1.5 text-sm font-medium";

async function upload(file: File | null, kind: string) {
  if (!file || !file.size) return null;
  if (file.size > 10 * 1024 * 1024) throw new Error(`${kind} must be under 10MB`);
  if (!ALLOWED.includes(file.type)) throw new Error(`${kind} must be a PDF, Word document or image`);
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  const path = `applications/${crypto.randomUUID()}-${kind.toLowerCase()}.${ext}`;
  const { error } = await supabase.storage.from("trainer-cvs").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Couldn't upload the ${kind}`);
  return path;
}

/** Shared trainer application form: public /teach page and staff "Add trainer application". */
export function TrainerApplyForm({ staff = false, userId, defaultEmail, onDone }: { staff?: boolean; userId?: string | null; defaultEmail?: string; onDone: (name: string) => void }) {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr("");
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string" && v !== "")) as Record<string, string>;
    const p = schema.safeParse(raw);
    if (!p.success) { setErr(p.error.issues[0]?.message ?? "Please check the form."); return; }
    const cv = fd.get("cv") as File | null;
    if (!staff && (!cv || !cv.size)) { setErr("Please attach your CV."); return; }
    if (!staff && !fd.get("consent")) { setErr("Please confirm the declaration."); return; }
    setBusy(true);
    try {
      const cv_path = await upload(cv, "CV");
      const certs_path = await upload(fd.get("certs") as File | null, "Certificates");
      const d = p.data;
      const { error } = await supabase.from("trainer_applications").insert({
        full_name: d.full_name, email: d.email, phone: d.phone ?? null, expertise: d.expertise, experience: d.experience,
        portfolio_url: d.portfolio_url ?? null, years_experience: d.years_experience ?? null, qualifications: d.qualifications ?? null,
        courses_interest: d.courses_interest ?? null, teaching_mode: d.teaching_mode ?? null, availability: d.availability ?? null,
        languages: d.languages ?? null, cv_path, certs_path, user_id: staff ? null : userId ?? null,
        ...(staff ? { status: String(fd.get("status") || "pending") } : {}),
      });
      if (error) throw new Error("Couldn't send the application. Please try again.");
      onDone(d.full_name);
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-widest text-brand-gold">Personal details</p>
      <label className={lbl}>Full name<input name="full_name" required maxLength={120} className={field} /></label>
      <label className={lbl}>Email<input name="email" type="email" required defaultValue={defaultEmail} className={field} /></label>
      <label className={lbl}>Mobile<input name="phone" maxLength={40} placeholder="+65 9123 4567" className={field} /></label>
      <label className={lbl}>Languages you teach in<input name="languages" maxLength={200} placeholder="English, Mandarin" className={field} /></label>

      <p className="sm:col-span-2 mt-2 text-xs font-semibold uppercase tracking-widest text-brand-gold">Teaching profile</p>
      <label className={lbl}>Area of expertise<input name="expertise" required maxLength={200} placeholder="e.g. Eyelash extension, Generative AI marketing" className={field} /></label>
      <label className={lbl}>Years of industry experience<input name="years_experience" type="number" min={0} max={60} className={field} /></label>
      <label className={`${lbl} sm:col-span-2`}>Courses you'd like to teach<input name="courses_interest" maxLength={500} placeholder="e.g. Diploma in Professional Make-up, AI Course Singapore" className={field} /></label>
      <label className={lbl}>Preferred teaching mode<select name="teaching_mode" className={field} defaultValue=""><option value="">Choose…</option><option>In person</option><option>Online</option><option>Both</option></select></label>
      <label className={lbl}>Availability<input name="availability" maxLength={300} placeholder="e.g. Weekday evenings, Saturdays" className={field} /></label>
      <label className={`${lbl} sm:col-span-2`}>Qualifications & certifications<textarea name="qualifications" rows={2} maxLength={1000} placeholder="e.g. ACTA/ACLP, CIDESCO, ITEC Level 3" className="rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className={`${lbl} sm:col-span-2`}>Teaching & industry experience<textarea name="experience" required rows={4} maxLength={3000} className="rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className={`${lbl} sm:col-span-2`}>Portfolio / LinkedIn (optional)<input name="portfolio_url" maxLength={300} className={field} /></label>

      <p className="sm:col-span-2 mt-2 text-xs font-semibold uppercase tracking-widest text-brand-gold">Documents</p>
      <label className={lbl}>CV {staff ? "(optional)" : ""}<input name="cv" type="file" accept=".pdf,.doc,.docx,image/*" className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground" /></label>
      <label className={lbl}>Certificates (optional)<input name="certs" type="file" accept=".pdf,.doc,.docx,image/*" className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-4 file:py-2" /></label>
      <p className="sm:col-span-2 -mt-2 text-xs text-muted-foreground">PDF, Word or image, up to 10MB each. Only SOQ staff can view these files.</p>

      {staff ? <label className={lbl}>Status<select name="status" className={field} defaultValue="pending"><option value="pending">Pending review</option><option value="approved">Approved</option></select></label>
        : <label className="flex items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" name="consent" className="mt-1" />I confirm the details are accurate and agree that SOQ may keep my CV to assess this application, in line with the PDPA.</label>}
      {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
      <Button disabled={busy} className="h-11 rounded-full sm:col-span-2">{busy ? "Sending…" : staff ? "Save application" : "Send application"}</Button>
    </form>
  );
}
