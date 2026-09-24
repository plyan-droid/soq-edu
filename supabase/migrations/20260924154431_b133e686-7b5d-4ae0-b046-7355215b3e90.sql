CREATE TABLE public.bank_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  full_name text NOT NULL, email text NOT NULL,
  items jsonb NOT NULL, total numeric NOT NULL CHECK (total >= 0),
  method text NOT NULL CHECK (method IN ('paynow','bank')),
  plan text NOT NULL DEFAULT 'full' CHECK (plan IN ('full','3','6')),
  reference text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  staff_note text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_payments TO authenticated; GRANT ALL ON public.bank_payments TO service_role;
ALTER TABLE public.bank_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp own read" ON public.bank_payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bp own insert" ON public.bank_payments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "bp admin" ON public.bank_payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.instalments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.bank_payments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, seq int NOT NULL, due_date date NOT NULL, amount numeric NOT NULL,
  paid boolean NOT NULL DEFAULT false, paid_at timestamptz);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instalments TO authenticated; GRANT ALL ON public.instalments TO service_role;
ALTER TABLE public.instalments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inst read" ON public.instalments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "inst admin" ON public.instalments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.course_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_slug text NOT NULL, name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 200), phone text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','offered','enrolled','removed')),
  created_at timestamptz NOT NULL DEFAULT now());
GRANT INSERT ON public.course_waitlist TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_waitlist TO authenticated; GRANT ALL ON public.course_waitlist TO service_role;
ALTER TABLE public.course_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl join" ON public.course_waitlist FOR INSERT TO anon, authenticated WITH CHECK (status = 'waiting');
CREATE POLICY "wl admin" ON public.course_waitlist FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.site_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, body text NOT NULL DEFAULT '', pinned boolean NOT NULL DEFAULT false,
  ends_on date, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.site_notices TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_notices TO authenticated; GRANT ALL ON public.site_notices TO service_role;
ALTER TABLE public.site_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notice read" ON public.site_notices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "notice admin" ON public.site_notices FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.course_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text NOT NULL DEFAULT '', slugs text[] NOT NULL,
  price numeric NOT NULL CHECK (price >= 0), active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.course_bundles TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_bundles TO authenticated; GRANT ALL ON public.course_bundles TO service_role;
ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bundle read" ON public.course_bundles FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "bundle admin" ON public.course_bundles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.custom_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,60}$'), title text NOT NULL, intro text NOT NULL DEFAULT '',
  fields jsonb NOT NULL DEFAULT '[]', active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.custom_forms TO anon; GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_forms TO authenticated; GRANT ALL ON public.custom_forms TO service_role;
ALTER TABLE public.custom_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form read" ON public.custom_forms FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY "form admin" ON public.custom_forms FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.custom_forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT INSERT ON public.form_responses TO anon; GRANT SELECT, INSERT, DELETE ON public.form_responses TO authenticated; GRANT ALL ON public.form_responses TO service_role;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resp insert" ON public.form_responses FOR INSERT TO anon, authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.custom_forms f WHERE f.id = form_id AND f.active) AND length(data::text) < 20000);
CREATE POLICY "resp admin" ON public.form_responses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.certificate_design (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  heading text NOT NULL DEFAULT 'Certificate of Completion',
  body text NOT NULL DEFAULT 'This is to certify that {name} has successfully completed {course}.',
  signatory text NOT NULL DEFAULT 'Academic Director', signatory_title text NOT NULL DEFAULT 'SOQ International Academy',
  accent text NOT NULL DEFAULT '#b8963e', updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO public.certificate_design (id) VALUES (1);
GRANT SELECT ON public.certificate_design TO anon; GRANT SELECT, UPDATE ON public.certificate_design TO authenticated; GRANT ALL ON public.certificate_design TO service_role;
ALTER TABLE public.certificate_design ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cd read" ON public.certificate_design FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cd admin" ON public.certificate_design FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(), email text, user_agent text, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.login_events TO authenticated; GRANT ALL ON public.login_events TO service_role;
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "le insert" ON public.login_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "le read" ON public.login_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.referral_codes (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(), code text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.referral_codes TO authenticated; GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rc own" ON public.referral_codes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "rc create" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL, referred_id uuid NOT NULL UNIQUE, referred_email text,
  status text NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up','enrolled','rewarded')),
  created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, UPDATE ON public.referrals TO authenticated; GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref read" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ref admin" ON public.referrals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.claim_referral(_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT user_id INTO r FROM referral_codes WHERE code = upper(trim(_code));
  IF r IS NULL OR r = auth.uid() THEN RETURN false; END IF;
  INSERT INTO referrals (referrer_id, referred_id, referred_email)
  VALUES (r, auth.uid(), (SELECT email FROM profiles WHERE id = auth.uid()))
  ON CONFLICT (referred_id) DO NOTHING;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_referral(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_bank_payment(_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p bank_payments; n int; i int; it jsonb;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Staff only'; END IF;
  SELECT * INTO p FROM bank_payments WHERE id = _id FOR UPDATE;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Already handled'; END IF;
  UPDATE bank_payments SET status = 'approved' WHERE id = _id;
  FOR it IN SELECT * FROM jsonb_array_elements(p.items) LOOP
    IF NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = p.user_id AND course_slug = it->>'slug') THEN
      INSERT INTO enrollments (student_id, course_slug, status) VALUES (p.user_id, it->>'slug', 'active');
    END IF;
  END LOOP;
  n := CASE p.plan WHEN '3' THEN 3 WHEN '6' THEN 6 ELSE 1 END;
  IF n > 1 THEN
    FOR i IN 1..n LOOP
      INSERT INTO instalments (payment_id, user_id, seq, due_date, amount, paid, paid_at)
      VALUES (_id, p.user_id, i, (current_date + ((i-1) || ' months')::interval)::date, round(p.total / n, 2), i = 1, CASE WHEN i = 1 THEN now() END);
    END LOOP;
  END IF;
  UPDATE referrals SET status = 'enrolled' WHERE referred_id = p.user_id AND status = 'signed_up';
END $$;
REVOKE ALL ON FUNCTION public.approve_bank_payment(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_bank_payment(uuid) TO authenticated;