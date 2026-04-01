-- Add expiration date tracking to loyalty points
-- Points expire 1 year after being earned

-- Add expiration_date column to loyalty_transactions table
ALTER TABLE public.loyalty_transactions
ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;

-- Add comment explaining expiration policy
COMMENT ON COLUMN public.loyalty_transactions.expiration_date IS 'Points expire 1 year after being earned. NULL means points do not expire (for legacy records or special cases).';

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_expiration_date 
ON public.loyalty_transactions(expiration_date) 
WHERE expiration_date IS NOT NULL;

-- Update existing earned transactions to have expiration date (1 year from creation)
DO $$
BEGIN
  UPDATE public.loyalty_transactions
  SET expiration_date = created_at + INTERVAL '1 year'
  WHERE transaction_type = 'earned' 
    AND expiration_date IS NULL
    AND status = 'active';
  
  RAISE NOTICE 'Added expiration_date column to loyalty_transactions table. Points now expire 1 year after being earned.';
END $$;

