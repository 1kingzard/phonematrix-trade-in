
DROP POLICY "Users can create requests" ON public.purchase_requests;
CREATE POLICY "Users can create own requests" ON public.purchase_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
