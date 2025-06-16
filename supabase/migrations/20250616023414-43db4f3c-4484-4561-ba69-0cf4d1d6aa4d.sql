-- Create inventory table for device stock management
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_condition TEXT NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  sku TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory (admin only)
CREATE POLICY "Admins can manage inventory" 
ON public.inventory 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Add referral tracking to purchase_requests
ALTER TABLE public.purchase_requests 
ADD COLUMN referral_code_used TEXT,
ADD COLUMN assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN workflow_status TEXT DEFAULT 'new';

-- Add referral rewards tracking
ALTER TABLE public.customer_loyalty 
ADD COLUMN referrals_made INTEGER DEFAULT 0,
ADD COLUMN referral_points_earned INTEGER DEFAULT 0;

-- Create referral_rewards table for tracking
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.purchase_requests(id),
  points_awarded INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'referral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on referral_rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies for referral_rewards
CREATE POLICY "Users can view their own referral rewards" 
ON public.referral_rewards 
FOR SELECT 
USING (auth.uid() = referrer_id OR public.is_admin(auth.uid()));

CREATE POLICY "System can insert referral rewards" 
ON public.referral_rewards 
FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle referral rewards
CREATE OR REPLACE FUNCTION public.process_referral_reward(
  referral_code TEXT,
  purchase_id UUID,
  purchase_amount DECIMAL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_user_id UUID;
  reward_points INTEGER;
BEGIN
  -- Find the referrer by their referral code
  SELECT user_id INTO referrer_user_id 
  FROM public.customer_loyalty 
  WHERE referral_code = process_referral_reward.referral_code;
  
  IF referrer_user_id IS NOT NULL THEN
    -- Calculate reward points (5% of purchase amount as points)
    reward_points := FLOOR(purchase_amount * 0.05);
    
    -- Award points to referrer
    PERFORM public.add_loyalty_points(
      referrer_user_id, 
      reward_points, 
      'referral_reward', 
      'Referral reward for successful referral',
      purchase_id
    );
    
    -- Update referrer stats
    UPDATE public.customer_loyalty 
    SET referrals_made = referrals_made + 1,
        referral_points_earned = referral_points_earned + reward_points
    WHERE user_id = referrer_user_id;
    
    -- Record the reward
    INSERT INTO public.referral_rewards (referrer_id, referred_user_id, purchase_id, points_awarded)
    VALUES (referrer_user_id, (SELECT user_id FROM public.purchase_requests WHERE id = purchase_id), purchase_id, reward_points);
  END IF;
END;
$$;