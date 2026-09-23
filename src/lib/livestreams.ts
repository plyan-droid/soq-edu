export type Livestream = { id: string; title: string; description: string; hosts: string | null; video_url: string; starts_at: string; status: "upcoming" | "live" | "ended"; created_at: string };

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1]! : null;
}
export const thumb = (url: string) => { const id = youtubeId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null; };
