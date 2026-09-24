CREATE TABLE public.admissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, email text NOT NULL, phone text, course_slug text NOT NULL, stage text NOT NULL DEFAULT 'applied', notes text, application_id uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.exemptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_email text NOT NULL, course_slug text NOT NULL, module text NOT NULL, kind text NOT NULL DEFAULT 'RPL', fee_reduction numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'pending', evidence text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.sfc_claims (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_email text NOT NULL, course_slug text NOT NULL, course_fee numeric NOT NULL DEFAULT 0, sfc_amount numeric NOT NULL DEFAULT 0, claim_ref text, status text NOT NULL DEFAULT 'submitted', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text, phone text, source text, interest text, status text NOT NULL DEFAULT 'new', notes text, created_at timestamptz NOT NULL DEFAULT now());
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['admissions','exemptions','sfc_claims','leads'] LOOP
EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
EXECUTE format('CREATE POLICY "Staff manage %s" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t, t);
END LOOP; END $$;