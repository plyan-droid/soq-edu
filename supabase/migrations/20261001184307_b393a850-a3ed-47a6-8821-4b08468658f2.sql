ALTER TABLE public.custom_forms ADD COLUMN IF NOT EXISTS banner text;
UPDATE public.custom_forms SET banner = 'make-up-master-class' WHERE slug = 'open-house-demo';