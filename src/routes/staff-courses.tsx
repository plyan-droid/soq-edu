import { PageSkeleton, ListSkeleton } from "@/components/start-here";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses, categories } from "@/lib/site-content";
import { courseOverridesQuery, mergeCourse, sectionsFor, allCourses, customToCourse } from "@/lib/course-overrides";
import type { CourseOverride } from "@/lib/course-overrides.functions";
import type { CourseSection } from "@/lib/course-details";

export const Route = createFileRoute("/staff-courses")({
  head: () => ({
    meta: [
      { title: "Course Editor | SOQ Staff Portal" },
      { name: "description", content: "SOQ staff tool for editing course syllabi, fees, durations and outcomes." },
      { property: "og:title", content: "SOQ Staff Course Editor" },
      { property: "og:description", content: "Edit SOQ course content." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StaffCourses,
});

type Form = { title: string; summary: string; price: string; duration: string; mode: string; badge: string; outcomes: string; sections: CourseSection[] };

function StaffCourses() {
  const { isAdmin, loading } = useAuth();
  const [slug, setSlug] = useState(courses[0]!.slug);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const { data: overrides = [] } = useQuery(courseOverridesQuery);

  if (loading) return <PageSkeleton />;
  if (!isAdmin) return (
    <div className="mx-auto max-w-7xl px-5 py-24">
      <h1 className="font-serif text-4xl text-primary">Staff only</h1>
      <p className="mt-2 text-muted-foreground">Sign in with an SOQ staff account to edit courses.</p>
      <Button asChild className="mt-5 rounded-full"><Link to="/login">Log in</Link></Button>
    </div>
  );

  const list = allCourses(overrides, true).filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Staff portal</p>
          <h1 className="font-serif text-5xl text-primary">Course editor</h1>
          <p className="mt-2 text-muted-foreground">Edit fees, duration, outcomes and syllabus. Changes go live on the course page straight away.</p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-full" onClick={() => setAdding(true)}><Plus /> Add course</Button>
          <Button asChild variant="outline" className="rounded-full"><Link to="/portal-admin">Students, applications & dates</Link></Button>
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="self-start rounded-lg border border-border bg-card p-4 lg:sticky lg:top-28">
          <Input placeholder="Search courses" value={q} onChange={e => setQ(e.target.value)} />
          <div className="mt-3 max-h-[70vh] overflow-y-auto">
            {categories.map(cat => {
              const items = list.filter(c => c.category === cat.name);
              if (!items.length) return null;
              return (
                <div key={cat.name} className="mt-3">
                  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-brand-gold">{cat.name}</p>
                  {items.map(c => (
                    <button key={c.slug} onClick={() => { setAdding(false); setSlug(c.slug); }} className={`mt-1 block w-full rounded-md px-2 py-1.5 text-left text-sm ${slug === c.slug ? "bg-brand-navy text-primary-foreground" : "hover:bg-muted"}`}>
                      {c.title}
                      {overrides.find(o => o.slug === c.slug)?.custom ? <span className="ml-1 text-[10px] text-brand-gold">● new</span> : overrides.some(o => o.slug === c.slug) && <span className="ml-1 text-[10px] text-brand-gold">● edited</span>}
                      {overrides.find(o => o.slug === c.slug)?.hidden && <span className="ml-1 text-[10px] opacity-70">(hidden)</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>
        {adding ? <NewCourse onCreated={s => { setAdding(false); setSlug(s); }} onCancel={() => setAdding(false)} /> : <Editor key={slug} slug={slug} />}
      </div>
    </div>
  );
}

function Editor({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const { data: overrides = [] } = useQuery(courseOverridesQuery);
  const o = overrides.find(x => x.slug === slug);
  const custom = !!o?.custom && !courses.some(c => c.slug === slug);
  const base = courses.find(c => c.slug === slug) ?? (o ? customToCourse(o) : courses[0]!);
  const initial = useMemo<Form>(() => {
    const m = mergeCourse(base, o);
    return { title: m.title, summary: m.summary, price: m.price, duration: m.duration, mode: m.mode, badge: m.badge, outcomes: m.outcomes.join("\n"), sections: structuredClone(sectionsFor(slug, o)) };
  }, [base, o, slug]);
  const [f, setF] = useState<Form>(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(initial), [initial]);

  const refresh = async () => { await qc.invalidateQueries({ queryKey: courseOverridesQuery.queryKey }); };
  const save = async () => {
    setBusy(true); setMsg("");
    const diff = (v: string, orig: string) => (v.trim() && v.trim() !== orig ? v.trim() : null);
    const outcomes = f.outcomes.split("\n").map(s => s.trim()).filter(Boolean);
    const sections = f.sections.map(s => ({ title: s.title.trim(), items: s.items.map(i => i.trim()).filter(Boolean) })).filter(s => s.title && s.items.length);
    const { error } = custom ? await supabase.from("course_overrides").update({
      title: f.title.trim(), summary: f.summary.trim(), price: f.price.trim(), duration: f.duration.trim(), mode: f.mode.trim(), badge: f.badge.trim(), outcomes, sections,
    }).eq("slug", slug) : await supabase.from("course_overrides").upsert({
      slug, hidden: o?.hidden ?? false,
      title: diff(f.title, base.title), summary: diff(f.summary, base.summary), price: diff(f.price, base.price),
      duration: diff(f.duration, base.duration), mode: diff(f.mode, base.mode), badge: diff(f.badge, base.badge),
      outcomes: JSON.stringify(outcomes) === JSON.stringify(base.outcomes) ? null : outcomes,
      sections: sections,
    });
    setBusy(false);
    if (error) return setMsg(`Could not save: ${error.message}`);
    setMsg("Saved. The course page is updated."); await refresh();
  };
  const toggleHidden = async () => {
    const hidden = !o?.hidden;
    const { error } = o ? await supabase.from("course_overrides").update({ hidden }).eq("slug", slug) : await supabase.from("course_overrides").insert({ slug, hidden });
    if (error) return setMsg(`Could not update: ${error.message}`);
    setMsg(hidden ? "Hidden from the public site." : "Visible on the public site again."); await refresh();
  };
  const remove = async () => {
    if (!confirm("Delete this course permanently? Its page will disappear.")) return;
    await supabase.from("course_intakes").delete().eq("course_slug", slug);
    await supabase.from("course_overrides").delete().eq("slug", slug);
    await refresh(); location.reload();
  };
  const reset = async () => {
    if (!confirm("Remove all edits and go back to the original content for this course?")) return;
    await supabase.from("course_overrides").delete().eq("slug", slug);
    setMsg("Restored original content."); await refresh();
  };
  const setSec = (i: number, s: CourseSection) => setF({ ...f, sections: f.sections.map((x, j) => (j === i ? s : x)) });
  const field = (label: string, k: keyof Omit<Form, "sections" | "outcomes" | "summary">, hint?: string) => (
    <label className="grid gap-1 text-sm font-medium">{label}<Input value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{base.category}</p>
          <h2 className="font-serif text-3xl text-primary">{f.title}</h2>
          {o?.hidden && <p className="text-xs font-medium text-destructive">Hidden from the public site</p>}
          {o && <p className="text-xs text-muted-foreground">Last edited {new Date(o.updated_at).toLocaleString("en-SG")}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="rounded-full"><Link to="/courses/$slug" params={{ slug }} target="_blank"><ExternalLink /> View page</Link></Button>
          <Button variant="outline" className="rounded-full" onClick={() => void toggleHidden()}>{o?.hidden ? <><Eye /> Show course</> : <><EyeOff /> Hide course</>}</Button>
          {custom ? <Button variant="outline" className="rounded-full" onClick={() => void remove()}><Trash2 /> Delete</Button> : o && <Button variant="outline" className="rounded-full" onClick={() => void reset()}><RotateCcw /> Restore original</Button>}
          <Button className="rounded-full" disabled={busy} onClick={() => void save()}><Save /> {busy ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
      {msg && <p className="rounded-md bg-brand-gold-soft px-4 py-2 text-sm text-primary">{msg}</p>}

      <section className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <h3 className="font-serif text-2xl text-primary md:col-span-2">Key details</h3>
        <div className="md:col-span-2">{field("Course title", "title")}</div>
        {field("Fee", "price", 'e.g. "From $216" or "Enquire for details"')}
        {field("Duration", "duration")}
        {field("Study mode", "mode", "Classroom, Blended…")}
        {field("Certification label", "badge", "WSQ, VTCT, Diploma…")}
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Summary<Textarea rows={3} value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} /></label>
        <p className="text-sm text-muted-foreground md:col-span-2">Intake dates and apply-by deadlines are managed on the <Link to="/portal-admin" className="underline">staff admin page</Link> and show on the Course Calendar.</p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-serif text-2xl text-primary">Learning outcomes</h3>
        <p className="text-sm text-muted-foreground">One outcome per line. Shown on course cards and in Compare.</p>
        <Textarea className="mt-3" rows={6} value={f.outcomes} onChange={e => setF({ ...f, outcomes: e.target.value })} />
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-primary">Syllabus sections</h3>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setF({ ...f, sections: [...f.sections, { title: "New section", items: [""] }] })}><Plus /> Add section</Button>
        </div>
        <div className="mt-4 grid gap-5">
          {f.sections.map((s, i) => (
            <div key={i} className="rounded-md border border-border p-4">
              <div className="flex gap-2">
                <Input value={s.title} onChange={e => setSec(i, { ...s, title: e.target.value })} className="font-medium" />
                <Button variant="ghost" size="icon" aria-label="Remove section" onClick={() => setF({ ...f, sections: f.sections.filter((_, j) => j !== i) })}><Trash2 /></Button>
              </div>
              <Textarea className="mt-2" rows={Math.min(12, Math.max(3, s.items.length + 1))} value={s.items.join("\n")} onChange={e => setSec(i, { ...s, items: e.target.value.split("\n") })} />
              <p className="mt-1 text-xs text-muted-foreground">One point per line.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NewCourse({ onCreated, onCancel }: { onCreated: (slug: string) => void; onCancel: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", category: categories[0]!.name as string, summary: "", price: "", duration: "", mode: "Classroom", badge: "", outcomes: "", syllabus: "", start: "", applyBy: "", time: "" });
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const create = async () => {
    if (!f.title.trim() || !f.summary.trim() || !f.price.trim()) return setMsg("Title, summary and fee are required.");
    const base = f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "course";
    const existing = (qc.getQueryData(courseOverridesQuery.queryKey) as CourseOverride[] | undefined) ?? [];
    let slug = base; let n = 2;
    while (courses.some(c => c.slug === slug) || existing.some(o => o.slug === slug)) slug = `${base}-${n++}`;
    const sections = f.syllabus.split(/\n\s*\n/).map(b => b.split("\n").map(s => s.trim()).filter(Boolean)).filter(b => b.length).map(b => ({ title: b[0]!, items: b.slice(1).length ? b.slice(1) : [b[0]!] }));
    setBusy(true); setMsg("");
    const { error } = await supabase.from("course_overrides").insert({
      slug, custom: true, hidden: false, category: f.category, title: f.title.trim(), summary: f.summary.trim(), price: f.price.trim(),
      duration: f.duration.trim() || null, mode: f.mode.trim() || null, badge: f.badge.trim() || null,
      outcomes: f.outcomes.split("\n").map(s => s.trim()).filter(Boolean), sections,
    });
    if (!error && f.start) await supabase.from("course_intakes").insert({ course_slug: slug, start_date: f.start, apply_by: f.applyBy || null, session_time: f.time || null, status: "open" });
    setBusy(false);
    if (error) return setMsg(`Could not create: ${error.message}`);
    await qc.invalidateQueries({ queryKey: courseOverridesQuery.queryKey });
    onCreated(slug);
  };
  const inp = (label: string, k: keyof typeof f, hint?: string, type = "text") => <label className="grid gap-1 text-sm font-medium">{label}<Input type={type} value={f[k]} onChange={set(k)} />{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</label>;
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-lg border border-border bg-card p-6 md:grid-cols-2">
        <h2 className="font-serif text-3xl text-primary md:col-span-2">Add a new course</h2>
        <div className="md:col-span-2">{inp("Course title *", "title")}</div>
        <label className="grid gap-1 text-sm font-medium">Category<select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={f.category} onChange={set("category")}>{categories.map(c => <option key={c.name}>{c.name}</option>)}</select></label>
        {inp("Fee *", "price", 'e.g. "$480" or "From $216"')}
        {inp("Duration", "duration", "e.g. 2 days")}
        {inp("Study mode", "mode")}
        {inp("Certification label", "badge", "WSQ, Workshop, Diploma…")}
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Summary *<Textarea rows={3} value={f.summary} onChange={set("summary")} /></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Learning outcomes<Textarea rows={4} value={f.outcomes} onChange={set("outcomes")} /><span className="text-xs font-normal text-muted-foreground">One per line.</span></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Syllabus<Textarea rows={6} value={f.syllabus} onChange={set("syllabus")} /><span className="text-xs font-normal text-muted-foreground">First line of each block is the section title, then one point per line. Leave a blank line between sections.</span></label>
        <h3 className="font-serif text-xl text-primary md:col-span-2">First intake (optional)</h3>
        {inp("Start date", "start", undefined, "date")}
        {inp("Apply by", "applyBy", undefined, "date")}
        {inp("Session time", "time", "e.g. 9am – 6pm")}
      </section>
      {msg && <p className="rounded-md bg-brand-gold-soft px-4 py-2 text-sm text-primary">{msg}</p>}
      <div className="flex gap-2"><Button className="rounded-full" disabled={busy} onClick={() => void create()}><Plus /> {busy ? "Creating…" : "Create course"}</Button><Button variant="ghost" className="rounded-full" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}
