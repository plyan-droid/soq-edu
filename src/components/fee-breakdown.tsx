import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Info, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const money = (n: number) => `$${n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InfoDialog({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger aria-label={`About ${title}`} className="text-primary"><Info className="size-4" /></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <DialogDescription asChild><div className="space-y-3 text-sm leading-6 text-foreground">{children}</div></DialogDescription>
        <DialogFooter><DialogTrigger asChild><Button className="rounded-full px-10">Ok</Button></DialogTrigger></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FeeBreakdown({ price, badge }: { price: string; badge: string }) {
  const [open, setOpen] = useState(true);
  const [older, setOlder] = useState(false);
  const [useCredit, setUseCredit] = useState(true);
  const monthly = /\/mo/i.test(price);
  const amount = Number(price.replace(/[^0-9.]/g, "")) || 0;
  const wsq = badge === "WSQ";

  const schemes = wsq
    ? [
        { label: "SkillsFuture Credit", cls: "border-primary text-primary" },
        { label: "WSQ Course Fee Funding", cls: "border-foreground text-foreground" },
        { label: "UTAP (NTUC members)", cls: "border-brand-gold text-brand-gold" },
        { label: "Absentee Payroll", cls: "border-muted-foreground text-muted-foreground" },
      ]
    : [{ label: "Instalment plans available", cls: "border-primary text-primary" }];

  const subsidy = wsq ? amount * (older ? 0.7 : 0.5) : 0;
  const credit = wsq && useCredit ? Math.min(500, amount - subsidy) : 0;
  const payable = Math.max(0, amount - subsidy - credit);

  return (
    <div className="overflow-hidden rounded-lg border-2 border-primary bg-card shadow-sm">
      <div className="bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground">{wsq ? "SkillsFuture eligible" : "Course fee"}</div>
      <div className="bg-secondary p-6">
        <p className="text-sm font-semibold">Eligible schemes:</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {schemes.map((s) => <span key={s.label} className={`rounded-md border bg-card px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>)}
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold">Full course fee:
          <InfoDialog title="Full course fee"><p>The listed course fee before any government funding. {monthly ? "This programme is paid in monthly instalments." : "GST (9%) may apply on the nett fee; SOQ is GST-registered."}</p></InfoDialog>
        </p>
        <p className="text-sm">{amount ? `${money(amount)}${monthly ? " / month" : ""}` : price}</p>

        {wsq && amount > 0 && (
          <>
            <p className="mt-5 flex items-center gap-1.5 text-sm font-semibold">Estimated payable fee:
              <InfoDialog title="Estimated payable fee">
                <p>This is the indicative fee payable after SkillsFuture (WSQ) course fee funding and your SkillsFuture Credit. Please check with SOQ on your eligibility, final payable fee and applicable GST.</p>
                <p>* Assumes you still have up to $500 SkillsFuture Credit remaining. Baseline funding is 50% for Singapore Citizens and PRs aged 21+; Singapore Citizens aged 40+ may receive enhanced funding of up to 70%.</p>
                <p>If you are employer-sponsored, SMEs may qualify for up to 70% funding plus Absentee Payroll. <Link to="/funding" className="text-primary underline">See funding details</Link>.</p>
              </InfoDialog>
            </p>
            <p className="text-sm">From <span className="text-2xl font-bold text-primary">{money(payable)}</span>{useCredit ? "*" : ""}</p>

            {open && (
              <div className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold">Fee breakdown <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-xs text-primary-foreground">-{money(subsidy + credit).replace(".00", "")}<Tag className="size-3" /></span></p>
                <div><p>SkillsFuture Subsidies ({older ? "70%" : "50%"}):</p><p className="text-muted-foreground">-{money(subsidy)}</p></div>
                {useCredit && <div><p>SkillsFuture Credit:</p><p className="text-muted-foreground">-{money(credit)}*</p></div>}
                <div className="space-y-2 border-t border-border pt-3 text-xs">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={older} onChange={(e) => setOlder(e.target.checked)} className="accent-primary" />I'm a Singapore Citizen aged 40 or above</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} className="accent-primary" />Use my SkillsFuture Credit</label>
                </div>
              </div>
            )}
            <button onClick={() => setOpen((o) => !o)} className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary">
              {open ? "View less" : "View fee breakdown"}<ChevronDown className={`size-4 ${open ? "rotate-180" : ""}`} />
            </button>
          </>
        )}
        {!wsq && <p className="mt-4 text-xs leading-5 text-muted-foreground">This programme isn't WSQ-funded. Ask an adviser about instalment plans and any schemes you may qualify for.</p>}
      </div>
    </div>
  );
}
