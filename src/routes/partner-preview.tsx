import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Link2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner-preview")({
  head: () => ({ meta: [
    { title: "Partner workspace concepts | SOQ International Academy" },
    { name: "description", content: "Preview focused SOQ partner workspace concepts for affiliates, sellers and employers." },
    { property: "og:title", content: "SOQ partner workspace concepts" },
    { property: "og:description", content: "Explore affiliate, store and employer partner workspace concepts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PartnerPreview,
});

const concepts = {
  affiliate: { icon: Link2, title: "Affiliate partner", subtitle: "Share SOQ learning with your network", lead: "Your referral link", detail: "A personal referral link will appear here once a partner agreement and tracking are connected.", sections: [
    { title: "Referrals", text: "No partner referral records are connected yet. This will show each referred application and its status." },
    { title: "Commission", text: "Commission terms and verified conversions must be agreed before earnings can be displayed." },
  ] },
  store: { icon: ShoppingBag, title: "Store partner", subtitle: "Keep products and orders in one place", lead: "Your products", detail: "Product publishing will open once the seller catalogue and fulfilment rules are connected.", sections: [
    { title: "Orders to fulfil", text: "No store orders are connected. Order statuses and customer details will only appear for the authorised seller." },
    { title: "Product catalogue", text: "Approved products, stock status and listing actions will live here after store integration." },
  ] },
  jobs: { icon: BriefcaseBusiness, title: "Employer partner", subtitle: "Follow your hiring pipeline", lead: "Open vacancies", detail: "Vacancy posting will open once employer verification and job management are connected.", sections: [
    { title: "Applicants", text: "No applicant pipeline is connected. Applicants will be visible only to their authorised employer." },
    { title: "Interviews & events", text: "Schedule and RSVP details will appear here when employer events are available." },
  ] },
} as const;
type Concept = keyof typeof concepts;

function PartnerPreview() {
  const [selected, setSelected] = useState<Concept>("affiliate");
  const item = concepts[selected];
  const Icon = item.icon;
  return <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
    <div className="border-b border-border pb-7"><p className="text-xs font-semibold uppercase text-brand-gold">Design preview · not a live partner account</p><h1 className="mt-2 font-serif text-4xl text-primary sm:text-5xl">Partner workspaces</h1><p className="mt-3 max-w-2xl text-muted-foreground">These are three separate views for future partners. No referral, order or hiring data is connected here.</p></div>
    <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Partner type">{(Object.keys(concepts) as Concept[]).map(key => <Button role="tab" aria-selected={selected === key} key={key} onClick={() => setSelected(key)} variant={selected === key ? "default" : "outline"}>{concepts[key].title}</Button>)}</div>
    <div className="mt-9 border-b border-border pb-7"><Icon className="size-7 text-brand-gold" /><p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">{item.subtitle}</p><h2 className="mt-1 font-serif text-4xl text-primary">{item.title}</h2></div>
    <div className="mt-8 grid gap-9 md:grid-cols-[1.3fr_1fr]"><section className="border-t-2 border-brand-gold pt-5"><p className="text-xs font-semibold uppercase text-muted-foreground">Start here</p><h3 className="mt-2 font-serif text-3xl text-primary">{item.lead}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{item.detail}</p><Button asChild variant="link" className="mt-4 px-0"><Link to="/contact">Ask about partnering <ArrowRight /></Link></Button></section><div className="space-y-6">{item.sections.map(section => <section key={section.title} className="border-t border-border pt-5"><h3 className="font-serif text-2xl text-primary">{section.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{section.text}</p></section>)}</div></div>
  </main>;
}