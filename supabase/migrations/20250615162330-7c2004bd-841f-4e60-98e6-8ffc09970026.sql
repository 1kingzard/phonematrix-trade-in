-- Create customer profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loyalty tiers enum
CREATE TYPE public.loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- Create customer loyalty table
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tier loyalty_tier NOT NULL DEFAULT 'bronze',
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_purchases INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request status enum
CREATE TYPE public.request_status AS ENUM ('pending', 'confirmed', 'processed', 'shipped', 'completed', 'cancelled');

-- Enhanced purchase requests table
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL,
  customer_info JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  status request_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create points transactions table
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'redeemed', 'bonus', 'referral'
  description TEXT NOT NULL,
  reference_id UUID, -- Can reference purchase_requests or other tables
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discount codes table
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  tier_required loyalty_tier,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication logs table
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'sms', 'notification'
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for customer loyalty
CREATE POLICY "Users can view own loyalty data" ON public.customer_loyalty FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own loyalty data" ON public.customer_loyalty FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own loyalty data" ON public.customer_loyalty FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for purchase requests
CREATE POLICY "Users can view own requests" ON public.purchase_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own requests" ON public.purchase_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests" ON public.purchase_requests FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for points transactions
CREATE POLICY "Users can view own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for discount codes (public read for active codes)
CREATE POLICY "Anyone can view active discount codes" ON public.discount_codes FOR SELECT USING (is_active = true);

-- Create RLS policies for communication logs
CREATE POLICY "Users can view own communications" ON public.communication_logs FOR SELECT USING (auth.uid() = user_id);

-- Create functions to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_loyalty_updated_at BEFORE UPDATE ON public.customer_loyalty FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create loyalty record when profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_loyalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customer_loyalty (user_id, referral_code)
  VALUES (NEW.user_id, 'REF' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)));
  RETURN NEW;
END;
$$;

-- Trigger to create loyalty record when profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_loyalty();

-- Function to calculate and update loyalty tier based on points
CREATE OR REPLACE FUNCTION public.update_loyalty_tier(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_points INTEGER;
  new_tier loyalty_tier;
BEGIN
  SELECT points INTO user_points FROM public.customer_loyalty WHERE user_id = user_uuid;
  
  IF user_points >= 5000 THEN
    new_tier := 'platinum';
  ELSIF user_points >= 2500 THEN
    new_tier := 'gold';
  ELSIF user_points >= 1000 THEN
    new_tier := 'silver';
  ELSE
    new_tier := 'bronze';
  END IF;
  
  UPDATE public.customer_loyalty 
  SET tier = new_tier, updated_at = now()
  WHERE user_id = user_uuid;
END;
$$;

-- Function to add points and update tier
CREATE OR REPLACE FUNCTION public.add_loyalty_points(
  user_uuid UUID,
  points_amount INTEGER,
  transaction_type TEXT,
  description TEXT,
  reference_uuid UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add points to customer loyalty
  UPDATE public.customer_loyalty 
  SET points = points + points_amount, updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Record the transaction
  INSERT INTO public.points_transactions (user_id, points, transaction_type, description, reference_id)
  VALUES (user_uuid, points_amount, transaction_type, description, reference_uuid);
  
  -- Update tier based on new points
  PERFORM public.update_loyalty_tier(user_uuid);
END;
$$;