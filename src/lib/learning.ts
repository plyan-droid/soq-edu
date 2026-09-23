export type Lesson = { id: string; course_slug: string; position: number; title: string; body: string | null; video_url: string | null; file_url: string | null; created_by: string | null; created_at: string };
export type LiveSession = { id: string; course_slug: string; trainer_id: string; title: string; starts_at: string; duration_min: number; meeting_url: string | null; status: string };

/** Turn a YouTube / Vimeo link into an embeddable URL, or null. */
export function embedUrl(url: string | null): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-SG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const safeHref = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
