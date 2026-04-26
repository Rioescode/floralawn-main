-- Create completed_jobs table to store all completed jobs with payment tracking
CREATE TABLE IF NOT EXISTS public.completed_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    service_type TEXT NOT NULL,
    service_description TEXT,
    job_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    invoice_sent BOOLEAN DEFAULT false,
    invoice_sent_at TIMESTAMP WITH TIME ZONE,
    invoice_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_completed_jobs_customer_id ON public.completed_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_customer_email ON public.completed_jobs(customer_email);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_job_date ON public.completed_jobs(job_date);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_payment_status ON public.completed_jobs(payment_status);
CREATE INDEX IF NOT EXISTS idx_completed_jobs_appointment_id ON public.completed_jobs(appointment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_completed_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    -- Auto-update payment_status based on amounts
    IF NEW.amount_paid >= NEW.amount_due THEN
        NEW.payment_status = 'paid';
    ELSIF NEW.amount_paid > 0 THEN
        NEW.payment_status = 'partial';
    ELSE
        NEW.payment_status = 'unpaid';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at and payment_status
CREATE TRIGGER update_completed_jobs_timestamp
    BEFORE UPDATE ON public.completed_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_completed_jobs_updated_at();

-- Add comments
COMMENT ON TABLE public.completed_jobs IS 'Stores all completed jobs with payment tracking for record keeping';
COMMENT ON COLUMN public.completed_jobs.appointment_id IS 'Reference to the original appointment if applicable';
COMMENT ON COLUMN public.completed_jobs.balance_due IS 'Auto-calculated: amount_due - amount_paid';
COMMENT ON COLUMN public.completed_jobs.payment_status IS 'Auto-updated based on amount_paid vs amount_due';

-- Enable RLS (Row Level Security)
ALTER TABLE public.completed_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to manage all completed jobs
CREATE POLICY "Admins can manage all completed jobs"
ON public.completed_jobs
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Create policy to allow service role to manage all completed jobs (for API routes)
CREATE POLICY "Service role can manage all completed jobs"
ON public.completed_jobs
FOR ALL
USING (true)
WITH CHECK (true);

