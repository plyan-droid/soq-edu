import { useEffect, useState } from "react";

export type CartItem = { slug: string; title: string; price: number; label: string; includes?: string[] };
const KEY = "soq-cart";
const EVT = "soq-cart-change";

/** "From $216" -> 216, "From $735/mo" -> 735 (first month). Null when no price is published. */
export function priceNumber(price: string): number | null {
  const m = price.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
export const money = (n: number) => `$${n.toFixed(2)}`;

function read(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[]; } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return {
    items,
    has: (slug: string) => items.some(i => i.slug === slug),
    add: (item: CartItem) => { const cur = read(); if (!cur.some(i => i.slug === item.slug)) write([...cur, item]); },
    remove: (slug: string) => write(read().filter(i => i.slug !== slug)),
    clear: () => write([]),
    subtotal: items.reduce((s, i) => s + i.price, 0),
  };
}
