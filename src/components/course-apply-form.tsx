import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { contact } from "@/lib/site-content";
import { submitApplication } from "@/lib/applicants.functions";
import { DIAL_CODES, NATIONALITIES, QUALIFICATIONS, SALES_MANAGERS } from "@/lib/applicant-options";

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const blank = { full_name: "", dial: "65", mobile: "", nationality: "", citizenship: "", id_type: "", id_number: "", dob: "", email: "", address: "", qualification: "", sales_manager: "", preferred_intake: "", notes: "", newsletter: false, truth: false, terms: false };
type F = typeof blank;
const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block text-sm"><span className="mb-1 block font-medium text-foreground">{t}</span>{children}</label>;
const toCit = (c: string) => (c === "SC" ? "singapore_citizen" : c === "PR" ? "permanent_resident" : "foreigner") as "singapore_citizen";

export function CourseApplyForm({ slug, title }: { slug: string; title: string }) {
  const { user } = useAuth();
  const send = useServerFn(submitApplication);
  const [f, setF] = useState<F>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof F | "form", string>>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; created: boolean } | null>(null);

  useEffect(() => {
    if (!user) return;
    void supabase.from("profiles").select("full_name,email,phone,citizenship,nationality,id_type,id_number,date_of_birth,address,qualification").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const ph = (data.phone ?? "").match(/^\+(\d+)\s*(.*)$/);
      const dob = data.date_of_birth ? data.date_of_birth.split("-").reverse().join("-") : "";
      setF(p => ({
        ...p, full_name: p.full_name || data.full_name || "", email: p.email || data.email || user.email || "",
        dial: ph?.[1] ?? p.dial, mobile: p.mobile || (ph?.[2] ?? data.phone ?? "").replace(/\D/g, ""),
        citizenship: p.citizenship || (data.citizenship === "singapore_citizen" ? "SC" : data.citizenship === "permanent_resident" ? "PR" : data.citizenship ? "Others" : ""),
        nationality: p.nationality || data.nationality || "", id_type: p.id_type || data.id_type || "", id_number: p.id_number || data.id_number || "",
        dob: p.dob || dob, address: p.address || data.address || "", qualification: p.qualification || data.qualification || "",
      }));
    });
  }, [user]);

  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<keyof F | "form", string>> = {};
    const digits = f.mobile.replace(/\D/g, "");
    if (f.full_name.trim().length < 2) er.full_name = "Please enter your full name as per NRIC";
    if (f.dial === "65" ? !/^[89]\d{7}$/.test(digits) : digits.length < 6) er.mobile = f.dial === "65" ? "Singapore numbers start with 8 or 9 and have 8 digits" : "Please enter a valid mobile number";
    if (!f.nationality) er.nationality = "Please select your nationality";
    if (!f.citizenship) er.citizenship = "Please select";
    if (!f.id_type) er.id_type = "Please select";
    if (f.id_number.trim().length < 3) er.id_number = "Please enter your ID number";
    const m = f.dob.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m || Number.isNaN(Date.parse(`${m[3]}-${m[2]}-${m[1]}`))) er.dob = "Use dd-mm-yyyy";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) er.email = "Please enter a valid email";
    if (f.address.trim().length < 3) er.address = "Please enter your address";
    if (!f.qualification) er.qualification = "Please select";
    if (!f.truth) er.truth = "Please confirm your details are correct";
    if (!f.terms) er.terms = "Please accept the Terms and Data Protection Policy";
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const r = await send({ data: {
        course_slug: slug, full_name: f.full_name, phone: `+${f.dial} ${digits}`, nationality: f.nationality, citizenship: toCit(f.citizenship),
        id_type: f.id_type as "NRIC", id_number: f.id_number.toUpperCase(), date_of_birth: `${m![3]}-${m![2]}-${m![1]}`, email: f.email,
        address: f.address, qualification: f.qualification, sales_manager: f.sales_manager, newsletter: f.newsletter, notes: f.notes, preferred_intake: f.preferred_intake,
      } });
      setDone({ name: f.full_name.split(" ")[0] ?? "", created: r.created });
    } catch { setErrors({ form: "Sorry, we couldn't send your application. Please try again or WhatsApp us." }); }
    setBusy(false);
  };

  if (done) return (
    <div id="apply" className="rounded-lg border border-brand-gold bg-brand-gold-soft/40 p-8 text-center">
      <CheckCircle2 className="mx-auto size-12 text-brand-gold" />
      <h2 className="mt-4 font-serif text-4xl text-primary">Thank you{done.name ? `, ${done.name}` : ""}!</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground">We've received your application for <strong className="text-foreground">{title}</strong>. An SOQ course adviser will contact you within 1–2 working days to confirm your intake, funding eligibility and next steps.</p>
      {done.created && <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">We've created your SOQ account. To log in, click <b>Forgot password</b> on the login page and set your password.</p>}
      <Button asChild variant="outline" className="mt-6 rounded-full"><a href={contact.whatsapp}>Need it sooner? WhatsApp us</a></Button>
    </div>
  );

  const err = (k: keyof F | "form") => errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>;
  return (
    <form id="apply" onSubmit={submit} noValidate className="rounded-lg border border-border bg-card p-7 md:p-9">
      <p className="eyebrow">Apply now</p>
      <h2 className="mt-2 font-serif text-4xl text-primary">Apply for this course</h2>
      <p className="mt-2 text-sm text-muted-foreground">No payment needed now. An adviser will confirm the schedule, fees and funding with you.</p>
      {!user && <p className="mt-4 rounded-md border border-brand-gold bg-brand-gold-soft/40 p-3 text-sm">An account will be automatically created for you once this form is submitted. To access your account, click <b>Forgot password</b> on the login page to set your password.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><L t="Full name (must be per NRIC for training grant application)"><Input value={f.full_name} onChange={set("full_name")} /></L>{err("full_name")}</div>
        <div className="sm:col-span-2"><L t="Contact no. (mobile)"><div className="flex gap-2"><select className="h-10 w-44 rounded-md border border-input bg-background px-2 text-sm" value={f.dial} onChange={set("dial")} aria-label="Country code">{DIAL_CODES.map(d => <option key={d.name} value={d.code}>{d.name} (+{d.code})</option>)}</select><Input type="tel" inputMode="numeric" value={f.mobile} onChange={set("mobile")} placeholder={f.dial === "65" ? "8 digits, starts with 8 or 9" : "Mobile number"} /></div></L>{err("mobile")}</div>
        <div className="sm:col-span-2"><L t="Nationality (mandatory for training grant application)"><select className={sel} value={f.nationality} onChange={set("nationality")}><option value="">— Please select —</option>{NATIONALITIES.map(n => <option key={n}>{n}</option>)}</select></L><p className="mt-1 text-xs text-muted-foreground">Singapore Citizens, PRs and LTVP+ holders: please pick the right option — it affects funding.</p>{err("nationality")}</div>
        <div><L t="Citizenship"><select className={sel} value={f.citizenship} onChange={set("citizenship")}><option value="">— Please select —</option><option>SC</option><option>PR</option><option>Others</option></select></L>{err("citizenship")}</div>
        <div><L t="ID type"><select className={sel} value={f.id_type} onChange={set("id_type")}><option value="">— Please select —</option><option>NRIC</option><option>FIN</option><option>PASSPORT</option></select></L>{err("id_type")}</div>
        <div><L t="ID number (NRIC/FIN)"><Input value={f.id_number} onChange={set("id_number")} /></L>{err("id_number")}</div>
        <div><L t="Date of birth (dd-mm-yyyy)"><Input value={f.dob} onChange={set("dob")} placeholder="dd-mm-yyyy" /></L>{err("dob")}</div>
        <div className="sm:col-span-2"><L t="Email (login username)"><Input type="email" value={f.email} onChange={set("email")} /></L>{err("email")}</div>
        <div className="sm:col-span-2"><L t="Address 1"><Input value={f.address} onChange={set("address")} /></L>{err("address")}</div>
        <div><L t="Highest qualification"><select className={sel} value={f.qualification} onChange={set("qualification")}><option value="">— Please select —</option>{QUALIFICATIONS.map(x => <option key={x}>{x}</option>)}</select></L>{err("qualification")}</div>
        <div><L t="Sales manager (if you have one)"><select className={sel} value={f.sales_manager} onChange={set("sales_manager")}><option value="">— Please select —</option>{SALES_MANAGERS.map(x => <option key={x}>{x}</option>)}</select></L></div>
        <div className="sm:col-span-2"><L t="Preferred intake / month (optional)"><Input value={f.preferred_intake} onChange={set("preferred_intake")} maxLength={100} /></L></div>
        <div className="sm:col-span-2"><L t="Questions or notes (optional)"><Textarea maxLength={2000} value={f.notes} onChange={set("notes")} /></L></div>
      </div>
      <div className="mt-5 space-y-3 text-sm">
        <label className="flex gap-3"><input type="checkbox" className="mt-1" checked={f.newsletter} onChange={set("newsletter")} />I would like to receive newsletters, promotions, offers and alerts of my favourite course's new run dates via email.</label>
        <label className="flex gap-3"><input type="checkbox" className="mt-1" checked={f.truth} onChange={set("truth")} /><span>By submitting this form, I confirm that all information provided is true, accurate and complete, and that I have double-checked the details. I acknowledge that SOQ International Academy will use the email address and contact details provided for course-related communications, and that incorrect or incomplete details may mean I miss course confirmations and reminders.</span></label>{err("truth")}
        <label className="flex gap-3"><input type="checkbox" className="mt-1" checked={f.terms} onChange={set("terms")} /><span>I have read and agree to SOQ International Academy's <a className="underline" href="https://soq.edu.sg/terms-of-service" target="_blank" rel="noreferrer">Terms of Service</a> and <a className="underline" href="https://soq.edu.sg/data-policy" target="_blank" rel="noreferrer">Data Protection Policy</a>, and consent to the collection, use and disclosure of my personal data in accordance with the PDPA for course administration and related purposes.</span></label>{err("terms")}
      </div>
      {err("form")}
      <Button disabled={busy} className="mt-6 h-12 rounded-full bg-brand-gold px-8 text-brand-navy hover:bg-brand-gold/85">{busy ? "Sending…" : "Submit application"}</Button>
    </form>
  );
}
