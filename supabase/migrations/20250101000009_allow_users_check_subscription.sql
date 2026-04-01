-- Allow authenticated users to check their own subscription status
CREATE POLICY "Users can view their own subscription" ON public.email_subscribers
    FOR SELECT USING (
        auth.jwt() ->> 'email' = email
    );

-- Allow authenticated users to update their own subscription
CREATE POLICY "Users can update their own subscription" ON public.email_subscribers
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = email
    );

