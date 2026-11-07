DROP POLICY IF EXISTS "Anyone can view active codes" ON public.referral_codes;

CREATE POLICY "Admins can view codes"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));