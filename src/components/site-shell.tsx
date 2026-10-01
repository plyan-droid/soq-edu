import { DetailSkeleton } from "@/components/start-here";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { CartLink } from "@/components/add-to-cart";
import { SiteSettingsLayer } from "@/components/site-settings";
import { RefCapture } from "@/components/learner-tools";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/soq-logo-local.png";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  Facebook,
  FileText,
  HelpCircle,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Newspaper,
  Phone,
  Search,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { contact } from "@/lib/site-content";
import { ClientOnly } from "@tanstack/react-router";
const PortalAssistant = lazy(() => import("@/components/portal-assistant").then((m) => ({ default: m.PortalAssistant })));

const nav = [
  { label: "Courses", to: "/courses" as const },
  { label: "Businesses", to: "/businesses" as const },
  { label: "Funding", to: "/funding" as const },
  { label: "About SOQ", to: "/about" as const },
];

const resourceLinks = [
  {
    label: "Frequently asked questions",
    desc: "Courses, payment, attendance and funding",
    icon: HelpCircle,
    to: "/faq" as const,
  },
  {
    label: "News & updates",
    desc: "Academy news and programme updates",
    icon: Newspaper,
    href: "https://soq.edu.sg/blog/list",
  },
  {
    label: "PEI profile",
    desc: "Registration, governance and facilities",
    icon: BookOpen,
    to: "/pei-profile" as const,
  },
  {
    label: "Student policies",
    desc: "Policies and guidance for learners",
    icon: FileText,
    href: "https://soq.edu.sg/upload/general/student-policy.pdf",
  },
  {
    label: "Registration guide",
    desc: "Registration and student administration",
    icon: FileText,
    href: "https://soq.edu.sg/upload/general/reg-guide.pdf",
  },
  {
    label: "Job matching programme",
    desc: "For graduates and employers",
    icon: BriefcaseBusiness,
    to: "/job-matching-program" as const,
  },
  {
    label: "Our trainers",
    desc: "Meet the SOQ training team",
    icon: Users,
    to: "/trainer/list" as const,
  },
];

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/soq-international", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/SOQtraining", icon: Facebook },
  {
    label: "Instagram",
    href: "https://www.instagram.com/soqinternationalacademy",
    icon: Instagram,
  },
  { label: "YouTube", href: "https://www.youtube.com/@SOQInternational", icon: Youtube },
];

export function Brand({ size = "md" }: { size?: "md" | "lg"; light?: boolean }) {
  return (
    <Link to="/" className="block shrink-0" aria-label="SOQ International Academy home">
      <img
        src={logo}
        alt="SOQ International Academy"
        width={120}
        height={120}
        className={size === "lg" ? "h-28 w-auto" : "h-[84px] w-auto"}
      />
    </Link>
  );
}

function ResourcesMenu() {
  return (
    <div className="group relative">
      <Link
        to="/resources"
        className="flex items-center gap-1 text-sm text-foreground/80 transition-colors group-hover:text-primary hover:text-primary"
        activeProps={{ className: "text-primary font-semibold" }}
      >
        Resources
        <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="rounded-xl border border-border bg-background p-2 shadow-lg">
          {resourceLinks.map(({ icon: Icon, label, desc, to, href }) => {
            const inner = (
              <>
                <Icon className="mt-0.5 size-5 shrink-0 text-brand-gold" />
                <span>
                  <span className="block text-sm font-medium text-primary">{label}</span>
                  <span className="block text-xs text-muted-foreground">{desc}</span>
                </span>
              </>
            );
            return to ? (
              <Link
                key={label}
                to={to}
                className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
              >
                {inner}
              </Link>
            ) : (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, isTrainer, isOrg, loading } = useAuth();
  const close = () => setOpen(false);
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-12 lg:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/recommend"
            aria-label="Find my course"
            className="grid size-10 place-items-center text-primary"
          >
            <Search className="size-5" />
          </Link>
          <CartLink />
          {user ? (
            <>
              <Link
                to="/community"
                className="text-sm font-medium text-primary hover:text-brand-gold"
              >
                Community
              </Link>
              <Link
                 to={isAdmin ? "/portal-admin" : isTrainer ? "/trainer" : isOrg ? "/business-portal" : "/student-portal"}
                className="text-sm font-medium text-primary hover:text-brand-gold"
              >
                My portal
              </Link>
              <button
                type="button"
                onClick={() => void supabase.auth.signOut()}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm font-medium text-primary hover:text-brand-gold">
              Log in
            </Link>
          )}
          <Button
            asChild
            className="h-11 rounded-full bg-brand-gold px-6 text-brand-navy shadow-none hover:bg-brand-gold/85"
          >
            <Link to="/contact">
              Get Course Advice <ArrowRight />
            </Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav
          className="border-t border-border bg-background px-5 py-5 lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto grid max-w-7xl gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={close}
                className="rounded-md px-3 py-3 text-base hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Signed in as {user.email}
                </p>
                <Link
                  to="/community"
                  onClick={close}
                  className="rounded-md px-3 py-3 text-base hover:bg-muted"
                >
                  Community
                </Link>
                <Link
                  to={isAdmin ? "/portal-admin" : isTrainer ? "/trainer" : isOrg ? "/business-portal" : "/student-portal"}
                  onClick={close}
                  className="rounded-md px-3 py-3 text-base hover:bg-muted"
                >
                  My Portal
                </Link>
                {isTrainer && (
                  <Link
                    to="/trainer"
                    onClick={close}
                    className="rounded-md px-3 py-3 text-base hover:bg-muted"
                  >
                    Trainer Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/portal-admin"
                    onClick={close}
                    className="rounded-md px-3 py-3 text-base hover:bg-muted"
                  >
                    Staff Admin
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="mt-2 rounded-full"
                  onClick={() => {
                    close();
                    void supabase.auth.signOut();
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={close}
                className={
                  loading
                    ? "rounded-md px-3 py-3 text-base hover:bg-muted"
                    : "mt-2 rounded-md bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
                }
              >
                Log in
              </Link>
            )}
            <Link
              to="/contact"
              onClick={close}
              className="mt-2 rounded-md bg-brand-gold px-4 py-3 text-center font-semibold text-brand-navy"
            >
              Get Course Advice
            </Link>
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
        </div>
        <div className="lg:border-r lg:border-primary-foreground/15">
          <h2 className="text-sm font-semibold">Quick Links</h2>
          <div className="mt-4 grid gap-2 text-sm text-primary-foreground/70">
            <Link to="/courses">Courses</Link>
            <Link to="/recommend">Find My Course</Link>
            <Link to="/compare">Compare Courses</Link>
            <Link to="/calendar">Course Calendar</Link>
            <Link to="/businesses">Businesses</Link>
            <Link to="/funding">Funding</Link>
            <Link to="/about">About SOQ</Link>
            <Link to="/resources">Resources</Link>
            <Link to="/tutors">Book a 1-to-1 tutor</Link>
            <Link to="/teach">Teach at SOQ</Link>
            <Link to="/verify-certificate">Verify a Certificate</Link>
            <Link to="/login">Portal Log in</Link>
          </div>
        </div>
        <div className="lg:border-r lg:border-primary-foreground/15 lg:pr-8">
          <h2 className="text-sm font-semibold">Get in Touch</h2>
          <div className="mt-4 grid gap-3 text-sm text-primary-foreground/70">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {contact.address}
            </p>
            <a className="flex gap-3" href={`tel:${contact.phone.replaceAll(" ", "")}`}>
              <Phone className="size-4" />
              {contact.phone}
            </a>
            <a className="flex gap-3" href={`mailto:${contact.email}`}>
              <Mail className="size-4" />
              {contact.email}
            </a>
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold">Follow Us</h2>
          <div className="mt-4 flex gap-4">
            {socials.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-primary-foreground/85 hover:text-brand-gold"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
          <NewsletterSignup />
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 px-5 py-5 text-center text-xs text-primary-foreground/45">
        © 2026 SOQ International Academy. All rights reserved.
      </div>
    </footer>
  );
}

function CommunityGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useAuth();
  if (!pathname.startsWith("/community")) return <>{children}</>;
  if (loading)
    return <DetailSkeleton />;
  if (user) return <>{children}</>;
  return (
    <section className="bg-secondary">
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="font-script text-3xl text-brand-gold">Members only</p>
        <h1 className="mt-2 font-serif text-4xl text-primary">The SOQ Community</h1>
        <p className="mt-4 text-muted-foreground">
          Community is open to SOQ students, alumni, trainers, partner businesses and staff. Log in
          to join the conversation.
        </p>
        <Button
          asChild
          className="mt-8 h-12 rounded-full bg-brand-gold px-7 text-brand-navy hover:bg-brand-gold/85"
        >
          <Link to="/login" search={{ next: pathname }}>
            Log in to continue <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const portalPage =
    /^\/(student-portal|business-portal|portal-admin|trainer|staff-courses|learn\/|live-classes|community)(\/|$)/.test(
      pathname,
    );
  const demoPortal = portalPage && user?.email?.endsWith("@demo.com");
  const [demoNoticeStarted, setDemoNoticeStarted] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(true);

  useEffect(() => {
    if (demoPortal && !demoNoticeStarted) setDemoNoticeStarted(true);
  }, [demoPortal, demoNoticeStarted]);

  useEffect(() => {
    if (!demoNoticeStarted) return;
    const timer = window.setTimeout(() => setShowDemoNotice(false), 8000);
    return () => window.clearTimeout(timer);
  }, [demoNoticeStarted]);

  return (
    <>
      <SiteSettingsLayer />
      <RefCapture />
      <SiteHeader />
      <main>
        <CommunityGate>{children}</CommunityGate>
      </main>
      <SiteFooter />
      {portalPage && user ? (
        <ClientOnly fallback={null}><Suspense fallback={null}><PortalAssistant key={user.id} /></Suspense></ClientOnly>
      ) : (
        !portalPage && (
          <a
            href={`${contact.whatsapp}?text=${encodeURIComponent("Hi SOQ International Academy, I'd like to enquire about your courses.")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enquire with SOQ on WhatsApp"
            title="Enquire on WhatsApp"
            className="fixed bottom-4 left-4 z-50 [[data-workspace]_&]:bottom-20 lg:[[data-workspace]_&]:bottom-6 grid size-11 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:left-6"
          >
            <svg viewBox="0 0 32 32" className="size-6 fill-current" aria-hidden="true">
              <path d="M16 .8A15.1 15.1 0 0 0 3 23.6L.8 31.2l7.9-2.1A15.2 15.2 0 1 0 16 .8Zm0 27.6a12.2 12.2 0 0 1-6.2-1.7l-.4-.2-4.7 1.2 1.3-4.5-.3-.5A12.3 12.3 0 1 1 16 28.4Zm6.8-9.2c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.3.3-.5.4-.7.1-.3 0-.5 0-.7l-1.2-2.8c-.3-.7-.6-.6-.8-.6h-.7c-.3 0-.7.1-1 .4-.3.4-1.3 1.3-1.3 3.1s1.3 3.5 1.5 3.7c.2.3 2.6 4.1 6.4 5.6.9.4 1.6.6 2.1.7.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.3-.3-.7-.5Z" />
            </svg>
          </a>
        )
      )}
    </>
  );
}
