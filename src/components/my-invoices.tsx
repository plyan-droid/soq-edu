import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { downloadInvoicePdf, type InvoiceRecord } from "@/lib/invoice-pdf";

const money = (value: number) => `S$${Number(value).toFixed(2)}`;
const date = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function MyInvoices({ userId }: { userId: string }) {
  const { data: transfers = [], isPending: transfersPending, isError: transfersError } = useQuery({ queryKey: ["my-bank", userId], queryFn: async () => {
    const { data, error } = await supabase.from("bank_payments").select("id,full_name,email,items,total,method,reference,status,plan,created_at").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data as InvoiceRecord[];
  } });
  const { data: orders = [], isPending: ordersPending, isError: ordersError } = useQuery({ queryKey: ["my-invoice-orders", userId], queryFn: async () => {
    const { data, error } = await supabase.from("orders").select("id,full_name,email,items,total,status,payment_ref,created_at").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } });
  const records: InvoiceRecord[] = [
    ...transfers,
    ...orders.map(o => ({ id: o.id, full_name: o.full_name, email: o.email, items: o.items as InvoiceRecord["items"], total: o.total, status: "demo", method: "card", reference: o.payment_ref, plan: "full", created_at: o.created_at })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
    <h2 className="font-serif text-3xl text-primary">Invoices</h2>
    {transfersPending || ordersPending ? <p className="mt-4 text-sm text-muted-foreground">Loading invoices…</p> : transfersError || ordersError ? <p className="mt-4 text-sm text-destructive">Invoices couldn't be loaded. Please refresh and try again.</p> : !records.length ? <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p> : <ul className="mt-4 divide-y divide-border border-y border-border">{records.map(p => <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0"><p className="font-medium text-primary">SOQ-{p.id.slice(0, 8).toUpperCase()} · {money(p.total)}</p><p className="mt-1 text-sm text-muted-foreground">{date(p.created_at)} · {p.items.map(i => i.title).join(", ")}</p><p className="mt-1 text-xs text-muted-foreground">{p.status === "demo" ? "Demo order — not a payment receipt" : p.status === "approved" ? "Transfer confirmed; check any remaining instalments under Payments" : p.status === "rejected" ? "Transfer not confirmed" : "Awaiting transfer confirmation — not a receipt"}</p></div>
      <Button variant="outline" size="sm" onClick={() => void downloadInvoicePdf(p).catch(() => toast.error("Couldn't download this invoice"))}><Download className="size-4" /> Download PDF</Button>
    </li>)}</ul>}
  </section>;
}