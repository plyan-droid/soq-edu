import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories } from "@/lib/site-content";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning", "Afternoon", "Evening"];
const subjects: string[] = categories.map(c => c.name);
type Tutor = { user_id: string; display_name: string; headline?: string; years_experience?: number | null; bio: string; subjects: string[]; days: string[]; times: string[]; location: string; online: boolean; visible: boolean };

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map(o => {
    const on = value.includes(o);
    return <button key={o} type="button" onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])} className={`rounded-full border px-4 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{o}</button>;
  })}</div>;
}

export function TutorProfileEditor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-tutor", user?.id], enabled: !!user, queryFn: async () => (await supabase.from("tutor_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data as Tutor | null });
  const [f, setF] = useState<Tutor | null>(null);
  const v: Tutor = f ?? data ?? { user_id: user!.id, display_name: "", bio: "", subjects: [], days: [], times: [], location: "Anson Road campus", online: true, visible: true };
  const set = (p: Partial<Tutor>) => setF({ ...v, ...p });
  const save = async () => {
    if (!v.display_name.trim()) { toast.error("Add your display name"); return; }
    const { error } = await supabase.from("tutor_profiles").upsert({ ...v, user_id: user!.id, updated_at: new Date().toISOString() });
    if (error) { toast.error("Couldn't save"); return; }
    toast.success("Your trainer listing is saved"); void qc.invalidateQueries({ queryKey: ["tutors"] }); void qc.invalidateQueries({ queryKey: ["start-here"] });
  };
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">This is what visitors see on the Book a 1-to-1 tutor page and in Tutor Finder.</p>
      <div className="mt-4 grid gap-3">
        <Input placeholder="Display name" value={v.display_name} onChange={e => set({ display_name: e.target.value })} maxLength={80} />
        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><Input placeholder="Headline, e.g. Digital marketing coach" value={v.headline ?? ""} onChange={e => set({ headline: e.target.value })} maxLength={80} /><Input type="number" min={0} max={60} placeholder="Years experience" value={v.years_experience ?? ""} onChange={e => set({ years_experience: e.target.value ? Number(e.target.value) : null })} /></div>
        <Textarea placeholder="Short bio" value={v.bio} onChange={e => set({ bio: e.target.value })} maxLength={600} />
        <Chips options={subjects} value={v.subjects} onChange={s => set({ subjects: s })} />
        <Chips options={DAYS} value={v.days} onChange={s => set({ days: s })} />
        <Chips options={TIMES} value={v.times} onChange={s => set({ times: s })} />
        <Input placeholder="Location" value={v.location} onChange={e => set({ location: e.target.value })} maxLength={100} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.online} onChange={e => set({ online: e.target.checked })} /> I also teach online</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.visible} onChange={e => set({ visible: e.target.checked })} /> Show me in Tutor Finder</label>
        <Button className="justify-self-start rounded-full" onClick={() => void save()}>Save listing</Button>
      </div>
    </div>
  );
}
