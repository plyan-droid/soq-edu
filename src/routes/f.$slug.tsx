import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/f/$slug")({
  head: () => ({ meta: [
    { title: "Form | SOQ International Academy" },
    { name: "description", content: "Fill in this SOQ International Academy form." },
    { property: "og:title", content: "SOQ Form" }, { property: "og:description", content: "Fill in this SOQ International Academy form." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

type Field = { label: string; type: string; required: boolean; options?: string };

function Page() {
  const { slug } = Route.useParams();
  const { data: form, isLoading } = useQuery({ queryKey: ["form", slug], queryFn: async () => (await supabase.from("custom_forms").select("*").eq("slug", slug).maybeSingle()).data });
  const [v, setV] = useState<Record<string, string>>({}); const [done, setDone] = useState(false);
  if (isLoading) return <p className="mx-auto max-w-2xl px-5 py-20 text-muted-foreground">Loading…</p>;
  if (!form) return <p className="mx-auto max-w-2xl px-5 py-20 text-muted-foreground">This form isn't available.</p>;
  const fields = form.fields as unknown as Field[];
  const submit = async () => {
    for (const f of fields) if (f.required && !v[f.label]?.trim()) return void toast.error(`Please fill in "${f.label}".`);
    const data = Object.fromEntries(fields.map(f => [f.label, (v[f.label] ?? "").slice(0, 2000)]));
    const { error } = await supabase.from("form_responses").insert({ form_id: form.id, data });
    if (error) return void toast.error("Couldn't send. Please try again."); setDone(true);
  };
  return <section className="mx-auto max-w-2xl px-5 py-16">
    <h1 className="font-serif text-5xl text-primary">{form.title}</h1>{form.intro && <p className="mt-3 text-muted-foreground">{form.intro}</p>}
    {done ? <p className="mt-8 rounded-lg bg-brand-gold-soft p-6 text-primary">Thank you — your answers have been sent to SOQ.</p> :
      <div className="mt-8 space-y-4">{fields.map(f => <label key={f.label} className="block text-sm font-medium">{f.label}{f.required && " *"}
        <div className="mt-1">{f.type === "textarea" ? <Textarea value={v[f.label] ?? ""} onChange={e => setV({ ...v, [f.label]: e.target.value })} /> :
          f.type === "select" ? <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={v[f.label] ?? ""} onChange={e => setV({ ...v, [f.label]: e.target.value })}><option value="">Choose…</option>{(f.options ?? "").split(",").map(o => o.trim()).filter(Boolean).map(o => <option key={o}>{o}</option>)}</select> :
          <Input type={f.type === "email" ? "email" : "text"} value={v[f.label] ?? ""} onChange={e => setV({ ...v, [f.label]: e.target.value })} />}</div></label>)}
        <Button className="rounded-full" onClick={() => void submit()}>Send</Button></div>}
  </section>;
}
