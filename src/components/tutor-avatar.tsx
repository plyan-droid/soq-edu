import { initials } from "@/lib/tutors";

export function TutorAvatar({ name, photo, size = "md" }: { name: string; photo: string | null; size?: "md" | "xl" }) {
  const cls = size === "xl" ? "size-40 text-5xl ring-8" : "size-12 text-base ring-2";
  return photo
    ? <img src={photo} alt={name} loading="lazy" className={`${cls} rounded-full object-cover ring-brand-gold/40`} />
    : <span aria-hidden className={`${cls} grid shrink-0 place-items-center rounded-full bg-primary font-serif text-primary-foreground ring-brand-gold/40`}>{initials(name)}</span>;
}
