CREATE OR REPLACE FUNCTION public.check_maintenance_key(_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM site_settings WHERE key = 'maintenance_key' AND value #>> '{}' = _key AND length(_key) >= 8)
$$;