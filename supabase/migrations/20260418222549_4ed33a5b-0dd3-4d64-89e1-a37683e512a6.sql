-- Fix infinite recursion: replace self-referencing user_roles policy with security-definer is_admin()
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Replace other admin policies that inline-query user_roles to also use is_admin() (avoids recursion via storage too)
DROP POLICY IF EXISTS "Admins can manage loyalty" ON public.customer_loyalty;
CREATE POLICY "Admins can manage loyalty" ON public.customer_loyalty
FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins can update inventory" ON public.inventory;
CREATE POLICY "Admins can delete inventory" ON public.inventory FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert inventory" ON public.inventory FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update inventory" ON public.inventory FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.purchase_requests;
CREATE POLICY "Admins can update requests" ON public.purchase_requests FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all requests" ON public.purchase_requests FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can insert codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Admins can update codes" ON public.referral_codes;
CREATE POLICY "Admins can delete codes" ON public.referral_codes FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert codes" ON public.referral_codes FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update codes" ON public.referral_codes FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete site media" ON public.site_media;
DROP POLICY IF EXISTS "Admins can insert site media" ON public.site_media;
DROP POLICY IF EXISTS "Admins can update site media" ON public.site_media;
CREATE POLICY "Admins can delete site media" ON public.site_media FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert site media" ON public.site_media FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update site media" ON public.site_media FOR UPDATE USING (public.is_admin(auth.uid()));

-- Storage policies for the media bucket so admins can upload
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload media" ON storage.objects;
DROP POLICY IF EXISTS "Admins update media" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;

CREATE POLICY "Public read media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admins upload media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins update media" ON storage.objects
FOR UPDATE USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins delete media" ON storage.objects
FOR DELETE USING (bucket_id = 'media' AND public.is_admin(auth.uid()));