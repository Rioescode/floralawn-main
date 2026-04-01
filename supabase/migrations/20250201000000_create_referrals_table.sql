-- Create referrals table for referral program
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Referrer (person who refers)
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referrer_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    referrer_email VARCHAR(255),
    referrer_name VARCHAR(255),
    
    -- Referee (person who was referred)
    referee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    referee_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    referee_email VARCHAR(255),
    referee_name VARCHAR(255),
    referee_phone VARCHAR(50),
    
    -- Referral Code
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, rewarded, expired
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Reward tracking
    referrer_reward_type VARCHAR(50), -- discount, credit, cash, service
    referrer_reward_amount DECIMAL(10,2) DEFAULT 0.00,
    referrer_reward_status VARCHAR(50) DEFAULT 'pending', -- pending, awarded, redeemed
    referrer_rewarded_at TIMESTAMP WITH TIME ZONE,
    
    referee_reward_type VARCHAR(50),
    referee_reward_amount DECIMAL(10,2) DEFAULT 0.00,
    referee_reward_status VARCHAR(50) DEFAULT 'pending',
    referee_rewarded_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional info
    source VARCHAR(100), -- website, email, social_media, etc.
    notes TEXT,
    
    CONSTRAINT referrals_status_check CHECK (
        status IN ('pending', 'completed', 'rewarded', 'expired', 'cancelled')
    ),
    CONSTRAINT referrals_reward_status_check CHECK (
        referrer_reward_status IN ('pending', 'awarded', 'redeemed', 'expired')
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_customer_id ON public.referrals(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_customer_id ON public.referrals(referee_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON public.referrals(created_at);

-- Drop trigger if exists, then create updated_at trigger
DROP TRIGGER IF EXISTS referrals_updated_at ON public.referrals;
CREATE TRIGGER referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Customers can view own referrals" ON public.referrals;
CREATE POLICY "Customers can view own referrals" ON public.referrals
    FOR SELECT USING (
        referrer_id = auth.uid() OR 
        (referrer_customer_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.id = referrals.referrer_customer_id 
            AND customers.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Admin can view all referrals" ON public.referrals;
CREATE POLICY "Admin can view all referrals" ON public.referrals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = 'esckoofficial@gmail.com'
        )
    );

DROP POLICY IF EXISTS "Allow public referral tracking" ON public.referrals;
CREATE POLICY "Allow public referral tracking" ON public.referrals
    FOR INSERT WITH CHECK (true);

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_email TEXT)
RETURNS VARCHAR(50) AS $$
DECLARE
    code VARCHAR(50);
    exists_check BOOLEAN;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Excludes confusing chars (0, O, I, 1)
    i INTEGER;
    random_char CHAR(1);
BEGIN
    -- Generate FLORA + 6 random alphanumeric characters
    code := 'FLORA';
    
    -- Add 6 random characters
    FOR i IN 1..6 LOOP
        random_char := SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
        code := code || random_char;
    END LOOP;
    
    -- Check if code exists and regenerate if needed
    SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists_check;
    
    WHILE exists_check LOOP
        code := 'FLORA';
        FOR i IN 1..6 LOOP
            random_char := SUBSTRING(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
            code := code || random_char;
        END LOOP;
        SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referral_code = code) INTO exists_check;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

