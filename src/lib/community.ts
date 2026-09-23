import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommunityProfile = { id: string; username: string; display_name: string; bio: string | null; member_type: string; website: string | null; created_at: string; verified: boolean };
export type PostRow = { id: string; author_id: string; title: string; body: string; tags: string[]; hidden: boolean; created_at: string; author: Pick<CommunityProfile, "username" | "display_name" | "member_type" | "verified"> | null; post_likes: { count: number }[]; post_comments: { count: number }[] };

export const POST_SELECT = "id,author_id,title,body,tags,hidden,created_at,author:community_profiles!posts_author_id_fkey(username,display_name,member_type,verified),post_likes(count),post_comments(count)";

export const memberTypes: Record<string, string> = { member: "Member", student: "Student", alumni: "Alumni", trainer: "Trainer", business: "Business" };
export const suggestedTags = ["beauty", "lashes", "makeup", "wellness", "ai", "business", "careers", "retail", "caregiving", "funding", "studytips", "jobs"];

export const normaliseTags = (raw: string) =>
  Array.from(new Set(raw.split(/[\s,#]+/).map(t => t.toLowerCase().replace(/[^a-z0-9]/g, "")).filter(Boolean))).slice(0, 4);

export const readingTime = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 200));
export const timeAgo = (d: string) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
export const countOf = (x: { count: number }[] | undefined) => x?.[0]?.count ?? 0;

export function useMyCommunityProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-community-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("community_profiles").select("*").eq("id", userId!).maybeSingle();
      return (data ?? null) as CommunityProfile | null;
    },
  });
}
