import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, BadgeCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";

export type CertDesign = { heading: string; subtitle: string; body: string; signatory: string; signatory_title: string; accent: string; template: string };
export const TEMPLATES = [["classic", "Classic"], ["modern", "Modern"], ["heritage", "Heritage"]] as const;
const NAVY = "#1b2a4a";
const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const longDate = (d: string) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
const fill = (b: string, name: string, course: string) => b.split("{name}").join(name).split("{course}").join(course);

export function useCertDesign() {
  return useQuery({ queryKey: ["cert-design"], queryFn: async () => (await supabase.from("certificate_design").select("*").eq("id", 1).maybeSingle()).data as CertDesign | null });
}

/* On-screen certificate (same layout as the PDF) */
export function CertificateView({ design: d, name, course, code, date }: { design: CertDesign; name: string; course: string; code: string; date: string }) {
  const t = d.template;
  const frame = t === "modern" ? { borderLeft: `18px solid ${d.accent}` } : t === "heritage" ? { border: `3px solid ${d.accent}`, outline: `1px solid ${d.accent}`, outlineOffset: "-12px" } : { border: `10px double ${d.accent}` };
  return (
    <div className={`relative flex aspect-[1.414] w-full flex-col justify-center overflow-hidden rounded-sm bg-white p-[6%] text-[#1b2a4a] shadow-md ${t === "modern" ? "items-start text-left" : "items-center text-center"}`} style={frame}>
      {t === "heritage" && <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[18vw] leading-none opacity-[0.04] lg:text-[9vw]">SOQ</div>}
      <p className="text-[clamp(8px,1.1vw,13px)] font-semibold uppercase tracking-[0.35em]" style={{ color: d.accent }}>SOQ International Academy</p>
      <p className="text-[clamp(6px,0.8vw,10px)] tracking-widest text-neutral-500">{d.subtitle}</p>
      <h2 className="mt-[3%] font-serif text-[clamp(18px,3vw,40px)] leading-tight">{d.heading}</h2>
      <p className="mt-[2%] text-[clamp(7px,0.9vw,12px)] uppercase tracking-widest text-neutral-500">This is to certify that</p>
      <p className="mt-[1%] font-script text-[clamp(22px,3.6vw,48px)] leading-tight" style={{ color: d.accent }}>{name}</p>
      <p className="mt-[1%] max-w-[80%] text-[clamp(8px,1vw,14px)] leading-relaxed">{fill(d.body, name, course)}</p>
      <div className={`mt-[4%] flex w-full items-end ${t === "modern" ? "gap-12" : "justify-between"} text-[clamp(6px,0.8vw,11px)]`}>
        <div><p className="border-t border-neutral-400 pt-1 font-semibold">{d.signatory}</p><p className="text-neutral-500">{d.signatory_title}</p></div>
        <div className="text-right"><p className="font-semibold">{longDate(date)}</p><p className="text-neutral-500">Certificate no. {code}</p></div>
      </div>
    </div>
  );
}

function hex(h: string): [number, number, number] { const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

export async function downloadCertificatePdf(d: CertDesign, c: { name: string; course: string; code: string; date: string }) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210, acc = hex(d.accent), navy = hex(NAVY), modern = d.template === "modern";
  pdf.setDrawColor(...acc); pdf.setFillColor(...acc);
  if (modern) pdf.rect(0, 0, 14, H, "F");
  else if (d.template === "heritage") { pdf.setLineWidth(1.2); pdf.rect(8, 8, W - 16, H - 16); pdf.setLineWidth(0.3); pdf.rect(13, 13, W - 26, H - 26);
    pdf.setTextColor(245, 245, 245); pdf.setFont("times", "bold"); pdf.setFontSize(160); pdf.text("SOQ", W / 2, H / 2 + 25, { align: "center" }); }
  else { pdf.setLineWidth(1.5); pdf.rect(8, 8, W - 16, H - 16); pdf.setLineWidth(0.5); pdf.rect(12, 12, W - 24, H - 24); }
  const x = modern ? 34 : W / 2, align = modern ? "left" : "center";
  const t = (s: string, y: number, font: string, style: string, size: number, color: [number, number, number], opts: { maxW?: number } = {}) => {
    pdf.setFont(font, style); pdf.setFontSize(size); pdf.setTextColor(...color);
    const lines = opts.maxW ? pdf.splitTextToSize(s, opts.maxW) : s; pdf.text(lines, x, y, { align: align as "left" | "center" });
    return Array.isArray(lines) ? lines.length : 1;
  };
  t("SOQ INTERNATIONAL ACADEMY", 38, "helvetica", "bold", 12, acc);
  t(d.subtitle, 44, "helvetica", "normal", 8, [120, 120, 120]);
  t(d.heading, 64, "times", "bold", 30, navy, { maxW: 230 });
  t("THIS IS TO CERTIFY THAT", 80, "helvetica", "normal", 9, [120, 120, 120]);
  t(c.name, 98, "times", "bolditalic", 34, acc, { maxW: 230 });
  t(fill(d.body, c.name, c.course), 114, "helvetica", "normal", 12, navy, { maxW: 210 });
  pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
  const sx = modern ? 34 : 40; pdf.line(sx, 170, sx + 70, 170);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(...navy); pdf.text(d.signatory, sx, 176);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(120, 120, 120); pdf.text(d.signatory_title, sx, 181);
  pdf.setFont("helvetica", "bold"); pdf.setTextColor(...navy); pdf.text(longDate(c.date), W - 40, 176, { align: "right" });
  pdf.setFont("helvetica", "normal"); pdf.setTextColor(120, 120, 120); pdf.text(`Certificate no. ${c.code}`, W - 40, 181, { align: "right" });
  pdf.setFontSize(7); pdf.text(`Verify at ${window.location.origin}/verify-certificate`, W / 2, H - 16, { align: "center" });
  pdf.save(`SOQ-certificate-${c.code}.pdf`);
}

/* Student portal: My certificates */
type Cert = { id: string; code: string; student_name: string; course_slug: string; issued_on: string; status: string };
export function MyCertificates({ userId }: { userId: string }) {
  const { data: design } = useCertDesign();
  const { data = [] } = useQuery({ queryKey: ["my-certs", userId], queryFn: async () => ((await supabase.from("certificates").select("id,code,student_name,course_slug,issued_on,status").eq("student_id", userId).order("issued_on", { ascending: false })).data ?? []) as Cert[] });
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
      <h2 className="flex items-center gap-2 font-serif text-3xl text-primary"><Award className="size-6 text-brand-gold" /> My certificates</h2>
      {data.length === 0 ? <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No certificates yet. You'll get one here when you finish a course or pass its certificate quiz.</p> : (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {data.map(c => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              {design && <CertificateView design={design} name={c.student_name} course={courseName(c.course_slug)} code={c.code} date={c.issued_on} />}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-medium">{courseName(c.course_slug)}</p><p className="text-xs text-muted-foreground">{c.code} · {c.status === "valid" ? "Valid" : "Revoked"}</p></div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/verify-certificate" search={{ code: c.code }}><BadgeCheck /> Verify</Link></Button>
                  <Button size="sm" className="rounded-full" disabled={!design || c.status !== "valid"} onClick={() => { if (design) void downloadCertificatePdf(design, { name: c.student_name, course: courseName(c.course_slug), code: c.code, date: c.issued_on }).catch(() => toast.error("Couldn't create the PDF")); }}><Download /> Download PDF</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
