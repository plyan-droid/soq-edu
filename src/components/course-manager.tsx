import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, EyeOff, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CourseForm, cleanCourse, emptyCourse, type CourseFields } from "@/components/course-form";
import { createLiveCourse } from "@/lib/course-publish";
import { supabase } from "@/integrations/supabase/client";
import { courses, categories } from "@/lib/site-content";
import { courseOverridesQuery, mergeCourse, sectionsFor, allCourses, customToCourse } from "@/lib/course-overrides";

const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";

type IntakeRow = { id: string; course_slug: string; start_date: string; end_date: string | null; apply_by: string | null; session_time: string | null; status: string };

const intakesQuery = {
  queryKey: ["admin-intakes"],
  queryFn: async () => ((await supabase.from("course_intakes").select("*").order("start_date")).data ?? []) as IntakeRow[],
};

/** Combined staff tool: course content editing, new courses and intake dates in one place. */
export function CoursesAndIntakes() {
  const [slug, setSlug] = useState(courses[0]!.slug);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"course" | "schedule">("course");
  const [q, setQ] = useState("");
  const { data: overrides = [] } = useQuery(courseOverridesQuery);

  const list = allCourses(overrides, true).filter(c => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-xl text-muted-foreground">Edit everything on a course page and manage its intake dates in one place. Changes go live straight away.</p>
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={() => { setAdding(true); setView("course"); }}><Plus /> Add course</Button>
          <Button variant={view === "schedule" ? "default" : "outline"} className="rounded-full" onClick={() => setView(v => (v === "schedule" ? "course" : "schedule"))}>
            <CalendarDays /> {view === "schedule" ? "Back to courses" : "All intake dates"}
          </Button>
        </div>
      </div>

      {view === "schedule" ? <MasterSchedule /> : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
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
                      <button key={c.slug} onClick={() => { setAdding(false); setSlug(c.slug); }} className={`mt-1 block w-full rounded-md px-2 py-1.5 text-left text-sm ${!adding && slug === c.slug ? "bg-brand-navy text-primary-foreground" : "hover:bg-muted"}`}>
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
      )}
    </div>
  );
}

function Editor({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const { data: overrides = [] } = useQuery(courseOverridesQuery);
  const o = overrides.find(x => x.slug === slug);
  const custom = !!o?.custom && !courses.some(c => c.slug === slug);
  const base = courses.find(c => c.slug === slug) ?? (o ? customToCourse(o) : courses[0]!);
  const initial = useMemo<CourseFields>(() => {
    const m = mergeCourse(base, o);
    return { ...emptyCourse(), title: m.title, category: m.category, summary: m.summary, price: m.price, duration: m.duration, mode: m.mode, badge: m.badge,
      level: o?.level ?? "", requirements: o?.requirements ?? "", outcomes: m.outcomes.join("\n"), sections: structuredClone(sectionsFor(slug, o)),
      faqs: structuredClone(o?.faqs ?? []), image_key: o?.image_key ?? "" };
  }, [base, o, slug]);
  const [f, setF] = useState<CourseFields>(initial);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => setF(initial), [initial]);

  const refresh = async () => { await qc.invalidateQueries({ queryKey: courseOverridesQuery.queryKey }); };
  const save = async () => {
    const c = cleanCourse(f);
    if (c.error) return setMsg(c.error);
    setBusy(true); setMsg("");
    const diff = (v: string, orig: string) => (v.trim() && v.trim() !== orig ? v.trim() : null);
    const extra = { level: f.level.trim() || null, requirements: f.requirements.trim() || null, faqs: c.faqs, image_key: f.image_key || null, sections: c.sections };
    const { error } = custom ? await supabase.from("course_overrides").update({
      title: f.title.trim(), category: f.category, summary: f.summary.trim(), price: f.price.trim(), duration: f.duration.trim(), mode: f.mode.trim(), badge: f.badge.trim(), outcomes: c.outcomes, ...extra,
    }).eq("slug", slug) : await supabase.from("course_overrides").upsert({
      slug, hidden: o?.hidden ?? false,
      title: diff(f.title, base.title), summary: diff(f.summary, base.summary), price: diff(f.price, base.price),
      duration: diff(f.duration, base.duration), mode: diff(f.mode, base.mode), badge: diff(f.badge, base.badge),
      outcomes: JSON.stringify(c.outcomes) === JSON.stringify(base.outcomes) ? null : c.outcomes, ...extra,
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

  return (
    <div className="grid min-w-0 gap-6">
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
      <CourseForm value={f} onChange={setF} showIntake={false} categoryLocked={!custom} />
      <div><Button className="rounded-full" disabled={busy} onClick={() => void save()}><Save /> {busy ? "Saving…" : "Save changes"}</Button></div>
      <CourseIntakes slug={slug} title={f.title} />
    </div>
  );
}

function CourseIntakes({ slug, title }: { slug: string; title: string }) {
  const qc = useQueryClient();
  const blank = { start_date: "", end_date: "", apply_by: "", session_time: "" };
  const [f, setF] = useState(blank);
  const { data = [] } = useQuery(intakesQuery);
  const rows = data.filter(i => i.course_slug === slug);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-intakes"] }); void qc.invalidateQueries({ queryKey: ["intakes"] }); };
  const add = async () => {
    if (!f.start_date) return;
    const { error } = await supabase.from("course_intakes").insert({ course_slug: slug, start_date: f.start_date, end_date: f.end_date || null, apply_by: f.apply_by || null, session_time: f.session_time || null, status: "confirmed" });
    if (error) alert(error.message); else { setF(blank); refresh(); }
  };
  const setStatus = async (id: string, status: string) => { await supabase.from("course_intakes").update({ status }).eq("id", id); refresh(); };
  const del = async (id: string) => { await supabase.from("course_intakes").delete().eq("id", id); refresh(); };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-serif text-2xl text-primary">Intake dates for {title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">These dates appear on the public Course Calendar.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <label className="text-xs text-muted-foreground">Start<Input type="date" value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">End<Input type="date" value={f.end_date} onChange={e => setF({ ...f, end_date: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">Apply by<Input type="date" value={f.apply_by} onChange={e => setF({ ...f, apply_by: e.target.value })} /></label>
        <label className="text-xs text-muted-foreground">Class time<Input placeholder="9.30am - 4.30pm" value={f.session_time} onChange={e => setF({ ...f, session_time: e.target.value })} /></label>
        <Button className="self-end rounded-full" onClick={() => void add()}><Plus /> Add intake</Button>
      </div>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No intake dates yet for this course.</p> : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr>{["Dates", "Apply by", "Time", "Status", ""].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map(i => (
              <tr key={i.id} className="border-t border-border">
                <td className="whitespace-nowrap p-3">{i.start_date}{i.end_date ? ` → ${i.end_date}` : ""}</td>
                <td className="p-3">{i.apply_by ?? "—"}</td>
                <td className="p-3">{i.session_time ?? "—"}</td>
                <td className="p-3"><select className={sel} value={i.status} onChange={e => void setStatus(i.id, e.target.value)}>{["tentative", "confirmed", "full", "cancelled"].map(s => <option key={s}>{s}</option>)}</select></td>
                <td className="p-3"><Button size="icon" variant="ghost" onClick={() => void del(i.id)}><Trash2 /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MasterSchedule() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(intakesQuery);
  const { data: overrides = [] } = useQuery(courseOverridesQuery);
  const all = allCourses(overrides, true);
  const titleFor = (s: string) => all.find(c => c.slug === s)?.title ?? s;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin-intakes"] }); void qc.invalidateQueries({ queryKey: ["intakes"] }); };
  const setStatus = async (id: string, status: string) => { await supabase.from("course_intakes").update({ status }).eq("id", id); refresh(); };
  const del = async (id: string) => { await supabase.from("course_intakes").delete().eq("id", id); refresh(); };
  return (
    <div className="mt-6">
      <h2 className="font-serif text-3xl text-primary">All intake dates</h2>
      <p className="mt-1 text-sm text-muted-foreground">Every scheduled intake across all courses, as shown on the public Course Calendar.</p>
      {data.length === 0 ? <p className="mt-4 text-muted-foreground">No intake dates yet.</p> : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr>{["Course", "Dates", "Apply by", "Time", "Status", ""].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.map(i => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3">{titleFor(i.course_slug)}</td>
                <td className="whitespace-nowrap p-3">{i.start_date}{i.end_date ? ` → ${i.end_date}` : ""}</td>
                <td className="p-3">{i.apply_by ?? "—"}</td>
                <td className="p-3">{i.session_time ?? "—"}</td>
                <td className="p-3"><select className={sel} value={i.status} onChange={e => void setStatus(i.id, e.target.value)}>{["tentative", "confirmed", "full", "cancelled"].map(s => <option key={s}>{s}</option>)}</select></td>
                <td className="p-3"><Button size="icon" variant="ghost" onClick={() => void del(i.id)}><Trash2 /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewCourse({ onCreated, onCancel }: { onCreated: (slug: string) => void; onCancel: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState<CourseFields>(emptyCourse);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const create = async () => {
    setBusy(true); setMsg("");
    const r = await createLiveCourse(f);
    setBusy(false);
    if (r.error || !r.slug) return setMsg(r.error ?? "Could not create the course.");
    await qc.invalidateQueries({ queryKey: courseOverridesQuery.queryKey });
    await qc.invalidateQueries({ queryKey: ["intakes"] });
    await qc.invalidateQueries({ queryKey: ["admin-intakes"] });
    onCreated(r.slug);
  };
  return (
    <div className="grid min-w-0 gap-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-serif text-3xl text-primary">Add a new course</h2>
        <p className="text-sm text-muted-foreground">Fill in everything shown on a course page. It goes live as soon as you create it.</p>
      </div>
      <CourseForm value={f} onChange={setF} />
      {msg && <p className="rounded-md bg-brand-gold-soft px-4 py-2 text-sm text-primary">{msg}</p>}
      <div className="flex gap-2"><Button className="rounded-full" disabled={busy} onClick={() => void create()}><Plus /> {busy ? "Creating…" : "Create course"}</Button><Button variant="ghost" className="rounded-full" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}
