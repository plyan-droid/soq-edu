INSERT INTO public.user_roles (user_id, role)
SELECT p.id, r.role::public.app_role FROM public.profiles p CROSS JOIN (VALUES ('admin'),('trainer')) r(role)
WHERE p.email = 'creative@morpheuslabs.io'
ON CONFLICT (user_id, role) DO NOTHING;