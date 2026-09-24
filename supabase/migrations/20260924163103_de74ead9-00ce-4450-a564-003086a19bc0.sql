REVOKE EXECUTE ON FUNCTION public.is_top_admin(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_top_admin(uuid) TO authenticated;