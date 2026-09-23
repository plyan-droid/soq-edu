import logo from "@/assets/soq-logo.png.asset.json";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Facebook, Instagram, Linkedin, Mail, MapPin, Menu, Phone, Search, X, Youtube } from "lucide-react";
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

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/soq-international", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/SOQtraining", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/soqinternationalacademy", icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/@SOQInternational", icon: Youtube },
];

export function Brand({ size = "md" }: { size?: "md" | "lg"; light?: boolean }) {
  return (
    <Link to="/" className="block shrink-0" aria-label="SOQ International Academy home">
      <img src={logo.url} alt="SOQ International Academy" width={120} height={120} className={size === "lg" ? "h-28 w-auto" : "h-[84px] w-auto"} />
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-12 lg:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} className="text-sm text-foreground/80 transition-colors hover:text-primary" activeProps={{ className: "text-primary font-semibold" }}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/recommend" aria-label="Find my course" className="grid size-10 place-items-center text-primary"><Search className="size-5" /></Link>
          <Button asChild className="h-11 rounded-full bg-brand-gold px-6 text-brand-navy shadow-none hover:bg-brand-gold/85">
            <Link to="/contact">Get Course Advice <ArrowRight /></Link>
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && (
        <nav className="border-t border-border bg-background px-5 py-5 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto grid max-w-7xl gap-1">
            {[...nav, { label: "Find My Course", to: "/recommend" as const }, { label: "Compare Courses", to: "/compare" as const }].map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-base hover:bg-muted">{item.label}</Link>)}
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
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1.2fr_1.3fr] lg:px-8">
        <div>
          <Brand size="lg" />
          <p className="mt-4 font-script text-2xl text-primary-foreground/85">Skills for People. Opportunities for Tomorrow.</p>
        </div>
        <div className="lg:border-r lg:border-primary-foreground/15">
          <h2 className="text-sm font-semibold">Quick Links</h2>
          <div className="mt-4 grid gap-2 text-sm text-primary-foreground/70">
            <Link to="/courses">Courses</Link><Link to="/recommend">Find My Course</Link><Link to="/compare">Compare Courses</Link><Link to="/businesses">For Businesses</Link><Link to="/funding">Funding</Link><Link to="/about">About SOQ</Link><Link to="/resources">Resources</Link>
          </div>
        </div>
        <div className="lg:border-r lg:border-primary-foreground/15 lg:pr-8">
          <h2 className="text-sm font-semibold">Get in Touch</h2>
          <div className="mt-4 grid gap-3 text-sm text-primary-foreground/70">
            <p className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0" />{contact.address}</p>
            <a className="flex gap-3" href={`tel:${contact.phone.replaceAll(" ", "")}`}><Phone className="size-4" />{contact.phone}</a>
            <a className="flex gap-3" href={`mailto:${contact.email}`}><Mail className="size-4" />{contact.email}</a>
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Follow Us</h2>
          <div className="mt-4 flex gap-4">
            {socials.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="text-primary-foreground/85 hover:text-brand-gold"><Icon className="size-5" /></a>)}
          </div>
          <p className="mt-8 -rotate-6 font-script text-3xl leading-tight text-primary-foreground/85">A More Capable You,<br />A Brighter Tomorrow</p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-5 py-5 text-center text-xs text-primary-foreground/45">© 2026 SOQ International Academy. All rights reserved.</div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main>{children}</main><SiteFooter /></>;
}
