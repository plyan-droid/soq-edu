import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TextSection({ eyebrow, title, children, tone = "plain" }: { eyebrow?: string; title: string; children: React.ReactNode; tone?: "plain" | "soft" | "navy" }) {
  return <section className={tone === "navy" ? "bg-primary text-primary-foreground" : tone === "soft" ? "bg-muted/50" : "bg-background"}><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className={`mt-3 max-w-3xl font-serif text-4xl md:text-5xl ${tone === "navy" ? "text-primary-foreground" : "text-primary"}`}>{title}</h2><div className={`mt-8 max-w-4xl leading-7 ${tone === "navy" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{children}</div></div></section>;
}

export function NumberGrid({ items }: { items: { number: string; title: string; copy: string }[] }) {
  return <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">{items.map(item => <article key={item.number} className="bg-background p-7"><span className="font-serif text-4xl text-brand-gold">{item.number}</span><h3 className="mt-5 font-serif text-2xl text-primary">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.copy}</p></article>)}</div>;
}

export function ContactBand() {
  return <section className="bg-brand-gold-soft"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 md:flex-row md:items-center lg:px-8"><div><p className="eyebrow">Talk to us</p><h2 className="mt-2 font-serif text-4xl text-primary">Find the right next step.</h2></div><Button asChild size="lg" className="rounded-full"><Link to="/contact">Get course advice <ArrowRight /></Link></Button></div></section>;
}