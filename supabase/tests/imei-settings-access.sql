-- Regression checks: every returned check must be true.
SELECT
  NOT has_table_privilege('anon', 'public.imei_settings', 'SELECT') AS anonymous_settings_blocked,
  (SELECT bool_and(qual = 'is_admin(auth.uid())')
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'imei_settings'
     AND cmd IN ('SELECT', 'ALL')) AS settings_reads_admin_only,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.imei_settings'::regclass) AS settings_rls_enabled,
  has_table_privilege('authenticated', 'public.imei_settings', 'SELECT') AS authenticated_access_subject_to_rls,
  has_function_privilege('anon', 'public.get_imei_availability()', 'EXECUTE') AS customer_availability_accessible;