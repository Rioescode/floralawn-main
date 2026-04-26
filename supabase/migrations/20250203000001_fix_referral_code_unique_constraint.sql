-- Fix referral_code unique constraint
-- Multiple people can use the same referral code, so it should NOT be unique
-- Instead, we'll ensure uniqueness per referee (same person can't use same code twice)

-- Drop the unique constraint on referral_code if it exists
DO $$
BEGIN
    -- Drop unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'referrals_referral_code_key' 
        AND conrelid = 'public.referrals'::regclass
    ) THEN
        ALTER TABLE public.referrals DROP CONSTRAINT referrals_referral_code_key;
        RAISE NOTICE 'Dropped unique constraint on referral_code';
    END IF;
    
    -- Drop unique index if it exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'referrals_referral_code_key'
    ) THEN
        DROP INDEX IF EXISTS public.referrals_referral_code_key;
        RAISE NOTICE 'Dropped unique index on referral_code';
    END IF;
END $$;

-- Create a unique constraint on (referral_code, referee_email) instead
-- This ensures the same person can't use the same code twice, but multiple people can use the same code
DROP INDEX IF EXISTS idx_referrals_code_referee_email;
CREATE UNIQUE INDEX idx_referrals_code_referee_email 
ON public.referrals(referral_code, referee_email) 
WHERE referee_email IS NOT NULL;

-- Also create unique constraint on (referral_code, referee_id) for users
DROP INDEX IF EXISTS idx_referrals_code_referee_id;
CREATE UNIQUE INDEX idx_referrals_code_referee_id 
ON public.referrals(referral_code, referee_id) 
WHERE referee_id IS NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.referrals.referral_code IS 'Referral code shared by referrer. Multiple people can use the same code, but each person can only use it once.';

