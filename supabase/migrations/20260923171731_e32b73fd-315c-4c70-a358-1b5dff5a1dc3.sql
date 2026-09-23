CREATE TABLE public.discount_codes (
  code text PRIMARY KEY,
  percent_off integer NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  active boolean NOT NULL DEFAULT true,
  expires_on date,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage discount codes" ON public.discount_codes FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  discount_code text,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  payment_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders or staff" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.check_discount(_code text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT percent_off FROM discount_codes WHERE upper(code) = upper(trim(_code)) AND active
    AND (expires_on IS NULL OR expires_on >= current_date) AND (max_uses IS NULL OR used_count < max_uses)
$$;
REVOKE EXECUTE ON FUNCTION public.check_discount(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_discount(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.place_mock_order(_items jsonb, _code text, _full_name text, _email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sub numeric := 0; pct integer; disc numeric := 0; oid uuid; it jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 20 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    IF (it->>'price')::numeric < 0 THEN RAISE EXCEPTION 'Bad price'; END IF;
    sub := sub + (it->>'price')::numeric;
  END LOOP;
  IF _code IS NOT NULL AND length(trim(_code)) > 0 THEN
    pct := check_discount(_code);
    IF pct IS NULL THEN RAISE EXCEPTION 'Discount code is not valid'; END IF;
    disc := round(sub * pct / 100.0, 2);
    UPDATE discount_codes SET used_count = used_count + 1 WHERE upper(code) = upper(trim(_code));
  END IF;
  INSERT INTO orders (user_id, full_name, email, items, subtotal, discount_code, discount_amount, total, payment_ref)
  VALUES (auth.uid(), left(_full_name, 120), left(_email, 200), _items, sub, nullif(upper(trim(_code)), ''), disc, sub - disc,
          'MOCK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)))
  RETURNING id INTO oid;
  RETURN oid;
END $$;
REVOKE EXECUTE ON FUNCTION public.place_mock_order(jsonb, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_mock_order(jsonb, text, text, text) TO authenticated;

CREATE TABLE public.site_pages (
  slug text PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors read published pages" ON public.site_pages FOR SELECT TO anon USING (published);
CREATE POLICY "Members read published, staff all" ON public.site_pages FOR SELECT TO authenticated USING (published OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff write pages" ON public.site_pages FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.notification_templates (
  key text PRIMARY KEY,
  label text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage templates" ON public.notification_templates FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
INSERT INTO public.notification_templates (key, label, subject, body) VALUES
 ('application_received','Course application received','We received your application for {{course}}','Hi {{name}},\n\nThank you for applying for {{course}} at SOQ International Academy. A course adviser will contact you within 1–2 working days.\n\nSOQ International Academy'),
 ('order_paid','Payment receipt','Your SOQ receipt {{reference}}','Hi {{name}},\n\nThank you for your payment of {{total}}. Your reference is {{reference}}.\n\nSOQ International Academy'),
 ('trainer_approved','Trainer application approved','Welcome to the SOQ trainer team','Hi {{name}},\n\nYour application to teach at SOQ has been approved. Sign in to open your Trainer Dashboard.\n\nSOQ International Academy'),
 ('ticket_reply','Support message reply','Re: your message to SOQ','Hi {{name}},\n\n{{reply}}\n\nSOQ International Academy');

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff change settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));