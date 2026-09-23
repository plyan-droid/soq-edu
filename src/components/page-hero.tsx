import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <section className="border-b border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-5 py-16 md:py-24 lg:px-8">
        <div className="mb-8 flex items-center gap-2 text-xs text-muted-foreground"><Link to="/">Home</Link><ChevronRight className="size-3" /><span>{eyebrow}</span></div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.03] text-primary md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p>
      </div>
    </section>
  );
}