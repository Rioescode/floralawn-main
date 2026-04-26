-- Add status column to bids table if it doesn't exist
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update any existing NULL statuses to 'pending'
UPDATE public.bids
SET status = 'pending'
WHERE status IS NULL; 