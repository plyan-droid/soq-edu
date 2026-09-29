import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Link2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner-preview")({
  head: () => ({ meta: [
    { title: "Partner workspace previews | SOQ International Academy" },
    { name: "description", content: "Explore sample affiliate, store and employer partner dashboards for SOQ." },
    { property: "og:title", content: "SOQ partner workspace previews" },
    { property: "og:description", content: "Sample affiliate, seller and employer workspace views." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: PartnerPreview,
});

type Sample = { label: string; detail: string; status: string };
type Preview = {
  icon: typeof Link2;
  title: string;
  subtitle: string;
  stats: { value: string; label: string }[];
  primary: { title: string; intro: string; entries: Sample[] };
  secondary: { title: string; intro: string; entries: Sample[] };
  note: string;
};
const previews: Record<"affiliate" | "store" | "jobs", Preview> = {
  affiliate: {
    icon: Link2, title: "Affiliate partner", subtitle: "Referral overview",
    stats: [{ value: "24", label: "Sample link visits" }, { value: "5", label: "Sample enquiries" }, { value: "2", label: "Sample applications" }, { value: "S$0", label: "Payable commission" }],
    primary: { title: "Referral activity", intro: "Illustrative activity only; these people and applications do not exist.", entries: [
      { label: "AI courses · link visit", detail: "Example referral journey · 12 Sep", status: "Visit" },
      { label: "Digital marketing · enquiry", detail: "Example referral journey · 15 Sep", status: "Enquiry" },
      { label: "Leadership course · application", detail: "Example referral journey · 18 Sep", status: "Unverified" },
    ] },
    secondary: { title: "Attribution & rewards", intro: "No commission agreement, tracking link or payout ledger is connected.", entries: [
      { label: "Shared links", detail: "Example: courses, events and programme pages", status: "Preview" },
      { label: "Conversions", detail: "Subject to agreed attribution and verified enrolment", status: "Pending" },
      { label: "Payouts", detail: "No earnings or payments have been recorded", status: "None" },
    ] },
    note: "A working referral link and earnings need an agreed partner contract and attribution rules.",
  },
  store: {
    icon: ShoppingBag, title: "Store partner", subtitle: "Catalogue & fulfilment",
    stats: [{ value: "3", label: "Sample products" }, { value: "2", label: "Sample orders" }, { value: "1", label: "Sample item to pack" }, { value: "S$0", label: "Verified sales" }],
    primary: { title: "Order queue", intro: "Illustrative orders only; nothing has been bought or paid for.", entries: [
      { label: "Example order #S-1001", detail: "Course workbook · 1 item · S$24", status: "To pack" },
      { label: "Example order #S-1002", detail: "Practice kit · 1 item · S$48", status: "Shipped" },
    ] },
    secondary: { title: "Product catalogue", intro: "Sample listings are not available to purchase.", entries: [
      { label: "Course workbook", detail: "Example price S$24 · 18 in stock", status: "Sample" },
      { label: "Practice kit", detail: "Example price S$48 · 7 in stock", status: "Sample" },
      { label: "Learning journal", detail: "Example price S$16 · draft listing", status: "Draft" },
    ] },
    note: "Publishing, checkout and fulfilment need a seller catalogue, order ownership and refund rules.",
  },
  jobs: {
    icon: BriefcaseBusiness, title: "Employer partner", subtitle: "Hiring overview",
    stats: [{ value: "2", label: "Sample vacancies" }, { value: "4", label: "Sample applications" }, { value: "1", label: "Sample interview" }, { value: "0", label: "Live job adverts" }],
    primary: { title: "Open vacancies", intro: "Example roles only; these jobs are not accepting applications.", entries: [
      { label: "Marketing assistant", detail: "Example role · 3 sample applications", status: "Preview" },
      { label: "Customer experience associate", detail: "Example role · 1 sample application", status: "Preview" },
    ] },
    secondary: { title: "Hiring pipeline", intro: "No real applicants or personal details are displayed.", entries: [
      { label: "Applications received", detail: "Illustrative count across example vacancies", status: "4 sample" },
      { label: "Shortlist", detail: "Illustrative application stage", status: "2 sample" },
      { label: "Interview planned", detail: "Illustrative interview stage · no meeting scheduled", status: "1 sample" },
    ] },
    note: "Live hiring needs verified employers, owned vacancies, applicant consent and recruiter permissions.",
  },
};
type Kind = keyof typeof previews;

function SampleList({ group }: { group: Preview["primary"] }) {
  return <section className="min-w-0 border-t border-border pt-5">
    <h3 className="font-serif text-2xl text-primary">{group.title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{group.intro}</p>
    <ul className="mt-5 divide-y divide-border">{group.entries.map(entry =>
      <li key={entry.label} className="flex items-start justify-between gap-4 py-4 text-sm">
        <div className="min-w-0"><p className="font-medium text-primary">{entry.label}</p><p className="mt-1 text-muted-foreground">{entry.detail}</p></div>
        <span className="shrink-0 border border-border px-2 py-1 text-xs text-muted-foreground">{entry.status}</span>
      </li>)}</ul>
  </section>;
}

function PartnerPreview() {
  const [selected, setSelected] = useState<Kind>("affiliate");
  const item = previews[selected];
  const Icon = item.icon;
  return <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
    <div className="border-b border-border pb-7"><p className="text-xs font-semibold uppercase text-brand-gold">Sample workspace · not a live account</p><h1 className="mt-2 font-serif text-4xl text-primary sm:text-5xl">Partner workspaces</h1><p className="mt-3 max-w-2xl text-muted-foreground">Explore how each partner view could work. All figures and records below are fictional examples; no sales, commissions or hiring activity is connected.</p></div>
    <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Partner type">{(Object.keys(previews) as Kind[]).map(key => <Button role="tab" aria-selected={selected === key} key={key} onClick={() => setSelected(key)} variant={selected === key ? "default" : "outline"}>{previews[key].title}</Button>)}</div>
    <div className="mt-9 flex items-start gap-4 border-b border-border pb-6"><Icon className="mt-1 size-7 shrink-0 text-brand-gold" /><div><p className="text-xs font-semibold uppercase text-muted-foreground">{item.subtitle}</p><h2 className="mt-1 font-serif text-4xl text-primary">{item.title}</h2></div></div>
    <div className="grid grid-cols-2 gap-x-5 gap-y-6 border-b border-border py-7 sm:grid-cols-4" aria-label="Sample figures">{item.stats.map(stat => <div key={stat.label} className="border-l-2 border-brand-gold pl-4"><p className="font-serif text-3xl text-primary">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>)}</div>
    <div className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2"><SampleList group={item.primary} /><SampleList group={item.secondary} /></div>
    <div className="mt-8 border-t border-border pt-5"><p className="text-sm text-muted-foreground">{item.note}</p><Button asChild variant="link" className="mt-3 px-0"><Link to="/contact">Ask about partnering <ArrowRight className="size-4" /></Link></Button></div>
  </main>;
}
