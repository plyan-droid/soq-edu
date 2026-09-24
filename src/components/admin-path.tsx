import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/** If the unknown URL matches the staff-chosen admin path, send the visitor to staff sign-in. */
export function AdminPathRedirect() {
  useEffect(() => {
    const seg = window.location.pathname.replace(/^\/|\/$/g, "").toLowerCase();
    if (!/^[a-z0-9]+$/.test(seg)) return;
    void supabase.from("site_settings").select("value").eq("key", "admin_path").maybeSingle().then(({ data }) => {
      if (typeof data?.value === "string" && data.value === seg) window.location.replace("/login?next=/portal-admin");
    });
  }, []);
  return null;
}
