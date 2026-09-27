import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { money, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | SOQ International Academy" },
      { name: "description", content: "Review the SOQ courses in your cart, apply a discount code and check out." },
      { property: "og:title", content: "Your SOQ Course Cart" },
      { property: "og:description", content: "Review your chosen courses and check out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

type Order = { id: string; total: number; payment_ref: string; created_at: string; items: { title: string }[] };

function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [f, setF] = useState({ name: "", card: "4242 4242 4242 4242", exp: "12/30", cvc: "123" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [method, setMethod] = useState<"card" | "paynow" | "bank">("card");
  const [plan, setPlan] = useState<"full" | "3" | "6">("full");
  const [ref, setRef] = useState("");
  const [bankDone, setBankDone] = useState(false);

  const { data: orders = [], refetch } = useQuery({
    enabled: !!user,
    queryKey: ["my-orders", user?.id],
    queryFn: async () => ((await supabase.from("orders").select("id,total,payment_ref,created_at,items").order("created_at", { ascending: false })).data ?? []) as unknown as Order[],
  });

  const discount = pct ? Math.round(cart.subtotal * pct) / 100 : 0;
  const total = cart.subtotal - discount;

  const applyCode = async () => {
    if (!user) return void toast.error("Log in to use a discount code.");
    const { data } = await supabase.rpc("check_discount", { _code: code });
    if (data) { setPct(data); toast.success(`${data}% off applied`); } else { setPct(null); toast.error("That code isn't valid."); }
  };

  const pay = async () => {
    if (!user) return;
    if (f.name.trim().length < 2) return void toast.error("Enter the name on the card.");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_mock_order", {
      _items: cart.items.map(i => ({ slug: i.slug, title: i.title, price: i.price })),
      _code: pct ? code : "", _full_name: f.name.trim(), _email: user.email ?? "",
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    cart.clear(); setPct(null); setCode("");
    const { data: o } = await supabase.from("orders").select("payment_ref").eq("id", data).maybeSingle();
    setDone(o?.payment_ref ?? "done"); void refetch();
  };

  const payBank = async () => {
    if (!user) return;
    if (f.name.trim().length < 2 || ref.trim().length < 3) return void toast.error("Enter your full name and the transfer reference.");
    const items = cart.items.flatMap(i => i.includes ? i.includes.map(s => ({ slug: s, title: `${s} (${i.title})`, price: 0 })).map((x, n) => n === 0 ? { ...x, price: i.price } : x) : [{ slug: i.slug, title: i.title, price: i.price }]);
    setBusy(true);
    const { error } = await supabase.from("bank_payments").insert({ user_id: user.id, full_name: f.name.trim(), email: user.email ?? "", items, total, method: method as "paynow" | "bank", plan, reference: ref.trim().slice(0, 60) });
    setBusy(false);
    if (error) return void toast.error(error.message);
    cart.clear(); setBankDone(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <h1 className="font-serif text-5xl text-primary">Your cart</h1>
      <p className="mt-3 text-sm text-muted-foreground">Monthly-fee courses charge the first month.</p>


      {bankDone ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-brand-gold" />
          <h2 className="mt-4 font-serif text-3xl text-primary">Transfer details sent</h2>
          <p className="mt-2 text-muted-foreground">SOQ will check the transfer and confirm your place, usually within 1–2 working days. You can follow it under "My payments" in the <Link to="/student-portal" className="underline">Student Portal</Link>.</p>
        </div>
      ) : done ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto size-12 text-brand-gold" />
          <h2 className="mt-4 font-serif text-3xl text-primary">Payment received</h2>
          <p className="mt-2 text-muted-foreground">Your reference is <strong>{done}</strong>. A course adviser will contact you to confirm your class dates.</p>
          <Button asChild className="mt-6 rounded-full"><Link to="/courses">Browse more courses</Link></Button>
        </div>
      ) : cart.items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Your cart is empty. <Link to="/courses" className="underline">Browse courses</Link></p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {cart.items.map(i => (
              <li key={i.slug} className="flex items-center justify-between gap-4 p-5">
                <div><Link to="/courses/$slug" params={{ slug: i.slug }} className="font-medium text-primary hover:text-brand-gold">{i.title}</Link><p className="text-sm text-muted-foreground">{i.label}</p></div>
                <div className="flex items-center gap-4"><span className="font-serif text-2xl text-primary">{money(i.price)}</span><button aria-label="Remove" onClick={() => cart.remove(i.slug)}><Trash2 className="size-4 text-muted-foreground" /></button></div>
              </li>
            ))}
          </ul>
          <aside className="space-y-4 self-start rounded-lg border border-border bg-card p-6">
            <div className="flex gap-2"><Input placeholder="Discount code" value={code} onChange={e => { setCode(e.target.value); setPct(null); }} /><Button variant="outline" onClick={() => void applyCode()}>Apply</Button></div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
              {pct && <div className="flex justify-between text-brand-gold"><dt>Discount ({pct}%)</dt><dd>−{money(discount)}</dd></div>}
              <div className="flex justify-between border-t border-border pt-2 font-serif text-2xl text-primary"><dt>Total</dt><dd>{money(total)}</dd></div>
            </dl>
            {!user ? (
              <Button asChild className="h-12 w-full rounded-full"><Link to="/login">Log in to check out</Link></Button>
            ) : (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1 text-xs">{([["card", "Card"], ["paynow", "PayNow"], ["bank", "Bank transfer"]] as const).map(([k, l]) => <button key={k} onClick={() => setMethod(k)} className={`rounded-full py-2 ${method === k ? "bg-card font-medium text-primary shadow-sm" : ""}`}>{l}</button>)}</div>
                {method === "card" ? <><p className="flex items-center gap-2 text-sm font-medium"><CreditCard className="size-4" /> Card details (test)</p>
                <Input placeholder="Name on card" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
                <Input value={f.card} onChange={e => setF({ ...f, card: e.target.value })} />
                <div className="grid grid-cols-2 gap-3"><Input value={f.exp} onChange={e => setF({ ...f, exp: e.target.value })} /><Input value={f.cvc} onChange={e => setF({ ...f, cvc: e.target.value })} /></div>
                <Button disabled={busy} className="h-12 w-full rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85" onClick={() => void pay()}>{busy ? "Processing…" : `Pay ${money(total)}`}</Button></> : <>
                  <div className="rounded-md bg-muted/50 p-3 text-sm">{method === "paynow" ? <>PayNow to SOQ's UEN <strong>[UEN to confirm]</strong></> : <>Transfer to <strong>[SOQ bank account to confirm]</strong></>}. Put your name in the transfer comment.</div>
                  <label className="block text-sm">Pay by<select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" value={plan} onChange={e => setPlan(e.target.value as typeof plan)}><option value="full">Full amount — {money(total)}</option><option value="3">3 monthly instalments — {money(total / 3)}/month</option><option value="6">6 monthly instalments — {money(total / 6)}/month</option></select></label>
                  <Input placeholder="Your full name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
                  <Input placeholder="Transfer reference number" value={ref} onChange={e => setRef(e.target.value)} />
                  <Button disabled={busy} className="h-12 w-full rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85" onClick={() => void payBank()}>{busy ? "Sending…" : `I've paid ${money(plan === "full" ? total : total / Number(plan))}`}</Button>
                </>}
              </div>
            )}
          </aside>
        </div>
      )}

      {orders.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-primary">Past orders</h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
            {orders.map(o => <li key={o.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><span>{new Date(o.created_at).toLocaleDateString("en-SG")} · {o.items.map(i => i.title).join(", ")}</span><span className="font-medium">{money(Number(o.total))} · {o.payment_ref}</span></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
