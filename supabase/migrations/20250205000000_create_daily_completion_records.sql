-- Create daily_completion_records table to track completed and missed customers per day
CREATE TABLE IF NOT EXISTS public.daily_completion_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_date DATE NOT NULL,
    day_name TEXT NOT NULL, -- e.g., "Monday Week 1", "Tuesday Week 2"
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    service_type TEXT NOT NULL,
    scheduled_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'moved')),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_job_id UUID REFERENCES public.completed_jobs(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(record_date, day_name, customer_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_completion_records_date ON public.daily_completion_records(record_date);
CREATE INDEX IF NOT EXISTS idx_daily_completion_records_day_name ON public.daily_completion_records(day_name);
CREATE INDEX IF NOT EXISTS idx_daily_completion_records_customer_id ON public.daily_completion_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_completion_records_status ON public.daily_completion_records(status);
CREATE INDEX IF NOT EXISTS idx_daily_completion_records_date_status ON public.daily_completion_records(record_date, status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_completion_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_daily_completion_records_timestamp
    BEFORE UPDATE ON public.daily_completion_records
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_completion_records_updated_at();

-- Create function to archive daily completions
CREATE OR REPLACE FUNCTION archive_daily_completions(p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_day_name TEXT;
    v_customer RECORD;
    v_completed_job_id UUID;
BEGIN
    -- Get the day name for the given date
    SELECT 
        CASE 
            WHEN EXTRACT(DOW FROM p_date) = 0 THEN 'Sunday'
            WHEN EXTRACT(DOW FROM p_date) = 1 THEN 'Monday'
            WHEN EXTRACT(DOW FROM p_date) = 2 THEN 'Tuesday'
            WHEN EXTRACT(DOW FROM p_date) = 3 THEN 'Wednesday'
            WHEN EXTRACT(DOW FROM p_date) = 4 THEN 'Thursday'
            WHEN EXTRACT(DOW FROM p_date) = 5 THEN 'Friday'
            WHEN EXTRACT(DOW FROM p_date) = 6 THEN 'Saturday'
        END || ' Week ' || 
        CASE 
            WHEN EXTRACT(DAY FROM p_date) <= 7 THEN '1'
            ELSE '2'
        END INTO v_day_name;

    -- Archive completed customers
    FOR v_customer IN 
        SELECT DISTINCT 
            c.id,
            c.name,
            c.email,
            c.phone,
            c.service_type,
            c.price,
            c.scheduled_day,
            cj.id as completed_job_id,
            cj.completed_date
        FROM public.customers c
        LEFT JOIN public.completed_jobs cj ON cj.customer_id = c.id 
            AND DATE(cj.job_date) = p_date
        WHERE c.scheduled_day = v_day_name
            AND c.status IN ('active', 'pending')
            AND c.frequency IN ('weekly', 'bi_weekly')
    LOOP
        -- Check if record already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.daily_completion_records
            WHERE record_date = p_date
            AND day_name = v_day_name
            AND customer_id = v_customer.id
        ) THEN
            INSERT INTO public.daily_completion_records (
                record_date,
                day_name,
                customer_id,
                customer_name,
                customer_email,
                customer_phone,
                service_type,
                scheduled_price,
                status,
                completed_at,
                completed_job_id
            ) VALUES (
                p_date,
                v_day_name,
                v_customer.id,
                v_customer.name,
                v_customer.email,
                v_customer.phone,
                v_customer.service_type,
                v_customer.price,
                CASE 
                    WHEN v_customer.completed_job_id IS NOT NULL THEN 'completed'
                    ELSE 'missed'
                END,
                v_customer.completed_date,
                v_customer.completed_job_id
            )
            ON CONFLICT (record_date, day_name, customer_id) 
            DO UPDATE SET
                status = CASE 
                    WHEN v_customer.completed_job_id IS NOT NULL THEN 'completed'
                    ELSE 'missed'
                END,
                completed_at = v_customer.completed_date,
                completed_job_id = v_customer.completed_job_id,
                updated_at = timezone('utc'::text, now());
        END IF;
    END LOOP;
END;
$$;

-- Add comments
COMMENT ON TABLE public.daily_completion_records IS 'Stores daily completion records to track completed and missed customers';
COMMENT ON COLUMN public.daily_completion_records.status IS 'Status: completed, missed, or moved';
COMMENT ON FUNCTION archive_daily_completions IS 'Archives all customers scheduled for a specific date, marking them as completed or missed';

-- Enable RLS
ALTER TABLE public.daily_completion_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to manage all records
CREATE POLICY "Admins can manage all daily completion records"
ON public.daily_completion_records
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create policy to allow service role to manage all records (for API routes)
CREATE POLICY "Service role can manage all daily completion records"
ON public.daily_completion_records
FOR ALL
USING (true)
WITH CHECK (true);

