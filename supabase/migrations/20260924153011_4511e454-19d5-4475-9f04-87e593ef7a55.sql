REVOKE EXECUTE ON FUNCTION public.in_course(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.in_course(uuid, text) TO authenticated;