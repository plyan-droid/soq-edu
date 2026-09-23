import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { priceNumber, useCart } from "@/lib/cart";

export function AddToCart({ slug, title, price }: { slug: string; title: string; price: string }) {
  const cart = useCart();
  const n = priceNumber(price);
  if (n === null) return null;
  if (cart.has(slug)) return <Button asChild variant="outline" className="mt-3 h-12 w-full rounded-full"><Link to="/cart"><ShoppingBag /> In your cart — view</Link></Button>;
  return (
    <Button variant="outline" className="mt-3 h-12 w-full rounded-full" onClick={() => cart.add({ slug, title, price: n, label: price })}>
      <ShoppingBag /> Add to cart
    </Button>
  );
}

export function CartLink() {
  const { items } = useCart();
  return (
    <Link to="/cart" aria-label="Cart" className="relative grid size-10 place-items-center text-primary">
      <ShoppingBag className="size-5" />
      {items.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-brand-gold text-[10px] font-semibold text-brand-navy">{items.length}</span>}
    </Link>
  );
}
