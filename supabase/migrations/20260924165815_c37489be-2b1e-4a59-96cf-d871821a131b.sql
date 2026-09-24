ALTER TABLE public.certificate_design ADD COLUMN IF NOT EXISTS template text NOT NULL DEFAULT 'classic', ADD COLUMN IF NOT EXISTS subtitle text NOT NULL DEFAULT 'Private Education Institution · Singapore';

CREATE TABLE public.sfc_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0 AND balance <= 100000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sfc_balances TO authenticated;
GRANT ALL ON public.sfc_balances TO service_role;
ALTER TABLE public.sfc_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balance" ON public.sfc_balances FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff balances" ON public.sfc_balances FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

ALTER TABLE public.sfc_claims ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
GRANT SELECT, INSERT ON public.sfc_claims TO authenticated;
CREATE POLICY "students see own claims" ON public.sfc_claims FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "students submit claims" ON public.sfc_claims FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'submitted' AND sfc_amount >= 0 AND sfc_amount <= course_fee);