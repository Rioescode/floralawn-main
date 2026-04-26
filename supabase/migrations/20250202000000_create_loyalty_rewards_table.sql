-- Create loyalty_rewards table for customer loyalty program
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Customer Information
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    
    -- Loyalty Points
    total_points INTEGER DEFAULT 0 NOT NULL,
    available_points INTEGER DEFAULT 0 NOT NULL,
    redeemed_points INTEGER DEFAULT 0,
    
    -- Loyalty Tier
    loyalty_tier VARCHAR(50) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    tier_start_date TIMESTAMP WITH TIME ZONE,
    
    -- Service History
    total_services_completed INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    first_service_date TIMESTAMP WITH TIME ZONE,
    last_service_date TIMESTAMP WITH TIME ZONE,
    
    -- Rewards
    total_rewards_earned DECIMAL(10,2) DEFAULT 0.00,
    total_rewards_redeemed DECIMAL(10,2) DEFAULT 0.00,
    available_reward_balance DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT loyalty_tier_check CHECK (
        loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')
    ),
    CONSTRAINT points_check CHECK (
        total_points >= 0 AND available_points >= 0 AND redeemed_points >= 0
    )
);

-- Create loyalty_transactions table to track point earnings and redemptions
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Customer
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    loyalty_reward_id UUID REFERENCES public.loyalty_rewards(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL, -- earned, redeemed, expired, adjusted
    points INTEGER NOT NULL,
    point_value DECIMAL(10,2) DEFAULT 0.00, -- Dollar value of points
    
    -- Related Service/Order
    service_id UUID, -- Reference to appointments or customers table
    service_type VARCHAR(100),
    service_date TIMESTAMP WITH TIME ZONE,
    
    -- Description
    description TEXT,
    notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, expired, cancelled
    
    CONSTRAINT transaction_type_check CHECK (
        transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'bonus')
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_customer_id ON public.loyalty_rewards(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user_id ON public.loyalty_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_tier ON public.loyalty_rewards(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_email ON public.loyalty_rewards(customer_email);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_id ON public.loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_loyalty_reward_id ON public.loyalty_transactions(loyalty_reward_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS loyalty_rewards_updated_at ON public.loyalty_rewards;
CREATE TRIGGER loyalty_rewards_updated_at
    BEFORE UPDATE ON public.loyalty_rewards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Customers can view their own loyalty rewards
CREATE POLICY "Customers can view own loyalty rewards" ON public.loyalty_rewards
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (customer_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.id = loyalty_rewards.customer_id 
            AND customers.user_id = auth.uid()
        ))
    );

-- RLS Policy: Admin can view all loyalty rewards
CREATE POLICY "Admin can view all loyalty rewards" ON public.loyalty_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = 'esckoofficial@gmail.com'
        )
    );

-- RLS Policy: Customers can view their own transactions
CREATE POLICY "Customers can view own transactions" ON public.loyalty_transactions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (customer_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.id = loyalty_transactions.customer_id 
            AND customers.user_id = auth.uid()
        ))
    );

-- RLS Policy: Admin can view all transactions
CREATE POLICY "Admin can view all transactions" ON public.loyalty_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = 'esckoofficial@gmail.com'
        )
    );

-- Function to calculate loyalty tier based on points/services
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(total_points INTEGER, total_services INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
    IF total_points >= 100000 THEN
        RETURN 'platinum';
    ELSIF total_points >= 5000 THEN
        RETURN 'gold';
    ELSIF total_points >= 2000 THEN
        RETURN 'silver';
    ELSIF total_points >= 1000 THEN
        RETURN 'bronze';
    ELSE
        RETURN 'bronze'; -- Starting tier for new members (0-999 points)
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get points value in dollars (1 point = $0.02, 2% back)
CREATE OR REPLACE FUNCTION points_to_dollars(points INTEGER)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN points * 0.02;
END;
$$ LANGUAGE plpgsql;

