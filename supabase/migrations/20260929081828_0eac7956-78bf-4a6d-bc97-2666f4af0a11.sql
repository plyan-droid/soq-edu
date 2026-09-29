CREATE OR REPLACE FUNCTION public.my_learning_organisation()
RETURNS TABLE(organisation_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(p.full_name, ''), p.email) AS organisation_name
  FROM public.profiles me
  JOIN public.org_members m ON lower(m.member_email) = lower(me.email) AND m.member_role = 'student'
  JOIN public.profiles p ON p.id = m.org_id
  WHERE me.id = auth.uid()
  ORDER BY m.created_at
  LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.my_learning_organisation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_learning_organisation() TO authenticated;