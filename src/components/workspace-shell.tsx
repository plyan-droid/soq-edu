import { useEffect, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type WorkspaceSection = { name: string; items: { id: string; label: string; content: ReactNode }[] };

/** Mobile: tappable section and page chips (swipe sideways) instead of dropdowns. */
export function MobileNav({ sections, section, active, onChange }: { sections: readonly { name: string; items: readonly (readonly [string, string])[] }[]; section: string; active: string; onChange: (id: string) => void }) {
  const cur = sections.find(s => s.name === section) ?? sections[0]!;
  const chip = (on: boolean) => `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`;
  return <div className="space-y-2 lg:hidden">
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Sections">
      {sections.map(s => <button key={s.name} type="button" role="tab" aria-selected={s.name === cur.name} className={chip(s.name === cur.name)} onClick={() => onChange(s.items[0]![0])}>{s.name}</button>)}
    </div>
    {cur.items.length > 1 && <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" aria-label="Pages">
      {cur.items.map(([id, label]) => <button key={id} type="button" aria-current={id === active ? "page" : undefined} className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${id === active ? "bg-secondary font-semibold text-primary" : "text-muted-foreground"}`} onClick={() => onChange(id)}>{label}</button>)}
    </div>}
  </div>;
}

/** Grouped sidebar (desktop) + section/tool selectors (mobile), shared by role dashboards. */
export function WorkspaceShell({ title, sections, active, onChange: setActive, top }: { title: string; sections: WorkspaceSection[]; active: string; onChange: (id: string) => void; top?: ReactNode }) {
  const valid = (id: string | null) => !!id && sections.some(s => s.items.some(i => i.id === id));
  // Keep the open page in the address bar (?tool=) so refresh, Back and shared links work.
  useEffect(() => {
    const sync = () => { const t = new URLSearchParams(window.location.search).get("tool"); if (valid(t)) setActive(t!); };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onChange = (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (url.searchParams.get("tool") !== id) { url.searchParams.set("tool", id); window.history.pushState(window.history.state, "", url); }
    window.scrollTo({ top: 0 });
  };
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
          <MobileNav sections={sections.map(x => ({ name: x.name, items: x.items.map(i => [i.id, i.label] as [string, string]) }))} section={current.name} active={item.id} onChange={onChange} />
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
