ALTER TABLE public.org_members ADD COLUMN IF NOT EXISTS member_role text NOT NULL DEFAULT 'student' CHECK (member_role IN ('student','instructor'));

CREATE TABLE public.org_packages (
  org_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Standard',
  student_seats integer NOT NULL DEFAULT 10,
  instructor_seats integer NOT NULL DEFAULT 2,
  expires_on date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_packages TO authenticated;
GRANT ALL ON public.org_packages TO service_role;
ALTER TABLE public.org_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org reads own package" ON public.org_packages FOR SELECT TO authenticated USING (org_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Staff manage packages" ON public.org_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Org removes own members" ON public.org_members FOR DELETE TO authenticated USING (org_id = auth.uid());

CREATE OR REPLACE FUNCTION public.org_add_member(_email text, _role text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.org_packages; used int; cap int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text = 'organization') THEN
    RAISE EXCEPTION 'Only organization accounts can add members';
  END IF;
  IF _role NOT IN ('student','instructor') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  SELECT * INTO p FROM org_packages WHERE org_id = auth.uid();
  IF p IS NULL THEN RAISE EXCEPTION 'No package assigned yet. Ask SOQ staff to set one up.'; END IF;
  IF p.expires_on IS NOT NULL AND p.expires_on < current_date THEN RAISE EXCEPTION 'Your package expired on %', p.expires_on; END IF;
  SELECT count(*) INTO used FROM org_members WHERE org_id = auth.uid() AND member_role = _role;
  cap := CASE WHEN _role = 'student' THEN p.student_seats ELSE p.instructor_seats END;
  IF used >= cap THEN RAISE EXCEPTION 'Package full: % of % % seats used', used, cap, _role; END IF;
  INSERT INTO org_members(org_id, member_email, member_role) VALUES (auth.uid(), lower(trim(_email)), _role)
  ON CONFLICT DO NOTHING;
  RETURN 'ok';
END $$;
REVOKE EXECUTE ON FUNCTION public.org_add_member(text,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.org_add_member(text,text) TO authenticated;