ALTER TABLE public.course_overrides ADD COLUMN IF NOT EXISTS category text, ADD COLUMN IF NOT EXISTS custom boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
ALTER TABLE public.sfc_balances ADD COLUMN IF NOT EXISTS verified_at timestamptz, ADD COLUMN IF NOT EXISTS verified_by uuid;
ALTER TABLE public.sfc_claims ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.bank_payments(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS settled_on date, ADD COLUMN IF NOT EXISTS staff_note text;

CREATE OR REPLACE FUNCTION public.guard_sfc_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.verified_at := NULL; NEW.verified_by := NULL;
    ELSE
      IF NEW.balance IS DISTINCT FROM OLD.balance THEN
        NEW.verified_at := NULL; NEW.verified_by := NULL;
      ELSE
        NEW.verified_at := OLD.verified_at; NEW.verified_by := OLD.verified_by;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_sfc_balance ON public.sfc_balances;
CREATE TRIGGER guard_sfc_balance BEFORE INSERT OR UPDATE ON public.sfc_balances FOR EACH ROW EXECUTE FUNCTION public.guard_sfc_balance();