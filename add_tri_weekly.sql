-- Step 1: Drop the existing frequency check constraint (if it exists)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'customers'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%frequency%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE customers DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- Step 2: Fix any rows with NULL or unrecognized frequency values
-- (this is what causes the "violated by some row" error)
UPDATE customers
SET frequency = 'bi_weekly'
WHERE frequency IS NULL
   OR frequency NOT IN ('weekly', 'bi_weekly', 'tri_weekly');

-- Step 3: Now safely add the updated constraint
ALTER TABLE customers
  ADD CONSTRAINT customers_frequency_check
  CHECK (frequency IN ('weekly', 'bi_weekly', 'tri_weekly'));

-- Confirm what frequencies exist after cleanup
SELECT frequency, COUNT(*) FROM customers GROUP BY frequency;
