-- Drop existing policies
drop policy if exists "Users can view their own waitlist entries" on public.snow_removal_waitlist;
drop policy if exists "Users can insert their own waitlist entries" on public.snow_removal_waitlist;
drop policy if exists "Users can update their own waitlist entries" on public.snow_removal_waitlist;

-- Create new policies that handle both authenticated and anonymous users
create policy "Users can view their own waitlist entries"
    on public.snow_removal_waitlist for select
    using (
        auth.uid() = customer_id -- Authenticated users can see their entries
        or 
        (auth.uid() is null and customer_id is null) -- Anonymous users can see entries without customer_id
    );

create policy "Anyone can insert waitlist entries"
    on public.snow_removal_waitlist for insert
    with check (
        (auth.uid() is null and customer_id is null) -- Allow anonymous users to insert without customer_id
        or
        (auth.uid() = customer_id) -- Authenticated users must match their ID
    );

create policy "Users can update their own waitlist entries"
    on public.snow_removal_waitlist for update
    using (
        auth.uid() = customer_id -- Only authenticated users can update their own entries
    );

-- Ensure proper permissions for both authenticated and anonymous users
grant usage on schema public to anon, authenticated;
grant all on public.snow_removal_waitlist to authenticated;
grant insert, select on public.snow_removal_waitlist to anon; 