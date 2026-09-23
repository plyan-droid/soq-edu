import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Mail, MapPin, Menu, Phone, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/site-content";

const nav = [
  { label: "Courses", to: "/courses" as const },
  { label: "For Businesses", to: "/businesses" as const },
  { label: "Funding", to: "/funding" as const },
  { label: "About SOQ", to: "/about" as const },
  { label: "Resources", to: "/resources" as const },
];

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="SOQ International Academy home">
      <img src={logo.url} alt="" width={48} height={48} className="size-12 object-contain" />
      <span className="leading-none">
        <strong className={`block font-serif text-lg ${light ? "text-primary-foreground" : "text-brand-navy"}`}>SOQ</strong>
        <span className={`block text-[9px] uppercase tracking-[0.16em] ${light ? "text-primary-foreground/70" : "text-muted-foreground"}`}>International Academy</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="text-sm text-foreground/80 transition-colors hover:text-primary" activeProps={{ className: "text-primary font-semibold" }}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/contact" aria-label="Search and contact" className="grid size-10 place-items-center text-primary"><BookOpen className="size-5" /></Link>
          <Button asChild className="h-11 rounded-full bg-brand-gold px-6 text-brand-navy shadow-none hover:bg-brand-gold/85">
            <Link to="/contact">Get Course Advice <ArrowRight /></Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-5 py-5 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {nav.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-base hover:bg-muted">{item.label}</Link>)}
            <Link to="/contact" onClick={() => setOpen(false)} className="mt-2 rounded-md bg-primary px-4 py-3 text-center font-semibold text-primary-foreground">Get Course Advice</Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.3fr_1fr_1.2fr] lg:px-8">
        <div><Brand light /><p className="mt-5 max-w-sm text-sm leading-6 text-primary-foreground/65">Practical, industry-relevant skills for people, careers and businesses in Singapore.</p></div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">Quick links</h2>
          <div className="mt-4 grid gap-2 text-sm text-primary-foreground/75">
            <Link to="/courses">Courses</Link><Link to="/businesses">For Businesses</Link><Link to="/funding">Funding</Link><Link to="/about">About SOQ</Link><Link to="/resources">Resources</Link>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">Get in touch</h2>
          <div className="mt-4 grid gap-3 text-sm text-primary-foreground/75">
            <p className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0" />{contact.address}</p>
            <a className="flex gap-3" href={`tel:${contact.phone.replaceAll(" ", "")}`}><Phone className="size-4" />{contact.phone}</a>
            <a className="flex gap-3" href={`mailto:${contact.email}`}><Mail className="size-4" />{contact.email}</a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-5 py-5 text-center text-xs text-primary-foreground/45">© 2026 SOQ International Academy. All rights reserved.</div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main>{children}</main><SiteFooter /></>;
}
