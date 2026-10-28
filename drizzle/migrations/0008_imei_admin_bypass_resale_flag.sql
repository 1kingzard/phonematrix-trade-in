CREATE OR REPLACE FUNCTION public.submit_imei_order(p_service_id uuid, p_identifier text, p_idempotency_key text, p_trade_in_request_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_service public.imei_services%ROWTYPE;
  v_wallet_id uuid;
  v_order_id uuid;
  v_masked text;
  v_resale boolean;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT (value::text)::boolean INTO v_resale FROM public.imei_settings WHERE key = 'resale_enabled';
  IF NOT COALESCE(v_resale, false) AND NOT public.is_admin(v_user) THEN
    RAISE EXCEPTION 'IMEI services are not currently enabled';
  END IF;
  SELECT * INTO v_service FROM public.imei_services WHERE id = p_service_id;
  IF NOT FOUND OR NOT v_service.enabled THEN
    RAISE EXCEPTION 'This service is not available';
  END IF;
  IF length(trim(p_identifier)) < 5 THEN
    RAISE EXCEPTION 'Invalid IMEI or serial number';
  END IF;
  SELECT id INTO v_order_id FROM public.imei_orders WHERE idempotency_key = p_idempotency_key;
  IF FOUND THEN
    RETURN v_order_id;
  END IF;
  INSERT INTO public.customer_wallets (user_id) VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT id INTO v_wallet_id FROM public.customer_wallets WHERE user_id = v_user FOR UPDATE;
  IF (SELECT balance - reserved FROM public.customer_wallets WHERE id = v_wallet_id) < v_service.retail_price THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  v_masked := CASE WHEN length(p_identifier) > 4 THEN repeat('*', length(p_identifier) - 4) || right(p_identifier, 4) ELSE p_identifier END;
  INSERT INTO public.imei_orders (user_id, service_id, identifier, identifier_masked, retail_price, wholesale_cost, status, idempotency_key, trade_in_request_id)
  VALUES (v_user, p_service_id, trim(p_identifier), v_masked, v_service.retail_price, v_service.wholesale_cost, 'submitted', p_idempotency_key, p_trade_in_request_id)
  RETURNING id INTO v_order_id;
  UPDATE public.customer_wallets SET reserved = reserved + v_service.retail_price, updated_at = now() WHERE id = v_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, reference, order_id)
  SELECT v_wallet_id, 'reservation', -v_service.retail_price, w.balance, 'reserve:' || v_order_id::text, v_order_id
  FROM public.customer_wallets w WHERE w.id = v_wallet_id;
  RETURN v_order_id;
END;
$$;