import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type WorkspaceSection = { name: string; items: { id: string; label: string; content: ReactNode }[] };

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

/** Grouped sidebar (desktop) + section/tool selectors (mobile), shared by role dashboards. */
export function WorkspaceShell({ title, sections, active, onChange, top }: { title: string; sections: WorkspaceSection[]; active: string; onChange: (id: string) => void; top?: ReactNode }) {
  const current = sections.find(s => s.items.some(i => i.id === active)) ?? sections[0]!;
  const item = current.items.find(i => i.id === active) ?? current.items[0]!;
  return (
    <div className="mx-auto max-w-[92rem] px-5 py-8 lg:px-8 lg:py-10">
      <div className="grid min-w-0 gap-8 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-3" aria-label={title}>
          <div className="mb-5 border-b border-border pb-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">SOQ International Academy</p>
            <p className="mt-1 font-serif text-3xl font-semibold text-primary">{title}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            <label className="min-w-0 text-xs font-medium text-muted-foreground">Section
              <select className={`${sel} mt-1`} value={current.name} onChange={e => { const s = sections.find(x => x.name === e.target.value); if (s) onChange(s.items[0]!.id); }}>
                {sections.map(s => <option key={s.name}>{s.name}</option>)}
              </select>
            </label>
            <label className="min-w-0 text-xs font-medium text-muted-foreground">Page
              <select className={`${sel} mt-1`} value={item.id} onChange={e => onChange(e.target.value)}>
                {current.items.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </label>
          </div>
          <nav className="hidden space-y-1 lg:block">
            {sections.map(s => {
              const open = s.name === current.name;
              return <div key={s.name}>
                <Button type="button" variant="ghost" aria-expanded={open} onClick={() => onChange(s.items[0]!.id)} className={`h-auto min-h-10 w-full justify-between whitespace-normal rounded-md px-3 py-2 text-left text-xs font-semibold uppercase shadow-none ${open ? "text-primary" : "text-muted-foreground"}`}>
                  {s.name}<ChevronRight className={`size-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} aria-hidden="true" />
                </Button>
                {open && <div className="ml-2 grid gap-0.5 border-l border-border pl-2">
                  {s.items.map(i => <Button key={i.id} type="button" variant="ghost" aria-current={i.id === item.id ? "page" : undefined} onClick={() => onChange(i.id)} className={`h-auto min-h-9 w-full justify-between whitespace-normal rounded-md px-3 py-2 text-left text-sm shadow-none ${i.id === item.id ? "bg-secondary font-semibold text-primary hover:bg-secondary" : "font-normal text-muted-foreground hover:text-foreground"}`}>
                    <span>{i.label}</span>{i.id === item.id && <ChevronRight className="size-4 shrink-0" aria-hidden="true" />}
                  </Button>)}
                </div>}
              </div>;
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          {top}
          <div className="border-b border-border pb-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{title} / {current.name}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-primary sm:text-5xl">{item.label}</h1>
          </div>
          <div className="min-w-0 pt-3">{item.content}</div>
        </main>
      </div>
    </div>
  );
}
