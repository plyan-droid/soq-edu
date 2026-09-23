import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHero } from "@/components/page-hero";
import { ContactBand } from "@/components/content-sections";
const faqs=[
  ["What types of courses does SOQ offer?","SOQ offers WSQ courses, professional diplomas, workshops and customised corporate training across AI and business, beauty and wellness, retail and service skills."],
  ["Where is training conducted?","Training is held at International Plaza near Tanjong Pagar MRT. Some programmes may include blended learning; check the individual course details."],
  ["Can I use SkillsFuture Credit?","Eligible Singapore Citizens may use SkillsFuture Credit for approved programmes. Funding depends on the specific course and current eligibility rules."],
  ["What is the attendance requirement?","Funded learners generally need at least 75% attendance and must complete the required assessments to remain eligible."],
  ["Can my company arrange customised training?","Yes. SOQ can tailor programmes around workplace needs, learner profiles and business goals."],
  ["How can I confirm the final course fee?","Contact a course adviser. They will confirm the current intake, your eligibility and the full fee breakdown before registration."],
];
export const Route=createFileRoute("/faq")({head:()=>({meta:[{title:"Frequently Asked Questions | SOQ"},{name:"description",content:"Answers about SOQ courses, payments, funding, attendance and corporate training."},{property:"og:title",content:"Frequently Asked Questions | SOQ"},{property:"og:description",content:"Helpful answers for prospective and current SOQ learners."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:FaqPage});
function FaqPage(){return <><PageHero eyebrow="FAQ" title="Good questions, clearly answered." intro="Find quick answers about learning with SOQ, from funding and payment to attendance and certification."/><section className="mx-auto max-w-4xl px-5 py-16"><Accordion type="single" collapsible className="border-t border-border">{faqs.map(([q,a])=><AccordionItem key={q} value={q}><AccordionTrigger className="py-6 text-left font-serif text-xl text-primary hover:no-underline">{q}</AccordionTrigger><AccordionContent className="pb-6 text-base leading-7 text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion></section><ContactBand/></>}
