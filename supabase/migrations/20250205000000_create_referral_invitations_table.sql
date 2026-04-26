-- Create referral_invitations table to track sent invitations
CREATE TABLE IF NOT EXISTS public.referral_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Referrer (person who sent the invitation)
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referrer_customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    referrer_email VARCHAR(255),
    referrer_name VARCHAR(255),
    
    -- Invited friend
    friend_email VARCHAR(255) NOT NULL,
    friend_name VARCHAR(255),
    
    -- Referral Code used
    referral_code VARCHAR(50) NOT NULL,
    
    -- Status: invited, signed_up, first_service_completed, rewarded
    status VARCHAR(50) NOT NULL DEFAULT 'invited',
    
    -- Timestamps for status changes
    signed_up_at TIMESTAMP WITH TIME ZONE,
    first_service_at TIMESTAMP WITH TIME ZONE,
    rewarded_at TIMESTAMP WITH TIME ZONE,
    
    -- Link to the resulting referral record (when friend uses the code)
    referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
    
    -- Notes
    notes TEXT,
    
    CONSTRAINT referral_invitations_status_check CHECK (
        status IN ('invited', 'signed_up', 'first_service_completed', 'rewarded', 'expired')
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_invitations_referrer_id ON public.referral_invitations(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_invitations_referrer_customer_id ON public.referral_invitations(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_invitations_friend_email ON public.referral_invitations(friend_email);
CREATE INDEX IF NOT EXISTS idx_referral_invitations_referral_code ON public.referral_invitations(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_invitations_status ON public.referral_invitations(status);

-- Updated_at trigger
DROP TRIGGER IF EXISTS referral_invitations_updated_at ON public.referral_invitations;
CREATE TRIGGER referral_invitations_updated_at
    BEFORE UPDATE ON public.referral_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.referral_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own invitations" ON public.referral_invitations;
CREATE POLICY "Users can view own invitations" ON public.referral_invitations
    FOR SELECT USING (
        referrer_id = auth.uid() OR 
        (referrer_customer_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.customers 
            WHERE customers.id = referral_invitations.referrer_customer_id 
            AND customers.user_id = auth.uid()
        ))
    );

DROP POLICY IF EXISTS "Users can create invitations" ON public.referral_invitations;
CREATE POLICY "Users can create invitations" ON public.referral_invitations
    FOR INSERT WITH CHECK (referrer_id = auth.uid());

DROP POLICY IF EXISTS "Admin can manage all invitations" ON public.referral_invitations;
CREATE POLICY "Admin can manage all invitations" ON public.referral_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email = 'esckoofficial@gmail.com'
        )
    );

