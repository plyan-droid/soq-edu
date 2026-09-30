import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories, courses } from "@/lib/site-content";
import type { CourseSection } from "@/lib/course-details";

export type Faq = { q: string; a: string };
export type CourseFields = {
  title: string; category: string; summary: string; price: string; duration: string; mode: string; badge: string; level: string;
  requirements: string; outcomes: string; sections: CourseSection[]; faqs: Faq[]; image_key: string;
  intake_start: string; intake_apply_by: string; intake_time: string;
};

export const emptyCourse = (): CourseFields => ({
  title: "", category: categories[0]!.name, summary: "", price: "", duration: "", mode: "Classroom", badge: "", level: "Beginner friendly",
  requirements: "", outcomes: "", sections: [{ title: "Module 1", items: [""] }], faqs: [], image_key: "",
  intake_start: "", intake_apply_by: "", intake_time: "",
});

/** Cleans the form into values ready to save. Returns an error message when required fields are missing. */
export function cleanCourse(f: CourseFields) {
  const outcomes = f.outcomes.split("\n").map(s => s.trim()).filter(Boolean);
  const sections = f.sections.map(s => ({ title: s.title.trim(), items: s.items.map(i => i.trim()).filter(Boolean) })).filter(s => s.title && s.items.length);
  const faqs = f.faqs.map(x => ({ q: x.q.trim(), a: x.a.trim() })).filter(x => x.q && x.a);
  let error = "";
  if (f.title.trim().length < 5) error = "Add a course title (at least 5 characters).";
  else if (f.summary.trim().length < 20) error = "Add a summary (at least 20 characters).";
  else if (!f.price.trim()) error = "Add the course fee.";
  else if (f.title.length > 150 || f.summary.length > 2000) error = "Title or summary is too long.";
  return { error, outcomes, sections, faqs };
}

export const imageFor = (key?: string | null) => (key ? courses.find(c => c.slug === key)?.image : undefined);
const photos = Array.from(new Map(courses.map(c => [c.image, c])).values());

export function CourseForm({ value: f, onChange: setF, showIntake = true, categoryLocked = false }: { value: CourseFields; onChange: (f: CourseFields) => void; showIntake?: boolean; categoryLocked?: boolean }) {
  const set = (k: keyof CourseFields) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const inp = (label: string, k: keyof CourseFields, hint?: string, type = "text") => (
    <label className="grid gap-1 text-sm font-medium">{label}<Input type={type} value={f[k] as string} onChange={set(k)} />{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>
  );
  const setSec = (i: number, s: CourseSection) => setF({ ...f, sections: f.sections.map((x, j) => (j === i ? s : x)) });
  const setFaq = (i: number, x: Faq) => setF({ ...f, faqs: f.faqs.map((y, j) => (j === i ? x : y)) });
  const card = "grid gap-4 rounded-lg border border-border bg-card p-6";
  return (
    <div className="grid gap-6">
      <section className={`${card} md:grid-cols-2`}>
        <h3 className="font-serif text-2xl text-primary md:col-span-2">Key details</h3>
        <div className="md:col-span-2">{inp("Course title *", "title")}</div>
        <label className="grid gap-1 text-sm font-medium">Category
          <select disabled={categoryLocked} className="h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60" value={f.category} onChange={set("category")}>{categories.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
        {inp("Fee *", "price", 'e.g. "$480" or "From $216"')}
        {inp("Duration", "duration", "e.g. 2 days, 16 hours")}
        {inp("Study mode", "mode", "Classroom, Blended, Online…")}
        {inp("Certification label", "badge", "WSQ, VTCT, Workshop, Diploma…")}
        {inp("Level", "level", "e.g. Beginner friendly, Intermediate level")}
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Summary *<Textarea rows={3} value={f.summary} onChange={set("summary")} /><span className="text-xs font-normal text-muted-foreground">Shown at the top of the course page and on course cards.</span></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Who it's for / entry requirements<Textarea rows={2} value={f.requirements} onChange={set("requirements")} /></label>
      </section>

      <section className={card}>
        <h3 className="font-serif text-2xl text-primary">Cover photo</h3>
        <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-6">
          {photos.map(c => (
            <button type="button" key={c.slug} onClick={() => setF({ ...f, image_key: c.slug })} aria-label={`Use photo from ${c.title}`}
              className={`overflow-hidden rounded-md border-2 ${f.image_key === c.slug ? "border-primary" : "border-transparent"}`}>
              <img src={c.image} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </button>))}
        </div>
        <p className="text-xs text-muted-foreground">Pick a photo. If none is chosen, a photo from the same category is used.</p>
      </section>

      <section className={card}>
        <h3 className="font-serif text-2xl text-primary">What you'll learn</h3>
        <Textarea rows={5} value={f.outcomes} onChange={set("outcomes")} />
        <p className="text-xs text-muted-foreground">One outcome per line. Shown on the course page, course cards and in Compare.</p>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">Syllabus modules</h3>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setF({ ...f, sections: [...f.sections, { title: `Module ${f.sections.length + 1}`, items: [""] }] })}><Plus /> Add module</Button>
        </div>
        {f.sections.map((s, i) => (
          <div key={i} className="rounded-md border border-border p-4">
            <div className="flex gap-2">
              <Input value={s.title} onChange={e => setSec(i, { ...s, title: e.target.value })} className="font-medium" aria-label="Module title" />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove module" onClick={() => setF({ ...f, sections: f.sections.filter((_, j) => j !== i) })}><Trash2 /></Button>
            </div>
            <Textarea className="mt-2" rows={Math.min(12, Math.max(3, s.items.length + 1))} value={s.items.join("\n")} onChange={e => setSec(i, { ...s, items: e.target.value.split("\n") })} />
            <p className="mt-1 text-xs text-muted-foreground">One topic per line.</p>
          </div>))}
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">Frequently asked questions</h3>
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setF({ ...f, faqs: [...f.faqs, { q: "", a: "" }] })}><Plus /> Add question</Button>
        </div>
        {f.faqs.length === 0 && <p className="text-sm text-muted-foreground">No course-specific questions — the standard SOQ questions are shown instead.</p>}
        {f.faqs.map((x, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border p-4">
            <div className="flex gap-2"><Input placeholder="Question" value={x.q} onChange={e => setFaq(i, { ...x, q: e.target.value })} /><Button type="button" variant="ghost" size="icon" aria-label="Remove question" onClick={() => setF({ ...f, faqs: f.faqs.filter((_, j) => j !== i) })}><Trash2 /></Button></div>
            <Textarea rows={2} placeholder="Answer" value={x.a} onChange={e => setFaq(i, { ...x, a: e.target.value })} />
          </div>))}
      </section>

      {showIntake && (
        <section className={`${card} md:grid-cols-3`}>
          <h3 className="font-serif text-2xl text-primary md:col-span-3">First intake (optional)</h3>
          {inp("Start date", "intake_start", undefined, "date")}
          {inp("Apply by", "intake_apply_by", undefined, "date")}
          {inp("Session time", "intake_time", "e.g. 9am – 6pm")}
          <p className="text-xs text-muted-foreground md:col-span-3">Shows on the public Course Calendar once the course is live.</p>
        </section>
      )}
    </div>
  );
}
