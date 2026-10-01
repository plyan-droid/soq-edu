import { courses } from "@/lib/site-content";

export const EVENT_CATEGORIES = [
  ["open_house", "Open house"],
  ["workshop", "Workshop"],
  ["talk", "Talk"],
  ["showcase", "Showcase"],
] as const;

export const categoryLabel = (c: string | null | undefined) =>
  EVENT_CATEGORIES.find(([k]) => k === c)?.[1] ?? "Event";

export const eventImage = (key: string | null | undefined) =>
  (key && courses.find(c => c.slug === key)?.image) || courses[0]!.image;

export const imageOptions = courses.map(c => ({ key: c.slug, title: c.title }));

export type EventItem = {
  id: string; title: string; description: string; starts_at: string; ends_at: string | null;
  location: string; online_url: string | null; capacity: number; created_by: string;
  category: string; speaker: string | null; speaker_role: string | null; image_key: string | null; agenda: string | null;
};

const ics = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function downloadIcs(e: EventItem) {
  const start = new Date(e.starts_at);
  const end = e.ends_at ? new Date(e.ends_at) : new Date(start.getTime() + 2 * 3600e3);
  const esc = (s: string) => s.replace(/[,;\\]/g, m => "\\" + m).replace(/\n/g, "\\n");
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SOQ International Academy//Events//EN", "BEGIN:VEVENT",
    `UID:${e.id}@soq.edu.sg`, `DTSTAMP:${ics(new Date())}`, `DTSTART:${ics(start)}`, `DTEND:${ics(end)}`,
    `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.description)}`, `LOCATION:${esc(e.online_url ? "Online" : e.location)}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  a.download = "soq-event.ics"; a.click();
}

export const timeRange = (s: string, e: string | null) => {
  const st = new Date(s);
  const day = st.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${t(st)}${e ? `–${t(new Date(e))}` : ""}`;
};
