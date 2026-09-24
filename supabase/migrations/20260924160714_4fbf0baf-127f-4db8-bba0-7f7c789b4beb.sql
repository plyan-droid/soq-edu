REVOKE EXECUTE ON FUNCTION public.guard_profile_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_bank_payment(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trainer_roster() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.trainer_lesson_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.session_roster(uuid) FROM PUBLIC, anon;