ALTER TABLE public.community_profiles ADD COLUMN verified boolean NOT NULL DEFAULT false, ADD COLUMN verified_at timestamptz, ADD COLUMN verified_by uuid;

CREATE OR REPLACE FUNCTION public.guard_profile_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.verified := false; NEW.verified_at := null; NEW.verified_by := null;
    END IF;
  ELSIF (NEW.verified IS DISTINCT FROM OLD.verified OR NEW.verified_at IS DISTINCT FROM OLD.verified_at OR NEW.verified_by IS DISTINCT FROM OLD.verified_by) THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only staff can change verification';
    END IF;
    IF NEW.verified THEN NEW.verified_at := now(); NEW.verified_by := auth.uid();
    ELSE NEW.verified_at := null; NEW.verified_by := null; END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER guard_profile_verification BEFORE INSERT OR UPDATE ON public.community_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification();

CREATE POLICY "Admins update any profile" ON public.community_profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Applicants view own applications" ON public.course_applications FOR SELECT TO authenticated
USING (lower(email) = lower(auth.jwt()->>'email'));