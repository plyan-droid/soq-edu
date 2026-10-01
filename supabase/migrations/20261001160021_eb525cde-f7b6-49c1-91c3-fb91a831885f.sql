ALTER TABLE public.course_applications DROP CONSTRAINT IF EXISTS course_applications_status_check;
ALTER TABLE public.course_applications ADD CONSTRAINT course_applications_status_check CHECK (status IN ('new','contacted','screening','offer','approved','enrolled','closed'));
ALTER TABLE public.course_applications
  ADD COLUMN IF NOT EXISTS nationality text CHECK (char_length(nationality) <= 60),
  ADD COLUMN IF NOT EXISTS id_type text CHECK (id_type IN ('NRIC','FIN','PASSPORT')),
  ADD COLUMN IF NOT EXISTS id_number text CHECK (char_length(id_number) <= 30),
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS address text CHECK (char_length(address) <= 300),
  ADD COLUMN IF NOT EXISTS qualification text CHECK (char_length(qualification) <= 80),
  ADD COLUMN IF NOT EXISTS sales_manager text CHECK (char_length(sales_manager) <= 60),
  ADD COLUMN IF NOT EXISTS newsletter boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'website' CHECK (source IN ('website','staff','import'));
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS id_type text,
  ADD COLUMN IF NOT EXISTS id_number text,
  ADD COLUMN IF NOT EXISTS qualification text;