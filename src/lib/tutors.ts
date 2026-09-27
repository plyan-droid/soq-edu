export type PublicTutor = { user_id: string; display_name: string; headline: string; bio: string; subjects: string[]; days: string[]; times: string[]; location: string; online: boolean; years_experience: number | null; photo_url: string | null };
export type OpenSlot = { id: string; trainer_id: string; trainer_name: string; topic: string; starts_at: string; duration_min: number; price: number };
export const TUTOR_COLS = "user_id,display_name,headline,bio,subjects,days,times,location,online,years_experience,photo_url";
export const initials = (n: string) => n.replace(/\[DEMO\]\s*/i, "").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
