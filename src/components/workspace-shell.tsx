import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type WorkspaceSection = { name: string; icon?: LucideIcon | undefined; items: { id: string; label: string; content: ReactNode }[] };
export type NavSection = { name: string; icon?: LucideIcon | undefined; items: readonly (readonly [string, string])[] };

const NavCtx = createContext<((id: string) => void) | null>(null);
/** Navigate inside the surrounding workspace (updates the address bar too). */
export const useWorkspaceNavigate = () => useContext(NavCtx);

/** Keeps the open page in ?tool= so refresh, Back and shared links work. Old ids map through `aliases`. */
export function useToolParam(isValid: (id: string) => boolean, setActive: (id: string) => void, aliases: Record<string, string> = {}) {
  useEffect(() => {
    const sync = () => {
      const raw = new URLSearchParams(window.location.search).get("tool");
      const t = raw && (aliases[raw] ?? raw);
      if (t && isValid(t)) setActive(t);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (id: string) => {
    setActive(id);
    const url = new URL(window.location.href);
    if (url.searchParams.get("tool") !== id) { url.searchParams.set("tool", id); window.history.pushState(window.history.state, "", url); }
    window.scrollTo({ top: 0 });
  };
}

/** Desktop: short list of main areas. Phone: fixed bottom bar (+ "More" sheet when there are more than 5). */
export function WorkspaceNav({ title, sections, section, onChange }: { title: string; sections: readonly NavSection[]; section: string; onChange: (id: string) => void }) {
  const [more, setMore] = useState(false);
  // Lets floating buttons (WhatsApp, assistant) sit above the phone bottom bar.
  useEffect(() => { document.body.setAttribute("data-workspace", "1"); return () => document.body.removeAttribute("data-workspace"); }, []);
  const overflow = sections.length > 5;
  const bar = overflow ? sections.slice(0, 4) : sections;
  const rest = overflow ? sections.slice(4) : [];
  const moreActive = rest.some(s => s.name === section);
  return <>
    <aside className="hidden min-w-0 lg:sticky lg:top-28 lg:block lg:self-start" aria-label={title}>
      <nav className="grid gap-1">
        {sections.map(s => { const on = s.name === section; const Icon = s.icon; return (
          <button key={s.name} type="button" aria-current={on ? "page" : undefined} onClick={() => onChange(s.items[0]![0])}
            className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm transition ${on ? "bg-secondary font-semibold text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"}`}>
            {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}<span>{s.name}</span>
          </button>); })}
      </nav>
    </aside>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label={title}>
      <div className="mx-auto flex max-w-lg">
        {bar.map(s => { const on = s.name === section; const Icon = s.icon; return (
          <button key={s.name} type="button" aria-current={on ? "page" : undefined} onClick={() => onChange(s.items[0]![0])} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] leading-tight ${on ? "font-semibold text-primary" : "text-muted-foreground"}`}>
            {Icon && <Icon className="size-5" aria-hidden="true" />}<span className="w-full truncate text-center">{s.name}</span>
          </button>); })}
        {overflow && <button type="button" onClick={() => setMore(true)} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] ${moreActive ? "font-semibold text-primary" : "text-muted-foreground"}`}>
          <MoreHorizontal className="size-5" aria-hidden="true" /><span>More</span></button>}
      </div>
    </nav>
    {overflow && <Sheet open={more} onOpenChange={setMore}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader><SheetTitle className="font-serif text-2xl text-primary">More</SheetTitle></SheetHeader>
        <div className="grid gap-1 p-4 pt-0">{rest.map(s => { const Icon = s.icon; return (
          <button key={s.name} type="button" onClick={() => { setMore(false); onChange(s.items[0]![0]); }} className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-left ${s.name === section ? "bg-secondary font-semibold text-primary" : ""}`}>
            {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}{s.name}</button>); })}</div>
      </SheetContent>
    </Sheet>}
  </>;
}

/** Keep every tool visible; longer lists wrap onto another line instead of hiding behind a menu. */
export function WorkspaceTabs({ items, active, onChange }: { items: readonly (readonly [string, string])[]; active: string; onChange: (id: string) => void }) {
  if (items.length < 2) return null;
  return <div className="-mx-5 mt-4 flex flex-wrap gap-x-1 border-b border-border px-5 lg:mx-0 lg:px-0" role="tablist">
    {items.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={id === active} onClick={() => onChange(id)}
      className={`min-h-10 border-b-2 px-3 py-2 text-sm transition ${id === active ? "border-accent font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
  </div>;
}

export function WorkspaceShell({ title, sections, active, onChange: setActive, top, aliases }: { title: string; sections: WorkspaceSection[]; active: string; onChange: (id: string) => void; top?: ReactNode; aliases?: Record<string, string> }) {
  const onChange = useToolParam(id => sections.some(s => s.items.some(i => i.id === id)), setActive, aliases);
  const current = sections.find(s => s.items.some(i => i.id === active)) ?? sections[0]!;
  const item = current.items.find(i => i.id === active) ?? current.items[0]!;
  const nav = sections.map(s => ({ name: s.name, icon: s.icon, items: s.items.map(i => [i.id, i.label] as const) }));
  return (
    <div className="mx-auto max-w-[92rem] px-5 pb-28 pt-6 lg:px-8 lg:py-10">
      <div className="grid min-w-0 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <WorkspaceNav title={title} sections={nav} section={current.name} onChange={onChange} />
        <main className="min-w-0">
          {top}
          <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold text-primary sm:text-5xl">{current.name}</h1>
          <WorkspaceTabs items={current.items.map(i => [i.id, i.label] as const)} active={item.id} onChange={onChange} />
          <div className="min-w-0 pt-3"><NavCtx.Provider value={onChange}>{item.content}</NavCtx.Provider></div>
        </main>
      </div>
    </div>
  );
}
