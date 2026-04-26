-- Add sms_consent column to email_subscribers table for easier querying
ALTER TABLE public.email_subscribers 
ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_email_subscribers_sms_consent ON public.email_subscribers(sms_consent);

-- Update existing records based on preferences JSONB field
UPDATE public.email_subscribers
SET sms_consent = COALESCE(
  (preferences->'sms'->>'subscribe')::boolean,
  (preferences->>'sms')::boolean,
  false
)
WHERE sms_consent IS NULL OR sms_consent = false;

-- Add comment to column
COMMENT ON COLUMN public.email_subscribers.sms_consent IS 'Whether the customer has consented to receive SMS/text messages';

