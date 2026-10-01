import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Award, BadgeCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import logo from "@/assets/soq-logo-local.png";

export type CertDesign = { heading: string; subtitle: string; body: string; signatory: string; signatory_title: string; accent: string; template: string };
export const TEMPLATES = [["classic", "Academy Classic"], ["modern", "Contemporary"], ["heritage", "Heritage" ]] as const;
const NAVY = "#102b4b";
const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const longDate = (d: string) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" });
const wording = (b: string, name: string, course: string) => b
  .replace(/this is to certify that\s*/i, "")
  .split("{name}").join("")
  .split(name).join("")
  .split("{course}").join(course)
  .trim().replace(/^[,\s]+/, "") || `has successfully completed ${course}.`;
const isSample = (code: string) => code === "SOQ-SAMPLE";

export function useCertDesign() {
  return useQuery({ queryKey: ["cert-design"], queryFn: async () => (await supabase.from("certificate_design").select("*").eq("id", 1).maybeSingle()).data as CertDesign | null });
}

/* The same content hierarchy and three compositions are used by the PDF below. */
export function CertificateView({ design: d, name, course, code, date }: { design: CertDesign; name: string; course: string; code: string; date: string }) {
  const t = d.template;
  return (
    <div className="@container w-full">
      <div className={`relative flex aspect-[297/210] w-full flex-col overflow-hidden border bg-card text-primary shadow-sm ${t === "modern" ? "text-left" : "text-center"}`}>
        {t === "modern" ? <div className="absolute inset-y-0 left-0 w-[3%] bg-primary" /> : <div className={`pointer-events-none absolute inset-[3%] border ${t === "heritage" ? "border-brand-gold" : "border-primary"}`} />}
        {t === "heritage" && <div className="pointer-events-none absolute inset-[4%] border border-brand-gold/45" />}
        <div className={`relative flex h-full flex-col ${t === "modern" ? "items-start px-[11%]" : "items-center px-[10%]"}`}>
          <img src={logo} alt="SOQ International Academy" className={`object-contain ${t === "modern" ? "mt-[5%] h-[19%]" : "mt-[4%] h-[21%]"}`} />
          <p className="mt-[0.5%] font-sans text-[1.35cqw] font-semibold uppercase text-primary">SOQ International Academy</p>
          <p className="mt-[0.4%] font-sans text-[1.05cqw] text-muted-foreground">{d.subtitle}</p>
          <div className={`mt-[3%] h-px ${t === "modern" ? "w-[17%] bg-primary" : "w-[15%] bg-brand-gold"}`} />
          <h2 className="mt-[2%] font-serif text-[4.4cqw] font-semibold leading-none">{d.heading}</h2>
          <p className="mt-[2%] font-sans text-[1.2cqw] uppercase text-muted-foreground">Presented to</p>
          <p className="mt-[0.5%] max-w-full break-words font-serif text-[5.2cqw] font-semibold leading-tight text-primary">{name}</p>
          <p className="mt-[1%] max-w-[85%] font-sans text-[1.65cqw] leading-snug">{wording(d.body, name, course)}</p>
          <div className={`mt-auto flex w-full items-end justify-between gap-[3%] pb-[6%] font-sans text-[1.25cqw] ${t === "modern" ? "pl-0" : "px-[3%]"}`}>
            <div className="min-w-0 text-left"><div className="mb-[4%] w-[75%] border-t border-primary/50" /><p className="font-semibold">{d.signatory}</p><p className="text-muted-foreground">{d.signatory_title}</p></div>
            <div className="min-w-0 text-right"><p className="font-semibold">{longDate(date)}</p><p className="text-muted-foreground">No. {code}</p></div>
          </div>
          <p className="absolute bottom-[2%] font-sans text-[1.05cqw] text-muted-foreground">Verify at soq.edu.sg/verify-certificate</p>
          {isSample(code) && <span className="pointer-events-none absolute right-[7%] top-[9%] rotate-12 border border-primary px-[1%] font-sans text-[2cqw] font-bold text-primary/60">SAMPLE</span>}
        </div>
      </div>
    </div>
  );
}

function hex(h: string): [number, number, number] { const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

async function logoData() {
  const response = await fetch(logo);
  if (!response.ok) throw new Error("SOQ logo could not be loaded");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("SOQ logo could not be read"));
    reader.onerror = () => reject(new Error("SOQ logo could not be read"));
    reader.readAsDataURL(blob);
  });
}

export async function downloadCertificatePdf(d: CertDesign, c: { name: string; course: string; code: string; date: string }) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210, acc = hex(d.accent), navy = hex(NAVY), modern = d.template === "modern";
  const textAlign = modern ? "left" : "center";
  const x = modern ? 46 : W / 2;
  pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, "F");
  pdf.setDrawColor(...(d.template === "classic" ? navy : acc));
  if (modern) { pdf.setFillColor(...navy); pdf.rect(0, 0, 9, H, "F"); }
  else { pdf.setLineWidth(0.6); pdf.rect(9, 9, W - 18, H - 18); }
  if (d.template === "heritage") { pdf.setLineWidth(0.25); pdf.rect(12, 12, W - 24, H - 24); }
  const logoImage = await logoData();
  pdf.addImage(logoImage, "PNG", modern ? 41 : W / 2 - 19, 15, 38, 38);
  const line = (s: string, y: number, font: "times" | "helvetica", style: "normal" | "bold", size: number, color: [number, number, number], width = 230, maxLines = 1) => {
    pdf.setFont(font, style); pdf.setTextColor(...color);
    let fitted = size;
    pdf.setFontSize(fitted);
    let lines = pdf.splitTextToSize(s, width) as string[];
    while (lines.length > maxLines && fitted > 7) {
      fitted -= 0.5;
      pdf.setFontSize(fitted);
      lines = pdf.splitTextToSize(s, width) as string[];
    }
    pdf.text(lines, x, y, { align: textAlign, lineHeightFactor: 1.1 });
  };
  line("SOQ INTERNATIONAL ACADEMY", 55, "helvetica", "bold", 9, navy);
  line(d.subtitle, 61, "helvetica", "normal", 8, [90, 96, 105]);
  pdf.setDrawColor(...acc); pdf.setLineWidth(0.4); pdf.line(x - (modern ? 0 : 22), 67, x + (modern ? 37 : 22), 67);
  line(d.heading, 83, "times", "bold", 27, navy, 225);
  line("PRESENTED TO", 96, "helvetica", "normal", 8, [90, 96, 105]);
  line(c.name, 111, "times", "bold", 30, navy, 210);
  line(wording(d.body, c.name, c.course), 124, "helvetica", "normal", 11, navy, 208, 4);
  const sx = modern ? 46 : 40;
  pdf.setDrawColor(...acc); pdf.line(sx, 170, sx + 67, 170);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...navy); pdf.text(d.signatory, sx, 176);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(90, 96, 105); pdf.text(d.signatory_title, sx, 181);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.setTextColor(...navy); pdf.text(longDate(c.date), W - 40, 176, { align: "right" });
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(90, 96, 105); pdf.text(`No. ${c.code}`, W - 40, 181, { align: "right" });
  pdf.setFontSize(7); pdf.text(`Verify at ${window.location.origin}/verify-certificate`, W / 2, H - 15, { align: "center" });
  if (isSample(c.code)) { pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.setTextColor(...acc); pdf.text("SAMPLE — NOT VALID", W - 24, 24, { align: "right" }); }
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
