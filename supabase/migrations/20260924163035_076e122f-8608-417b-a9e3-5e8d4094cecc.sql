ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization';

CREATE OR REPLACE FUNCTION public.is_top_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'admin')
$$;

-- Staff count as admin everywhere, except roles and settings (top admin only)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND (role = _role OR (_role::text = 'admin' AND role::text = 'staff')))
$$;

DROP POLICY "Staff grant roles" ON public.user_roles;
DROP POLICY "Staff remove roles" ON public.user_roles;
CREATE POLICY "Admin grant roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_top_admin(auth.uid()));
CREATE POLICY "Admin remove roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_top_admin(auth.uid()) AND user_id <> auth.uid());

DROP POLICY "Settings are public" ON public.site_settings;
DROP POLICY "Staff change settings" ON public.site_settings;
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT TO anon, authenticated USING (key <> 'maintenance_key' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin change settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_top_admin(auth.uid())) WITH CHECK (public.is_top_admin(auth.uid()));

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  member_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, member_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_members TO authenticated;
GRANT ALL ON public.org_members TO service_role;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org reads own" ON public.org_members FOR SELECT TO authenticated USING (org_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages" ON public.org_members FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Organization sees its employees' enrolments
CREATE OR REPLACE FUNCTION public.org_roster()
RETURNS TABLE(member_email text, full_name text, course_slug text, progress int, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.member_email, p.full_name, e.course_slug, e.progress, e.status
  FROM org_members m LEFT JOIN profiles p ON lower(p.email) = lower(m.member_email)
  LEFT JOIN enrollments e ON e.student_id = p.id
  WHERE m.org_id = auth.uid() ORDER BY 1
$$;
REVOKE EXECUTE ON FUNCTION public.org_roster() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.org_roster() TO authenticated;