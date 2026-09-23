import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTrainer, setIsTrainer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async (s: Session | null) => {
      setSession(s);
      if (s) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
        const roles = (data ?? []).map(r => r.role as string);
        setIsAdmin(roles.includes("admin"));
        setIsTrainer(roles.includes("trainer"));
      } else { setIsAdmin(false); setIsTrainer(false); }
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setTimeout(() => void check(s), 0); });
    void supabase.auth.getSession().then(({ data }) => check(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, isAdmin, isTrainer, loading };
}
