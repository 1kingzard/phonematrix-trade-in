CREATE OR REPLACE FUNCTION public.wallet_credit(p_user_id uuid, p_amount numeric, p_type text, p_reference text, p_reason text DEFAULT NULL, p_admin_id uuid DEFAULT NULL)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance numeric(12,2);
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive';
  END IF;
  INSERT INTO public.customer_wallets (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE user_id = p_user_id FOR UPDATE;
  BEGIN
    INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, reason, admin_id)
    SELECT v_wallet_id, p_type, p_amount, w.balance + p_amount, p_reference, p_reason, p_admin_id
    FROM public.customer_wallets w WHERE w.id = v_wallet_id;
  EXCEPTION WHEN unique_violation THEN
    SELECT balance INTO v_balance FROM public.customer_wallets WHERE id = v_wallet_id;
    RETURN v_balance;
  END;
  UPDATE public.customer_wallets SET balance = balance + p_amount, updated_at = now() WHERE id = v_wallet_id RETURNING balance INTO v_balance;
  RETURN v_balance;
END;
$$;